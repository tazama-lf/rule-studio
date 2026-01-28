import { Box, Stack } from "@mui/material";
import { keyframes, styled } from "@mui/material/styles";
import logo from "../../assets/logo.png";

const pulseBar = keyframes`
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.6;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
`;

const Bar = styled(Box)<{ delay: number }>(({ delay }) => ({
    width: 6,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#51be99",
    animation: `${pulseBar} 1.2s ease-in-out infinite`,
    animationDelay: `${delay}s`,
}));

const SuspenseLoader = () => {
    return (
        <Box
            minHeight="100vh"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            bgcolor="white"
            px={2}
            gap={3}
        >
            <Box
                component="img"
                src={logo}
                alt="logo"
                sx={{
                    height: 120,
                    objectFit: "contain",
                }}
            />

            <Stack direction="row" spacing={1}>
                <Bar delay={0} />
                <Bar delay={0.15} />
                <Bar delay={0.3} />
                <Bar delay={0.45} />
            </Stack>
        </Box>
    );
};

export default SuspenseLoader;
