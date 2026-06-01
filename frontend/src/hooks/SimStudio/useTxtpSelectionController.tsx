import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { DropdownOption } from "../../components/DropDown";
import {
    useGetTypesQuery,
    useLazyGetSamplePayloadQuery,
    useLazyGetTxtpVersionsQuery,
} from "../../redux/Api/Config";
import {
    useLazyGetLatestGenerationQuery,
    useLazyGetContextConfigsQuery,
    useUpdateContextConfigMutation,
    useUpsertFieldStrategiesMutation,
    type UpsertFieldStrategyItem,
} from "../../redux/Api/SimStudio";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData, insertData } from "../../utils/Common/storage";

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
    name: string;
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

const SIM_DATA_KEY = "sim_data";

const readSimData = () => {
    try {
        return (extractData(SIM_DATA_KEY, LocalStorage, false) as Record<string, unknown>) ?? {};
    } catch {
        return {} as Record<string, unknown>;
    }
};

const readSuiteId = (): number | null => {
    const data = readSimData() as { suiteId?: number };
    return data.suiteId ?? null;
};

const writeStep2 = (entries: TxtpEntry[]) => {
    const existing = readSimData();
    const step2 = entries.map((e) => ({
        id: e.id,
        txtp: e.txtp,
        version: e.version,
        numMessages: e.numMessages,
        fieldConfigs: e.fieldConfigs,
    }));
    insertData({ ...existing, step2 }, SIM_DATA_KEY, LocalStorage, false);
};

const useTxtpSelectionController = () => {
    const initialized = useRef(false);

    const [entries, setEntries] = useState<TxtpEntry[]>([]);
    const [adding, setAdding] = useState(false);
    const [addTxtp, setAddTxtp] = useState<DropdownOption | null>(null);
    const [addVersion, setAddVersion] = useState<DropdownOption | null>(null);
    const [numMessages, setNumMessages] = useState<number>(100);
    const [configId, setConfigId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { data: txTypesData } = useGetTypesQuery({});
    const [fetchVersionsForAdd, { data: addVersionsData, isFetching: addVersionsLoading }] =
        useLazyGetTxtpVersionsQuery();
    const [getPayload] = useLazyGetSamplePayloadQuery();
    const [fetchLatestGeneration] = useLazyGetLatestGenerationQuery();
    const [fetchContextConfigs] = useLazyGetContextConfigsQuery();
    const [updateContextConfig] = useUpdateContextConfigMutation();
    const [upsertFieldStrategies] = useUpsertFieldStrategiesMutation();

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

    const buildEntry = useCallback(
        async (txtp: string, version: string, msgs: number): Promise<TxtpEntry> => {
            try {
                const payload = (await getPayload({ type: txtp, version }).unwrap()) as Record<
                    string,
                    unknown
                >;
                const fieldPaths = flattenPaths(payload);
                return {
                    id: `${txtp}_${version}_${Date.now()}`,
                    txtp,
                    version,
                    numMessages: msgs,
                    expanded: false,
                    payload,
                    fieldPaths,
                    fieldConfigs: {},
                    schemaLoaded: true,
                    sampleAvailable: fieldPaths.length > 0,
                };
            } catch {
                return {
                    id: `${txtp}_${version}_${Date.now()}`,
                    txtp,
                    version,
                    numMessages: msgs,
                    expanded: false,
                    payload: null,
                    fieldPaths: [],
                    fieldConfigs: {},
                    schemaLoaded: false,
                    sampleAvailable: false,
                };
            }
        },
        [getPayload]
    );

    // On mount: build primary entry from step1 data, then sync message_count
    // from the seeded context_txtp_config row in the DB.
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const simData = readSimData() as {
            step1?: { txtp?: { value: string }; version?: { value: string } };
            suiteId?: number;
        };
        const txtp = simData.step1?.txtp;
        const version = simData.step1?.txtp_version;
        if (!txtp || !version) return;

        const suiteId = simData.suiteId;

        void buildEntry(txtp, version, 100).then(async (entry) => {
            let initialMsgs = 100;

            // Fetch the seeded context config to get message_count + configId
            if (suiteId) {
                try {
                    const genRes = await fetchLatestGeneration(suiteId).unwrap();
                    if (genRes.data?.id) {
                        const cfgRes = await fetchContextConfigs(genRes.data.id).unwrap();
                        const primary = cfgRes.data?.[0];
                        if (primary) {
                            setConfigId(primary.id);
                            initialMsgs = primary.message_count ?? 100;
                        }
                    }
                } catch {
                    // non-blocking — UI still works without DB sync
                }
            }

            const hydrated = { ...entry, numMessages: initialMsgs };
            setEntries([hydrated]);
            writeStep2([hydrated]);
        });
    }, [buildEntry, fetchLatestGeneration, fetchContextConfigs]);

    // Called by parent wizard on "Next Step" — persists message_count + field strategies
    const saveStep2ToDb = useCallback(async (): Promise<boolean> => {
        const suiteId = readSuiteId();
        if (!suiteId || configId === null) return true; // no suite yet, skip silently

        setIsSaving(true);
        try {
            const primaryEntry = entries[0];
            if (primaryEntry) {
                await updateContextConfig({
                    suiteId,
                    configId,
                    message_count: primaryEntry.numMessages,
                }).unwrap();

                const strategies: UpsertFieldStrategyItem[] = Object.entries(
                    primaryEntry.fieldConfigs
                ).map(([fieldPath, cfg]) => {
                    const base = { field_path: fieldPath } as UpsertFieldStrategyItem;
                    switch (cfg.action) {
                        case "static":
                            return { ...base, strategy_code: "static", static_value: cfg.staticValue };
                        case "range":
                            return {
                                ...base,
                                strategy_code: "range",
                                range_min: cfg.rangeStart ? Number(cfg.rangeStart) : undefined,
                                range_max: cfg.rangeEnd ? Number(cfg.rangeEnd) : undefined,
                            };
                        case "skip":
                            return { ...base, strategy_code: "skip" };
                        default:
                            return { ...base, strategy_code: "keep_sample" };
                    }
                });

                if (strategies.length > 0) {
                    await upsertFieldStrategies({ suiteId, configId, strategies }).unwrap();
                }
            }
            return true;
        } catch {
            toast.error("Failed to save TXTP configuration. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [entries, configId, updateContextConfig, upsertFieldStrategies]);

    const handleAdd = useCallback(() => {
        if (!addTxtp?.value || !addVersion?.value) {
            toast.error("Please select TXTP Type and Version");
            return;
        }
        setAdding(true);
        void buildEntry(String(addTxtp.value), String(addVersion.value), numMessages).then(
            (entry) => {
                setEntries((prev) => {
                    const updated = [...prev, entry];
                    writeStep2(updated);
                    return updated;
                });
                setAddTxtp(null);
                setAddVersion(null);
                setNumMessages(100);
                setAdding(false);
            }
        );
    }, [addTxtp, addVersion, numMessages, buildEntry]);

    const handleRemove = useCallback((id: string) => {
        setEntries((prev) => {
            const updated = prev.filter((e) => e.id !== id);
            writeStep2(updated);
            return updated;
        });
    }, []);

    const handleToggleExpand = useCallback((id: string) => {
        setEntries((prev) =>
            prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
        );
    }, []);

    const handleFieldConfigChange = useCallback(
        (entryId: string, fieldPath: string, config: FieldConfig) => {
            setEntries((prev) => {
                const updated = prev.map((e) => {
                    if (e.id !== entryId) return e;
                    return { ...e, fieldConfigs: { ...e.fieldConfigs, [fieldPath]: config } };
                });
                writeStep2(updated);
                return updated;
            });
        },
        []
    );

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
            handleFieldConfigChange,
            saveStep2ToDb,
        },
    };
};

export default useTxtpSelectionController;

export const buildSimPayload = (
    entries: TxtpEntry[],
    step1: {
        name: string;
        description: string;
        associated_rule?: string | null;
        rule_version?: string | null;
    }
): SimCreationPayload => ({
    name: step1.name,
    description: step1.description,
    associated_rule: step1.associated_rule ?? null,
    rule_version: step1.rule_version ?? null,
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
