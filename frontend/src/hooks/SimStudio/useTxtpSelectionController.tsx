import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { DropdownOption } from "../../components/DropDown";
import {
    useGetTypesQuery,
    useLazyGetTxtpVersionsQuery,
} from "../../redux/Api/Config";
import {
    useLazyGetContextConfigsQuery,
    useCreateContextConfigMutation,
    useBulkUpdateContextConfigsMutation,
    type BulkConfigItem,
    type FieldStrategy,
} from "../../redux/Api/SimStudio";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData } from "../../utils/Common/storage";

export type FieldAction = "sample" | "static" | "range" | "skip";

export interface FieldConfig {
    action: FieldAction;
    staticValue: string;
    rangeStart: string;
    rangeEnd: string;
}

export interface TxtpEntry {
    id: string;
    txtp: string;
    version: string;
    numMessages: number;
    expanded: boolean;
    payload: Record<string, unknown> | null;
    fieldPaths: string[];
    fieldConfigs: Record<string, FieldConfig>;
    schemaLoaded: boolean;
    sampleAvailable: boolean;
    contextConfigId?: number;
}

export interface SimFieldConfig {
    action: "sample" | "static" | "range" | "skip";
    static_value: string | null;
    range_start: string | null;
    range_end: string | null;
}

export interface SimTxtpPayload {
    txtp: string;
    version: string;
    num_messages: number;
    is_primary: boolean;
    field_configs: Record<string, SimFieldConfig>;
}

export interface SimCreationPayload {
    suite_name: string;
    description: string;
    associated_rule: string | null;
    rule_version: string | null;
    txtp_list: SimTxtpPayload[];
}

const flattenPaths = (obj: unknown, prefix = ""): string[] => {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return prefix ? [prefix] : [];
    }
    return Object.entries(obj as Record<string, unknown>).flatMap(([key, val]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            return flattenPaths(val, path);
        }
        return [path];
    });
};

const strategyToFieldAction = (code: string): FieldAction => {
    if (code === "static") return "static";
    if (code === "range") return "range";
    if (code === "skip") return "skip";
    return "sample";
};

const buildEntryFromContextConfig = (cfg: {
    context_txtp_config_id?: string | number;
    id?: number;
    txtp: string;
    txtp_version: string;
    message_count: number;
    sample_payload_snapshot?: Record<string, unknown> | null;
    field_strategies?: FieldStrategy[];
}): TxtpEntry => {
    const payload = cfg.sample_payload_snapshot ?? null;
    const fieldPaths = payload ? flattenPaths(payload) : [];
    const fieldConfigs: Record<string, FieldConfig> = {};
    for (const s of cfg.field_strategies ?? []) {
        fieldConfigs[s.field_path] = {
            action: strategyToFieldAction(s.strategy_code),
            staticValue: s.static_value != null ? String(s.static_value) : "",
            rangeStart: s.range_min != null ? String(s.range_min) : "",
            rangeEnd: s.range_max != null ? String(s.range_max) : "",
        };
    }
    return {
        id: `${cfg.txtp}_${cfg.txtp_version}_${Date.now()}`,
        txtp: cfg.txtp,
        version: cfg.txtp_version,
        numMessages: cfg.message_count ?? 100,
        expanded: false,
        payload,
        fieldPaths,
        fieldConfigs,
        schemaLoaded: true,
        sampleAvailable: fieldPaths.length > 0,
        contextConfigId: Number(cfg.context_txtp_config_id ?? cfg.id ?? 0) || undefined,
    };
};

const useTxtpSelectionController = () => {
    const initialized = useRef(false);

    const [entries, setEntries] = useState<TxtpEntry[]>([]);
    const [adding, setAdding] = useState(false);
    const [addTxtp, setAddTxtp] = useState<DropdownOption | null>(null);
    const [addVersion, setAddVersion] = useState<DropdownOption | null>(null);
    const [numMessages, setNumMessages] = useState<number>(100);
    const [isSaving, setIsSaving] = useState(false);

    const { data: txTypesData } = useGetTypesQuery({});
    const [fetchVersionsForAdd, { data: addVersionsData, isFetching: addVersionsLoading }] =
        useLazyGetTxtpVersionsQuery();
    const [fetchContextConfigs] = useLazyGetContextConfigsQuery();
    const [createContextConfig] = useCreateContextConfigMutation();
    const [bulkUpdateContextConfigs] = useBulkUpdateContextConfigsMutation();

    const txTypeOptions = useMemo<DropdownOption[]>(() => {
        if (!txTypesData || !Array.isArray(txTypesData)) return [];
        const seen = new Set<string>();
        return (txTypesData as { transaction_type: string }[]).reduce<DropdownOption[]>(
            (acc, item) => {
                if (!seen.has(item.transaction_type)) {
                    seen.add(item.transaction_type);
                    acc.push({ label: item.transaction_type, value: item.transaction_type });
                }
                return acc;
            },
            []
        );
    }, [txTypesData]);

    const addVersionOptions = useMemo<DropdownOption[]>(() => {
        if (!addVersionsData || !Array.isArray(addVersionsData)) return [];
        return (addVersionsData as string[]).map((v) => ({ label: v, value: v }));
    }, [addVersionsData]);

    const handleTxtpChange = useCallback((value: DropdownOption | null) => {
        setAddTxtp(value);
        setAddVersion(null);
    }, []);

    useEffect(() => {
        if (addTxtp?.value) {
            void fetchVersionsForAdd({ type: String(addTxtp.value) });
        }
    }, [addTxtp, fetchVersionsForAdd]);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        if (!genId) return;

        void (async () => {
            try {
                const cfgRes = await fetchContextConfigs(Number(genId)).unwrap();
                const configs = cfgRes.data ?? [];
                if (configs.length === 0) return;

                const newEntries = configs.map((cfg) => buildEntryFromContextConfig(cfg));
                setEntries(newEntries);
            } catch {
                // non-blocking — UI still works without DB sync
            }
        })();
    }, [fetchContextConfigs]);

    const saveStep2ToDb = useCallback(async (): Promise<boolean> => {
        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        if (!genId) return true;

        const items: BulkConfigItem[] = entries
            .filter((e) => e.contextConfigId)
            .map((entry) => ({
                context_txtp_config_id: entry.contextConfigId!,
                message_count: entry.numMessages || 100,
                field_strategies: Object.entries(entry.fieldConfigs).map(([fieldPath, cfg]) => {
                    switch (cfg.action) {
                        case "static":
                            return { field_path: fieldPath, strategy_code: "static" as const, static_value: cfg.staticValue };
                        case "range":
                            return {
                                field_path: fieldPath,
                                strategy_code: "range" as const,
                                range_min: cfg.rangeStart ? Number(cfg.rangeStart) : undefined,
                                range_max: cfg.rangeEnd ? Number(cfg.rangeEnd) : undefined,
                            };
                        case "skip":
                            return { field_path: fieldPath, strategy_code: "skip" as const };
                        default:
                            return { field_path: fieldPath, strategy_code: "keep_sample" as const };
                    }
                }),
            }));

        if (items.length === 0) return true;

        setIsSaving(true);
        try {
            await bulkUpdateContextConfigs({ generationId: Number(genId), items }).unwrap();
            return true;
        } catch {
            toast.error("Failed to save TXTP configuration. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [entries, bulkUpdateContextConfigs]);

    const handleAdd = useCallback(() => {
        if (!addTxtp?.value || !addVersion?.value) {
            toast.error("Please select TXTP Type and Version");
            return;
        }

        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        if (!genId) {
            toast.error("Generation ID not found. Please complete Step 1 first.");
            return;
        }

        setAdding(true);
        void (async () => {
            try {
                const res = await createContextConfig({
                    generationId: Number(genId),
                    txtp: String(addTxtp.value),
                    txtp_version: String(addVersion.value),
                    message_count: numMessages || 100,
                }).unwrap();

                const newEntry = buildEntryFromContextConfig(res.data);
                setEntries((prev) => [...prev, newEntry]);
                setAddTxtp(null);
                setAddVersion(null);
                setNumMessages(100);
            } catch {
                toast.error("Failed to add TXTP. Please try again.");
            } finally {
                setAdding(false);
            }
        })();
    }, [addTxtp, addVersion, numMessages, entries.length, createContextConfig]);

    const handleRemove = useCallback((id: string) => {
        setEntries((prev) => prev.filter((e) => e.id !== id));
    }, []);

    const handleToggleExpand = useCallback((id: string) => {
        setEntries((prev) =>
            prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
        );
    }, []);

    const handleFieldConfigChange = useCallback(
        (entryId: string, fieldPath: string, config: FieldConfig) => {
            setEntries((prev) =>
                prev.map((e) =>
                    e.id !== entryId ? e : { ...e, fieldConfigs: { ...e.fieldConfigs, [fieldPath]: config } }
                )
            );
        },
        []
    );

    const handleNumMessagesChange = useCallback((entryId: string, value: number) => {
        setEntries((prev) =>
            prev.map((e) => (e.id === entryId ? { ...e, numMessages: value } : e))
        );
    }, []);

    return {
        values: {
            entries,
            txTypeOptions,
            addTxtp,
            addVersion,
            addVersionOptions,
            addVersionsLoading,
            numMessages,
            adding,
            isSaving,
        },
        functions: {
            handleTxtpChange,
            setAddVersion,
            setNumMessages,
            handleAdd,
            handleRemove,
            handleToggleExpand,
            handleNumMessagesChange,
            handleFieldConfigChange,
            saveStep2ToDb,
        },
    };
};

export default useTxtpSelectionController;

export const buildSimPayload = (
    entries: TxtpEntry[],
    step1: {
        suite_name: string;
        description: string;
        associated_rule?: { label: string; value: string } | null;
        rule_version?: { label: string; value: string } | null;
    }
): SimCreationPayload => ({
    suite_name: step1.suite_name,
    description: step1.description,
    associated_rule: step1.associated_rule?.value ?? null,
    rule_version: step1.rule_version?.value ?? null,
    txtp_list: entries.map((entry, idx) => ({
        txtp: entry.txtp,
        version: entry.version,
        num_messages: entry.numMessages,
        is_primary: idx === 0,
        field_configs: Object.fromEntries(
            Object.entries(entry.fieldConfigs).map(([path, cfg]) => [
                path,
                {
                    action: cfg.action,
                    static_value: cfg.action === "static" ? cfg.staticValue : null,
                    range_start: cfg.action === "range" && cfg.rangeStart ? cfg.rangeStart : null,
                    range_end: cfg.action === "range" && cfg.rangeEnd ? cfg.rangeEnd : null,
                },
            ])
        ),
    })),
});
