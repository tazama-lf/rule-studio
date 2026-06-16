import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import toast from "react-hot-toast";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData } from "../../utils/Common/storage";
import {
    useGetEnrichmentTablesQuery,
    useCreateEnrichmentTableMutation,
    useDeleteEnrichmentTableMutation,
} from "../../redux/Api/SimStudio";

export type SchemaFieldType = "String" | "Number" | "Boolean" | "Date" | "UUID";
export type GenerationStrategy = "Sample Value" | "Static" | "Range" | "Skip Field" | "Random";

export interface SchemaField {
    id: string;
    fieldName: string;
    type: SchemaFieldType;
    strategy: GenerationStrategy;
    staticValue: string;
    rangeMin: string;
    rangeMax: string;
    semanticId: string;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inferType = (value: unknown): SchemaFieldType => {
    if (typeof value === "boolean") return "Boolean";
    if (typeof value === "number") return "Number";
    if (typeof value === "string") {
        if (UUID_RE.test(value)) return "UUID";
        if (ISO_DATE_RE.test(value)) return "Date";
    }
    return "String";
};

const flattenJson = (obj: Record<string, unknown>, prefix = ""): { path: string; value: unknown }[] => {
    const result: { path: string; value: unknown }[] = [];
    for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(val)) {
            val.forEach((item, index) => {
                const itemPath = `${path}[${index}]`;
                if (typeof item === "object" && item !== null && !Array.isArray(item)) {
                    result.push(...flattenJson(item as Record<string, unknown>, itemPath));
                } else {
                    result.push({ path: itemPath, value: item ?? "" });
                }
            });
        } else if (typeof val === "object" && val !== null) {
            result.push(...flattenJson(val as Record<string, unknown>, path));
        } else {
            result.push({ path, value: val });
        }
    }
    return result;
};

const useEnrichmentDataController = (
    onSaveRef?: MutableRefObject<(() => Promise<boolean>) | null>
) => {
    const generationId = extractData("sim_gen_id", LocalStorage, false) as number | null;

    const { data: enrichmentTablesData, isLoading: isLoadingTables } = useGetEnrichmentTablesQuery(generationId!, {
        skip: !generationId,
    });
    const [createEnrichmentTable, { isLoading: isSaving }] = useCreateEnrichmentTableMutation();
    const [deleteEnrichmentTable, { isLoading: isDeleting }] = useDeleteEnrichmentTableMutation();

    const savedRecords = enrichmentTablesData?.data ?? [];

    const [tableName, setTableName] = useState("");
    const [numberOfRows, setNumberOfRows] = useState(1);
    const [sampleJson, setSampleJson] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);

    const handleSampleJsonChange = useCallback((value: string) => {
        setSampleJson(value);
        if (!value.trim() || value.trim() === "{}") {
            setJsonError(null);
            return;
        }
        try {
            JSON.parse(value);
            setJsonError(null);
        } catch (e) {
            setJsonError((e as SyntaxError).message);
        }
    }, []);

    const handleGenerateSchemaFields = useCallback(() => {
        try {
            const parsed = JSON.parse(sampleJson) as Record<string, unknown>;
            const flattened = flattenJson(parsed);
            const fields = flattened.map(({ path, value }) => ({
                id: path,
                fieldName: path,
                type: inferType(value),
                strategy: "Sample Value" as GenerationStrategy,
                staticValue: "",
                rangeMin: "",
                rangeMax: "",
                semanticId: "",
            }));
            setSchemaFields(fields);
            setJsonError(null);
        } catch (e) {
            setJsonError((e as SyntaxError).message);
        }
    }, [sampleJson]);

    const handleFieldChange = useCallback((id: string, changes: Partial<SchemaField>) => {
        setSchemaFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)));
    }, []);

    const handleSaveRecord = useCallback(async (): Promise<void> => {
        if (!generationId) {
            toast.error("Generation ID not found. Please complete Step 1 first.");
            return;
        }
        if (!tableName.trim()) {
            toast.error("Please enter a target table name.");
            return;
        }
        if (!sampleJson.trim() || jsonError) {
            toast.error("Please provide a valid sample JSON.");
            return;
        }
        if (schemaFields.length === 0) {
            toast.error("Please generate schema fields before saving.");
            return;
        }
        try {
            const payloadJson = JSON.parse(sampleJson) as Record<string, unknown>;
            await createEnrichmentTable({
                generationId,
                table_name: tableName.trim(),
                row_count: numberOfRows,
                payload_template_json: payloadJson,
                schema_template_json: { properties: schemaFields },
            }).unwrap();
            toast.success("Enrichment record saved successfully.");
            setTableName("");
            setNumberOfRows(1);
            setSampleJson("");
            setJsonError(null);
            setSchemaFields([]);
        } catch {
            toast.error("Failed to save enrichment record. Please try again.");
        }
    }, [generationId, tableName, numberOfRows, sampleJson, jsonError, schemaFields, createEnrichmentTable]);

    const handleDeleteRecord = useCallback(async (tableId: number): Promise<void> => {
        if (!generationId) return;
        try {
            await deleteEnrichmentTable({ generationId, tableId }).unwrap();
            toast.success("Enrichment record removed.");
        } catch {
            toast.error("Failed to remove enrichment record.");
        }
    }, [generationId, deleteEnrichmentTable]);

    // Next button just proceeds — records are saved individually via Save Record
    const saveEnrichmentRecords = useCallback(async (): Promise<boolean> => {
        return true;
    }, []);

    useEffect(() => {
        if (onSaveRef) onSaveRef.current = saveEnrichmentRecords;
        return () => { if (onSaveRef) onSaveRef.current = null; };
    }, [onSaveRef, saveEnrichmentRecords]);

    return {
        values: { tableName, numberOfRows, sampleJson, jsonError, schemaFields, savedRecords, isSaving, isDeleting, isLoading: isLoadingTables },
        functions: {
            setTableName,
            setNumberOfRows,
            handleSampleJsonChange,
            handleGenerateSchemaFields,
            handleFieldChange,
            handleSaveRecord,
            handleDeleteRecord,
        },
    };
};

export default useEnrichmentDataController;

