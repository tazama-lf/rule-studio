import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, IconButton } from "@mui/material";
import Tabs from "../../../components/Tabs";
import { Text } from "../../../components/Text";
import { SimStudioTabProvider } from "../../../contexts/SimStudioTabContext";
import { useSimStudioTab } from "../../../contexts/SimStudioTabContext";
import * as S from "./CreateSimSuite.styles";
import useCreateSimSuiteController from "../../../hooks/SimStudio/useCreateSimSuiteController";

const CreateSimSuiteContent = () => {
    const { values, functions } = useCreateSimSuiteController();
    const { tabs } = useSimStudioTab();
    const showFooter = !values.isResultsLocked;
    const showNextStep = values.selectedTab !== "preview_save" && values.selectedTab !== "simulation_results";

    return (
        <S.PageContainer>
            <S.TopBar>
                <Box display="flex" alignItems="center" gap={1}>
                    {!values.isResultsLocked && (
                        <IconButton
                            size="small"
                            onClick={functions.handleBack}
                            sx={{ color: "text.primary" }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    )}
                    <Text weight="bold" color="black" size="header">
                        Create Simulation Suite
                    </Text>
                </Box>
                <Text color="text.ternary" size="sub">
                    Step {values.currentStepIndex + 1} of {tabs.length}
                </Text>
            </S.TopBar>
            <Box sx={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", px: 3 }}>
                <Tabs variant="sim-studio" />
            </Box>
            <S.ContentArea>{functions.renderStep()}</S.ContentArea>
            {showFooter && (
                <S.BottomBar>
                <Button
                    variant="outlined"
                    onClick={functions.handleBack}
                    sx={{
                        textTransform: "none",
                        height: "38px",
                        px: 3,
                        borderColor: "#dfddde",
                        color: "#1f2937",
                        borderRadius: "6px",
                        "&:hover": { borderColor: "#b0b0b0", backgroundColor: "#f9fafb" },
                    }}
                >
                    Back
                </Button>
                {showNextStep && (
                <Button
                    variant="contained"
                    endIcon={<ChevronRightIcon />}
                    onClick={functions.handleNextStep}
                    disabled={values.isCreatingSuite}
                    sx={{
                        textTransform: "none",
                        height: "38px",
                        px: 3,
                        borderRadius: "6px",
                        backgroundColor: "#2b7fff",
                        "&:hover": { backgroundColor: "#1a6fee" },
                        boxShadow: "none",
                        color: "#fff",
                    }}
                >
                    {values.isCreatingSuite ? "Creating..." : "Next Step"}
                </Button>
                )}
                </S.BottomBar>
            )}
        </S.PageContainer>
    );
};

const CreateSimSuite = () => (
    <SimStudioTabProvider>
        <CreateSimSuiteContent />
    </SimStudioTabProvider>
);

export default CreateSimSuite;
