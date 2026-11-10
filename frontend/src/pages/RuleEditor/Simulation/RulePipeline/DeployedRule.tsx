import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Alert, Box, Chip } from "@mui/material";
import toast from "react-hot-toast";
import Button from "../../../../components/Button";
import { Text } from "../../../../components/Text";
import { useDeployRuleMutation, useGetRuleDeploymentQuery, useRunDeployedRuleMutation, useRunEndToEndMutation, type RuleBuild, type RuleDeployment, type RuleResult, type RuleRun } from "../../../../redux/Api/RulePipeline";
import { describeResult, formatDuration } from "./useRulePipelineController";

interface IDeployedRule {
    ruleId?: number
    build?: RuleBuild
    canRun: boolean
}

type ChipColor = 'success' | 'info' | 'warning' | 'error' | 'default'

const Mono = ({ children }: { children: React.ReactNode }) => (
    <Text size={'sub'} color="black" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{children}</Text>
)

const CONTAINER_STATE: Record<NonNullable<RuleDeployment['state']>, { label: string; color: ChipColor }> = {
    deployed: { label: 'Deployed', color: 'success' },
    starting: { label: 'Starting', color: 'info' },
    restarting: { label: 'Restarting', color: 'error' },
    stopped: { label: 'Stopped', color: 'error' },
}

const stateOf = (deployment: RuleDeployment): { label: string; color: ChipColor } => {
    if (!deployment.deployed) return { label: 'Not deployed', color: 'default' }
    if (!deployment.current) return { label: `Runs ${deployment.rule ?? 'another version'}`, color: 'warning' }
    return CONTAINER_STATE[deployment.state ?? 'stopped']
}

const detailsOf = (deployment: RuleDeployment): string => [
    `${deployment.container ?? ''} on ${deployment.network ?? ''}`,
    deployment.state === 'deployed' && deployment.startedAt ? `connected to NATS, up since ${new Date(deployment.startedAt).toLocaleString()}` : '',
    deployment.state === 'stopped' ? `exited with code ${deployment.exitCode ?? '?'}` : '',
    deployment.restarts ? `${deployment.restarts} restarts` : '',
].filter(Boolean).join(' · ')

const hintOf = (deployment: RuleDeployment, ready: boolean, digest?: string, buildId?: string): string => {
    if (ready) return 'Run rule sends the latest evaluated transaction straight to this rule and shows its result. Run end to end sends a new pacs.008 and pacs.002 through Tazama and shows the alert.'
    if (deployment.deployed && deployment.current && deployment.state === 'starting') return 'The rule is starting. It counts as deployed once it has connected to NATS.'
    if (deployment.deployed && deployment.current) return `The rule container is ${deployment.state ?? 'not running'}. Redeploy it or check its logs.`
    if (!digest) return 'Build & Test has to pass before its image can be deployed.'
    return `Deploy the image of build #${buildId ?? ''} to run this rule in Tazama.`
}

const EVALUATION_STATUS: Record<string, { label: string; color: ChipColor }> = {
    ALRT: { label: 'Alert', color: 'error' },
    NALT: { label: 'No alert', color: 'success' },
}

const errorOf = (err: unknown, fallback: string): string => {
    const message = (err as { data?: { message?: unknown } } | undefined)?.data?.message
    return typeof message === 'string' ? message : fallback
}

const ResultCard = ({ title, chip, run, children }: { title: string; chip: { label: string; color: ChipColor }; run: RuleRun; children: React.ReactNode }) => (
    <Box p={2} border={'1px solid'} borderColor={'static.border'} borderRadius={2} sx={{ minWidth: 0 }}>
        <Box display={'flex'} alignItems={'center'} gap={1.5} mb={1}>
            <Text size={'body'} weight={600} color="black">{title}</Text>
            <Chip size="small" label={chip.label} color={chip.color} />
        </Box>
        {children}
        <Text size={'sub'} color="text.ternary" sx={{ mt: 1 }}>
            {new Date(run.ranAt).toLocaleString()} · took {formatDuration(run.tookMs)}{run.msgId ? ` · message ${run.msgId}` : ''}
        </Text>
    </Box>
)

const Raw = ({ label, value }: { label: string; value: unknown }) => (
    <Box mt={1.5}>
        <Text size={'sub'} color="text.ternary">{label}</Text>
        <Box component="pre" sx={{ mt: 0.5, mb: 0, p: 1.5, maxHeight: 420, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1, fontSize: 12, fontFamily: 'monospace' }}>
            {JSON.stringify(value, null, 2)}
        </Box>
    </Box>
)

const variableOf = (result: RuleResult): string => `independent variable ${String(result.indpdntVarbl ?? '-')}`

const RuleRunResult = ({ run }: { run: RuleRun }) => (
    <ResultCard title="Rule result" run={run} chip={run.result ? { label: run.result.subRuleRef, color: run.ok ? 'success' : 'error' } : { label: 'Failed', color: 'error' }}>
        {run.result
            ? <>
                <Mono>{describeResult(run.result, run.reason)} · {variableOf(run.result)}</Mono>
                <Raw label="Rule result, as the rule returned it" value={run.result} />
            </>
            : <Mono>{run.error}</Mono>}
    </ResultCard>
)

const EvaluationResult = ({ run }: { run: RuleRun }) => {
    const evaluation = run.alert?.report
    const status = evaluation?.status ? EVALUATION_STATUS[evaluation.status] ?? { label: evaluation.status, color: 'default' } : { label: 'Failed', color: 'error' as const }
    return (
        <ResultCard title="End-to-end evaluation" run={run} chip={status}>
            {run.result ? <Mono>This rule: {describeResult(run.result, run.reason)} · {variableOf(run.result)}</Mono> : <Mono>{run.error}</Mono>}
            {evaluation?.tadpResult?.typologyResult?.map((typology) => (
                <Box key={typology.cfg} mt={1.5}>
                    <Text size={'sub'} weight={600} color="black">
                        Typology {typology.cfg} · score {typology.result ?? 0}
                        {typology.workflow ? ` (alert at ${typology.workflow.alertThreshold ?? '-'}, interdiction at ${typology.workflow.interdictionThreshold ?? '-'})` : ''}
                    </Text>
                    {typology.ruleResults?.map((rule) => (
                        <Mono key={rule.id}>{rule.id} → {rule.subRuleRef} · indpdntVarbl {String(rule.indpdntVarbl ?? '-')} · wght {String(rule.wght ?? '-')}</Mono>
                    ))}
                </Box>
            ))}
            {evaluation?.evaluationID && <Text size={'sub'} color="text.ternary" sx={{ mt: 1.5 }}>Evaluation {evaluation.evaluationID}</Text>}
            {run.alert && <Raw label="Alert, as Tazama stored it" value={run.alert} />}
        </ResultCard>
    )
}

const DeployedRule = ({ ruleId, build, canRun }: IDeployedRule) => {
    const { data: deployment } = useGetRuleDeploymentQuery(ruleId as number, { skip: !ruleId, refetchOnMountOrArgChange: true })
    const [deployRule, { isLoading: deploying, data: deployed }] = useDeployRuleMutation()
    const [runRule, { isLoading: runningRule }] = useRunDeployedRuleMutation()
    const [runEndToEnd, { isLoading: runningEndToEnd }] = useRunEndToEndMutation()

    if (!ruleId || !deployment?.enabled) return null
    const state = stateOf(deployment)
    const ready = deployment.state === 'deployed' && Boolean(deployment.current)
    const busy = deploying || runningRule || runningEndToEnd
    const digest = build?.status === 'passed' ? build.image?.digest : undefined
    const upToDate = ready && Boolean(digest && deployment.image?.endsWith(digest))
    const { rule, e2e } = deployment.runs ?? {}

    const handleDeploy = () => {
        void deployRule(ruleId).unwrap()
            .then((result) => {
                if (result.ok) toast.success(`Deployed to ${result.container ?? 'Tazama'}`)
                else toast.error('Deployment failed')
            })
            .catch((err: unknown) => toast.error(errorOf(err, 'The deployment could not start')))
    }

    const report = (run: RuleRun) => {
        if (run.ok) toast.success(`${run.kind === 'rule' ? 'Rule' : 'End to end'}: ${describeResult(run.result, run.reason)}`)
        else toast.error(run.error ?? 'The run failed')
    }

    return (
        <Box mt={3} p={2} border={'1px solid'} borderColor={'static.border'} borderRadius={2}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap'} gap={1} mb={1}>
                <Box display={'flex'} alignItems={'center'} gap={1.5}>
                    <Text size={'main'} color="black">Deploy & Run</Text>
                    <Chip size="small" label={state.label} color={state.color} />
                </Box>
                {deployment.deployed && <Text size={'sub'} color="text.ternary">{detailsOf(deployment)}</Text>}
            </Box>
            {deployment.deployed && deployment.image && <Mono>{deployment.image}</Mono>}

            {canRun &&
                <>
                    <Box display={'flex'} flexWrap={'wrap'} alignItems={'center'} gap={2} mt={2}>
                        <Button
                            height="40px"
                            width="200px"
                            type="secondary"
                            size="md"
                            text={upToDate ? "Redeploy" : "Deploy to Tazama"}
                            Icon={CloudUploadIcon}
                            loading={deploying}
                            disabled={busy || !digest}
                            onClick={handleDeploy}
                        />
                        <Button
                            height="40px"
                            width="150px"
                            type="primary"
                            size="md"
                            text="Run rule"
                            Icon={PlayArrowIcon}
                            loading={runningRule}
                            disabled={busy || !ready}
                            onClick={() => { void runRule(ruleId).unwrap().then(report).catch((err: unknown) => toast.error(errorOf(err, 'The rule run could not start'))) }}
                        />
                        <Button
                            height="40px"
                            width="190px"
                            type="secondary"
                            size="md"
                            text="Run end to end"
                            Icon={SwapHorizIcon}
                            loading={runningEndToEnd}
                            disabled={busy || !ready}
                            onClick={() => { void runEndToEnd(ruleId).unwrap().then(report).catch((err: unknown) => toast.error(errorOf(err, 'The end-to-end run could not start'))) }}
                        />
                    </Box>
                    <Text size={'sub'} color="text.ternary" sx={{ mt: 1 }}>{hintOf(deployment, ready, digest, build?.buildId)}</Text>
                </>
            }
            {deployed?.ok === false && <Alert severity="error" sx={{ mt: 2 }}>Deployment failed: {deployed.error}</Alert>}

            {(rule || e2e) &&
                <Box mt={2} display={'grid'} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2} alignItems={'start'}>
                    {rule && <RuleRunResult run={rule} />}
                    {e2e && <EvaluationResult run={e2e} />}
                </Box>
            }
        </Box>
    )
}

export default DeployedRule
