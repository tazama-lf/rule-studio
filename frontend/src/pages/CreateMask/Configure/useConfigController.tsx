import { useCallback, useEffect, useMemo, useState } from "react";
import { useMaskingTab } from "../../../contexts/MaskingTabContext/useMaskingTab";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import type { TableColumn } from "../../../components/Table";
import SwitchButton from "../../../components/Switch";
import { PII } from "../../../utils/Constants/data";

const extractAllKeys = (obj: any, prefix: string = ''): string[] => {
    const keys: string[] = [];

    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const key in obj) {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] !== 'object' || obj[key] === null) {
                keys.push(fullPath);
            } else {
                keys.push(...extractAllKeys(obj[key], fullPath));
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

    const handleNext = () => {
        enableNextTab()
    }

    const handlePrevious = () => {
        enablePreviousTab()
    }

    const getData = useCallback(() => {
        if (!data?.txtp) return
        getPayload({ type: data.txtp, version: data.txtpVersion })
            .unwrap()
            .then((res) => {
                setPayload(JSON.stringify(res, null, 4))
                const keys = extractAllKeys(res)
                setPayloadKeys(keys)
            })
            .catch(() => {
                setPayload(null)
                setPayloadKeys([])
            })
    }, [data, getPayload])

    useEffect(() => {
        if (!data?.txtp) return
        getData()
    }, [data?.txtp, getData])

    const fetchJson = () => {
        getData()
    }

    const columns: TableColumn[] = [
        { label: "Field Name", key: "field_name" },
        {
            label: "Tokenize",
            key: "tokenize",
            render: (row: Record<string, unknown>) => (
                <SwitchButton checked={row.is_pii as boolean} />
            )
        },
        { label: "Tokenized Value", key: "tokenized" },
    ]

    const isPIIField = (key: string): boolean => {
        const lowerCaseKey = key.toLowerCase();
        const lowerCasePII = PII.map(p => p.toLowerCase());
        
        // Check if the full key matches any PII entry
        if (lowerCasePII.includes(lowerCaseKey)) {
            return true;
        }
        
        // For nested keys, extract the last part and check
        const lastKey = key.split('.').pop()?.toLowerCase() || '';
        return lowerCasePII.includes(lastKey);
    }

    const tableData = payloadKeys.map(key => ({ 
        field_name: key,
        is_pii: isPIIField(key)
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
