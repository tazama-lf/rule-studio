import { Box, Paper, styled } from "@mui/material";

export const ValueContainer = styled(Box)(() => ({
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
}));

export const Tag = styled(Box)(({ theme }) => ({
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 12,
    backgroundColor: theme.palette.text.secondary,
    color: "#fff",
}));

export const DropdownMenu = styled(Paper)(() => ({
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    zIndex: 10,
    maxHeight: 240,
    overflowY: "auto",
}));

export const SearchBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));
