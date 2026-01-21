import { useForm } from "react-hook-form";
import { useParsePayloadMutation } from "../../../redux/Api/Parse";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { useEffect, useState } from "react";
import type { IResult } from "../../../utils/Common/types";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useGetGlobalVariablesQuery } from "../../../redux/Api/Rule-builder";


export interface IParseProps {
    data?: Record<string, unknown> | undefined,
    mode: string | null
}

const useParserController = (props: IParseProps) => {

    const data = extractData('trs_rule', LocalStorage, true) ?? props?.data
    const { enableNextTab } = useTab()

    const { mode } = props

    const isEdit = mode === 'edit'
    const isView = mode === 'view'

    const [submit, { data: parseBody, isLoading, isSuccess }] = useParsePayloadMutation()
    const [getPayload, { isFetching: sampleLoader }] = useLazyGetSamplePayloadQuery()
    const { data: globalVariables } = useGetGlobalVariablesQuery(data?.id, { refetchOnMountOrArgChange: true, skip: !(isView || isEdit) })
    const [result, setResult] = useState<IResult | null>(null)

    const initial = {
        payload: (data?.payload as string) || "",
    }

    const { handleSubmit, control, watch, setValue } = useForm({ defaultValues: initial })
    // eslint-disable-next-line react-hooks/incompatible-library
    const json = watch('payload')

    const onSubmit = () => {
        submit(JSON.parse(json)).unwrap()
    }

    const handleNext = () => {
        enableNextTab()
    }

    useEffect(() => {
        if (isSuccess) {
            setResult(parseBody)
        }
    }, [isSuccess, parseBody])

    const getData = () => {
        getPayload({ type: data?.txtp }).unwrap().then((res) => {
            if (res) {
                setValue('payload', JSON.stringify(res, null, 4))
            }
        })
    }

    useEffect(() => {
        if (isView || isEdit) {
            getData()
        }
    }, [isView, isEdit])

    const fetchJson = () => {
        getData()
    }
    
    return {
        values: {
            control,
            json,
            result,
            isLoading,
            sampleLoader,
            txtp: data?.txtp,
            isEdit,
            isView,
            ruleRequest: globalVariables?.RuleRequest
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            fetchJson,
            handleNext
        }
    }
}

export default useParserController;
