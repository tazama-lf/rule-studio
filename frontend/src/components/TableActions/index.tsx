import { memo } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditSquareIcon from '@mui/icons-material/EditSquare';
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

type TableActionsProps = {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onClone?: () => void;
    onHold?: () => void;
    onToggleStatus?: () => void;
    active?: boolean;
    children?: React.ReactNode;
    pause?: boolean
};

const TableActions = ({
    onView,
    onEdit,
    onDelete,
    onClone,
    onHold,
    onToggleStatus,
    active = false,
    pause = false,
    children,
}: TableActionsProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
            }}
        >
            {onView && (
                <Tooltip title="View">
                    <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={onView}>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {onEdit && (
                <Tooltip title="Edit">
                    <IconButton size="small" sx={{ color: '#d08700' }} onClick={onEdit}>
                        <EditSquareIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {onHold && (
                <Tooltip title={pause ? "Resume" : "Pause"}>
                    <IconButton size="small" sx={{ color: pause ? 'green' : 'red' }} onClick={onHold}>
                        {pause ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
            )}

            {onClone && (
                <Tooltip title="Clone">
                    <IconButton size="small" sx={{ color: '#21a0c1' }} onClick={onEdit}>
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {onToggleStatus && (
                <Tooltip title={active ? "Mark Inactive" : "Mark Active"}>
                    <IconButton
                        size="small"
                        color={active ? "inherit" : "success"}
                        onClick={onToggleStatus}
                    >
                        {active ? (
                            <BlockIcon fontSize="small" />
                        ) : (
                            <CheckCircleIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
            )}

            {children}

            {onDelete && (
                <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={onDelete}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};

export default memo(TableActions);
