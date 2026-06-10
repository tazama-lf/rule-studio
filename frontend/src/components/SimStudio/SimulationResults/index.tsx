import { useState, useMemo } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import {
    Box,
    Chip,
    Collapse,
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
import Button from "../../Button";

interface SimResult {
    triggerMessageId: string;
    independentVariable: string;
    resultBand: "Good" | "Bad" | "Neutral" | "Error";
    expectedIV: string;
    expectedBand: "Good" | "Bad" | "Neutral" | "Error";
    notes: string;
}

interface Generation {
    id: number;
    generationNumber: number;
    runDate: string;
    ruleVersion: string;
    total: number;
    passed: number;
    failed: number;
    results: SimResult[];
}

const MOCK_GENERATIONS: Generation[] = [
    {
        id: 1,
        generationNumber: 1,
        runDate: "Oct 24, 2023 09:15",
        ruleVersion: "v1.0",
        total: 180,
        passed: 162,
        failed: 18,
        results: [
            { triggerMessageId: "MSG-1001", independentVariable: "620.00",   resultBand: "Good",    expectedIV: "620.00",   expectedBand: "Good",    notes: "Match" },
            { triggerMessageId: "MSG-1002", independentVariable: "18500.00", resultBand: "Bad",     expectedIV: "18500.00", expectedBand: "Bad",     notes: "Threshold exceeded" },
            { triggerMessageId: "MSG-1003", independentVariable: "0.00",     resultBand: "Error",   expectedIV: "45.00",    expectedBand: "Neutral", notes: "Missing field" },
            { triggerMessageId: "MSG-1004", independentVariable: "3200.00",  resultBand: "Good",    expectedIV: "3200.00",  expectedBand: "Good",    notes: "Match" },
            { triggerMessageId: "MSG-1005", independentVariable: "7500.00",  resultBand: "Neutral", expectedIV: "7500.00",  expectedBand: "Neutral", notes: "Within tolerance" },
        ],
    },
    {
        id: 2,
        generationNumber: 2,
        runDate: "Oct 26, 2023 14:30",
        ruleVersion: "v2.0 (Draft)",
        total: 252,
        passed: 240,
        failed: 12,
        results: [
            { triggerMessageId: "MSG-9921", independentVariable: "750.00",   resultBand: "Good",  expectedIV: "750.00",   expectedBand: "Good",    notes: "Match" },
            { triggerMessageId: "MSG-9922", independentVariable: "15000.00", resultBand: "Bad",   expectedIV: "15000.00", expectedBand: "Bad",     notes: "Threshold exceeded" },
            { triggerMessageId: "MSG-9923", independentVariable: "0.00",     resultBand: "Error", expectedIV: "45.00",    expectedBand: "Neutral", notes: "Missing field" },
            { triggerMessageId: "MSG-9924", independentVariable: "900.00",   resultBand: "Good",  expectedIV: "900.00",   expectedBand: "Good",    notes: "Match" },
            { triggerMessageId: "MSG-9925", independentVariable: "4200.00",  resultBand: "Good",  expectedIV: "4200.00",  expectedBand: "Good",    notes: "Match" },
        ],
    },
];

const BAND_STYLES: Record<string, { bg: string; color: string; border: string }> = {
    Good:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    Bad:     { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    Neutral: { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" },
    Error:   { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

const BandChip = ({ band }: { band: string }) => {
    const s = BAND_STYLES[band] ?? BAND_STYLES.Neutral;
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
            }}
        >
            {band}
        </Box>
    );
};

const StatCard = ({
    label,
    value,
    sub,
    color,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
}) => (
    <Box
        sx={{
            bgcolor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 1.5,
            px: 2.5,
            py: 2,
            flex: 1,
            minWidth: 120,
        }}
    >
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: color ?? "#111827", lineHeight: 1.2 }}>
            {value}
        </Typography>
        {sub && (
            <Typography sx={{ fontSize: 11.5, color: "#6b7280", mt: 0.5 }}>{sub}</Typography>
        )}
    </Box>
);

const GenerationRow = ({
    generation,
    expanded,
    onToggle,
    search,
    bandFilter,
}: {
    generation: Generation;
    expanded: boolean;
    onToggle: () => void;
    search: string;
    bandFilter: string;
}) => {
    const filtered = useMemo(() => {
        let rows = generation.results;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(
                (r) =>
                    r.triggerMessageId.toLowerCase().includes(q) ||
                    r.notes.toLowerCase().includes(q)
            );
        }
        if (bandFilter && bandFilter !== "all") {
            rows = rows.filter((r) => r.resultBand === bandFilter);
        }
        return rows;
    }, [generation.results, search, bandFilter]);

    const successRate = generation.total > 0
        ? ((generation.passed / generation.total) * 100).toFixed(1)
        : "0.0";

    return (
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5, overflow: "hidden", bgcolor: "#fff" }}>
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
                        : <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                    }
                </IconButton>
                <Box minWidth={160}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        sim-{String(generation.id).padStart(3, "0")}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "#9ca3af" }}>
                        {generation.runDate}
                    </Typography>
                </Box>

                <Chip
                    label={`#${generation.generationNumber}`}
                    size="small"
                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 11, height: 20, borderRadius: "4px" }}
                />
                <Chip
                    label={generation.ruleVersion}
                    size="small"
                    sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 600, fontSize: 11, height: 20, borderRadius: "4px" }}
                />
                <Box flex={1} />
                <Box display="flex" alignItems="center" gap={3}>
                    <Box textAlign="right">
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Total</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{generation.total}</Typography>
                    </Box>
                    <Box textAlign="right">
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Passed</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 13, color: "#22c55e" }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{generation.passed}</Typography>
                        </Box>
                    </Box>
                    <Box textAlign="right">
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Failed</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <CancelOutlinedIcon sx={{ fontSize: 13, color: "#ef4444" }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{generation.failed}</Typography>
                        </Box>
                    </Box>
                </Box>
                <Button
                    height="30px"
                    type="secondary"
                    size="sm"
                    text="Rerun"
                    Icon={PlayArrowOutlinedIcon}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
            </Box>
            <Collapse in={expanded} timeout={150}>
                <Box>
                    {filtered.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: "center" }}>
                            <ErrorOutlineIcon sx={{ fontSize: 28, color: "#e5e7eb", mb: 0.75 }} />
                            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>No results match the current filters</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f9fafb", "& th": { fontSize: 11.5, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb", py: 1.25, px: 2, whiteSpace: "nowrap" } }}>
                                        <TableCell>Trigger Message ID</TableCell>
                                        <TableCell>Independent Variable</TableCell>
                                        <TableCell>Result Band</TableCell>
                                        <TableCell>Expected IV</TableCell>
                                        <TableCell>Expected Band</TableCell>
                                        <TableCell>Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((row) => (
                                        <TableRow key={row.triggerMessageId} hover sx={{ "& td": { borderBottom: "1px solid #f3f4f6", py: 1.25, px: 2, fontSize: 13 } }}>
                                            <TableCell>
                                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                                    {row.triggerMessageId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: "#374151" }}>{row.independentVariable}</TableCell>
                                            <TableCell><BandChip band={row.resultBand} /></TableCell>
                                            <TableCell sx={{ color: "#374151" }}>{row.expectedIV}</TableCell>
                                            <TableCell><BandChip band={row.expectedBand} /></TableCell>
                                            <TableCell sx={{ color: "#6b7280" }}>{row.notes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <Box sx={{ px: 2.5, py: 1.25, borderTop: "1px solid #f3f4f6", bgcolor: "#fafafa", display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography sx={{ fontSize: 11.5, color: "#6b7280" }}>
                            Success rate: <strong style={{ color: "#15803d" }}>{successRate}%</strong>
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "#d1d5db" }}>·</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "#6b7280" }}>
                            Showing {filtered.length} of {generation.results.length} results
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

const SimulationResults = () => {
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([MOCK_GENERATIONS[MOCK_GENERATIONS.length - 1].id]));
    const [search, setSearch] = useState("");
    const [bandFilter, setBandFilter] = useState("all");

    const handleToggle = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleExpandAll = () => setExpandedIds(new Set(MOCK_GENERATIONS.map((g) => g.id)));
    const handleCollapseAll = () => setExpandedIds(new Set());

    const latest = MOCK_GENERATIONS[MOCK_GENERATIONS.length - 1];
    const totalIterations = MOCK_GENERATIONS.length;
    const latestSuccessRate = latest.total > 0
        ? `${((latest.passed / latest.total) * 100).toFixed(1)}%`
        : "—";
    const totalMessages = MOCK_GENERATIONS.reduce((acc, g) => acc + g.total, 0);

    return (
        <Box sx={{ p: 3, maxWidth: 1100, mx: "auto", width: "100%" }}>
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <StatCard label="Total Iterations" value={totalIterations} />
                <StatCard label="Latest Success Rate" value={latestSuccessRate} color="#15803d" />
                <StatCard label="Total Messages Processed" value={totalMessages} />
                <StatCard
                    label="Active Dataset"
                    value="Q3 Edge Cases"
                    sub={`Gen #${latest.generationNumber}`}
                />
            </Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={2} flexWrap="wrap">
                <TextField
                    size="small"
                    placeholder="Search by Simulation ID or Rule ID..."
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
                    value={bandFilter}
                    onChange={(e) => setBandFilter(e.target.value)}
                    startAdornment={<FilterListIcon sx={{ fontSize: 16, color: "#6b7280", mr: 0.5 }} />}
                    sx={{ fontSize: 13, minWidth: 155, bgcolor: "#fff", "& .MuiSelect-select": { py: "7px" } }}
                >
                    <MenuItem value="all" sx={{ fontSize: 13 }}>Filter Results</MenuItem>
                    <MenuItem value="Good" sx={{ fontSize: 13 }}>Good</MenuItem>
                    <MenuItem value="Bad" sx={{ fontSize: 13 }}>Bad</MenuItem>
                    <MenuItem value="Neutral" sx={{ fontSize: 13 }}>Neutral</MenuItem>
                    <MenuItem value="Error" sx={{ fontSize: 13 }}>Error</MenuItem>
                </Select>
                <Tooltip title="Expand all generations">
                    <IconButton size="small" onClick={handleExpandAll} sx={{ color: "#6b7280", "&:hover": { color: "#2563eb" } }}>
                        <UnfoldMoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
                <Typography
                    component="span"
                    onClick={handleExpandAll}
                    sx={{ fontSize: 13, color: "#2563eb", fontWeight: 500, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                >
                    Expand All
                </Typography>
                <Tooltip title="Collapse all generations">
                    <IconButton size="small" onClick={handleCollapseAll} sx={{ color: "#6b7280", "&:hover": { color: "#374151" } }}>
                        <UnfoldLessIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
                <Typography
                    component="span"
                    onClick={handleCollapseAll}
                    sx={{ fontSize: 13, color: "#374151", fontWeight: 500, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                >
                    Collapse All
                </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <StorageOutlinedIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Simulation History
                </Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={1.5}>
                {MOCK_GENERATIONS.map((gen) => (
                    <GenerationRow
                        key={gen.id}
                        generation={gen}
                        expanded={expandedIds.has(gen.id)}
                        onToggle={() => handleToggle(gen.id)}
                        search={search}
                        bandFilter={bandFilter}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default SimulationResults;
