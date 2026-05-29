import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import { Box } from "@mui/material";
import { Text } from "../Text";

interface PlaceholderStepProps {
    title: string;
}

const PlaceholderStep = ({ title }: PlaceholderStepProps) => (
    <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={10}
        gap={2}
        width="100%"
        maxWidth="700px"
    >
        <ConstructionOutlinedIcon sx={{ fontSize: 52, color: "text.ternary" }} />
        <Text size="header" weight="bold" color="text.ternary">
            {title}
        </Text>
        <Text size="body" color="text.ternary">
            This step will be implemented in future iterations.
        </Text>
    </Box>
);

export default PlaceholderStep;
