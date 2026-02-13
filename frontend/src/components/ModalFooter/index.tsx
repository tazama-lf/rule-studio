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
                width: '100%',
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
            }}
        >
            <Button height="35px" type={'danger'} text="Cancel" size="sm" onClick={close} />
            <Button height="35px" type={type} text={title} onClick={onSubmit} size="sm" loading={isSubmitting} />
        </Box>
    );
};

export default memo(ModalFooter);
