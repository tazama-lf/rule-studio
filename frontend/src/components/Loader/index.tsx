import { memo } from "react";
import { Box, CircularProgress } from "@mui/material";

type LoaderProps = {
    size?: number;
    color?: "primary" | "secondary" | "inherit" | "success" | "error" | "warning" | 'info';
    center?: boolean;
    type?: "spinner" | "circular";
};

const Loader = ({
    size = 24,
    color = "primary",
    center = false,
    type = "spinner",
}: LoaderProps) => {
    const loader = (
        <CircularProgress
            size={size}
            color={color}
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
