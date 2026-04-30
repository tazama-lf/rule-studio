import { useCallback, useEffect, useMemo, useState } from "react";
import { useMaskingTab } from "../../../contexts/MaskingTabContext/useMaskingTab";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import type { TableColumn } from "../../../components/Table";
import SwitchButton from "../../../components/Switch";
import { PII, Status } from "../../../utils/Constants/data";
import { generateKey } from "../../../utils/Common/helpers";
import { Paper } from "@mui/material";
import { Text } from "../../../components/Text";
import toast from "react-hot-toast";
import { useUpdateMaskMutation, useGetMaskByIdQuery } from "../../../redux/Api/Masking";
import { useModal } from "../../../contexts/ModalContext";
import SubmitMasking from "../Modals/SubmitMasking";

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
    const { open } = useModal()

    const { data: maskRecord } = useGetMaskByIdQuery({ id: data?.id }, { skip: !data?.id })

    const [getPayload, { isFetching: sampleLoader }] = useLazyGetSamplePayloadQuery()
    const [ , { isLoading: updateLoading }] = useUpdateMaskMutation()

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

    useEffect(() => {
        if (!maskRecord || payloadKeys.length === 0) return
        const existingTokenize = (maskRecord as Record<string, unknown>)
            ?.tokenize as Record<string, boolean> | undefined
        if (!existingTokenize || Object.keys(existingTokenize).length === 0) return

        setPiiStates(prev => {
            const updated = { ...prev }
            payloadKeys.forEach(key => {
                if (key in existingTokenize) {
                    updated[key] = existingTokenize[key]
                }
            })
            return updated
        })
    }, [maskRecord, payloadKeys])

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


    const onSubmit = async () => {
        const totalFields = payloadKeys.length
        const fieldsMasked = Object.values(piiStates).filter(Boolean).length

        const payload = {
            txtp: data?.txtp,
            txtp_version: data?.txtpVersion,
            tokenize: piiStates,
            total_fields: totalFields,
            fields_masked: fieldsMasked,
            status: Status.STATUS_03_UNDER_REVIEW
        }

        open('Submit for Approval', <SubmitMasking id={data.id} payload={payload} />, null, { maxWidth: 'md' })
    }

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

        const hasUncheckedPIIFields = payloadKeys.some(key => {
            const shouldBePII = isPIIField(key);
            const isMarkedAsPII = piiStates[key] ?? false;
            return shouldBePII && !isMarkedAsPII;
        });

        const allFieldsOff = totalFields > 0 && tokenizedFields === 0;

        const status = (hasUncheckedPIIFields || allFieldsOff) ? { message: 'Warning: Check Sensitive Fields', bgColor: 'theme.creamy', textColor: '#92400e' } : { message: 'All fields tokenized', bgColor: '#bbf7d0', textColor: '#166534' };

        return { totalFields, tokenizedFields, status };
    }, [payloadKeys, piiStates]);

    return {
        values: {
            payload,
            columns,
            sampleLoader,
            txtp: data?.txtp,
            data: tableData,
            summary,
            updateLoading,
        },
        functions: {
            onSubmit,
            fetchJson,
            handleNext,
            handlePrevious
        }
    }
}

export default useConfigController;