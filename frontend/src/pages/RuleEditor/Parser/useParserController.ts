import { useCallback, useEffect, useMemo, useState } from "react";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { useGetGlobalVariablesQuery } from "../../../redux/Api/Rule-builder";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";


export interface IParseProps {
    data?: Record<string, unknown> | undefined,
    mode: string | null
}

const useParserController = (props: IParseProps) => {

    const data = useMemo(
        () => props.data ?? extractData('trs_rule', LocalStorage, true),
        [props.data]
    )

    const { enablePreviousTab, enableNextTab } = useTab()

    const { mode } = props

    const isEdit = mode === 'edit'
    const isView = mode === 'view'

    const [getPayload, { isFetching: sampleLoader }] = useLazyGetSamplePayloadQuery()
    const { data: globalVariables } = useGetGlobalVariablesQuery(data?.id, { skip: !data?.id, refetchOnMountOrArgChange: true })
    const [payload, setPayload] = useState<string | null>(null)

    const handleNext = () => {
        // navigate(`/rule-builder/${data?.id}`)
        enableNextTab()
    }

    const handlePrevious = () => {
        enablePreviousTab()
    }

    const getData = useCallback(() => {
        if (!data?.txtp) return
        getPayload({ type: data.txtp, version: data.txtp_version })
            .unwrap()
            .then((res) => {
                setPayload(JSON.stringify(res, null, 4))
            })
            .catch((error) => {
                console.error('Failed to fetch sample payload:', error)
                setPayload(null)
            })
    }, [data, getPayload])

    useEffect(() => {
        if (!data?.txtp) return
        getData()
    }, [data?.txtp, getData])

    const fetchJson = () => {
        getData()
    }

    return {
        values: {
            payload,
            sampleLoader,
            txtp: data?.txtp,
            isEdit,
            isView,
            ruleRequest: globalVariables?.RuleRequest
        },
        functions: {
            fetchJson,
            handleNext,
            handlePrevious
        }
    }
}

export default useParserController;
