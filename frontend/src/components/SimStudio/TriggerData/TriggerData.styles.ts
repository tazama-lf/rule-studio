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

export const AddFormCard = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-end",
    gap: theme.spacing(2),
    flexWrap: "wrap",
    padding: theme.spacing(2, 2.5),
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: theme.spacing(2.5),
}));

export const FieldLabel = styled(Typography)(() => ({
    fontSize: "12px",
    fontWeight: 500,
    color: "#6b7280",
    marginBottom: "6px",
}));

export const PrimaryBadge = styled(Box)(() => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "1px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    marginLeft: "8px",
    verticalAlign: "middle",
}));

export const RemoveText = styled(Typography)(() => ({
    fontSize: "13px",
    fontWeight: 500,
    color: "#ef4444",
    cursor: "pointer",
    "&:hover": { textDecoration: "underline" },
}));

export const AddMappingText = styled(Typography)(() => ({
    fontSize: "13px",
    fontWeight: 500,
    color: "#2563eb",
    cursor: "pointer",
    "&:hover": { textDecoration: "underline" },
}));

export const FieldConfigSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 2.5),
    backgroundColor: "#fafafa",
    borderTop: "1px solid #e5e7eb",
}));

export const FieldConfigHeader = styled(Box)(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
}));

export const FieldConfigTitle = styled(Typography)(() => ({
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
}));

export const FieldConfigSubtitle = styled(Typography)(() => ({
    fontSize: "12px",
    color: "#6b7280",
}));