import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { DropdownOption } from "../../../components/DropDown";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useGetTypesQuery, useLazyGetTxtpVersionsQuery } from "../../../redux/Api/Config";
import { useCloneRuleMutation, useCreateRuleMutation } from "../../../redux/Api/Rules";
import { LocalStorage } from "../../../utils/Common/enums";
import { toDropdown } from "../../../utils/Common/helpers";
import { extractData, insertData } from "../../../utils/Common/storage";
import { ruleTypes } from "../../../utils/Constants/data";
import { createRuleSchema } from "../../../validation/schemas";
import RuleConfig from "../Modals/RuleConfig";
import ViewNetworkMap from "../Modals/ViewNetworkMap";

interface RuleFormValues {
    rule_name: string;
    description: string;
    txtp: { label: string, value: string } | null;
    txtpVersion: { label: string, value: string } | null;
    version: string;
    rule_config_id: { label: string, value: string } | null;
    rule_type: { label: string, value: string } | null;
}

export interface IOverviewProps {
    data?: Record<string, unknown> | undefined,
    mode: string | null,
}

const useOverviewController = (props: IOverviewProps) => {

    const data = extractData('trs_rule', LocalStorage, true) ?? props?.data
    const { enableNextTab } = useTab()
    const { mode } = props
    const [versions, setVersions] = useState<string[]>([])

    const { data: types, isLoading } = useGetTypesQuery({})
    const [submit, { isLoading: createLoading }] = useCreateRuleMutation()
    const [clone, { isLoading: cloneLoading }] = useCloneRuleMutation()
    const [getVersions] = useLazyGetTxtpVersionsQuery()

    const { open } = useModal()
    const user = extractData('user') || {}

    const initial: RuleFormValues = {
        rule_name: (data?.rule_name as string) ?? '',
        description: (data?.description as string) ?? '',
        txtp: toDropdown(data?.txtp as string) as { label: string, value: string } | null,
        txtpVersion: toDropdown(data?.txtp_version as string) as { label: string, value: string } | null,
        version: (data?.version as string) ?? '',
        rule_config_id: toDropdown(data?.rule_config_id as string) as { label: string, value: string } | null,
        rule_type: toDropdown(data?.rule_type as string) as { label: string, value: string } | null,
    };


    const shouldValidate = mode === "clone" || !mode

    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        getValues
    } = useForm<RuleFormValues>({
        defaultValues: initial,
        resolver: shouldValidate ? yupResolver(createRuleSchema) : undefined,
    })

    const onSubmit = (values: RuleFormValues) => {
        const payload = {
            description: values?.description,
            version: values?.version,
            txtp: values?.txtp?.value,
            rule_config_id: values?.rule_config_id?.value,
            rule_type: values?.rule_type?.value,
            txtpVersion: values?.txtpVersion?.value,
        }

        if (mode === 'clone') {
            clone({ id: data?.id, body: payload }).unwrap()
                .then((res) => {
                    insertData(res, 'trs_rule', LocalStorage, true)
                    toast.success('Rule Successfully Cloned')
                    enableNextTab()
                })
                .catch((error) => {
                    toast.error(error?.data?.message || 'Failed to clone rule')
                })
        } else {
            submit(payload).unwrap()
                .then((res) => {
                    insertData(res, 'trs_rule', LocalStorage, true)
                    toast.success('Rule Successfully Created')
                    enableNextTab()
                })
                .catch((error) => {
                    toast.error(error?.data?.message || 'Failed to create rule')
                })
        }
    }

    const handleNext = () => {
        enableNextTab()
    }

    const handleRuleValue = (val: DropdownOption) => {
        setValue('rule_config_id', val as { label: string, value: string })
        const rule_no = val?.value?.toString().split('@')
        const tenantId = user?.tenantId ?? ''
        setValue('rule_name', `${tenantId}-rule-${rule_no?.[0]}`)
    }

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
    }, [])


    useEffect(() => {
        if (mode === 'clone' && data?.txtp_version) {
            getTxtpVersions(data?.txtp)
        }
    }, [mode, data?.txtp_version])

    const handleTxTp = (val: DropdownOption) => {
        setValue('txtp', val as { label: string, value: string })
        setValue('txtpVersion', null)
        if (val?.value) {
            getTxtpVersions(val?.value)
        }
    }

    const handleRuleConfig = () => {
        const currentRuleConfigId = getValues('rule_config_id')
        open(`${mode === 'view' ? 'View' : 'Select'} Rule Config`, <RuleConfig mode={mode} ruleConfigId={currentRuleConfigId?.value} handleRuleValue={handleRuleValue} />, null, { maxWidth: 'md' })
    }

    const handleNetworkMap = () => {
        open('View Network Map', <ViewNetworkMap />, null, { maxWidth: 'md' })
    }


    return {
        values: {
            control,
            isEdit: mode === 'edit' || mode == 'view',
            errors,
            isLoading,
            rule_config_id: getValues('rule_config_id'),
            createLoading,
            transactions: types?.map((item: string) => ({ label: item, value: item })) || [],
            txtpVersions: versions?.map((item: string) => ({ label: item, value: item })) || [],
            ruleTypes: ruleTypes.map(({ display, value }) => { return { label: display, value } }),
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            handleRuleConfig,
            handleNetworkMap,
            handleTxTp,
            handleNext
        }
    }
}

export default useOverviewController;
