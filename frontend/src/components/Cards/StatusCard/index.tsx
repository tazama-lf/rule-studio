import { useTheme } from "@mui/material";
import { memo } from "react";
import { Text } from "../../Text";
import { BoxContainer, getStatusStyles, StatusContainer } from "./Status.styles";

interface StatusBoxProps {
    status: string;
    bullet?: boolean
}

const StatusCard = ({ status, bullet = true }: StatusBoxProps) => {
    const theme = useTheme();
    const styles = getStatusStyles(status, theme);

    return (
        <StatusContainer
            sx={{
                ...styles,
            }}
        >
            {bullet &&
                <BoxContainer sx={{ bgcolor: styles.color }}></BoxContainer>
            }
            <Text size="sub" fontWeight={700} fontSize={11} color={styles.color}>
                {status}
            </Text>
        </StatusContainer>
    );
};

export default memo(StatusCard);
