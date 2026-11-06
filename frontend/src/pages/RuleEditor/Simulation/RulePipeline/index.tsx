import { useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Alert, AlertTitle, Box, Checkbox, Chip, CircularProgress, Collapse, FormControlLabel, Link, Tooltip } from "@mui/material";
import Button from "../../../../components/Button";
import { Text } from "../../../../components/Text";
import Section from "../../../../components/Wrappers/Section";
import type { RuleBuild } from "../../../../redux/Api/RulePipeline";
import useRulePipelineController, { describeProblem, describeStatus, formatDuration, STAGES, stageState, type IRulePipeline, type StageState } from "./useRulePipelineController";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box display={'flex'} gap={2} py={1} borderTop={'1px solid'} borderColor={'static.border'}>
        <Text size={'sub'} color="text.ternary" sx={{ width: 110, flexShrink: 0 }}>{label}</Text>
        <Box sx={{ minWidth: 0, wordBreak: 'break-all' }}>{children}</Box>
    </Box>
)

const Mono = ({ children }: { children: React.ReactNode }) => (
    <Text size={'sub'} color="black" sx={{ fontFamily: 'monospace' }}>{children}</Text>
)

const STAGE_LOOK: Record<StageState, { color: 'success' | 'info' | 'error' | 'default'; variant: 'filled' | 'outlined'; icon?: React.ReactElement }> = {
    done: { color: 'success', variant: 'filled', icon: <CheckIcon /> },
    current: { color: 'info', variant: 'filled', icon: <CircularProgress size={12} color="inherit" /> },
    failed: { color: 'error', variant: 'filled', icon: <CloseIcon /> },
    pending: { color: 'default', variant: 'outlined' },
    skipped: { color: 'default', variant: 'outlined' },
}

const Stages = ({ build }: { build: RuleBuild }) => (
    <Box display={'flex'} flexWrap={'wrap'} alignItems={'center'} gap={0.75}>
        {STAGES.map(({ key, label }, index) => {
            const state = stageState(build, key)
            const look = STAGE_LOOK[state]
            const took = build.durationsMs?.[key]
            return (
                <Box key={key} display={'flex'} alignItems={'center'} gap={0.75}>
                    {index > 0 && <Box sx={{ width: 12, height: '1px', bgcolor: 'static.border' }} />}
                    <Tooltip title={took !== undefined ? formatDuration(took) : state === 'skipped' ? 'Not run' : ''} arrow>
                        <Chip size="small" label={label} color={look.color} variant={look.variant} icon={look.icon} sx={{ opacity: state === 'skipped' ? 0.5 : 1 }} />
                    </Tooltip>
                </Box>
            )
        })}
    </Box>
)

const Problem = ({ build }: { build: RuleBuild }) => {
    const [showOutput, setShowOutput] = useState(false)
    const status = describeStatus(build)
    const problem = describeProblem(build.error)
    return (
        <Alert severity={status.severity} sx={{ mt: 2, '& .MuiAlert-message': { width: '100%', minWidth: 0 } }}>
            <AlertTitle sx={{ mb: problem ? 0.5 : 0 }}>{status.text}</AlertTitle>
            {problem && <Text size={'sub'} color="black">{problem.title}</Text>}
            {problem && problem.compileErrors.length > 0 &&
                <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                    {problem.compileErrors.map((e) => (
                        <li key={`${e.file}:${e.line}:${e.message}`}>
                            <Text size={'sub'} color="black"><b>{e.file} line {e.line}</b>: {e.message}</Text>
                        </li>
                    ))}
                </Box>
            }
            {problem?.output &&
                <>
                    <Link component="button" type="button" underline="hover" sx={{ mt: 1, fontSize: 13 }} onClick={() => setShowOutput((v) => !v)}>
                        {showOutput ? 'Hide full output' : 'Show full output'}
                    </Link>
                    <Collapse in={showOutput}>
                        <Box component="pre" sx={{ mt: 1, mb: 0, p: 1.5, maxHeight: 280, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {problem.output}
                        </Box>
                    </Collapse>
                </>
            }
        </Alert>
    )
}

const BuildResult = ({ build, onReport, onDownload }: { build: RuleBuild; onReport: () => void; onDownload: () => void }) => {
    const status = describeStatus(build)
    const finished = build.finishedAt ? new Date(build.finishedAt).getTime() - new Date(build.createdAt).getTime() : undefined
    const active = build.status === 'queued' || build.status === 'running'
    return (
        <Box mt={2} p={2} border={'1px solid'} borderColor={'static.border'} borderRadius={2}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap'} gap={1} mb={1.5}>
                <Box display={'flex'} alignItems={'center'} gap={1.5}>
                    <Text size={'main'} color="black">Build #{build.buildId}</Text>
                    <Chip size="small" label={status.label} color={status.severity === 'info' ? 'info' : status.severity} />
                </Box>
                <Text size={'sub'} color="text.ternary">
                    {build.ruleId}@{build.version} · started {new Date(build.createdAt).toLocaleString()}
                    {finished !== undefined ? ` · took ${formatDuration(finished)}` : ''}
                    {build.requestedBy ? ` · by ${build.requestedBy}` : ''}
                </Text>
            </Box>

            <Stages build={build} />

            {active
                ? <Alert severity="info" sx={{ mt: 2 }}>{status.text}</Alert>
                : build.status === 'passed'
                    ? <Alert severity="success" sx={{ mt: 2 }}>{status.text}</Alert>
                    : <Problem build={build} />
            }

            {(build.tests || build.package || build.image || build.gitRepo || build.simulation) &&
                <Box mt={2}>
                    {build.tests &&
                        <Row label="Tests">
                            <Mono>{build.tests.passed}/{build.tests.total} passed · coverage threshold {build.tests.coverageThresholdMet ? 'met' : 'not met'}</Mono>
                        </Row>
                    }
                    {build.package &&
                        <Row label="Package">
                            <Mono>{build.package.file}</Mono>
                            <Mono>{build.package.integrity}</Mono>
                        </Row>
                    }
                    {build.image &&
                        <Row label="Image">
                            <Mono>{build.image.ref}</Mono>
                            {build.image.digest && <Mono>digest {build.image.digest}</Mono>}
                        </Row>
                    }
                    {build.gitRepo &&
                        <Row label="Source">
                            <Link href={build.gitRepo} target="_blank" rel="noreferrer"><Mono>{build.gitRepo}</Mono></Link>
                        </Row>
                    }
                    {build.simulation &&
                        <Row label="Simulation">
                            <Mono>
                                {build.simulation.ok
                                    ? `Up in ${formatDuration(build.simulation.upMs)}, listening on ${build.simulation.subject ?? ''}; torn down`
                                    : `Did not start: ${build.simulation.error ?? ''}`}
                            </Mono>
                        </Row>
                    }
                </Box>
            }

            {(build.hasReport || build.package) &&
                <Box display={'flex'} flexWrap={'wrap'} gap={2} mt={2}>
                    {build.hasReport && <Button height="40px" width="190px" type="secondary" size="md" text="View Test Report" Icon={DescriptionOutlinedIcon} onClick={onReport} />}
                    {build.package && <Button height="40px" width="210px" type="secondary" size="md" text="Download Package" Icon={DownloadIcon} onClick={onDownload} />}
                </Box>
            }
        </Box>
    )
}

const RulePipeline = (props: IRulePipeline) => {
    const { values, functions } = useRulePipelineController(props)
    const { build } = values

    return (
        <Section
            header={'Build & Test'}
            subHeader={"Runs this rule's unit tests in a throwaway container, packages it and, as configured, builds, pushes and simulates its image."}
        >
            <Box width={'100%'}>
                <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap'} gap={2}>
                    <Box display={'flex'} flexWrap={'wrap'} alignItems={'center'} gap={1}>
                        <Text size={'sub'} color="text.ternary">Builds with</Text>
                        {values.chips.map((chip) => <Chip key={chip} size="small" variant="outlined" label={chip} />)}
                    </Box>
                    {values.canBuild &&
                        <Box display={'flex'} alignItems={'center'} gap={2}>
                            <FormControlLabel
                                sx={{ m: 0 }}
                                control={<Checkbox size="small" checked={values.simulate && values.canSimulate} disabled={!values.canSimulate || values.running} onChange={(e) => functions.setSimulate(e.target.checked)} />}
                                label={<Text size={'sub'} color="black">Simulate the built image</Text>}
                            />
                            <Button
                                height="40px"
                                width="170px"
                                type="primary"
                                size="md"
                                text={values.running ? "Building…" : "Build & Test"}
                                Icon={PlayArrowIcon}
                                loading={values.starting || values.running}
                                disabled={values.running}
                                onClick={functions.handleBuild}
                            />
                        </Box>
                    }
                </Box>

                {build
                    ? <BuildResult build={build} onReport={functions.handleReport} onDownload={() => { void functions.handleDownload() }} />
                    : <Box mt={2} p={2} border={'1px dashed'} borderColor={'static.border'} borderRadius={2}>
                        <Text size={'sub'} color="text.ternary">
                            {values.canBuild ? 'No builds yet. Build & Test checks the rule the way the pipeline ships it: unit tests, package, image and, if selected, a short simulation.' : 'No builds yet.'}
                        </Text>
                    </Box>
                }
            </Box>
        </Section>
    )
}

export default RulePipeline
