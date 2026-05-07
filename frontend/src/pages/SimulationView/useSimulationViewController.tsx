import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import type { SvgIconComponent } from "@mui/icons-material";
import { Button, Paper } from "@mui/material";
import { Text } from "../../components/Text";
import SimulationAnalysisModal from "../../components/Modals/SimulationAnalysis";
import { useModal } from "../../contexts/ModalContext";
import useFilters from "../../hooks/useFilters";
import { useLazyGetSimulationStatsQuery, useLazyGetSimulationResultsQuery } from "../../redux/Api/RuleSimulation";

type MediaType = "total" | "evaluated" | "alerts" | "notAlerts";

const getMedia = (type: MediaType) => {
    const mediaConfig = {
        total: {
            title: "Total Records",
            icon: StorageRoundedIcon as SvgIconComponent,
            bgColor: "#dbeafe",
            color: "#2563eb",
        },
        evaluated: {
            title: "Records Evaluated",
            icon: CheckCircleOutlineIcon as SvgIconComponent,
            bgColor: "#dcfce7",
            color: "#16a34a",
        },
        alerts: {
            title: "Alerts Generated",
            icon: WarningAmberRoundedIcon as SvgIconComponent,
            bgColor: "#fee2e2",
            color: "red",
        },
        notAlerts: {
            title: "Alerts Not Generated",
            icon: RemoveCircleOutlineIcon as SvgIconComponent,
            bgColor: "#fef3c7",
            color: "#d97706",
        },
    };
    return mediaConfig[type];
};

const useSimulationViewController = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { open } = useModal();
    const location = useLocation();

    const totalIterations: number = (location.state as { total_iterations?: number } | null)?.total_iterations ?? 1;

    const { offset, limit, setOffset } = useFilters();

    // Search / filter state
    const [msgIdFilter, setMsgIdFilter] = useState("");
    const [msgTypeFilter, setMsgTypeFilter] = useState("");
    const [outcomeFilter, setOutcomeFilter] = useState<"" | "Hit" | "No-Hit">("");

    const [iterationNo, setIterationNo] = useState<string>(String(totalIterations));

    const iterationOptions = useMemo(
        () =>
            Array.from({ length: totalIterations }, (_, i) => ({
                label: `Iteration ${i + 1}${i + 1 === totalIterations ? " (Latest)" : ""}`,
                value: String(i + 1),
            })),
        [totalIterations],
    );

    const sim = useMemo(() => id ? id.toLowerCase().replace(/-/g, "") : "", [id]);

    const [getSimulationStats, { data: statsData, isLoading: statsLoading }] = useLazyGetSimulationStatsQuery();
    const [getSimulationResults, { data: resultsData, isLoading: resultsLoading }] = useLazyGetSimulationResultsQuery();

    const fetchStats = useCallback(() => {
        if (sim) void getSimulationStats({ sim, iteration_no: iterationNo });
    }, [sim, iterationNo, getSimulationStats]);

    const fetchResults = useCallback(() => {
        if (!sim) return;
        void getSimulationResults({
            sim,
            iteration_no: iterationNo,
            limit,
            offset,
            ...(msgIdFilter.trim() ? { msg_id: msgIdFilter.trim() } : {}),
            ...(msgTypeFilter.trim() ? { msg_type: msgTypeFilter.trim() } : {}),
            ...(outcomeFilter ? { outcome: outcomeFilter } : {}),
        });
    }, [sim, iterationNo, limit, offset, msgIdFilter, msgTypeFilter, outcomeFilter, getSimulationResults]);

    const pagination = useMemo(() => ({
        offset,
        limit,
        total: resultsData?.total ?? 0,
        onPageChange: (page: number) => setOffset(page - 1),
    }), [offset, limit, resultsData?.total, setOffset]);

    const overviewItems = useMemo(() => {
        const counts: Record<MediaType, number> = {
            total: statsData?.total_no_of_records ?? 0,
            evaluated: statsData?.records_evaluated ?? 0,
            alerts: statsData?.alerts_generated ?? 0,
            notAlerts: statsData?.alerts_not_generated ?? 0,
        };
        return (Object.keys(counts) as MediaType[]).map((key) => {
            const media = getMedia(key);
            return {
                key,
                title: media.title,
                Icon: media.icon,
                count: counts[key],
                bgColor: media.bgColor,
                iconColor: media.color,
            };
        });
    }, [statsData]);

    const stats = statsData as { run_date_time?: string | null; replay_duration?: string | null } | undefined;
    const runDateTime = stats?.run_date_time ?? "—";
    const replayDuration = stats?.replay_duration ?? "—";

    const handleView = useCallback((row: Record<string, unknown>) => {
        const rawRules = (row.triggered_rules as Array<{ ruleId: string; description: string; status: string }>) || [];
        const analysisData = {
            messageId: row.msg_id as string,
            outcome: row.outcome as string,
            score: 0,
            triggeredRules: rawRules.map((r) => ({ id: r.ruleId, ...r })),
            triggeredTypologies: (row.triggered_typologies as Array<{ name: string; score: number; rules: Array<{ ruleId: string; weight: number; subRef: string }> }>) || [],
        };
        open(
            'Simulation Analysis',
            <SimulationAnalysisModal data={analysisData} />,
            null,
            { maxWidth: 'md' },
        );
    }, [open]);

    const columns = [
        { label: "Message ID", key: "msg_id" },
        {
            label: "Message Type",
            key: "msg_type",
            render: (row: Record<string, unknown>) => (
                <Paper
                    variant="outlined"
                    sx={{
                        display: "inline-block",
                        borderRadius: 1,
                        px: 1.2,
                        py: 0.3,
                        bgcolor: "#f1f5f9",
                        borderColor: "#e2e8f0",
                    }}
                >
                    <Text
                        size="sub"
                        sx={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#334155" }}
                    >
                        {row.msg_type as string}
                    </Text>
                </Paper>
            ),
        },
        { label: "Time", key: "time" },
        {
            label: "Outcome",
            key: "outcome",
            render: (row: Record<string, unknown>) => {
                const isHit = row.outcome === "Hit";
                return (
                    <Paper
                        variant="outlined"
                        sx={{
                            display: "inline-block",
                            borderRadius: 4,
                            px: 1.8,
                            py: 0.3,
                            border: 0,
                            bgcolor: !isHit ? "#dcfce7" : "error.main",
                        }}
                    >
                        <Text
                            size="sub"
                            weight="600"
                            sx={{
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap",
                                color: !isHit ? "static.darkGreen" : "white",
                            }}
                        >
                            {row.outcome as string}
                        </Text>
                    </Paper>
                );
            },
        },
        {
            label: "Action",
            key: "actions",
            render: (row: Record<string, unknown>) => {
                const isNoHit = row.outcome === "No-Hit";
                return (
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={isNoHit}
                        sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderColor: "#e2e8f0",
                            color: "#334155",
                            "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                        }}
                        onClick={() => handleView(row)}
                    >
                        View Details
                    </Button>
                );
            },
        },
    ];

    const handleSearch = useCallback(() => {
        setOffset(0);
        fetchResults();
    }, [fetchResults, setOffset]);

    const handleClearFilters = useCallback(() => {
        setMsgIdFilter("");
        setMsgTypeFilter("");
        setOutcomeFilter("");
    }, []);

    return {
        values: {
            id,
            columns,
            data: (resultsData?.data ?? []) as Record<string, unknown>[],
            pagination,
            overviewItems,
            runDateTime,
            replayDuration,
            statsLoading,
            resultsLoading,
            msgIdFilter,
            msgTypeFilter,
            outcomeFilter,
            iterationNo,
            iterationOptions,
            totalIterations,
        },
        functions: {
            navigate,
            fetchStats,
            fetchResults,
            handleSearch,
            handleClearFilters,
            setMsgIdFilter,
            setMsgTypeFilter,
            setOutcomeFilter,
            setIterationNo,
        },
    };
};

export default useSimulationViewController;