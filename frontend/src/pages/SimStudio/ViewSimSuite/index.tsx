import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
    useCloneGenerationMutation,
    useGetSuiteByIdQuery,
    useGetSuiteGenerationsQuery,
    useLazyResumeGenerationQuery,
    useRerunSimulationMutation,
    type SuiteGeneration,
} from "../../../redux/Api/SimStudio";
import { LocalStorage } from "../../../utils/Common/enums";
import { insertData, removeData } from "../../../utils/Common/storage";

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
    DRAFT:     { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
    COMPLETED: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
    RUNNING:   { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
    FAILED:    { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

const outcomeStyles: Record<string, { bg: string; color: string; border: string }> = {
    SUCCESS:      { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    COMPLETED:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    FAILED:       { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    ERROR:        { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    RUNNING:      { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    DRAFT:        { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    "NOT-SIMULATE": { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

const fallbackStatusStyle = { bg: "#f9fafb", color: "#374151", dot: "#9ca3af" };

const STEP_TAB_MAP: Record<number, string> = {
    1: "create_generation",
    2: "txtp_selection",
    3: "trigger_data",
    4: "enrichment_data",
    5: "preview_save",
};

const formatStatusLabel = (status?: string | null): string => {
    if (!status) return "Unknown";
    return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
};

const OutcomeChip = ({ outcome }: { outcome?: string | null }) => {
    const label = outcome || "UNKNOWN";
    const styles = outcomeStyles[label.toUpperCase()] ?? { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };

    return (
        <Chip
            label={label}
            size="small"
            sx={{
                height: 22,
                bgcolor: styles.bg,
                color: styles.color,
                border: `1px solid ${styles.border}`,
                borderRadius: "6px",
                fontSize: 11,
                fontWeight: 700,
            }}
        />
    );
};

const MetaRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box mb={2.5}>
        <Typography
            fontSize={10}
            fontWeight={600}
            color="#9ca3af"
            textTransform="uppercase"
            letterSpacing={0.8}
            mb={0.75}
        >
            {label}
        </Typography>
        {children}
    </Box>
);

const GenerationActionButton = ({
    label,
    icon,
    color,
    loading = false,
    disabled = false,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) => (
    <Tooltip title={label}>
        <span>
            <Button
                size="small"
                variant="outlined"
                startIcon={loading ? <CircularProgress size={14} sx={{ color }} /> : icon}
                onClick={onClick}
                disabled={disabled}
                sx={{
                    height: 30,
                    minWidth: 76,
                    px: 1.15,
                    borderRadius: "6px",
                    borderColor: "#e5e7eb",
                    bgcolor: "#ffffff",
                    color,
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    "&:hover": {
                        borderColor: color,
                        bgcolor: "#f8fafc",
                    },
                    "&.Mui-disabled": {
                        borderColor: "#e5e7eb",
                        bgcolor: "#f9fafb",
                        color: "#9ca3af",
                    },
                    "& .MuiButton-startIcon": {
                        mr: 0.5,
                        ml: 0,
                    },
                }}
            >
                {label}
            </Button>
        </span>
    </Tooltip>
);

const ViewSimSuite = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [generationStatusFilter, setGenerationStatusFilter] = useState<string>("");
    const [resumingRunId, setResumingRunId] = useState<string | number | null>(null);
    const [cloningRunId, setCloningRunId] = useState<string | number | null>(null);
    const [rerunningRunId, setRerunningRunId] = useState<string | number | null>(null);
    const [triggerResume] = useLazyResumeGenerationQuery();
    const [cloneGeneration] = useCloneGenerationMutation();
    const [rerunSimulation] = useRerunSimulationMutation();

    const suiteId = id ? Number(id) : null;
    const { data, isLoading, isError } = useGetSuiteByIdQuery(suiteId!, { skip: !suiteId });
    const {
        data: generationsData,
        isLoading: isGenerationsLoading,
        isError: isGenerationsError,
    } = useGetSuiteGenerationsQuery(suiteId!, { skip: !suiteId });
    const suite = data?.suite;
    const generations = useMemo(() => generationsData?.data ?? [], [generationsData?.data]);
    const filteredGenerations = useMemo(() => {
        if (!generationStatusFilter) return generations;
        return generations.filter((generation) => generation.status?.toUpperCase() === generationStatusFilter);
    }, [generationStatusFilter, generations]);

    const styles = suite?.status ? (statusStyles[suite.status] ?? fallbackStatusStyle) : null;

    const handleResume = useCallback(async (generation: SuiteGeneration) => {
        if (!suiteId) return;

        setResumingRunId(generation.id);
        try {
            const result = await triggerResume({ suiteId, generationId: generation.id }).unwrap();
            const genId = result.data.id;
            const resumeSuiteId = result.data.suite_id;
            const currentStep = (result.data.wizard_snapshot?.currentStep as number) ?? 1;
            const tabValue = STEP_TAB_MAP[currentStep] ?? "create_generation";

            insertData(genId, "sim_gen_id", LocalStorage, false);
            insertData(resumeSuiteId, "sim_suite_id", LocalStorage, false);
            removeData("sim_clone_mode", LocalStorage);
            removeData("sim_clone_type", LocalStorage);
            removeData("sim_results_locked", LocalStorage);
            navigate(`/sim-studio/create?simStudioTab=${tabValue}`);
        } catch {
            toast.error("Failed to resume simulation suite. Please try again.");
        } finally {
            setResumingRunId(null);
        }
    }, [navigate, suiteId, triggerResume]);

    const handleClone = useCallback(async (generation: SuiteGeneration) => {
        if (!suiteId) return;

        const generationId = Number(generation.id);
        if (Number.isNaN(generationId)) {
            toast.error("Generation ID is missing for this run.");
            return;
        }

        setCloningRunId(generation.id);
        try {
            const result = await cloneGeneration({ suite_id: suiteId, generation_id: generationId }).unwrap();
            insertData(result.data.id, "sim_gen_id", LocalStorage, false);
            insertData(result.data.suite_id, "sim_suite_id", LocalStorage, false);
            insertData(true, "sim_clone_mode", LocalStorage, false);
            insertData("generation", "sim_clone_type", LocalStorage, false);
            removeData("sim_results_locked", LocalStorage);
            navigate("/sim-studio/create?simStudioTab=create_generation");
        } catch {
            toast.error("Failed to clone simulation generation. Please try again.");
        } finally {
            setCloningRunId(null);
        }
    }, [cloneGeneration, navigate, suiteId]);

    const handleRerun = useCallback(async (generation: SuiteGeneration) => {
        if (!suiteId) return;

        const generationId = Number(generation.id);
        if (Number.isNaN(generationId)) {
            toast.error("Generation ID is missing for this run.");
            return;
        }

        setRerunningRunId(generation.id);
        try {
            await rerunSimulation({ suiteId, generationId }).unwrap();
            insertData(generationId, "sim_gen_id", LocalStorage, false);
            insertData(suiteId, "sim_suite_id", LocalStorage, false);
            insertData(true, "sim_results_locked", LocalStorage, false);
            removeData("sim_clone_mode", LocalStorage);
            removeData("sim_clone_type", LocalStorage);
            navigate("/sim-studio/create?simStudioTab=simulation_results");
        } catch {
            toast.error("Failed to rerun simulation. Please try again.");
        } finally {
            setRerunningRunId(null);
        }
    }, [navigate, rerunSimulation, suiteId]);

    const handleViewResults = useCallback((generation: SuiteGeneration) => {
        if (!suiteId) return;

        insertData(generation.id, "sim_gen_id", LocalStorage, false);
        insertData(suiteId, "sim_suite_id", LocalStorage, false);
        removeData("sim_clone_mode", LocalStorage);
        removeData("sim_clone_type", LocalStorage);
        removeData("sim_results_locked", LocalStorage);
        navigate("/sim-studio/create?simStudioTab=simulation_results");
    }, [navigate, suiteId]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f3f4f6">
                <CircularProgress size={32} thickness={4} sx={{ color: "#2b7fff" }} />
            </Box>
        );
    }

    if (isError || !suite) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f3f4f6">
                <Box textAlign="center">
                    <Typography fontSize={15} fontWeight={600} color="text.primary" mb={0.5}>
                        Suite not found
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                        The simulation suite could not be loaded.
                    </Typography>
                </Box>
            </Box>
        );
    }

    const suiteStatus = suite.status?.toUpperCase();
    const isSuiteDraft = suiteStatus === "DRAFT";
    const statusLabel = formatStatusLabel(suite.status);

    return (
        <Box minHeight="100vh" bgcolor="#f3f4f6" display="flex" flexDirection="column">

            {/* ── Top Bar ── */}
            <Box
                display="flex"
                alignItems="center"
                gap={1.5}
                px={3}
                py={1.5}
                bgcolor="#fff"
                borderBottom="1px solid #e5e7eb"
                sx={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.04)" }}
            >
                <IconButton
                    size="small"
                    onClick={() => navigate("/sim-studio")}
                    sx={{ color: "#6b7280", "&:hover": { bgcolor: "#f3f4f6", color: "#111827" } }}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>

                <Box flex={1} display="flex" alignItems="baseline" gap={1.5}>
                    <Typography fontSize={17} fontWeight={700} color="#111827" lineHeight={1.3}>
                        {suite.name}
                    </Typography>
                    {suite.status && styles && (
                        <Box
                            display="inline-flex"
                            alignItems="center"
                            gap={0.6}
                            px={1.25}
                            py={0.35}
                            borderRadius="999px"
                            sx={{ bgcolor: styles.bg }}
                        >
                            <Box
                                width={6}
                                height={6}
                                borderRadius="50%"
                                sx={{ bgcolor: styles.dot, flexShrink: 0 }}
                            />
                            <Typography fontSize={11.5} fontWeight={600} sx={{ color: styles.color }}>
                                {statusLabel}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Typography fontSize={12} color="#9ca3af" fontWeight={500}>
                    Suite ID:&nbsp;
                    <Typography component="span" fontSize={12} fontWeight={700} color="#374151">
                        {suite.id}
                    </Typography>
                </Typography>
            </Box>

            {/* ── Body ── */}
            <Box flex={1} p={3} display="flex" gap={3} alignItems="flex-start">

                {/* Left — Metadata Card */}
                <Box
                    bgcolor="#fff"
                    border="1px solid #e5e7eb"
                    borderRadius={2}
                    p={3}
                    minWidth={260}
                    maxWidth={300}
                    flexShrink={0}
                    sx={{ boxShadow: "0 1px 4px 0 rgb(0 0 0 / 0.04)" }}
                >
                    <Typography
                        fontSize={10}
                        fontWeight={700}
                        color="#9ca3af"
                        textTransform="uppercase"
                        letterSpacing={0.9}
                        mb={2.5}
                    >
                        Suite Metadata
                    </Typography>

                    <MetaRow label="Associated Rule">
                        <Typography fontSize={14} fontWeight={600} color="#111827">
                            {suite.rule_name ?? "—"}
                        </Typography>
                    </MetaRow>

                    <MetaRow label="Rule Version">
                        <Typography fontSize={13} color="#374151">
                            {suite.rule_version ?? "—"}
                        </Typography>
                    </MetaRow>

                    <MetaRow label="TXTP Configuration">
                        <Box display="flex" flexWrap="wrap" gap={0.75}>
                            {suite.primary_txtp ? (
                                <Chip
                                    label={suite.primary_txtp}
                                    size="small"
                                    sx={{
                                        bgcolor: "#eff6ff",
                                        color: "#1d4ed8",
                                        fontWeight: 600,
                                        fontSize: 11.5,
                                        height: 22,
                                        border: "1px solid #bfdbfe",
                                        borderRadius: "6px",
                                    }}
                                />
                            ) : null}
                            {suite.primary_txtp_version ? (
                                <Chip
                                    label={`v${suite.primary_txtp_version}`}
                                    size="small"
                                    sx={{
                                        bgcolor: "#f0fdf4",
                                        color: "#15803d",
                                        fontWeight: 600,
                                        fontSize: 11.5,
                                        height: 22,
                                        border: "1px solid #bbf7d0",
                                        borderRadius: "6px",
                                    }}
                                />
                            ) : null}
                            {!suite.primary_txtp && !suite.primary_txtp_version && (
                                <Typography fontSize={13} color="#9ca3af">—</Typography>
                            )}
                        </Box>
                    </MetaRow>

                    {suite.description && (
                        <>
                            <Divider sx={{ my: 2, borderColor: "#f3f4f6" }} />
                            <MetaRow label="Description">
                                <Typography fontSize={13} color="#6b7280" lineHeight={1.65}>
                                    {suite.description}
                                </Typography>
                            </MetaRow>
                        </>
                    )}
                </Box>

                {/* Right — Iteration History */}
                <Box
                    flex={1}
                    bgcolor="#fff"
                    border="1px solid #e5e7eb"
                    borderRadius={2}
                    overflow="hidden"
                    sx={{ boxShadow: "0 1px 4px 0 rgb(0 0 0 / 0.04)" }}
                >
                    {/* Card Header */}
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        px={3}
                        py={2}
                        borderBottom="1px solid #f3f4f6"
                    >
                        <HistoryIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                        <Typography fontSize={10} fontWeight={700} color="#9ca3af" textTransform="uppercase" letterSpacing={0.9}>
                            Iteration History
                        </Typography>
                        <Box ml="auto">
                            <Select
                                size="small"
                                value={generationStatusFilter}
                                onChange={(event) => setGenerationStatusFilter(event.target.value)}
                                displayEmpty
                                sx={{
                                    minWidth: 150,
                                    height: 34,
                                    borderRadius: "6px",
                                    bgcolor: "#ffffff",
                                    fontSize: 13,
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#e5e7eb",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#cbd5e1",
                                    },
                                    "& .MuiSelect-select": {
                                        py: 0.75,
                                    },
                                }}
                            >
                                <MenuItem value="">All Statuses</MenuItem>
                                <MenuItem value="DRAFT">Draft</MenuItem>
                                <MenuItem value="RUNNING">Running</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                                <MenuItem value="FAILED">Failed</MenuItem>
                            </Select>
                        </Box>
                    </Box>

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow
                                    sx={{
                                        bgcolor: "#f9fafb",
                                        "& th": {
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                            color: "#6b7280",
                                            borderBottom: "1px solid #e5e7eb",
                                            py: 1.25,
                                            px: 2,
                                            whiteSpace: "nowrap",
                                        },
                                    }}
                                >
                                    <TableCell>Status</TableCell>
                                    <TableCell>Rule</TableCell>
                                    <TableCell>Version</TableCell>
                                    <TableCell>Triggers</TableCell>
                                    <TableCell>Result Entries</TableCell>
                                    <TableCell align="right">Outcome</TableCell>
                                    <TableCell align="right" sx={{ minWidth: 288 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isGenerationsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: "none" }}>
                                            <CircularProgress size={24} thickness={4} sx={{ color: "#2b7fff", mb: 1 }} />
                                            <Typography fontSize={13} color="#9ca3af" fontWeight={500}>
                                                Loading iteration history...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : isGenerationsError ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: "none" }}>
                                            <HistoryIcon sx={{ fontSize: 32, color: "#e5e7eb", mb: 1 }} />
                                            <Typography fontSize={13} color="#9ca3af" fontWeight={500}>
                                                Could not load iteration history
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredGenerations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: "none" }}>
                                            <HistoryIcon sx={{ fontSize: 32, color: "#e5e7eb", mb: 1 }} />
                                            <Typography fontSize={13} color="#9ca3af" fontWeight={500}>
                                                {generations.length === 0 ? "No generations yet" : "No generations match this status"}
                                            </Typography>
                                            <Typography fontSize={12} color="#d1d5db" mt={0.5}>
                                                {generations.length === 0
                                                    ? "Create or clone a generation to populate this suite history"
                                                    : "Choose another status to view more iterations"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredGenerations.map((generation) => {
                                        const generationStatus = generation.status?.toUpperCase();
                                        const isDraft = generationStatus === "DRAFT";
                                        const hasSimulationResults = !isDraft;
                                        const canClone = hasSimulationResults && (generationStatus === "COMPLETED" || generationStatus === "FAILED");
                                        const canRerun = hasSimulationResults && !isSuiteDraft;
                                        const isResuming = resumingRunId === generation.id;
                                        const isCloning = cloningRunId === generation.id;
                                        const isRerunning = rerunningRunId === generation.id;
                                        const ruleLabel = generation.rule_name || suite.rule_name || generation.rule_repo || "-";
                                        const versionLabel = generation.rule_version || suite.rule_version || "-";
                                        const triggerCount = isDraft ? "not-simulate" : (generation.trigger_count ?? "-");
                                        const resultEntries = isDraft
                                            ? "not-simulate"
                                            : (generation.result_entries ?? generation.result_entry_count ?? "-");
                                        const outcome = isDraft ? "not-simulate" : (generation.outcome ?? generation.status);

                                        return (
                                            <TableRow key={generation.id} hover sx={{ "& td": { py: 1.5, px: 2, borderBottom: "1px solid #f3f4f6" } }}>
                                                <TableCell>
                                                    <OutcomeChip outcome={generation.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13} color="#374151">
                                                        {ruleLabel}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13} color="#374151">
                                                        {versionLabel}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13} color="#374151">
                                                        {triggerCount}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontSize={13} color="#374151">
                                                        {resultEntries}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <OutcomeChip outcome={outcome} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ minWidth: 288 }}>
                                                    <Box
                                                        display="inline-flex"
                                                        justifyContent="flex-end"
                                                        alignItems="center"
                                                        gap={0.5}
                                                        px={0.5}
                                                        py={0.35}
                                                        border="1px solid #e5e7eb"
                                                        borderRadius="8px"
                                                        bgcolor="#f8fafc"
                                                    >
                                                        {isDraft && (
                                                            <GenerationActionButton
                                                                label="Resume"
                                                                icon={<PlayCircleOutlineIcon fontSize="small" />}
                                                                color="#b45309"
                                                                loading={isResuming}
                                                                disabled={isResuming}
                                                                onClick={() => void handleResume(generation)}
                                                            />
                                                        )}
                                                        {canClone && (
                                                            <GenerationActionButton
                                                                label="Clone"
                                                                icon={<ContentCopyIcon fontSize="small" />}
                                                                color="#0e7490"
                                                                loading={isCloning}
                                                                disabled={isCloning}
                                                                onClick={() => void handleClone(generation)}
                                                            />
                                                        )}
                                                        {canRerun && (
                                                            <GenerationActionButton
                                                                label="Rerun"
                                                                icon={<ReplayIcon fontSize="small" />}
                                                                color="#2563eb"
                                                                loading={isRerunning}
                                                                disabled={isRerunning}
                                                                onClick={() => void handleRerun(generation)}
                                                            />
                                                        )}
                                                        {hasSimulationResults && (
                                                            <GenerationActionButton
                                                                label="View"
                                                                icon={<VisibilityOutlinedIcon fontSize="small" />}
                                                                color="#475569"
                                                                onClick={() => handleViewResults(generation)}
                                                            />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
        </Box>
    );
};

export default ViewSimSuite;

