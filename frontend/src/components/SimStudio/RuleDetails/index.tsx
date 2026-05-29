import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import DropDown, { type DropdownOption } from "../../DropDown";
import Input from "../../Input";
import Loader from "../../Loader";
import * as S from "../../../pages/SimStudio/CreateSimSuite/CreateSimSuite.styles";
import type { Step1Values } from "../../../hooks/SimStudio/useCreateSimSuiteController";

interface Step1Props {
    control: Control<Step1Values>;
    errors: FieldErrors<Step1Values>;
    txTypeOptions: DropdownOption[];
    versionOptions: DropdownOption[];
    ruleOptions: DropdownOption[];
    ruleVersionOptions: DropdownOption[];
    txLoading: boolean;
    versionLoading: boolean;
}

const Step1RuleDetails = ({
    control,
    errors,
    txTypeOptions,
    versionOptions,
    ruleOptions,
    ruleVersionOptions,
    txLoading,
    versionLoading,
}: Step1Props) => {
    if (txLoading) return <Loader center />;

    return (
        <Box width="100%" maxWidth="700px" display="flex" flexDirection="column">
            <S.InfoBanner>
                <InfoOutlinedIcon sx={{ color: "#3b82f6", fontSize: 18, flexShrink: 0, mt: "1px" }} />
                <Typography fontSize={13} color="#1d4ed8" lineHeight={1.5}>
                    Define the simulation suite metadata and optionally associate it with a rule.
                </Typography>
            </S.InfoBanner>
            <S.FormCard>
                <Grid container spacing={2.5}>
                    <Grid size={12}>
                        <Controller
                            control={control}
                            name="suite_name"
                            render={({ field }) => (
                                <Input
                                    maxWidth="100%"
                                    required
                                    label="Simulation Suite Name"
                                    placeholder="e.g., Q3 Edge Cases"
                                    {...field}
                                    error={errors.suite_name?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={12}>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <Input
                                    maxWidth="100%"
                                    type="textarea"
                                    rows={4}
                                    label="Description"
                                    placeholder="Describe the purpose of this simulation suite..."
                                    {...field}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={control}
                            name="associated_rule"
                            render={({ field }) => (
                                <DropDown
                                    label="Associated Rule"
                                    placeholder="Select a rule..."
                                    options={ruleOptions}
                                    value={field.value ?? null}
                                    onChange={(val) => field.onChange(val)}
                                    error={errors.associated_rule?.message as string | undefined}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={control}
                            name="rule_version"
                            render={({ field, fieldState: { error } }) => (
                                <DropDown
                                    label="Rule Version"
                                    placeholder="Select version..."
                                    options={ruleVersionOptions}
                                    value={field.value ?? null}
                                    onChange={(val) => field.onChange(val)}
                                    disabled={ruleVersionOptions.length === 0}
                                    error={error?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={control}
                            name="txtp"
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="TXTP"
                                    placeholder="Select TXTP..."
                                    options={txTypeOptions}
                                    searchable
                                    value={field.value ?? null}
                                    onChange={(val) => field.onChange(val)}
                                    error={errors.txtp?.message as string | undefined}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={control}
                            name="version"
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Version"
                                    placeholder="Select version..."
                                    options={versionOptions}
                                    value={field.value ?? null}
                                    onChange={(val) => field.onChange(val)}
                                    disabled={versionOptions.length === 0 || versionLoading}
                                    error={errors.version?.message as string | undefined}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </S.FormCard>
        </Box>
    );
};

export default Step1RuleDetails;
