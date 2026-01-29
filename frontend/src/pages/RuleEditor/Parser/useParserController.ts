import { useCallback, useEffect, useMemo, useState } from "react";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { useGetGlobalVariablesQuery } from "../../../redux/Api/Rule-builder";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { samplePayload } from "../../../utils/Constants/data";


export interface IParseProps {
    data?: Record<string, unknown> | undefined,
    mode: string | null
}

const useParserController = (props: IParseProps) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const { enableNextTab, enablePreviousTab } = useTab()

    const { mode } = props

    const isEdit = mode === 'edit'
    const isView = mode === 'view'

    const [getPayload, { isFetching: sampleLoader }] = useLazyGetSamplePayloadQuery()
    const { data: globalVariables } = useGetGlobalVariablesQuery(data?.id, { refetchOnMountOrArgChange: true })
    const [payload, setPayload] = useState<string | null>(null)

    const handleNext = () => {
        enableNextTab()
    }

    const handlePrevious = () => {
        enablePreviousTab()
    }

    const getData = useCallback(() => {
        getPayload({ type: data.txtp })
            .unwrap()
            .then((res) => {
                setPayload(JSON.stringify(res, null, 4))
            })
    }, [data?.txtp, getPayload])

    useEffect(() => {
        if (!data?.txtp) return
        getData()
    }, [data?.txtp])

    const fetchJson = () => {
        getData()
    }

    return {
        values: {
            payload: JSON.stringify(samplePayload, null, 2),
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
