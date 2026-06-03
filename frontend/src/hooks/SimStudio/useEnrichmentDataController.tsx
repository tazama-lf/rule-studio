import { useCallback, useState, type MutableRefObject } from "react";

export type SchemaFieldType = "String" | "Number" | "Boolean" | "Date" | "UUID";
export type GenerationStrategy = "Sample Value" | "Static" | "Range" | "Auto-generate";

export interface SchemaField {
    id: string;
    fieldName: string;
    type: SchemaFieldType;
    strategy: GenerationStrategy;
    staticValue: string;
    rangeMin: string;
    rangeMax: string;
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
            if (val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
                result.push(...flattenJson(val[0] as Record<string, unknown>, `${path}[0]`));
            } else {
                result.push({ path, value: val[0] ?? "" });
            }
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
            }));
            setSchemaFields(fields);
            setJsonError(null);
            console.log("[EnrichmentData] Generated schema fields:", fields);
        } catch (e) {
            setJsonError((e as SyntaxError).message);
        }
    }, [sampleJson]);

    const handleFieldChange = useCallback((id: string, changes: Partial<SchemaField>) => {
        setSchemaFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)));
    }, []);

    const handleRemoveField = useCallback((id: string) => {
        setSchemaFields((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const saveEnrichmentRecords = useCallback(async (): Promise<boolean> => {
        console.log("[EnrichmentData] Saving enrichment record:", {
            tableName,
            numberOfRows,
            schemaFields,
        });
        // TODO: wire API when ready
        return true;
    }, [tableName, numberOfRows, schemaFields]);

    if (onSaveRef) {
        onSaveRef.current = saveEnrichmentRecords;
    }

    return {
        values: { tableName, numberOfRows, sampleJson, jsonError, schemaFields },
        functions: {
            setTableName,
            setNumberOfRows,
            handleSampleJsonChange,
            handleGenerateSchemaFields,
            handleFieldChange,
            handleRemoveField,
            saveEnrichmentRecords,
        },
    };
};

export default useEnrichmentDataController;

