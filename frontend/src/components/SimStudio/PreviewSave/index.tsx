import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import { Box, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import Button from "../../Button";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { useGetGenerationSummaryQuery, useRunSimulationMutation } from "../../../redux/Api/SimStudio";
import { useSimStudioTab } from "../../../contexts/SimStudioTabContext";
import * as S from "./PreviewSave.styles";

const PreviewSave = () => {
    const generationId = extractData("sim_gen_id", LocalStorage, false) as number | null;
    const suiteId = extractData("sim_suite_id", LocalStorage, false) as number | null;
    const { enableNextTab } = useSimStudioTab();
    const [runSimulation, { isLoading: isRunning }] = useRunSimulationMutation();

    const { data, isLoading } = useGetGenerationSummaryQuery(generationId!, {
        skip: !generationId,
    });

    const handleRunSimulation = async () => {
        if (!suiteId || !generationId) {
            toast.error("Missing suite or generation ID. Please restart the wizard.");
            return;
        }
        try {
            await runSimulation({ suiteId: Number(suiteId), generationId: Number(generationId) }).unwrap();
            enableNextTab();
        } catch {
            toast.error("Failed to run simulation. Please try again.");
        }
    };

    const summary = data?.data;

    if (isLoading || !summary) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    const txtp = summary.context_txtp_configs
        .map((c) => `${c.txtp} ${c.txtp_version}`)
        .join(", ") || summary.primary_txtp || "—";

    const iterationLabel =
        summary.iteration_number > 0
            ? `v${summary.iteration_number} (New)`
            : "v1 (New)";

    return (
        <S.PageWrapper>
            <S.StatsRow>
                <S.StatCard>
                    <S.StatValue>{summary.context_count}</S.StatValue>
                    <S.StatLabel>Context Records</S.StatLabel>
                </S.StatCard>
                <S.StatCard>
                    <S.StatValue>{summary.trigger_count}</S.StatValue>
                    <S.StatLabel>Trigger Records</S.StatLabel>
                </S.StatCard>
                <S.StatCard>
                    <S.StatValue>{summary.enrichment_table_count}</S.StatValue>
                    <S.StatLabel>Enrichment Records</S.StatLabel>
                </S.StatCard>
                
            </S.StatsRow>
            <S.SummaryCard>
                <S.SummaryTitle>Simulation Summary</S.SummaryTitle>
                <S.SummaryGrid>
                    <S.SummaryField>
                        <S.FieldLabel>Suite Name</S.FieldLabel>
                        <S.FieldValue>{summary.suite_name || "—"}</S.FieldValue>
                    </S.SummaryField>
                    <S.SummaryField>
                        <S.FieldLabel>Associated Rule</S.FieldLabel>
                        <S.FieldValue>{summary.associated_rule || "—"}</S.FieldValue>
                    </S.SummaryField>

                    <S.SummaryField>
                        <S.FieldLabel>TXTPs</S.FieldLabel>
                        <S.FieldValue>{txtp}</S.FieldValue>
                    </S.SummaryField>
                    <S.SummaryField>
                        <S.FieldLabel>Iteration Number</S.FieldLabel>
                        <S.FieldValue>{iterationLabel}</S.FieldValue>
                    </S.SummaryField>

                    {summary.enrichment_table_names.length > 0 && (
                        <>
                            <S.Divider />
                            <S.SummaryField>
                                <S.FieldLabel>Enrichment Table{summary.enrichment_table_names.length > 1 ? "s" : ""}</S.FieldLabel>
                                <S.FieldValue>{summary.enrichment_table_names.join(", ")}</S.FieldValue>
                            </S.SummaryField>
                        </>
                    )}
                </S.SummaryGrid>

                <S.ActionRow>
                    
                    <Button
                        type="primary"
                        text={isRunning ? "Running…" : "Run Simulation"}
                        size=""
                        width="auto"
                        height="38px"
                        Icon={isRunning ? undefined : PlayArrowOutlinedIcon}
                        onClick={() => void handleRunSimulation()}
                        disabled={isRunning}
                    />
                </S.ActionRow>
            </S.SummaryCard>
        </S.PageWrapper>
    );
};

export default PreviewSave;
