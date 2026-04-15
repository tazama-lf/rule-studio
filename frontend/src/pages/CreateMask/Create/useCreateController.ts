import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { DropdownOption } from "../../../components/DropDown";
import { useMaskingTab } from "../../../contexts/MaskingTabContext/useMaskingTab";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../../redux/Api/Config";
import { LocalStorage } from "../../../utils/Common/enums";
import { insertData } from "../../../utils/Common/storage";
import { useCreateMaskingMutation } from "../../../redux/Api/Masking";

interface MaskFormValues {
    txtp: { label: string, value: string } | null;
    txtpVersion: { label: string, value: string } | null;
}

const useCreateController = () => {

    const [versions, setVersions] = useState<string[]>([])

    const { data: types, isLoading } = useGetTypesQuery({})
    const [getVersions] = useLazyGetTxtpVersionsQuery()
    const [submit, { isLoading: createLoading }] = useCreateMaskingMutation()

    const { enableNextTab } = useMaskingTab()

    const initial: MaskFormValues = {
        txtp: null,
        txtpVersion: null,
    };

    const getTxtpVersions = useCallback((type: string | number) => {
        getVersions({ type }).unwrap()
            .then((res) => {
                if (res) {
                    setVersions(res)
                }
            })
            .catch(() => {
                toast.error('Failed to load transaction type versions')
            })
    }, [getVersions])

    const handleTxTp = (val: DropdownOption) => {
        setValue('txtp', val as { label: string, value: string })
        setValue('txtpVersion', null)
        if (val?.value) {
            getTxtpVersions(val?.value)
        }
    }

    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue
    } = useForm<MaskFormValues>({
        defaultValues: initial
    })


    const onSubmit = async (values: MaskFormValues) => {
        const payload = {
            txtp: values?.txtp?.value,
            txtpVersion: values?.txtpVersion?.value,
        }

        await submit(payload).unwrap()

        insertData(payload, 'mask_config', LocalStorage, true)
        toast.success('Configuration Successfully Created')

        enableNextTab()
    }


    return {
        values: {
            control,
            errors,
            transactions: (types as { transaction_type: string; endpoint_path: string }[] | undefined)
                ?.reduce((acc: { label: string; value: string }[], item) => {
                    if (!acc.some(t => t.value === item.transaction_type)) {
                        acc.push({ label: item.transaction_type, value: item.transaction_type });
                    }
                    return acc;
                }, []) || [],
            txtpVersions: versions?.map((item: string) => ({ label: item, value: item })) || [],
            createLoading,
            isLoading
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            handleTxTp
        },
    }
}

export default useCreateController;
