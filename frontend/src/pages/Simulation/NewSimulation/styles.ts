import type { SxProps, Theme } from "@mui/material";

export const styles = {
    container: {
        py: 3,
    } as SxProps<Theme>,

    actionBox: {
        my: 2,
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
    } as SxProps<Theme>,

    summaryBox: {
        p: 2,
        bgcolor: 'rgb(248 250 252)',
        borderRadius: 1,
        height: '70px',
    } as SxProps<Theme>,

    readinessPaper: {
        display: 'inline-block',
        mt: 1,
        borderRadius: 6,
        px: 1.5,
        py: 0.8,
        bgcolor: '#f0fdf4',
        borderColor: '#bbf7d0',
    } as SxProps<Theme>,

    readinessIconBox: {
        display: 'flex',
    } as SxProps<Theme>,

    readinessIcon: {
        color: '#166534',
    } as SxProps<Theme>,

    readinessText: {
        px: 1,
        fontSize: '0.95rem',
        whiteSpace: 'nowrap',
        color: '#166534',
    } as SxProps<Theme>,

    accordionContainer: {
        py: 1,
    } as SxProps<Theme>,

    accordion: {
        border: '1px solid theme.creamy',
        boxShadow: 0,
    } as SxProps<Theme>,

    accordionIcon: {
        color: 'static.darkBrown',
    } as SxProps<Theme>,

    accordionDetails: {
        backgroundColor: 'static.pale',
        paddingLeft: '50px',
        paddingTop: '0px',
        maxHeight: '450px',
        overflowY: 'auto'
    } as SxProps<Theme>,

    tagPaper: {
        display: 'inline-block',
        borderRadius: 1,
        px: 1.5,
        py: 0.3,
        bgcolor: 'static.creamy',
        borderColor: 'static.creamy',
        marginRight: '10px',
    } as SxProps<Theme>,

    tagPaperOutlined: {
        display: 'inline-block',
        borderRadius: 1,
        borderWidth: 2,
        px: 1.5,
        py: 0.3,
        bgcolor: 'transparent',
        borderColor: 'static.creamy',
        marginRight: '10px',
    } as SxProps<Theme>,
};