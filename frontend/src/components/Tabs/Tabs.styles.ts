import { Box, styled, Typography } from "@mui/material";
import { motion } from "framer-motion";

export const Wrapper = styled(Box)(() => ({
    width: "100%",
    overflowX: "auto",
}));

export const TabsContainer = styled(Box)(() => ({
    display: "inline-flex",
    gap: 16,
    minWidth: "max-content",
    marginTop: '20px'
}));

export const TabItemWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ theme, active }) => ({
    position: "relative",
    padding: "10px 16px",
    cursor: "pointer",
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
    backgroundColor: active ? theme.palette.static.lightBlue : 'transparent'
}));

export const TabLabel = styled(Typography, {
    shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ theme, active }) => ({
    fontSize: "0.875rem",
    fontWeight: active ? 500 : 400,
    color: active
        ? theme.palette.static.secondary
        : theme.palette.text.black,
    transition: "color 0.2s",
    whiteSpace: "nowrap",
}));

export const Underline = styled(motion.div)(({ theme }) => ({
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: theme.palette.static.secondary,
    borderRadius: theme.shape.borderRadius,
}));
