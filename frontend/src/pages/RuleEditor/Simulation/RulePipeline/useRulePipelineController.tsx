import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useModal } from "../../../../contexts/ModalContext";
import {
    rulePipelineUrl,
    useGetLatestRuleBuildQuery,
    useGetPipelineConfigQuery,
    useGetRuleBuildQuery,
    useStartRuleBuildMutation,
    type RuleBuild,
    type RulePipelineConfig,
} from "../../../../redux/Api/RulePipeline";
import { getAuthToken } from "../../../../utils/Common/storage";
import PipelineReport from "./PipelineReport";

export interface IRulePipeline {
    ruleId?: number
    canBuild: boolean
}

export type StageState = "done" | "current" | "failed" | "pending" | "skipped";

export const STAGES: ReadonlyArray<{ key: string; label: string }> = [
    { key: "git", label: "Git" },
    { key: "start", label: "Container" },
    { key: "install", label: "npm ci" },
    { key: "test", label: "Unit tests" },
    { key: "package", label: "Package" },
    { key: "assemble", label: "Rule executer" },
    { key: "image", label: "Image" },
    { key: "push", label: "Push" },
    { key: "simulate", label: "Simulation" },
];

const ACTIVE = new Set(["queued", "running"]);

export const stageLabel = (key?: string): string | undefined => STAGES.find((s) => s.key === key)?.label;

export const describeConfig = (config?: RulePipelineConfig): string[] => {
    if (!config) return [];
    const npm = config.npm.source === "offline" ? "npm: offline cache"
        : config.npm.source === "mirror" ? `npm: ${config.npm.registry ?? "mirror"}`
            : "npm: npmjs + GitHub Packages";
    const image = !config.image.build ? "image: off (package only)"
        : config.image.registry ? `image: ${config.image.registry}/${config.image.namespace}` : "image: Docker host only";
    const git = config.git.kind === "none" ? "git: off"
        : `git: ${config.git.kind}${config.git.owner ? ` ${config.git.owner}` : ""}${config.git.branch ? ` (${config.git.branch})` : ""}`;
    return [npm, image, git];
};

const failedStageOf = (build: RuleBuild): string | undefined => {
    if (build.status === "failed") return "test";
    if (build.status === "error" && build.simulation && !build.simulation.ok) return "simulate";
    return build.status === "error" ? build.stage : undefined;
};

export const stageState = (build: RuleBuild, key: string): StageState => {
    const index = STAGES.findIndex((s) => s.key === key);
    if (ACTIVE.has(build.status)) {
        const current = STAGES.findIndex((s) => s.key === build.stage);
        if (current === -1) return "pending";
        return index < current ? "done" : index === current ? "current" : "pending";
    }
    const failed = failedStageOf(build);
    if (failed === key) return "failed";
    if (key === "simulate") return build.simulation?.ok ? "done" : "skipped";
    return build.durationsMs && key in build.durationsMs ? "done" : "skipped";
};

export const formatDuration = (ms?: number): string => {
    if (ms === undefined) return "";
    const seconds = ms / 1000;
    return seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
};

export const describeStatus = (build: RuleBuild): { severity: "success" | "error" | "info"; label: string; text: string } => {
    switch (build.status) {
        case "queued": return { severity: "info", label: "Queued", text: "Waiting for the builder." };
        case "running": return { severity: "info", label: "Running", text: `${stageLabel(build.stage) ?? "Starting"}…` };
        case "passed": return { severity: "success", label: "Passed", text: "All tests passed and every requested step worked." };
        case "failed": return { severity: "error", label: "Tests failed", text: `${build.tests?.failed ?? 0} of ${build.tests?.total ?? 0} unit tests failed, so nothing was packaged. Open the test report to see which.` };
        default: {
            const stage = stageLabel(failedStageOf(build));
            return { severity: "error", label: "Failed", text: stage ? `The build stopped at ${stage}.` : "The build stopped." };
        }
    }
};

export interface BuildProblem {
    title: string;
    compileErrors: Array<{ file: string; line: number; message: string }>;
    output?: string;
}

export const describeProblem = (error?: string): BuildProblem | undefined => {
    if (!error) return undefined;
    const text = error.replace(/^\[[^\]]+\]\s*/, "");
    const newline = text.indexOf("\n");
    const title = (newline === -1 ? text : text.slice(0, newline)).replace(/:\s*$/, "");
    const output = newline === -1 ? undefined : text.slice(newline + 1).trim();
    const compileErrors = [...(output ?? "").matchAll(/^(.+?)\((\d+),\d+\): error TS\d+: (.+)$/gm)]
        .map(([, file, line, message]) => ({ file, line: Number(line), message }));
    return { title, compileErrors, output };
};

const useRulePipelineController = ({ ruleId, canBuild }: IRulePipeline) => {
    const { open } = useModal()
    const [simulate, setSimulate] = useState(true)
    const [buildId, setBuildId] = useState<string>()

    const { data: config } = useGetPipelineConfigQuery()
    const { data: latest } = useGetLatestRuleBuildQuery(ruleId as number, { skip: !ruleId, refetchOnMountOrArgChange: true })
    const [startRuleBuild, { isLoading: starting }] = useStartRuleBuildMutation()

    const [polling, setPolling] = useState(false)
    const { data: build } = useGetRuleBuildQuery(buildId as string, { skip: !buildId, pollingInterval: polling ? 2000 : 0 })
    const running = build ? ACTIVE.has(build.status) : false

    useEffect(() => {
        if (!buildId && latest?.build) setBuildId(latest.build.buildId)
    }, [latest, buildId])

    useEffect(() => {
        setPolling(running)
    }, [running])

    const lastStatus = useRef<string | undefined>(undefined)
    useEffect(() => {
        if (!build) return
        if (lastStatus.current && ACTIVE.has(lastStatus.current) && !ACTIVE.has(build.status)) {
            const { severity, text } = describeStatus(build)
            if (severity === "success") toast.success(text)
            else toast.error(text)
        }
        lastStatus.current = build.status
    }, [build])

    const handleBuild = useCallback(async () => {
        if (!ruleId) return
        const started = await startRuleBuild({ ruleId, simulate: simulate && Boolean(config?.image.build) }).unwrap().catch(() => undefined)
        if (!started) return
        lastStatus.current = started.status
        setBuildId(started.buildId)
        setPolling(true)
    }, [ruleId, simulate, config, startRuleBuild])

    const handleReport = useCallback(() => {
        if (build) open('Test Report', <PipelineReport buildId={build.buildId} />, null, { maxWidth: 'xl' })
    }, [build, open])

    const handleDownload = useCallback(async () => {
        if (!build?.package) return
        try {
            const res = await fetch(`${rulePipelineUrl}/builds/${build.buildId}/package`, { headers: { authorization: `Bearer ${getAuthToken() ?? ""}` } })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const url = URL.createObjectURL(await res.blob())
            const link = document.createElement("a")
            link.href = url
            link.download = build.package.file
            link.click()
            URL.revokeObjectURL(url)
        } catch {
            toast.error("Failed to download the package")
        }
    }, [build])

    const chips = useMemo(() => describeConfig(config), [config])

    return {
        values: {
            build,
            chips,
            simulate,
            canSimulate: Boolean(config?.image.build),
            canBuild: canBuild && Boolean(ruleId),
            running,
            starting,
        },
        functions: {
            setSimulate,
            handleBuild,
            handleReport,
            handleDownload,
        }
    }
}

export default useRulePipelineController
