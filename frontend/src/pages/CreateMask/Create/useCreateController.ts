import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { DropdownOption } from "../../../components/DropDown";
import { useMaskingTab } from "../../../contexts/MaskingTabContext";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../../redux/Api/Config";
import { LocalStorage } from "../../../utils/Common/enums";
import { insertData } from "../../../utils/Common/storage";
import { useCreateMaskingMutation } from "../../../redux/Api/Masking";

interface MaskFormValues {
    txtp: { label: string, value: string } | null;
    txtpVersion: { label: string, value: string } | null;
}

interface CreateControllerProps {
    mode?: string | null;
    id?: string;
    maskData?: Record<string, unknown>;
}

const useCreateController = ({ mode, maskData }: CreateControllerProps = {}) => {

    const [versions, setVersions] = useState<string[]>([])
    const [versionsLoading, setVersionsLoading] = useState(false)

    const { data: types, isLoading } = useGetTypesQuery({})
    const [getVersions] = useLazyGetTxtpVersionsQuery()
    const [submit, { isLoading: createLoading }] = useCreateMaskingMutation()

    const { enableNextTab } = useMaskingTab()

    const initial: MaskFormValues = {
        txtp: null,
        txtpVersion: null,
    };

    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue
    } = useForm<MaskFormValues>({
        defaultValues: initial
    })

    const getTxtpVersions = useCallback((type: string | number) => {
        setVersionsLoading(true)
        getVersions({ type }).unwrap()
            .then((res) => {
                if (res) {
                    setVersions(res)
                }
            })
            .catch(() => {
                toast.error('Failed to load transaction type versions')
            })
            .finally(() => {
                setVersionsLoading(false)
            })
    }, [getVersions])

    // Pre-populate form fields in edit mode when mask data is available
    useEffect(() => {
        if (mode === 'edit' && maskData?.txtp) {
            const txtp = maskData.txtp as string;
            const txtpVersion = maskData.txtp_version as string;
            setValue('txtp', { label: txtp, value: txtp });
            if (txtpVersion) {
                setValue('txtpVersion', { label: txtpVersion, value: txtpVersion });
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            getTxtpVersions(txtp);

            const updateLocalStorageMask = {
                txtp: maskData.txtp,
                txtpVersion: maskData.txtp_version,
                id: maskData.id,
            }
            insertData(updateLocalStorageMask, 'mask_config', LocalStorage, true);
        }
    }, [mode, maskData])

    const handleTxTp = (val: DropdownOption) => {
        setValue('txtp', val as { label: string, value: string })
        setValue('txtpVersion', null)
        if (val?.value) {
            getTxtpVersions(val?.value)
        }
    }

    const onSubmit = async (values: MaskFormValues) => {
        if (mode === 'edit') {
            // txtp/txtpVersion are read-only in edit mode — just proceed to the next tab
            enableNextTab()
            return;
        }

        const payload = {
            txtp: values?.txtp?.value,
            txtpVersion: values?.txtpVersion?.value,
        }

        try {
            const res = await submit(payload).unwrap()
            insertData({ ...payload, id: res.id }, 'mask_config', LocalStorage, true)
            toast.success('Configuration Successfully Created')
            enableNextTab()
        } catch {
            toast.error('Failed to create configuration')
        }
    }


    return {
        values: {
            control,
            errors,
            mode,
            transactions: (types as { transaction_type: string; endpoint_path: string }[] | undefined)
                ?.reduce((acc: { label: string; value: string }[], item) => {
                    if (!acc.some(t => t.value === item.transaction_type)) {
                        acc.push({ label: item.transaction_type, value: item.transaction_type });
                    }
                    return acc;
                }, []) || [],
            txtpVersions: versions?.map((item: string) => ({ label: item, value: item })) || [],
            createLoading,
            versionsLoading,
            isLoading
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            handleTxTp
        },
    }
}

export default useCreateController;
