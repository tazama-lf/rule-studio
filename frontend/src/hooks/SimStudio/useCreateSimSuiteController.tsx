import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as yup from "yup";
import type { DropdownOption } from "../../components/DropDown";
import { useSimStudioTab } from "../../contexts/SimStudioTabContext";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../redux/Api/Config";
import { useCreateSuiteMutation, usePatchSuiteMutation, useUpdateWizardProgressMutation, useLazyGetSuiteByIdQuery } from "../../redux/Api/SimStudio";
import { useGetRulesQuery, useLazyGetRuleTagsQuery } from "../../redux/Api/DockerHub";
import { LocalStorage } from "../../utils/Common/enums";
import { insertData, extractData, removeData } from "../../utils/Common/storage";
import { SimStudioTabs } from "../../utils/Constants/data";
import Step1RuleDetails from "../../components/SimStudio/RuleDetails";
import TxtpSelection from "../../components/SimStudio/TxtpSelection";
import TriggerData from "../../components/SimStudio/TriggerData";
import EnrichmentData from "../../components/SimStudio/EnrichmentData";
import PreviewSave from "../../components/SimStudio/PreviewSave";
import SimulationResults from "../../components/SimStudio/SimulationResults";

export interface Step1Values {
    suite_name: string;
    description: string;
    associated_rule: DropdownOption | null;
    rule_version: DropdownOption | null;
    txtp: DropdownOption | null;
    version: DropdownOption | null;
    rule_config: string;
}

const step1Schema = yup.object({
    suite_name: yup
        .string()
        .required("Suite name is required")
        .min(3, "Minimum 3 characters"),
    description: yup.string().default(""),
    associated_rule: yup
        .object({ label: yup.string().required(), value: yup.mixed().required() })
        .nullable()
        .optional(),
    rule_version: yup
        .object({ label: yup.string().required(), value: yup.mixed().required() })
        .nullable()
        .test("required-if-rule", "Rule version is required", function (val) {
            const { associated_rule } = this.parent as Step1Values;
            if (associated_rule?.value) return val !== null && val !== undefined;
            return true;
        }),
    txtp: yup
        .object({ label: yup.string().required(), value: yup.mixed().required() })
        .nullable()
        .test("not-null", "TXTP is required", (val) => val !== null && val !== undefined),
    version: yup
        .object({ label: yup.string().required(), value: yup.mixed().required() })
        .nullable()
        .test("not-null", "Version is required", (val) => val !== null && val !== undefined),
    rule_config: yup
        .string()
        .required("Rule config is required")
        .test("is-valid-json", "Rule config must be valid JSON", (val) => {
            if (!val || val.trim() === "" || val.trim() === "{}") return false;
            try { JSON.parse(val); return true; } catch { return false; }
        }),
});


const useCreateSimSuiteController = () => {
    const navigate = useNavigate();
    const { selectedTab, tabs, enableNextTab, enablePreviousTab } = useSimStudioTab();
    const [createSuite, { isLoading: isCreatingSuite }] = useCreateSuiteMutation();
    const [patchSuite, { isLoading: isPatchingSuite }] = usePatchSuiteMutation();
    const [updateWizardProgress] = useUpdateWizardProgressMutation();
    const isCloneMode = extractData("sim_clone_mode", LocalStorage, false) === true;
    const cloneType = extractData("sim_clone_type", LocalStorage, false) as string | null;
    const isSuiteCloneMode = isCloneMode && cloneType === "suite";
    const isGenerationCloneMode = isCloneMode && !isSuiteCloneMode;
    const isResultsLocked = selectedTab === "simulation_results" && extractData("sim_results_locked", LocalStorage, false) === true;

    const extractGenId = useCallback(() => {
        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        return genId ? Number(genId) : null;
    }, []);

    const extractSuiteId = useCallback(() => {
        const suiteId = extractData("sim_suite_id", LocalStorage, false) as string | number | null;
        return suiteId ? Number(suiteId) : null;
    }, []);

    const [getSuiteById, { data: existingSuiteData, isFetching: isSuiteLoading }] = useLazyGetSuiteByIdQuery();

    useEffect(() => {
        if (selectedTab === SimStudioTabs[0].value) {
            const suiteId = extractSuiteId();
            if (suiteId) void getSuiteById(suiteId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTab]);

    const existingSuite = existingSuiteData?.suite ?? null;

    useEffect(() => {
        if (!existingSuite) return;
        reset({
            suite_name: existingSuite.name ?? "",
            description: existingSuite.description ?? "",
            associated_rule: existingSuite.rule_name
                ? { label: existingSuite.rule_name, value: existingSuite.rule_name }
                : null,
            rule_version: existingSuite.rule_version
                ? { label: existingSuite.rule_version, value: existingSuite.rule_version }
                : null,
            txtp: existingSuite.primary_txtp
                ? { label: existingSuite.primary_txtp, value: existingSuite.primary_txtp }
                : null,
            version: existingSuite.primary_txtp_version
                ? { label: existingSuite.primary_txtp_version, value: existingSuite.primary_txtp_version }
                : null,
            rule_config: existingSuite.rule_config
                ? JSON.stringify(existingSuite.rule_config, null, 2)
                : "{}",
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingSuite]);
    const { data: rulesData } = useGetRulesQuery();
    const [getRuleTags, { data: ruleTagsData }] = useLazyGetRuleTagsQuery();
    const step2SaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const step3SaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const step4SaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const hasExistingSuite = existingSuite !== null;

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        trigger,
        getValues,
        clearErrors,
        formState: { errors },
    } = useForm<Step1Values>({
        resolver: yupResolver(step1Schema) as never,
        defaultValues: {
            suite_name: "",
            description: "",
            associated_rule: null,
            rule_version: null,
            txtp: null,
            rule_config: "{}",
            version: null,
        },
    });

    const selectedTxtp = watch("txtp");
    const selectedRule = watch("associated_rule");

    const { data: txTypesData, isLoading: txLoading } = useGetTypesQuery({});

    const txTypeOptions = useMemo<DropdownOption[]>(() => {
        if (!txTypesData || !Array.isArray(txTypesData)) return [];
        const seen = new Set<string>();
        return (txTypesData as { transaction_type: string }[]).reduce<DropdownOption[]>((acc, item) => {
            if (!seen.has(item.transaction_type)) {
                seen.add(item.transaction_type);
                acc.push({ label: item.transaction_type, value: item.transaction_type });
            }
            return acc;
        }, []);
    }, [txTypesData]);

    const [getVersions, { data: versionsData, isFetching: versionLoading }] =
        useLazyGetTxtpVersionsQuery();

    const fetchVersions = useCallback(
        (type: string) => { void getVersions({ type }); },
        [getVersions]
    );

    useEffect(() => {
        if (selectedTxtp?.value) {
            fetchVersions(String(selectedTxtp.value));
            if (existingSuite?.primary_txtp !== selectedTxtp.value) {
                setValue("version", null);
            }
        } else if (!hasExistingSuite) {
            setValue("version", null);
        }
    }, [selectedTxtp, fetchVersions, setValue, existingSuite?.primary_txtp, hasExistingSuite]);

    const versionOptions = useMemo<DropdownOption[]>(() => {
        if (!versionsData || !Array.isArray(versionsData)) return [];
        return (versionsData as string[]).map((v) => ({ label: v, value: v }));
    }, [versionsData]);

    const ruleOptions = useMemo<DropdownOption[]>(() => {
        return rulesData?.rules.map((r) => ({ label: r.name, value: r.name })) ?? [];
    }, [rulesData]);

    useEffect(() => {
        if (selectedRule?.value) {
            void getRuleTags({ rule: String(selectedRule.value) });
            if (existingSuite?.rule_name !== selectedRule.value) {
                setValue("rule_version", null);
            }
        } else if (!hasExistingSuite) {
            setValue("rule_version", null);
        }
    }, [selectedRule, setValue, getRuleTags, existingSuite?.rule_name, hasExistingSuite]);

    const ruleVersionOptions = useMemo<DropdownOption[]>(() => {
        return ruleTagsData?.tags.map((t) => ({ label: t.name, value: t.name })) ?? [];
    }, [ruleTagsData]);

    const handleBack = () => {
        if (selectedTab === SimStudioTabs[0].value) {
            removeData("sim_clone_mode", LocalStorage);
            removeData("sim_clone_type", LocalStorage);
            navigate("/sim-studio");
        } else {
            enablePreviousTab();
        }
    };

    const handleNextStep = () => {
        if (selectedTab === SimStudioTabs[0].value) {
            if (existingSuite && !isCloneMode) {
                enableNextTab();
                return;
            }
            if (isCloneMode && existingSuite) {
                void (async () => {
                    clearErrors(["associated_rule", "txtp", "version", "rule_config"]);
                    const cloneFields: (keyof Step1Values)[] = isSuiteCloneMode
                        ? ["suite_name", "description", "rule_version"]
                        : ["rule_version"];
                    const isCloneDetailsValid = await trigger(cloneFields);
                    if (!isCloneDetailsValid) return;

                    const suiteId = extractSuiteId();
                    const genId = extractGenId();
                    if (!suiteId || !genId) {
                        toast.error("Cloned simulation details are missing. Please clone again.");
                        return;
                    }

                    const data = getValues();
                    const patchBody = isSuiteCloneMode
                        ? {
                            name: data.suite_name,
                            description: data.description || undefined,
                            rule_version: data.rule_version?.value ? String(data.rule_version.value) : undefined,
                        }
                        : {
                            rule_version: data.rule_version?.value ? String(data.rule_version.value) : undefined,
                        };
                    try {
                        await patchSuite({
                            suiteId,
                            body: patchBody,
                        }).unwrap();
                        void updateWizardProgress({ generationId: genId, current_step_num: 2, completed_step_num: 1 });
                        removeData("sim_clone_mode", LocalStorage);
                        removeData("sim_clone_type", LocalStorage);
                        enableNextTab();
                    } catch {
                        toast.error("Failed to update cloned simulation details. Please try again.");
                    }
                })();
                return;
            }
            void handleSubmit(async (data) => {
                try {
                    let parsedRuleConfig: Record<string, unknown>;
                    try { parsedRuleConfig = JSON.parse(data.rule_config || '{}') as Record<string, unknown>; } catch { parsedRuleConfig = {}; }

                    const result = await createSuite({
                        name: data.suite_name,
                        description: data.description || undefined,
                        rule_name: data.associated_rule?.value ? String(data.associated_rule.value) : undefined,
                        rule_version: data.rule_version?.value ? String(data.rule_version.value) : undefined,
                        primary_txtp: String(data.txtp!.value),
                        primary_txtp_version: String(data.version!.value),
                        rule_config: parsedRuleConfig,
                    }).unwrap();
                    const genId = result.data.generation_id as unknown as number;
                    const suiteId = result.data.id as unknown as number;
                    insertData(genId, "sim_gen_id", LocalStorage, false);
                    insertData(suiteId, "sim_suite_id", LocalStorage, false);
                    void updateWizardProgress({ generationId: genId, current_step_num: 2, completed_step_num: 1 });
                    enableNextTab();
                } catch {
                    toast.error("Failed to create simulation suite. Please try again.");
                }
            })();
        } else if (selectedTab === SimStudioTabs[1].value) {
            void (async () => {
                const save = step2SaveRef.current;
                const ok = save ? await save() : true;
                if (ok) {
                    const genId = extractGenId();
                    if (genId) void updateWizardProgress({ generationId: genId, current_step_num: 3, completed_step_num: 2 });
                    enableNextTab();
                }
            })();
        } else if (selectedTab === SimStudioTabs[2].value) {
            void (async () => {
                const save = step3SaveRef.current;
                const ok = save ? await save() : true;
                if (ok) {
                    const genId = extractGenId();
                    if (genId) void updateWizardProgress({ generationId: genId, current_step_num: 4, completed_step_num: 3 });
                    enableNextTab();
                }
            })();
        } else if (selectedTab === SimStudioTabs[3].value) {
            void (async () => {
                const save = step4SaveRef.current;
                const ok = save ? await save() : true;
                if (ok) {
                    const genId = extractGenId();
                    if (genId) void updateWizardProgress({ generationId: genId, current_step_num: 5, completed_step_num: 4 });
                    enableNextTab();
                }
            })();
        } else {
            enableNextTab();
        }
    };

    const renderStep = () => {
        switch (selectedTab) {
            case 'create_generation':
                return (
                    <Step1RuleDetails
                        control={control}
                        errors={errors}
                        txTypeOptions={txTypeOptions}
                        versionOptions={versionOptions}
                        ruleOptions={ruleOptions}
                        ruleVersionOptions={ruleVersionOptions}
                        txLoading={txLoading}
                        versionLoading={versionLoading}
                        existingSuite={existingSuite}
                        isSuiteLoading={isSuiteLoading}
                        isCloneMode={isCloneMode}
                        isSuiteCloneMode={isSuiteCloneMode}
                        isGenerationCloneMode={isGenerationCloneMode}
                    />
                );
            case 'txtp_selection':      return <TxtpSelection onSaveRef={step2SaveRef} />;
            case 'trigger_data':        return <TriggerData onSaveRef={step3SaveRef} />;
            case 'enrichment_data':     return <EnrichmentData onSaveRef={step4SaveRef} />;
            case 'preview_save':        return <PreviewSave />;
            case 'simulation_results':  return <SimulationResults />;
            default:                    return null;
        }
    };

    const currentStepIndex = tabs.findIndex(t => t.value === selectedTab);
    const isStep1ReadOnly = selectedTab === SimStudioTabs[0].value && existingSuite !== null && !isCloneMode;

    return {
        values: {
            currentStepIndex,
            totalSteps: tabs.length,
            isCreatingSuite: isCreatingSuite || isPatchingSuite,
            selectedTab,
            isStep1ReadOnly,
            isResultsLocked,
        },
        functions: { handleBack, handleNextStep, renderStep },
    };
};

export default useCreateSimSuiteController;
