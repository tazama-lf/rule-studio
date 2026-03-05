import { Box } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";

export const getStatusStyles = (status: string, theme: Theme) => {
    switch (status) {
        case "STATUS_01_IN_PROGRESS":
            return {
                backgroundColor: '#fefce8',
                color: '#d28e0e',
                borderColor: '#fef5b5',
            };

        case "STATUS_03_UNDER_REVIEW":
            return {
                backgroundColor: '#ecfeff',
                color: '#155dfc',
                borderColor: '#c0dcff',
            };

        case "STATUS_04_APPROVED":
        case "Simple":
        case "Low":
            return {
                backgroundColor: '#f0fdf4',
                color: '#00a63e',
                borderColor: '#ddfbe8',
            };
        case "STATUS_05_REJECTED":
        case "Complex":
        case "High":
            return {
                backgroundColor: '#fef2f2',
                color: '#e7000b',
                borderColor: '#ffc9c9',
            };
        case "STATUS_07_READY_FOR_DEPLOYMENT":
            return {
                backgroundColor: theme.palette.success.light,
                color: theme.palette.success.dark,
                borderColor: theme.palette.success.main,
            };

        case "STATUS_08_DEPLOYED":
            return {
                backgroundColor: '#eef2ff',
                color: '#5641f6',
                borderColor: '#e1e8ff',
            };
        case "STATUS_02_ON_HOLD":
            return {
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.grey[700],
                borderColor: theme.palette.grey[300],
            };
        default:
            return {
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.grey[700],
                borderColor: theme.palette.grey[300],
            };
    }
};


export const BoxContainer = styled(Box)(() => ({
    width: '7px',
    height: '7px',
    borderRadius: '7px',
}));


export const StatusContainer = styled(Box)(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 1.5),
    borderWidth: 1.8,
    borderRadius: 20,
    borderStyle: "solid",
    gap: 4
}));
