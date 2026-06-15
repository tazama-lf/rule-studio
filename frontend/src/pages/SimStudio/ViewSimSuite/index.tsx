import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useGetSuiteByIdQuery } from "../../../redux/Api/SimStudio";

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
    DRAFT:     { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
    COMPLETED: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
    RUNNING:   { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
    FAILED:    { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
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

const ViewSimSuite = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useGetSuiteByIdQuery(Number(id), { skip: !id });
    const suite = data?.suite;

    const styles = suite ? (statusStyles[suite.status] ?? { bg: "#f9fafb", color: "#374151", dot: "#9ca3af" }) : null;

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

    const statusLabel = suite.status.charAt(0) + suite.status.slice(1).toLowerCase().replace("_", " ");

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
                    {styles && (
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
                                    <TableCell>Iteration</TableCell>
                                    <TableCell>Created Date</TableCell>
                                    <TableCell>Context</TableCell>
                                    <TableCell>Trigger</TableCell>
                                    <TableCell>Passed</TableCell>
                                    <TableCell>Failed</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        align="center"
                                        sx={{ py: 8, borderBottom: "none" }}
                                    >
                                        <HistoryIcon sx={{ fontSize: 32, color: "#e5e7eb", mb: 1 }} />
                                        <Typography fontSize={13} color="#9ca3af" fontWeight={500}>
                                            No iterations yet
                                        </Typography>
                                        <Typography fontSize={12} color="#d1d5db" mt={0.5}>
                                            Run the simulation to generate iteration history
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
        </Box>
    );
};

export default ViewSimSuite;

