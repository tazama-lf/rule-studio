import { Box, styled, Typography } from "@mui/material";

export const PageWrapper = styled(Box)(() => ({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
}));

export const StatsRow = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(2),
}));

export const StatCard = styled(Box)<{ highlight?: boolean }>(({ theme, highlight }) => ({
    flex: 1,
    padding: theme.spacing(2.5, 2),
    backgroundColor: highlight ? "#f0fdf4" : "#fff",
    border: `1px solid ${highlight ? "#86efac" : "#e5e7eb"}`,
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(0.5),
}));

export const StatValue = styled(Typography)<{ highlight?: boolean }>(({ highlight }) => ({
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1.1,
    color: highlight ? "#16a34a" : "#111827",
}));

export const StatLabel = styled(Typography)(() => ({
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
}));

export const SummaryCard = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
}));

export const SummaryTitle = styled(Typography)(() => ({
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "20px",
}));

export const SummaryGrid = styled(Box)(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2.5, 4),
}));

export const SummaryField = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    gap: "4px",
}));

export const FieldLabel = styled(Typography)(() => ({
    fontSize: "12px",
    color: "#6b7280",
}));

export const FieldValue = styled(Typography)(() => ({
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
}));

export const Divider = styled(Box)(() => ({
    height: "1px",
    backgroundColor: "#e5e7eb",
    gridColumn: "1 / -1",
}));

export const ActionRow = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
}));
