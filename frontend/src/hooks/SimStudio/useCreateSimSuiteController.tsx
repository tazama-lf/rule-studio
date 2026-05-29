import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import type { DropdownOption } from "../../components/DropDown";
import { useSimStudioTab } from "../../contexts/SimStudioTabContext";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../redux/Api/Config";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData, insertData } from "../../utils/Common/storage";
import { SimStudioTabs } from "../../utils/Constants/data";
import PlaceholderStep from "../../components/SimStudio/PlaceholderStep";
import Step1RuleDetails from "../../components/SimStudio/RuleDetails";
import TxtpSelection from "../../components/SimStudio/TxtpSelection";

export interface Step1Values {
    suite_name: string;
    description: string;
    associated_rule: DropdownOption | null;
    rule_version: DropdownOption | null;
    txtp: DropdownOption | null;
    version: DropdownOption | null;
}

export interface SimData {
    step1?: Step1Values;
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
});

const MOCK_RULES: DropdownOption[] = [
    { label: "Rule 001", value: "Rule 001" },
    { label: "Rule 002", value: "Rule 002" },
    { label: "Rule 003", value: "Rule 003" },
    { label: "Rule 004", value: "Rule 004" },
    { label: "Rule 005", value: "Rule 005" },
];

const MOCK_RULE_VERSIONS: Record<string, DropdownOption[]> = {
    "Rule 001": [{ label: "v1.0", value: "v1.0" }, { label: "v1.1", value: "v1.1" }, { label: "v2.0", value: "v2.0" }],
    "Rule 002": [{ label: "v1.0", value: "v1.0" }],
    "Rule 003": [{ label: "v1.0", value: "v1.0" }, { label: "v2.0", value: "v2.0" }],
    "Rule 004": [{ label: "v1.0", value: "v1.0" }, { label: "v1.1", value: "v1.1" }],
    "Rule 005": [{ label: "v1.0", value: "v1.0" }, { label: "v1.1", value: "v1.1" }, { label: "v2.0", value: "v2.0" }],
};

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
            suite_name: "",
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

    useEffect(() => {
        setValue("rule_version", null);
    }, [selectedRule, setValue]);

    const ruleVersionOptions = useMemo<DropdownOption[]>(() => {
        const key = String(selectedRule?.value ?? "");
        return MOCK_RULE_VERSIONS[key] ?? [];
    }, [selectedRule]);

    const handleBack = () => {
        if (selectedTab === SimStudioTabs[0].value) {
            navigate("/sim-studio");
        } else {
            enablePreviousTab();
        }
    };

    const handleNextStep = () => {
        if (selectedTab === SimStudioTabs[0].value) {
            void handleSubmit((data) => {
                writeSimData({ step1: data });
                enableNextTab();
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
                        ruleOptions={MOCK_RULES}
                        ruleVersionOptions={ruleVersionOptions}
                        txLoading={txLoading}
                        versionLoading={versionLoading}
                    />
                );
            case 'txtp_selection':      return <TxtpSelection />;
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
        values: { currentStepIndex, totalSteps: tabs.length },
        functions: { handleBack, handleNextStep, renderStep },
    };
};

export default useCreateSimSuiteController;
