import { memo } from "react";
import { Box, CircularProgress, type SxProps, type Theme } from "@mui/material";

type LoaderProps = {
    size?: number;
    color?: "primary" | "secondary" | "inherit" | "success" | "error" | "warning";
    center?: boolean;
    type?: "spinner" | "circular";
    sx?: SxProps<Theme>
};

const Loader = ({
    size = 24,
    color = "primary",
    center = false,
    type = "spinner",
    sx
}: LoaderProps) => {
    const loader = (
        <CircularProgress
            size={size}
            color={color}
            sx={sx}
            thickness={type === "circular" ? 4 : 5}
        />
    );

    if (center) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center">
                {loader}
            </Box>
        );
    }

    return loader;
};

export default memo(Loader);
