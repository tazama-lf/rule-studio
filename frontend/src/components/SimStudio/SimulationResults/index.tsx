import { useState, useMemo } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
    Box,
    Button as MuiButton,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { useGetSuiteResultQuery, useLazyGetTriggerConfigByIdQuery, type SuiteRunResult } from "../../../redux/Api/SimStudio";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";

// ── Outcome chip ──────────────────────────────────────────────────────────────

const OUTCOME_STYLES: Record<string, { bg: string; color: string; border: string }> = {
    SUCCESS: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    FAILED:  { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    ERROR:   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const OutcomeChip = ({ outcome }: { outcome: string }) => {
    const s = OUTCOME_STYLES[outcome.toUpperCase()] ?? { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.25,
                py: 0.25,
                borderRadius: "6px",
                fontSize: 11.5,
                fontWeight: 700,
                border: `1px solid ${s.border}`,
                bgcolor: s.bg,
                color: s.color,
                whiteSpace: "nowrap",
                textTransform: "uppercase",
            }}
        >
            {outcome}
        </Box>
    );
};

// ── Strategy code → label ─────────────────────────────────────────────────────

const STRATEGY_LABEL: Record<string, string> = {
    keep_sample:   "Use Sample Value",
    static:        "Set Static Value",
    static_value:  "Set Static Value",
    range:         "Use Range",
    remove:        "Skip Field",
    skip_field:    "Skip Field",
    generated:     "Random",
    random:        "Random",
};

const STRATEGY_CHIP: Record<string, { bg: string; color: string; border: string }> = {
    "Use Sample Value": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    "Set Static Value": { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    "Use Range":        { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    "Skip Field":       { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
    "Random":           { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

const ActionBadge = ({ code }: { code: string }) => {
    const label = STRATEGY_LABEL[code] ?? code;
    const s = STRATEGY_CHIP[label] ?? STRATEGY_CHIP["Skip Field"];
    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.25,
                py: 0.3,
                borderRadius: "6px",
                fontSize: 11,
                fontWeight: 700,
                border: `1px solid ${s.border}`,
                bgcolor: s.bg,
                color: s.color,
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </Box>
    );
};

// ── Payload modal ─────────────────────────────────────────────────────────────

const PayloadModal = ({
    open,
    onClose,
    triggerId,
}: {
    open: boolean;
    onClose: () => void;
    triggerId: string | null;
}) => {
    const [fetchTriggerConfig, { data, isFetching, isError }] = useLazyGetTriggerConfigByIdQuery();

    useMemo(() => {
        if (open && triggerId) {
            void fetchTriggerConfig(Number(triggerId));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, triggerId]);

    const cfg = data?.data;
    const strategies = cfg?.field_strategies ?? [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: "88vh" } }}>
            {/* ── Header ── */}
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.75, px: 3, borderBottom: "1px solid #e5e7eb" }}>
                <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                        Field Strategies
                        {cfg && (
                            <Box component="span" sx={{ ml: 1.5 }}>
                                <Chip label={cfg.txtp} size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 11, height: 20, borderRadius: "4px" }} />
                                <Chip label={`v${cfg.txtp_version}`} size="small" sx={{ ml: 0.75, bgcolor: "#f5f3ff", color: "#6d28d9", fontWeight: 600, fontSize: 11, height: 20, borderRadius: "4px" }} />
                            </Box>
                        )}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.25 }}>
                        Read-only view — Trigger Config ID: {triggerId}
                        {cfg && <Box component="span" sx={{ ml: 1.5, color: "#9ca3af" }}>· {strategies.length} field{strategies.length !== 1 ? "s" : ""} configured</Box>}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: "#6b7280" }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            {/* ── Body ── */}
            <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {isFetching ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                        <CircularProgress size={28} />
                        <Typography sx={{ ml: 2, fontSize: 13, color: "#6b7280" }}>Loading field strategies…</Typography>
                    </Box>
                ) : isError ? (
                    <Box display="flex" flexDirection="column" alignItems="center" py={10}>
                        <ErrorOutlineIcon sx={{ fontSize: 32, color: "#ef4444", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Failed to load trigger config.</Typography>
                    </Box>
                ) : strategies.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" py={10}>
                        <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>No field strategies configured for this trigger.</Typography>
                    </Box>
                ) : (
                    <TableContainer sx={{ overflowY: "auto", flex: 1 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow sx={{
                                    "& th": {
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        bgcolor: "#f9fafb",
                                        borderBottom: "1px solid #e5e7eb",
                                        py: 1.5,
                                        px: 2.5,
                                        whiteSpace: "nowrap",
                                    },
                                }}>
                                    <TableCell>#</TableCell>
                                    <TableCell>Field Path</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Static Value</TableCell>
                                    <TableCell>Range</TableCell>
                                    <TableCell>Semantic Type</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {strategies.map((s, idx) => {
                                    const label = STRATEGY_LABEL[s.strategy_code] ?? s.strategy_code;
                                    return (
                                        <TableRow key={s.id} hover sx={{ "& td": { borderBottom: "1px solid #f3f4f6", py: 1.25, px: 2.5, fontSize: 13 } }}>
                                            <TableCell sx={{ color: "#9ca3af", fontSize: 12, width: 40 }}>{idx + 1}</TableCell>

                                            {/* Field path */}
                                            <TableCell sx={{ maxWidth: 320 }}>
                                                <Tooltip title={s.field_path} placement="top-start">
                                                    <Typography
                                                        sx={{
                                                            fontSize: 12,
                                                            fontFamily: "monospace",
                                                            color: "#2563eb",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            maxWidth: 310,
                                                        }}
                                                    >
                                                        {s.field_path}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>

                                            {/* Action badge */}
                                            <TableCell><ActionBadge code={s.strategy_code} /></TableCell>

                                            {/* Static value */}
                                            <TableCell>
                                                {label === "Set Static Value" && s.static_value !== undefined && s.static_value !== null ? (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            fontSize: 12,
                                                            fontFamily: "monospace",
                                                            bgcolor: "#f3f4f6",
                                                            border: "1px solid #e5e7eb",
                                                            borderRadius: "4px",
                                                            px: 0.75,
                                                            py: 0.25,
                                                        }}
                                                    >
                                                        {String(s.static_value)}
                                                    </Box>
                                                ) : (
                                                    <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                                                )}
                                            </TableCell>

                                            {/* Range */}
                                            <TableCell>
                                                {label === "Use Range" && (s.range_min !== null || s.range_max !== null) ? (
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <Box component="span" sx={{ fontSize: 12, fontFamily: "monospace", bgcolor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "4px", px: 0.75, py: 0.25 }}>
                                                            {s.range_min ?? "—"}
                                                        </Box>
                                                        <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>to</Typography>
                                                        <Box component="span" sx={{ fontSize: 12, fontFamily: "monospace", bgcolor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "4px", px: 0.75, py: 0.25 }}>
                                                            {s.range_max ?? "—"}
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                                                )}
                                            </TableCell>

                                            {/* Semantic type */}
                                            <TableCell>
                                                {s.faker_semantic_type ? (
                                                    <Chip
                                                        label={s.faker_semantic_type}
                                                        size="small"
                                                        sx={{ bgcolor: "#f5f3ff", color: "#6d28d9", fontWeight: 600, fontSize: 11, height: 18, borderRadius: "4px" }}
                                                    />
                                                ) : (
                                                    <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 1.5, px: 2.5, py: 2, flex: 1, minWidth: 130 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: color ?? "#111827", lineHeight: 1.2 }}>
            {value}
        </Typography>
    </Box>
);

// ── Run result row ────────────────────────────────────────────────────────────

const RunResultRow = ({
    run,
    expanded,
    onToggle,
    search,
}: {
    run: SuiteRunResult;
    expanded: boolean;
    onToggle: () => void;
    search: string;
}) => {
    const [payloadModal, setPayloadModal] = useState<{ triggerId: string; generationId: string } | null>(null);

    const filteredTriggers = useMemo(() => {
        let rows = run.triggers;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(
                (t) =>
                    t.trigger_id.toLowerCase().includes(q) ||
                    t.id.toLowerCase().includes(q) ||
                    t.sub_rule_ref.toLowerCase().includes(q) ||
                    t.independent_variable.toLowerCase().includes(q)
            );
        }
        return rows;
    }, [run.triggers, search]);

    return (
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
            {/* Row header */}
            <Box
                onClick={onToggle}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    bgcolor: expanded ? "#f8fafc" : "#fff",
                    borderBottom: expanded ? "1px solid #e5e7eb" : "none",
                    "&:hover": { bgcolor: "#f8fafc" },
                    transition: "background 0.1s",
                }}
            >
                <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    sx={{ color: "#6b7280", p: 0.25 }}
                >
                    {expanded
                        ? <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                        : <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />}
                </IconButton>

                {/* Run ID */}
                <Box minWidth={100}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        Run #{run.run_id}
                    </Typography>
                </Box>

                {/* rule name */}
                <Chip
                    label={run.rule_name}
                    size="small"
                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 11, height: 20, borderRadius: "4px" }}
                />

                {/* rule version */}
                <Chip
                    label={`v${run.rule_version}`}
                    size="small"
                    sx={{ bgcolor: "#f5f3ff", color: "#6d28d9", fontWeight: 600, fontSize: 11, height: 20, borderRadius: "4px" }}
                />

                <Box flex={1} />

                {/* trigger count */}
                <Box textAlign="right" mr={1}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Triggers</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{run.trigger_count}</Typography>
                </Box>

                {/* outcome */}
                <OutcomeChip outcome={run.outcome} />
            </Box>

            {/* Expanded trigger table */}
            <Collapse in={expanded} timeout={150}>
                <Box>
                    {filteredTriggers.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: "center" }}>
                            <ErrorOutlineIcon sx={{ fontSize: 28, color: "#e5e7eb", mb: 0.75 }} />
                            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>No triggers match the current filter</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f9fafb", "& th": { fontSize: 11.5, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb", py: 1.25, px: 2, whiteSpace: "nowrap" } }}>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Trigger ID</TableCell>
                                        <TableCell>Sub-Rule Ref</TableCell>
                                        <TableCell>Independent Variable</TableCell>
                                        <TableCell>Payload</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTriggers.map((trigger) => (
                                        <TableRow key={trigger.id} hover sx={{ "& td": { borderBottom: "1px solid #f3f4f6", py: 1.25, px: 2, fontSize: 13 } }}>
                                            <TableCell>
                                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                                    {trigger.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: "#2563eb", fontFamily: "monospace", fontSize: 12 }}>
                                                {trigger.trigger_id}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={trigger.sub_rule_ref}
                                                    size="small"
                                                    sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 600, fontSize: 11, height: 18, borderRadius: "4px" }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: "#374151" }}>{trigger.independent_variable}</TableCell>
                                            <TableCell>
                                                <MuiButton
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPayloadModal({ triggerId: trigger.trigger_id, generationId: run.generation_id });
                                                    }}
                                                    sx={{
                                                        fontSize: 12,
                                                        py: 0.4,
                                                        px: 1.25,
                                                        textTransform: "none",
                                                        borderColor: "#d1d5db",
                                                        color: "#374151",
                                                        "&:hover": { borderColor: "#2563eb", color: "#2563eb", bgcolor: "#eff6ff" },
                                                    }}
                                                >
                                                    View
                                                </MuiButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <Box sx={{ px: 2.5, py: 1.25, borderTop: "1px solid #f3f4f6", bgcolor: "#fafafa", display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography sx={{ fontSize: 11.5, color: "#6b7280" }}>
                            Showing {filteredTriggers.length} of {run.triggers.length} trigger{run.triggers.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                </Box>
            </Collapse>

            {/* Payload modal */}
            <PayloadModal
                open={!!payloadModal}
                onClose={() => setPayloadModal(null)}
                triggerId={payloadModal?.triggerId ?? null}
            />
        </Box>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

const SimulationResults = () => {
    const suiteId = extractData("sim_suite_id", LocalStorage, false) as number | null;

    const { data, isLoading, isError } = useGetSuiteResultQuery(Number(suiteId), {
        skip: !suiteId,
    });

    const results = data?.data?.results ?? [];

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [outcomeFilter, setOutcomeFilter] = useState("all");

    // Expand last run by default once data arrives
    useMemo(() => {
        if (results.length > 0) {
            setExpandedIds(new Set([results[results.length - 1].run_id]));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const filteredResults = useMemo(() => {
        if (outcomeFilter === "all") return results;
        return results.filter((r) => r.outcome.toUpperCase() === outcomeFilter.toUpperCase());
    }, [results, outcomeFilter]);

    const handleToggle = (runId: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(runId)) next.delete(runId); else next.add(runId);
            return next;
        });
    };

    const handleExpandAll = () => setExpandedIds(new Set(results.map((r) => r.run_id)));
    const handleCollapseAll = () => setExpandedIds(new Set());

    // Summary stats
    const totalRuns = results.length;
    const successCount = results.filter((r) => r.outcome.toUpperCase() === "SUCCESS").length;
    const failedCount = results.filter((r) => r.outcome.toUpperCase() !== "SUCCESS").length;
    const totalTriggers = results.reduce((acc, r) => acc + r.trigger_count, 0);

    if (isLoading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={12} gap={2}>
                <CircularProgress size={48} thickness={3} sx={{ color: "#4789f6" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                    Loading simulation results…
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                    Please wait while we fetch your results
                </Typography>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" py={12}>
                <ErrorOutlineIcon sx={{ fontSize: 36, color: "#ef4444", mb: 1 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Failed to load results</Typography>
                <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.5 }}>Please try refreshing the page.</Typography>
            </Box>
        );
    }

    if (!suiteId || results.length === 0) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" py={12}>
                <StorageOutlinedIcon sx={{ fontSize: 36, color: "#e5e7eb", mb: 1 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>No simulation results yet</Typography>
                <Typography sx={{ fontSize: 12, color: "#d1d5db", mt: 0.5 }}>Run the simulation from the Preview &amp; Save step to generate results.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1100, mx: "auto", width: "100%" }}>

            {/* ── Stat row ── */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <StatCard label="Total Runs" value={totalRuns} />
                <StatCard label="Successful" value={successCount} color="#15803d" />
                <StatCard label="Failed" value={failedCount} color={failedCount > 0 ? "#b91c1c" : "#111827"} />
                <StatCard label="Total Triggers" value={totalTriggers} />
            </Box>

            {/* ── Toolbar ── */}
            <Box display="flex" alignItems="center" gap={1.5} mb={2} flexWrap="wrap">
                <TextField
                    size="small"
                    placeholder="Search by trigger ID, sub-rule ref…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                            </InputAdornment>
                        ),
                        sx: { fontSize: 13, "& input": { py: "7px" } },
                    }}
                    sx={{ flex: 1, minWidth: 260, maxWidth: 480, bgcolor: "#fff", borderRadius: 1 }}
                />

                <Select
                    size="small"
                    value={outcomeFilter}
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    startAdornment={<FilterListIcon sx={{ fontSize: 16, color: "#6b7280", mr: 0.5 }} />}
                    sx={{ fontSize: 13, minWidth: 170, bgcolor: "#fff", "& .MuiSelect-select": { py: "7px" } }}
                >
                    <MenuItem value="all"     sx={{ fontSize: 13 }}>All Outcomes</MenuItem>
                    <MenuItem value="SUCCESS" sx={{ fontSize: 13 }}>Success</MenuItem>
                    <MenuItem value="FAILED"  sx={{ fontSize: 13 }}>Failed</MenuItem>
                    <MenuItem value="ERROR"   sx={{ fontSize: 13 }}>Error</MenuItem>
                </Select>

                <Box display="flex" alignItems="center" gap={0.5} sx={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", bgcolor: "#fff" }}>
                    <Box
                        onClick={handleExpandAll}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "#374151",
                            cursor: "pointer",
                            borderRight: "1px solid #e5e7eb",
                            "&:hover": { bgcolor: "#f3f4f6", color: "#111827" },
                            transition: "all 0.15s",
                        }}
                    >
                        <UnfoldMoreIcon sx={{ fontSize: 15 }} />
                        Expand All
                    </Box>
                    <Box
                        onClick={handleCollapseAll}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "#374151",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#f3f4f6", color: "#111827" },
                            transition: "all 0.15s",
                        }}
                    >
                        <UnfoldLessIcon sx={{ fontSize: 15 }} />
                        Collapse All
                    </Box>
                </Box>
            </Box>

            {/* ── Section label ── */}
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <StorageOutlinedIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Simulation History
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#d1d5db", ml: 0.5 }}>
                    · {filteredResults.length} run{filteredResults.length !== 1 ? "s" : ""}
                </Typography>
            </Box>

            {/* ── Run rows ── */}
            {filteredResults.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>No runs match the current filter.</Typography>
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={1.5}>
                    {filteredResults.map((run) => (
                        <RunResultRow
                            key={run.run_id}
                            run={run}
                            expanded={expandedIds.has(run.run_id)}
                            onToggle={() => handleToggle(run.run_id)}
                            search={search}
                        />
                    ))}
                </Box>
            )}

            {/* ── Summary footer ── */}
            {results.length > 0 && (
                <Box display="flex" alignItems="center" gap={1.5} mt={2.5} px={0.5}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#22c55e" }} />
                    <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                        <strong style={{ color: "#15803d" }}>{successCount}</strong> successful ·&nbsp;
                        <strong style={{ color: failedCount > 0 ? "#b91c1c" : "#374151" }}>{failedCount}</strong> failed out of {totalRuns} total run{totalRuns !== 1 ? "s" : ""}
                    </Typography>
                    <CancelOutlinedIcon sx={{ fontSize: 14, color: failedCount > 0 ? "#ef4444" : "#d1d5db" }} />
                </Box>
            )}
        </Box>
    );
};

export default SimulationResults;

