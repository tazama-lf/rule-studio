import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { memo } from "react";

interface SimStudioActionsProps {
    onView: () => void;
}

const SimStudioActions = ({ onView }: SimStudioActionsProps) => {
    return (
        <Tooltip title="View">
            <IconButton size="small" sx={{ color: "text.ternary" }} onClick={onView}>
                <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

export default memo(SimStudioActions);
