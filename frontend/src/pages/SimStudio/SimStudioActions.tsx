import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { memo } from "react";

interface SimStudioActionsProps {
    onView: () => void;
    onResume?: () => void;
    isDraft?: boolean;
    isResuming?: boolean;
}

const SimStudioActions = ({ onView, onResume, isDraft, isResuming }: SimStudioActionsProps) => {
    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            {isDraft && (
                <Tooltip title="Resume">
                    <span>
                        <IconButton
                            size="small"
                            sx={{ color: "#f59e0b" }}
                            onClick={onResume}
                            disabled={isResuming}
                        >
                            {isResuming ? (
                                <CircularProgress size={16} sx={{ color: "#f59e0b" }} />
                            ) : (
                                <PlayCircleOutlineIcon fontSize="small" />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
            )}
            <Tooltip title="View">
                <IconButton size="small" sx={{ color: "text.ternary" }} onClick={onView}>
                    <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default memo(SimStudioActions);
