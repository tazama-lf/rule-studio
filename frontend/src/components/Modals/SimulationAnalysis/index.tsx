import { useState, type ReactNode } from "react";
import { Box, Collapse, Divider, IconButton } from "@mui/material";
import Grid from "@mui/material/Grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Text } from "../../Text";
import { Paper } from "@mui/material";

interface TriggeredRule {
    id: ReactNode;
    ruleId: string;
    description: string;
    status: string;
}

interface TypologyRule {
    ruleId: string;
    weight: number;
    subRef: string;
}

interface Typology {
    name: string;
    score: number;
    rules: TypologyRule[];
}

export interface SimulationAnalysisData {
    messageId: string;
    outcome: string;
    score: number;
    triggeredRules: TriggeredRule[];
    triggeredTypologies: Typology[];
}

const TypologyItem = ({ typology }: { typology: Typology }) => {
    const [expanded, setExpanded] = useState(false);
    const hasRules = typology.rules.length > 0;

    return (
        <Box
            border="1px solid"
            borderColor="divider"
            borderRadius={1}
            overflow="hidden"
        >
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={2}
                py={1.5}
                sx={{ cursor: "pointer" }}
                onClick={() => setExpanded(!expanded)}
            >
                <Box display="flex" alignItems="center" gap={1.5}>
                    <IconButton size="small" sx={{ p: 0 }}>
                        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                    <Box
                        width={10}
                        height={10}
                        borderRadius="50%"
                        bgcolor="#e7000b"
                        flexShrink={0}
                    />
                    <Text color="black" size="sub" weight="600">
                        {typology.name}
                    </Text>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Text color="#e7000b" size="sub" weight="600">
                        Score: {typology.score.toFixed(2)}
                    </Text>
                    <Box
                        width={80}
                        height={8}
                        bgcolor="#fee2e2"
                        borderRadius={4}
                        overflow="hidden"
                    >
                        <Box
                            height="100%"
                            bgcolor="#e7000b"
                            borderRadius={4}
                            width={`${Math.min((typology.score / 1000) * 100, 100)}%`}
                        />
                    </Box>
                </Box>
            </Box>

            <Collapse in={expanded}>
                <Box px={2} pb={1.5}>
                    {hasRules ? typology.rules.map((rule, idx) => (
                            <Box key={idx}>
                                {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                                <Box display="flex" alignItems="flex-start" gap={1.5} py={1} pl={5}>
                                    <Box
                                        width={8}
                                        height={8}
                                        borderRadius="50%"
                                        bgcolor="#9ca3af"
                                        flexShrink={0}
                                        mt={0.5}
                                    />
                                    <Box>
                                        <Text color="black" size="sub" weight="600">
                                            {rule.ruleId}
                                        </Text>
                                        <Text color="text.ternary" size="sub">
                                            Weight: {rule.weight.toFixed(2)}
                                        </Text>
                                        <Text color="text.ternary" size="sub">
                                            Sub-ref: {rule.subRef}
                                        </Text>
                                    </Box>
                                </Box>
                            </Box>
                        )) : (
                        <Box py={2} textAlign="center">
                            <Text color="text.ternary" size="sub">No data to show</Text>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

interface SimulationAnalysisModalProps {
    data: SimulationAnalysisData;
}

const SimulationAnalysisModal = ({ data }: SimulationAnalysisModalProps) => {
    const isHit = data.outcome === "Hit";

    return (
        <Grid container spacing={2}> 
            <Grid size={12}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Text color="text.ternary" size="sub" weight="500">
                        {data.messageId}
                    </Text>
                    <Paper
                        variant="outlined"
                        sx={{
                            display: "inline-block",
                            borderRadius: 4,
                            px: 1.5,
                            py: 0.2,
                            border: 0,
                            bgcolor: isHit ? "error.main" : "#dcfce7",
                        }}
                    >
                        <Text
                            size="sub"
                            weight="600"
                            sx={{
                                fontSize: "0.7rem",
                                color: isHit ? "white" : "static.darkGreen",
                            }}
                        >
                            {data.outcome}
                        </Text>
                    </Paper>
                    
                </Box>
            </Grid>

            {/* Triggered Rules */}
            <Grid size={12} mt={1}>
                <Text weight="bold" color="black" size="main" mb={1}>
                    Triggered Rules
                </Text>
                <Box
                    border="1px solid"
                    borderColor="divider"
                    borderRadius={1}
                    overflow="hidden"
                >
                    {data.triggeredRules.map((rule, idx) => (
                        <Box key={idx}>
                            {idx > 0 && <Divider />}
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                px={2}
                                py={1.5}
                            >
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Box
                                        width={10}
                                        height={10}
                                        borderRadius="50%"
                                        bgcolor="#e7000b"
                                        flexShrink={0}
                                    />
                                    <Box>
                                        <Text color="black" size="sub" weight="600">
                                            {rule.id}
                                        </Text>
                                    </Box>
                                </Box>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        display: "inline-block",
                                        borderRadius: 4,
                                        px: 1.5,
                                        py: 0.2,
                                        border: 0,
                                        bgcolor: "#fee2e2",
                                    }}
                                >
                                    <Text
                                        size="sub"
                                        weight="600"
                                        sx={{ fontSize: "0.7rem", color: "#e7000b" }}
                                    >
                                        Triggered
                                    </Text>
                                </Paper>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Grid>

            {/* Triggered Typologies */}
            <Grid size={12} mt={2}>
                <Text weight="bold" color="black" size="main" mb={1}>
                    Triggered Typologies
                </Text>
                <Box display="flex" flexDirection="column" gap={1.5}>
                    {data.triggeredTypologies.map((typology, idx) => (
                        <TypologyItem key={idx} typology={typology} />
                    ))}
                </Box>
            </Grid>
        </Grid>
    );
};

export default SimulationAnalysisModal;
