import { Box, styled, Typography } from "@mui/material";

export const InfoBanner = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    marginBottom: theme.spacing(3),
}));

export const FormCard = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2.5, 3),
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: theme.spacing(2.5),
}));

export const FieldLabel = styled(Typography)(() => ({
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "6px",
}));

export const SchemaTableContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 3, 2.5),
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
}));

export const SchemaTableHeader = styled(Box)(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
}));

export const SchemaTableTitle = styled(Typography)(() => ({
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
}));

export const ColumnHeader = styled(Typography)(() => ({
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
}));

export const RemoveText = styled(Typography)(() => ({
    fontSize: "13px",
    fontWeight: 500,
    color: "#ef4444",
    cursor: "pointer",
    "&:hover": { textDecoration: "underline" },
}));
