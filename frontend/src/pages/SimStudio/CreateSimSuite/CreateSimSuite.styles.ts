import { Box, styled } from "@mui/material";

export const PageContainer = styled(Box)(() => ({
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
}));

export const TopBar = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1.5, 3),
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e7eb",
}));

export const StepperBar = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: theme.spacing(2.5, 3),
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e7eb",
    overflowX: "auto",
}));

export const StepItem = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 80,
    textAlign: "center",
}));

export const StepCircle = styled(Box, {
    shouldForwardProp: (prop) => prop !== "active" && prop !== "completed",
})<{ active?: boolean; completed?: boolean }>(({ active, completed }) => ({
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 600,
    flexShrink: 0,
    transition: "all 0.2s",
    backgroundColor: active || completed ? "#2b7fff" : "#fff",
    color: active || completed ? "#fff" : "#9ca3af",
    border: `2px solid ${active || completed ? "#2b7fff" : "#d1d5db"}`,
}));

export const StepLabel = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(0.75),
    fontSize: "11px",
    color: theme.palette.text.ternary,
    whiteSpace: "pre-line",
    lineHeight: 1.4,
    textAlign: "center",
}));

export const StepConnector = styled(Box)(() => ({
    fontSize: "16px",
    color: "#d1d5db",
    display: "flex",
    alignItems: "flex-start",
    paddingTop: "6px",
    paddingLeft: "4px",
    paddingRight: "4px",
    flexShrink: 0,
}));

export const ContentArea = styled(Box)(({ theme }) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.spacing(4, 3),
}));

export const FormCard = styled(Box)(({ theme }) => ({
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: theme.spacing(3),
    width: "100%",
    maxWidth: "700px",
}));

export const InfoBanner = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.5, 2),
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    marginBottom: theme.spacing(2.5),
    width: "100%",
    maxWidth: "700px",
}));

export const BottomBar = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2, 3),
    backgroundColor: "#fff",
    borderTop: "1px solid #e5e7eb",
    position: "sticky",
    bottom: 0,
}));
