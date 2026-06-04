import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as yup from "yup";
import type { DropdownOption } from "../../components/DropDown";
import { useSimStudioTab } from "../../contexts/SimStudioTabContext";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../redux/Api/Config";
import { useCreateSuiteMutation, useUpdateWizardProgressMutation } from "../../redux/Api/SimStudio";
import { useGetRulesQuery, useLazyGetRuleTagsQuery } from "../../redux/Api/DockerHub";
import { LocalStorage } from "../../utils/Common/enums";
import { insertData, extractData } from "../../utils/Common/storage";
import { SimStudioTabs } from "../../utils/Constants/data";
import PlaceholderStep from "../../components/SimStudio/PlaceholderStep";
import Step1RuleDetails from "../../components/SimStudio/RuleDetails";
import TxtpSelection from "../../components/SimStudio/TxtpSelection";
import TriggerData from "../../components/SimStudio/TriggerData";
import EnrichmentData from "../../components/SimStudio/EnrichmentData";
import PreviewSave from "../../components/SimStudio/PreviewSave";

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
    const [updateWizardProgress] = useUpdateWizardProgressMutation();

    const extractGenId = useCallback(() => {
        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        return genId ? Number(genId) : null;
    }, []);
    const { data: rulesData } = useGetRulesQuery();
    const [getRuleTags, { data: ruleTagsData }] = useLazyGetRuleTagsQuery();
    const step2SaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const step3SaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const step4SaveRef = useRef<(() => Promise<boolean>) | null>(null);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
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
            setValue("version", null);
        } else {
            setValue("version", null);
        }
    }, [selectedTxtp, fetchVersions, setValue]);

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
        }
        setValue("rule_version", null);
    }, [selectedRule, setValue, getRuleTags]);

    const ruleVersionOptions = useMemo<DropdownOption[]>(() => {
        return ruleTagsData?.tags.map((t) => ({ label: t.name, value: t.name })) ?? [];
    }, [ruleTagsData]);

    const handleBack = () => {
        if (selectedTab === SimStudioTabs[0].value) {
            navigate("/sim-studio");
        } else {
            enablePreviousTab();
        }
    };

    const handleNextStep = () => {
        if (selectedTab === SimStudioTabs[0].value) {
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
                    insertData(genId, "sim_gen_id", LocalStorage, false);
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
            case 'rule_details':
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
                    />
                );
            case 'txtp_selection':      return <TxtpSelection onSaveRef={step2SaveRef} />;
            case 'trigger_data':        return <TriggerData onSaveRef={step3SaveRef} />;
            case 'enrichment_data':     return <EnrichmentData onSaveRef={step4SaveRef} />;
            case 'preview_save':        return <PreviewSave />;
            case 'simulation_results':  return <PlaceholderStep title="Simulation Results" />;
            case 'summary':             return <PlaceholderStep title="Summary" />;
            default:                    return null;
        }
    };

    const currentStepIndex = tabs.findIndex(t => t.value === selectedTab);

    return {
        values: { currentStepIndex, totalSteps: tabs.length, isCreatingSuite, selectedTab },
        functions: { handleBack, handleNextStep, renderStep },
    };
};

export default useCreateSimSuiteController;
