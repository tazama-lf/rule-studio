import { memo } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";

interface SimulationActionsProps {
    status: string;
    onView: () => void;
    onRerun: () => void;
}

const SimulationActions = ({ status, onView, onRerun }: SimulationActionsProps) => {
    const isRunning = status?.toUpperCase() === "RUNNING";

    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title={isRunning ? "Running simulation, please wait." : "View"}>
                <span>
                    <IconButton
                        size="small"
                        sx={{ color: isRunning ? 'action.disabled' : 'text.secondary' }}
                        onClick={onView}
                        disabled={isRunning}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            {!isRunning && (
                <Tooltip title="Re-run">
                    <IconButton size="small" sx={{ color: '#4789f6' }} onClick={onRerun}>
                        <ReplayIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};

export default memo(SimulationActions);
