import { useCallback, useEffect, useMemo, useState } from "react";
import { useMaskingTab } from "../../../contexts/MaskingTabContext/useMaskingTab";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import type { TableColumn } from "../../../components/Table";
import SwitchButton from "../../../components/Switch";
import { PII } from "../../../utils/Constants/data";
import { generateKey } from "../../../utils/Common/helpers";
import { Paper } from "@mui/material";
import { Text } from "../../../components/Text";
import toast from "react-hot-toast";

const extractAllKeys = (obj: unknown, prefix: string = ''): string[] => {
    const keys: string[] = [];

    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const objRecord = obj as Record<string, unknown>;
        for (const key in objRecord) {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            if (typeof objRecord[key] !== 'object' || objRecord[key] === null) {
                keys.push(fullPath);
            } else {
                keys.push(...extractAllKeys(objRecord[key], fullPath));
            }
        }
    } else if (Array.isArray(obj) && obj.length > 0) {
        const arrayPath = prefix ? `${prefix}[0]` : '[0]';
        if (typeof obj[0] === 'object' && obj[0] !== null) {
            keys.push(...extractAllKeys(obj[0], arrayPath));
        } else {
            keys.push(arrayPath);
        }
    }

    return keys;
};

const useConfigController = () => {

    const data = useMemo(() => {
        try {
            return extractData('mask_config', LocalStorage, true)
        } catch {
            return null
        }
    }, [])

    const { enablePreviousTab, enableNextTab } = useMaskingTab()

    const [getPayload, { isFetching: sampleLoader }] = useLazyGetSamplePayloadQuery()
    const [payload, setPayload] = useState<string | null>(null)
    const [payloadKeys, setPayloadKeys] = useState<string[]>([])
    const [piiStates, setPiiStates] = useState<Record<string, boolean>>({})
    const [tokenizedValues, setTokenizedValues] = useState<Record<string, string>>({})

    const handleNext = () => {
        enableNextTab()
    }

    const handlePrevious = () => {
        enablePreviousTab()
    }

    const isPIIField = (key: string): boolean => {
        const lowerCaseKey = key.toLowerCase();
        const lowerCasePII = PII.map(p => p.toLowerCase());

        if (lowerCasePII.includes(lowerCaseKey)) {
            return true;
        }

        const lastKey = key.split('.').pop()?.toLowerCase() || '';
        return lowerCasePII.includes(lastKey);
    }

    const getData = useCallback(() => {
        if (!data?.txtp || !data?.txtpVersion) return
        getPayload({ type: data.txtp, version: data.txtpVersion })
            .unwrap()
            .then((res) => {
                setPayload(JSON.stringify(res, null, 4))
                const keys = extractAllKeys(res)
                setPayloadKeys(keys)

                const initialStates: Record<string, boolean> = {}
                const initialTokens: Record<string, string> = {}
                keys.forEach(key => {
                    initialStates[key] = isPIIField(key)
                    initialTokens[key] = generateKey(key)
                })
                setPiiStates(initialStates)
                setTokenizedValues(initialTokens)
            })
            .catch(() => {
                setPayload(null)
                setPayloadKeys([])
                setPiiStates({})
                setTokenizedValues({})
                toast.error('Failed to load sample payload')
            })
    }, [data?.txtp, data?.txtpVersion, getPayload])

    useEffect(() => {
        getData()
    }, [getData])

    const fetchJson = () => {
        getData()
    }

    const handleTogglePII = useCallback((fieldName: string) => {
        setPiiStates(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }))
    }, [])

    const columns: TableColumn[] = useMemo(() => [
        { label: "Field Name", key: "field_name" },
        {
            label: "Tokenize",
            key: "tokenize",
            render: (row: Record<string, unknown>) => (
                <SwitchButton
                    checked={row.is_pii as boolean}
                    onChange={() => handleTogglePII(row.field_name as string)}
                />
            )
        },
        {
            label: "Tokenized Value",
            key: "tokenized",
            render: (row: Record<string, unknown>) => {
                const isPii = row.is_pii as boolean;
                return (
                    <Paper
                        variant="outlined"
                        sx={{
                            display: 'inline-block',
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.5,
                            bgcolor: isPii ? '#f0fdf4' : '#f9fafb',
                            borderColor: isPii ? '#bbf7d0' : '#e5e7eb',
                        }}
                    >
                        <Text
                            size="sub"
                            sx={{
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                color: isPii ? '#166534' : '#6b7280'
                            }}
                        >
                            {row.tokenized as string}
                        </Text>
                    </Paper>
                );
            }
        },
    ], [handleTogglePII])

    const tableData = useMemo(() =>
        payloadKeys.map(key => ({
            field_name: key,
            is_pii: piiStates[key] ?? false,
            tokenized: piiStates[key] ? tokenizedValues[key] : 'Not Tokenized'
        })),
        [payloadKeys, piiStates, tokenizedValues]
    );

    const summary = useMemo(() => {
        const totalFields = payloadKeys.length;
        const tokenizedFields = Object.values(piiStates).filter(Boolean).length;
        return { totalFields, tokenizedFields };
    }, [payloadKeys, piiStates]);

    return {
        values: {
            payload,
            columns,
            sampleLoader,
            txtp: data?.txtp,
            data: tableData,
            summary
        },
        functions: {
            fetchJson,
            handleNext,
            handlePrevious
        }
    }
}

export default useConfigController;