import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useState } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import DropDown, { type DropdownOption } from "../../DropDown";
import Input from "../../Input";
import Loader from "../../Loader";
import * as S from "../../../pages/SimStudio/CreateSimSuite/CreateSimSuite.styles";
import type { Step1Values } from "../../../hooks/SimStudio/useCreateSimSuiteController";
import type { SuiteDetail } from "../../../redux/Api/SimStudio";

interface Step1Props {
    control: Control<Step1Values>;
    errors: FieldErrors<Step1Values>;
    txTypeOptions: DropdownOption[];
    versionOptions: DropdownOption[];
    ruleOptions: DropdownOption[];
    ruleVersionOptions: DropdownOption[];
    txLoading: boolean;
    versionLoading: boolean;
    existingSuite?: SuiteDetail | null;
    isSuiteLoading?: boolean;
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
    existingSuite,
    isSuiteLoading,
}: Step1Props) => {
    if (txLoading || isSuiteLoading) return <Loader center />;

    const isDisabled = !!existingSuite;

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
                                    disabled={isDisabled}
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
                                    disabled={isDisabled}
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
                                    disabled={isDisabled}
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
                                    disabled={isDisabled || ruleVersionOptions.length === 0}
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
                                    disabled={isDisabled}
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
                                    disabled={isDisabled || versionOptions.length === 0 || versionLoading}
                                    error={errors.version?.message as string | undefined}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={12}>
                        <Controller
                            control={control}
                            name="rule_config"
                            render={({ field, fieldState: { error: schemaError } }) => {
                                const [jsonError, setJsonError] = useState<string | null>(null);
                                const [isValid, setIsValid] = useState<boolean | null>(null);

                                const handleChange = (raw: string) => {
                                    field.onChange(raw);
                                    if (raw.trim() === "" || raw.trim() === "{}") {
                                        setJsonError(null);
                                        setIsValid(null);
                                        return;
                                    }
                                    try {
                                        JSON.parse(raw);
                                        setJsonError(null);
                                        setIsValid(true);
                                    } catch (e) {
                                        setJsonError((e as SyntaxError).message);
                                        setIsValid(false);
                                    }
                                };

                                // schemaError takes priority (empty/missing), jsonError for syntax
                                const displayError = schemaError?.message ?? jsonError;
                                const hasError = !!displayError;

                                const borderColor = hasError
                                    ? "#ef4444"
                                    : isValid === true
                                        ? "#22c55e"
                                        : "#e5e7eb";

                                return (
                                    <Box>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
                                            <Typography fontSize={13} fontWeight={500} color="text.primary">
                                                Rule Config
                                                <Typography component="span" fontSize={11} color="#ef4444" ml={0.25}>*</Typography>
                                                <Typography component="span" fontSize={11} color="text.secondary" ml={0.75}>
                                                    (JSON)
                                                </Typography>
                                            </Typography>
                                            {isValid === true && !hasError && (
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#22c55e" }} />
                                                    <Typography fontSize={12} color="#22c55e">Valid JSON</Typography>
                                                </Box>
                                            )}
                                            {hasError && (
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <ErrorOutlineIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                                                    <Typography fontSize={12} color="#ef4444">Invalid JSON</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={8}
                                            maxRows={20}
                                            disabled={isDisabled}
                                            value={field.value === "{}" ? "" : (field.value ?? "")}
                                            onChange={(e) => handleChange(e.target.value)}
                                            placeholder={'Enter Rule Config here...\n{\n  "key": "value"\n}'}
                                            spellCheck={false}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    fontFamily: "monospace",
                                                    fontSize: 13,
                                                    lineHeight: 1.6,
                                                    bgcolor: "#fafafa",
                                                    "& fieldset": { borderColor },
                                                    "&:hover fieldset": { borderColor },
                                                    "&.Mui-focused fieldset": { borderColor },
                                                },
                                            }}
                                        />
                                        {displayError && (
                                            <Typography fontSize={12} color="#ef4444" mt={0.5}>
                                                {displayError}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            }}
                        />
                    </Grid>
                </Grid>
            </S.FormCard>
        </Box>
    );
};

export default Step1RuleDetails;

