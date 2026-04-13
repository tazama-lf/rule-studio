import { Box } from "@mui/material";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";

const MaskingConfig = () => {
    return (
        <BoxWrapper>
            <Box display="flex" flexDirection="column" gap={2}>
                <Text weight="bold" color="black" size="header">
                    Masking Configuration
                </Text>
                <Text color="text.ternary" size="body">
                    Configure data masking rules and policies.
                </Text>
            </Box>
        </BoxWrapper>
    );
};

export default MaskingConfig;
