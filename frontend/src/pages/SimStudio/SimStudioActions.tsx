import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { memo } from "react";

interface SimStudioActionsProps {
    onView: () => void;
    onClone: () => void;
    isCloning?: boolean;
}

const SimStudioActions = ({ onView, onClone, isCloning = false }: SimStudioActionsProps) => {
    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Clone Suite">
                <span>
                    <IconButton size="small" sx={{ color: "#0e7490" }} onClick={onClone} disabled={isCloning}>
                        {isCloning ? (
                            <CircularProgress size={16} sx={{ color: "#0e7490" }} />
                        ) : (
                            <ContentCopyIcon fontSize="small" />
                        )}
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="View">
                <IconButton size="small" sx={{ color: "text.ternary" }} onClick={onView}>
                    <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default memo(SimStudioActions);
