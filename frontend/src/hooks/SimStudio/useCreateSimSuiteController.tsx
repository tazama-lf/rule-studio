import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as yup from "yup";
import type { DropdownOption } from "../../components/DropDown";
import { useSimStudioTab } from "../../contexts/SimStudioTabContext";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../redux/Api/Config";
import { useGetRulesQuery, useLazyGetRuleTagsQuery } from "../../redux/Api/DockerHub";
import { useCreateSuiteMutation } from "../../redux/Api/SimStudio";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData, insertData } from "../../utils/Common/storage";
import { SimStudioTabs } from "../../utils/Constants/data";
import PlaceholderStep from "../../components/SimStudio/PlaceholderStep";
import Step1RuleDetails from "../../components/SimStudio/RuleDetails";
import TxtpSelection from "../../components/SimStudio/TxtpSelection";

export interface Step1Values {
    name: string;
    description: string;
    associated_rule: DropdownOption | null;
    rule_version: DropdownOption | null;
    txtp: DropdownOption | null;
    version: DropdownOption | null;
}

export interface SimData {
    step1?: Step1Values;
    suiteId?: number;
}

const step1Schema = yup.object({
    name: yup
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
});

const SIM_DATA_KEY = 'sim_data';

const readSimData = (): SimData => {
    try {
        return (extractData(SIM_DATA_KEY, LocalStorage, false) as SimData) ?? {};
    } catch {
        return {};
    }
};

const writeSimData = (patch: Partial<SimData>) => {
    const existing = readSimData();
    insertData({ ...existing, ...patch }, SIM_DATA_KEY, LocalStorage, false);
};

const useCreateSimSuiteController = () => {
    const navigate = useNavigate();
    const { selectedTab, tabs, enableNextTab, enablePreviousTab } = useSimStudioTab();
    const [createSuite, { isLoading: isCreatingSuite }] = useCreateSuiteMutation();
    const step2SaveRef = useRef<(() => Promise<boolean>) | null>(null);

    useEffect(() => {
        localStorage.removeItem(SIM_DATA_KEY);
    }, []);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<Step1Values>({
        resolver: yupResolver(step1Schema) as never,
        defaultValues: {
            name: "",
            description: "",
            associated_rule: null,
            rule_version: null,
            txtp: null,
            version: null,
        },
    });

    const selectedTxtp = watch("txtp");
    const selectedRule = watch("associated_rule");

    const { data: txTypesData, isLoading: txLoading } = useGetTypesQuery({});
    const { data: rulesData, isLoading: rulesLoading } = useGetRulesQuery();
    const [fetchRuleTags, { data: ruleTagsData, isFetching: ruleVersionLoading }] =
        useLazyGetRuleTagsQuery();

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

    const ruleOptions = useMemo<DropdownOption[]>(() => {
        if (!rulesData?.rules) return [];
        return rulesData.rules.map((r) => ({ label: r.name, value: r.name }));
    }, [rulesData]);

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

    useEffect(() => {
        setValue("rule_version", null);
        if (selectedRule?.value) {
            void fetchRuleTags({ rule: String(selectedRule.value) });
        }
    }, [selectedRule, setValue, fetchRuleTags]);

    const ruleVersionOptions = useMemo<DropdownOption[]>(() => {
        if (!ruleTagsData?.tags) return [];
        return ruleTagsData.tags.map((t) => ({ label: t.name, value: t.name }));
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
                writeSimData({ step1: data });
                try {
                    const result = await createSuite({
                        name: data.name,
                        description: data.description || undefined,
                        rule_name: data.associated_rule?.value ? String(data.associated_rule.value) : undefined,
                        rule_version: data.rule_version?.value ? String(data.rule_version.value) : undefined,
                        primary_txtp: String(data.txtp!.value),
                        primary_txtp_version: String(data.version!.value),
                    }).unwrap();
                    writeSimData({ suiteId: result.data.id });
                    enableNextTab();
                } catch {
                    toast.error("Failed to create simulation suite. Please try again.");
                }
            })();
        } else if (selectedTab === SimStudioTabs[1].value) {
            void (async () => {
                const save = step2SaveRef.current;
                const ok = save ? await save() : true;
                if (ok) enableNextTab();
            })();
        } else {
            const simData = extractData(SIM_DATA_KEY, LocalStorage, false);
            console.log('[SimStudio] Next Step — sim_data at hand-off:', simData);
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
                        rulesLoading={rulesLoading}
                        ruleVersionLoading={ruleVersionLoading}
                    />
                );
            case 'txtp_selection':      return <TxtpSelection onSaveRef={step2SaveRef} />;
            case 'trigger_data':        return <PlaceholderStep title="Trigger Data" />;
            case 'enrichment_data':     return <PlaceholderStep title="Enrichment Data" />;
            case 'preview_save':        return <PlaceholderStep title="Preview & Save" />;
            case 'simulation_results':  return <PlaceholderStep title="Simulation Results" />;
            case 'summary':             return <PlaceholderStep title="Summary" />;
            default:                    return null;
        }
    };

    const currentStepIndex = tabs.findIndex(t => t.value === selectedTab);

    return {
        values: { currentStepIndex, totalSteps: tabs.length, isCreatingSuite },
        functions: { handleBack, handleNextStep, renderStep },
    };
};

export default useCreateSimSuiteController;
