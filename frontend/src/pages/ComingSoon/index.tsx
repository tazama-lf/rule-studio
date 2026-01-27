import { Box, Typography } from "@mui/material";
import logo from "../../assets/logo.png"

const ComingSoon = () => {
    return (
        <Box
            sx={{
                minHeight: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "grey.100",
                color: "primary.main",
                px: 2,
            }}
        >
            <Box textAlign="center">
                <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{
                        mx: "auto",
                        mb: 6,
                        width: 100,
                        maxWidth: "100%",
                    }}
                />

                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 700,
                        mb: 2,
                        fontSize: {
                            xs: "2.25rem",
                            md: "3.75rem",
                        },
                    }}
                >
                    Coming Soon
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: "grey.900",
                        fontSize: {
                            xs: "1rem",
                            md: "1.25rem",
                        },
                    }}
                >
                    We're working on something amazing. Stay tuned!
                </Typography>
            </Box>
        </Box>
    );
};

export default ComingSoon;
