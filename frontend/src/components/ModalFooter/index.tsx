import { memo } from "react";
import { useModal } from "../../contexts/ModalContext";
import Button from "../Button";
import { Box } from "@mui/material";

type ModalFooterProps = {
    onSubmit: () => void;
    isSubmitting?: boolean;
    title?: string;
    type?: "primary" | "secondary" | "muted" | "danger" | "success" | "default" | 'simple';
};

const ModalFooter = ({ onSubmit, isSubmitting = false, type = 'primary', title = "Submit" }: ModalFooterProps) => {
    const { close } = useModal();

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 3,
            }}
        >
            <Button height="35px" text="Cancel" size="sm" onClick={close} type="muted" />
            <Button height="35px" type={type} text={title} onClick={onSubmit} size="md" loading={isSubmitting} />
        </Box>
    );
};

export default memo(ModalFooter);
