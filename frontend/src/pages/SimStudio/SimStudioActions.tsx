import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, IconButton, Tooltip } from "@mui/material";
import { memo } from "react";

interface SimStudioActionsProps {
    onView: () => void;
}

const SimStudioActions = ({ onView }: SimStudioActionsProps) => {
    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="View">
                <IconButton size="small" sx={{ color: "text.ternary" }} onClick={onView}>
                    <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default memo(SimStudioActions);
