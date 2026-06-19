import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import toast from "react-hot-toast";
import {
    useLazyGetContextConfigsQuery,
    useLazyGetTriggerConfigsQuery,
    useCreateTriggerConfigMutation,
    useBulkUpdateTriggerConfigsMutation,
    useDeleteTriggerConfigMutation,
    type TriggerTxtpConfig,
} from "../../redux/Api/SimStudio";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData } from "../../utils/Common/storage";

export type TriggerOverrideType = "null" | "static" | "range" | "random" | "remove";

export interface TriggerOverride {
    overrideType: TriggerOverrideType;
    staticValue: string;
    rangeMin: string;
    rangeMax: string;
    semanticId: string;
}

export interface TriggerEntry {
    id: string;
    triggerId?: number;
    txtp: string;
    version: string;
    numMessages: number;
    expanded: boolean;
    payloadFields: string[];
    fieldOverrides: Record<string, TriggerOverride>;
    relatedTxtpConfigId?: number | null;
}

const parseRelatedTransaction = (url: string): { txtp: string; version: string } | null => {
    if (!url || url.length === 0) return null;
    const parts = url.split("/");
    const version = parts[2];
    const txtp = parts[4];
    if (!txtp || !version) return null;
    return { txtp, version };
};

const overrideTypeFromApi = (type: string): TriggerOverrideType => {
    if (type === "static") return "static";
    if (type === "range") return "range";
    if (type === "random") return "random";
    if (type === "remove" || type === "skip") return "remove";
    return "null";
};

const getUniqueFieldPaths = (items: { field_path: string }[] = []): string[] =>
    Array.from(
        new Set(
            items
                .map((item) => item.field_path)
                .filter((path) => path.trim().length > 0)
        )
    );

const buildTriggerEntry = (cfg: TriggerTxtpConfig): TriggerEntry => {
    const strategyFields = cfg.field_strategies ?? [];
    const payloadFields = strategyFields.length > 0
        ? getUniqueFieldPaths(strategyFields)
        : getUniqueFieldPaths(cfg.field_overrides ?? []);

    const fieldOverrides: Record<string, TriggerOverride> = {};
    for (const s of strategyFields) {
        fieldOverrides[s.field_path] = {
            overrideType: overrideTypeFromApi(s.strategy_code),
            staticValue: s.static_value != null ? String(s.static_value) : "",
            rangeMin: s.range_min != null ? String(s.range_min) : "",
            rangeMax: s.range_max != null ? String(s.range_max) : "",
            semanticId: s.faker_semantic_type ?? "",
        };
    }
    for (const o of cfg.field_overrides ?? []) {
        fieldOverrides[o.field_path] = {
            overrideType: overrideTypeFromApi(o.override_type),
            staticValue: o.static_value != null ? String(o.static_value) : "",
            rangeMin: o.range_min != null ? String(o.range_min) : "",
            rangeMax: o.range_max != null ? String(o.range_max) : "",
            semanticId: o.faker_semantic_type ?? "",
        };
    }

    return {
        id: `trigger_${cfg.trigger_txtp_config_id}_${Date.now()}`,
        triggerId: Number(cfg.trigger_txtp_config_id),
        txtp: cfg.txtp,
        version: cfg.txtp_version,
        numMessages: cfg.message_count ?? 1,
        expanded: false,
        payloadFields,
        fieldOverrides,
        relatedTxtpConfigId: cfg.related_txtp_config_id ?? null,
    };
};

const useTriggerDataController = () => {
    const initialized = useRef(false);

    const [entries, setEntries] = useState<TriggerEntry[]>([]);
    const [adding, setAdding] = useState(false);
    const [numMessages, setNumMessages] = useState<number>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [primaryTxtp, setPrimaryTxtp] = useState<{ txtp: string; txtp_version: string } | null>(null);

    const [fetchContextConfigs] = useLazyGetContextConfigsQuery();
    const [fetchTriggerConfigs] = useLazyGetTriggerConfigsQuery();
    const [createTriggerConfig] = useCreateTriggerConfigMutation();
    const [bulkUpdateTriggerConfigs] = useBulkUpdateTriggerConfigsMutation();
    const [deleteTriggerConfig] = useDeleteTriggerConfigMutation();

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        if (!genId) return;

        setIsLoading(true);
        void (async () => {
            try {
                // Get primary txtp from context configs
                const ctxRes = await fetchContextConfigs(Number(genId)).unwrap();
                const primary = ctxRes.data?.[0];
                if (primary) {
                    setPrimaryTxtp({ txtp: primary.txtp, txtp_version: primary.txtp_version });
                }

                // Load existing trigger configs
                const trigRes = await fetchTriggerConfigs(Number(genId)).unwrap();
                const configs = trigRes.data ?? [];

                if (configs.length === 0) return;

                // Find primaries that need a related trigger config created
                const primariesNeedingRelated = configs.filter(
                    (c) =>
                        !c.related_txtp_config_id &&
                        c.related_transaction &&
                        c.related_transaction.length > 0 &&
                        !configs.some(
                            (other) =>
                                other.related_txtp_config_id === Number(c.trigger_txtp_config_id)
                        )
                );

                if (primariesNeedingRelated.length > 0) {
                    for (const primaryCfg of primariesNeedingRelated) {
                        const parsed = parseRelatedTransaction(primaryCfg.related_transaction!);
                        if (!parsed) continue;
                        const primaryTrigId = Number(primaryCfg.trigger_txtp_config_id);
                        try {
                            await createTriggerConfig({
                                generationId: Number(genId),
                                txtp: parsed.txtp,
                                txtp_version: parsed.version,
                                message_count: primaryCfg.message_count ?? 1,
                                related_trigger_txtp_id: primaryTrigId || undefined,
                            }).unwrap();
                        } catch {
                            // non-blocking
                        }
                    }

                    // Re-fetch to get the complete authoritative list
                    const refreshed = await fetchTriggerConfigs(Number(genId)).unwrap();
                    setEntries((refreshed.data ?? []).map(buildTriggerEntry));
                } else {
                    setEntries(configs.map(buildTriggerEntry));
                }
            } catch {
                // non-blocking
            } finally {
                setIsLoading(false);
            }
        })();
    }, [fetchContextConfigs, fetchTriggerConfigs, createTriggerConfig]);

    const handleAdd = useCallback(() => {
        if (!primaryTxtp) {
            toast.error("Primary TXTP not found. Please complete Step 2 first.");
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
                const res = await createTriggerConfig({
                    generationId: Number(genId),
                    txtp: primaryTxtp.txtp,
                    txtp_version: primaryTxtp.txtp_version,
                    message_count: numMessages || 1,
                }).unwrap();

                const newEntry = buildTriggerEntry(res.data);
                const primaryTrigId = Number(res.data.trigger_txtp_config_id);

                // Check if the added trigger has a related transaction
                const relatedUrl: string = (res.data as { related_transaction?: string }).related_transaction ?? "";
                const parsed = relatedUrl.length > 0 ? parseRelatedTransaction(relatedUrl) : null;

                if (parsed) {
                    try {
                        await createTriggerConfig({
                            generationId: Number(genId),
                            txtp: parsed.txtp,
                            txtp_version: parsed.version,
                            message_count: numMessages || 1,
                            related_trigger_txtp_id: primaryTrigId || undefined,
                        }).unwrap();

                        // Re-fetch for authoritative state
                        const refreshed = await fetchTriggerConfigs(Number(genId)).unwrap();
                        setEntries((refreshed.data ?? []).map(buildTriggerEntry));
                    } catch {
                        setEntries((prev) => [...prev, newEntry]);
                    }
                } else {
                    setEntries((prev) => [...prev, newEntry]);
                }

                setNumMessages(1);
            } catch {
                toast.error("Failed to add trigger config. Please try again.");
            } finally {
                setAdding(false);
            }
        })();
    }, [primaryTxtp, numMessages, createTriggerConfig, fetchTriggerConfigs]);

    const handleRemove = useCallback((id: string) => {
        const entry = entries.find((e) => e.id === id);
        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        if (entry?.triggerId && genId) {
            void deleteTriggerConfig({ generationId: Number(genId), configId: entry.triggerId })
                .unwrap()
                .catch(() => toast.error("Failed to remove trigger config."));
        }
        setEntries((prev) => prev.filter((e) => e.id !== id));
    }, [entries, deleteTriggerConfig]);

    const handleRemovePair = useCallback((primaryId: string, relatedId: string) => {
        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        const primaryEntry = entries.find((e) => e.id === primaryId);
        const relatedEntry = entries.find((e) => e.id === relatedId);
        if (genId && primaryEntry?.triggerId) {
            void deleteTriggerConfig({ generationId: Number(genId), configId: primaryEntry.triggerId })
                .unwrap()
                .catch(() => toast.error("Failed to remove trigger config."));
        }
        if (genId && relatedEntry?.triggerId) {
            void deleteTriggerConfig({ generationId: Number(genId), configId: relatedEntry.triggerId })
                .unwrap()
                .catch(() => toast.error("Failed to remove trigger config."));
        }
        setEntries((prev) => prev.filter((e) => e.id !== primaryId && e.id !== relatedId));
    }, [entries, deleteTriggerConfig]);

    const handleToggleExpand = useCallback((id: string) => {
        startTransition(() => {
            setEntries((prev) =>
                prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
            );
        });
    }, []);

    const handleNumMessagesChange = useCallback((entryId: string, value: number) => {
        setEntries((prev) =>
            prev.map((e) => (e.id === entryId ? { ...e, numMessages: value } : e))
        );
    }, []);

    const handleOverrideChange = useCallback(
        (entryId: string, fieldPath: string, override: TriggerOverride) => {
            setEntries((prev) =>
                prev.map((e) =>
                    e.id !== entryId
                        ? e
                        : { ...e, fieldOverrides: { ...e.fieldOverrides, [fieldPath]: override } }
                )
            );
        },
        []
    );

    const saveTriggerConfigs = useCallback(async (): Promise<boolean> => {
        const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
        if (!genId) return true;

        const toStrategyCode = (t: TriggerOverrideType): string => {
            if (t === "static") return "static";
            if (t === "range") return "range";
            if (t === "random") return "random";
            if (t === "remove") return "skip";
            return "keep_sample";
        };

        const items = entries
            .filter((e) => e.triggerId)
            .map((entry) => ({
                trigger_txtp_config_id: entry.triggerId!,
                message_count: entry.numMessages || 1,
                field_strategies: Object.entries(entry.fieldOverrides).map(([fieldPath, o]) => ({
                    field_path: fieldPath,
                    strategy_code: toStrategyCode(o.overrideType),
                    static_value: o.overrideType === "static" ? o.staticValue : undefined,
                    range_min: o.overrideType === "range" && o.rangeMin ? Number(o.rangeMin) : undefined,
                    range_max: o.overrideType === "range" && o.rangeMax ? Number(o.rangeMax) : undefined,
                    faker_semantic_type: o.semanticId || undefined,
                })),
            }));

        if (items.length === 0) return true;

        setIsSaving(true);
        try {
            await bulkUpdateTriggerConfigs({ generationId: Number(genId), items }).unwrap();
            return true;
        } catch {
            toast.error("Failed to save trigger configuration. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [entries, bulkUpdateTriggerConfigs]);

    return {
        values: { entries, numMessages, adding, isSaving, isLoading, primaryTxtp },
        functions: {
            setNumMessages,
            handleAdd,
            handleRemove,
            handleRemovePair,
            handleToggleExpand,
            handleNumMessagesChange,
            handleOverrideChange,
            saveTriggerConfigs,
        },
    };
};

export default useTriggerDataController;
