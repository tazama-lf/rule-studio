import { Box, styled } from "@mui/material";

export const StatCard = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(2, 2.5),
    borderRadius: "8px",
    border: `1px solid ${theme.palette.static.border}`,
    backgroundColor: "#fff",
    flex: 1,
    minWidth: 0,
}));

export const StatIconWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== "iconColor",
})<{ iconColor: string }>(({ iconColor }) => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: `${iconColor}1a`,
    color: iconColor,
    flexShrink: 0,
}));

export const StatsRow = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
        flexWrap: "wrap",
    },
}));

export const FiltersRow = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(3),
    flexWrap: "wrap",
}));

export const TxtpBadge = styled(Box)(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "4px",
    backgroundColor: theme.palette.static.lightGrey,
    border: `1px solid ${theme.palette.static.border}`,
    fontSize: "12px",
    fontWeight: 500,
    color: theme.palette.text.primary,
    fontFamily: "monospace",
    userSelect: "none",
}));

export const RuleLink = styled(Box)(({ theme }) => ({
    color: theme.palette.text.secondary,
    cursor: "pointer",
    fontSize: "14px",
    "&:hover": {
        textDecoration: "underline",
    },
}));

export const selectSx = {
    minWidth: 160,
    borderRadius: "6px",
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#dfddde",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#b0b0b0",
    },
    "& .MuiSelect-select": {
        paddingTop: "8.5px",
        paddingBottom: "8.5px",
        fontSize: "14px",
    },
} as const;

export const activeSelectSx = {
    ...selectSx,
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#4789f6",
        borderWidth: "1.5px",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#4789f6",
    },
} as const;
