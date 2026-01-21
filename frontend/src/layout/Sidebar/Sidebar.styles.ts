import { Box, styled } from "@mui/material";
import { NAV_HEIGHT } from "../../utils/Constants";

export const SidebarContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "expanded"
})<{ expanded: boolean }>(({ expanded }) => ({
    position: "fixed",
    height: `calc(100vh - ${NAV_HEIGHT}px)`,
    alignSelf: 'flex-end',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1000,
    width: expanded ? "260px" : "65px",
    backgroundColor: "#fbf9fa",
    borderRight: "1px solid #dfddde",
    borderTop: "1px solid #dfddde",
    transition: "all 0.2s"
}));

export const MenuItemBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== "active" && prop !== "expanded"
})<{ active?: boolean; expanded?: boolean }>(({ active, expanded }) => ({
    display: "flex",
    alignItems: "center",
    height: 48,
    width: '100%',
    cursor: "pointer",
    justifyContent: expanded ? undefined : 'center',
    backgroundColor: active ? '#e9edf9' : "transparent",
    transition: "all 0.2s",
    "&:hover": {
        backgroundColor: "#dfddde",
    },
}));

export const IconWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== "color" && prop !== "expanded"
})<{ color?: string; expanded?: boolean }>(({ color, expanded }) => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: '30px',
    height: '30px',
    border: `1px solid ${color} `,
    borderRadius: '30px',
    color: color ?? "#fff",
    margin: expanded ? '0 0 0 25px' : 0,
}));