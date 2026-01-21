import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

export type ModalProps = {
    open: boolean;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onClose: () => void;
    maxWidth?: "sm" | "md" | "lg" | "xl" | string;
};

const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const Modal = ({ open, title, children, footer, onClose, maxWidth = "lg" }: ModalProps) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 16,
                        overflowY: "auto",
                    }}
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <motion.div
                        style={{
                            width: "100%",
                            maxWidth: maxWidth === "sm" ? 550 :
                                maxWidth === "md" ? 650 :
                                    maxWidth === "lg" ? 900 :
                                        maxWidth === "xl" ? 1200 : maxWidth,
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
                            display: "flex",
                            flexDirection: "column",
                            maxHeight: "90vh",
                            overflow: "hidden",
                        }}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <Box
                            sx={{
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderBottom: "1px solid #e0e0e0",
                                px: 3,
                                py: 2,
                                backgroundColor: "#fff",
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                                {title}
                            </Typography>
                            <IconButton
                                onClick={onClose}
                                sx={{
                                    position: "absolute",
                                    right: 16,
                                    top: 13,
                                    color: "grey.500",
                                    "&:hover": { color: "grey.700" },
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
                            {children}
                        </Box>

                        {footer && (
                            <Box
                                sx={{
                                    borderTop: "1px solid #e0e0e0",
                                    px: 3,
                                    py: 2,
                                    bgcolor: "grey.50",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    position: "sticky",
                                    bottom: 0,
                                }}
                            >
                                {footer}
                            </Box>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
