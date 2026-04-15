import { useCallback, useEffect, useMemo, useState } from "react";
import { useMaskingTab } from "../../../contexts/MaskingTabContext/useMaskingTab";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import type { TableColumn } from "../../../components/Table";
import SwitchButton from "../../../components/Switch";
import { PII } from "../../../utils/Constants/data";

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
        keys.push(...extractAllKeys(obj[0], arrayPath));
    }

    return keys;
};

const useConfigController = () => {

    const data = useMemo(() => extractData('mask_config', LocalStorage, true), [])

    const { enablePreviousTab, enableNextTab } = useMaskingTab()

    const [getPayload, { isFetching: sampleLoader }] = useLazyGetSamplePayloadQuery()
    const [payload, setPayload] = useState<string | null>(null)
    const [payloadKeys, setPayloadKeys] = useState<string[]>([])
    const [piiStates, setPiiStates] = useState<Record<string, boolean>>({})

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
        if (!data?.txtp) return
        getPayload({ type: data.txtp, version: data.txtpVersion })
            .unwrap()
            .then((res) => {
                setPayload(JSON.stringify(res, null, 4))
                const keys = extractAllKeys(res)
                setPayloadKeys(keys)

                const initialStates: Record<string, boolean> = {}
                keys.forEach(key => {
                    initialStates[key] = isPIIField(key)
                })
                setPiiStates(initialStates)
            })
            .catch(() => {
                setPayload(null)
                setPayloadKeys([])
                setPiiStates({})
            })
    }, [data, getPayload])

    useEffect(() => {
        if (!data?.txtp) return
        getData()
    }, [data?.txtp, getData])

    const fetchJson = () => {
        getData()
    }

    const handleTogglePII = (fieldName: string) => {
        setPiiStates(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }))
    }

    const columns: TableColumn[] = [
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
        { label: "Tokenized Value", key: "tokenized" },
    ]

    const tableData = payloadKeys.map(key => ({
        field_name: key,
        is_pii: piiStates[key] ?? false
    }))

 
    return {
        values: {
            payload,
            columns,
            sampleLoader,
            txtp: data?.txtp,
            data: tableData
        },
        functions: {
            fetchJson,
            handleNext,
            handlePrevious
        }
    }
}

export default useConfigController;
