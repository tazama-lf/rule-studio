import { useCallback, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useMaskingTab } from "../../contexts/MaskingTabContext"
import { useGetRuleByIdQuery } from "../../redux/Api/Rules"
import { LocalStorage } from "../../utils/Common/enums"
import { extractData, insertData } from "../../utils/Common/storage"
import Create from "./Create"
import Configure from "./Configure"

const useCreateMaskController = () => {

    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    const { data, isFetching: isLoading, isSuccess } = useGetRuleByIdQuery({ id }, { skip: !id, refetchOnMountOrArgChange: true })
    const { selectedTab } = useMaskingTab()

    const user = extractData('user')

    useEffect(() => {
        if (isSuccess && data?.rules) {
            insertData(data.rules, 'trs_rule', LocalStorage, true)
        }
    }, [isSuccess, data])

    const renderComponent = useCallback(() => {
        switch (selectedTab) {
            case 'create':
                return <Create />
            case 'configure':
                return <Configure />
            default:
                return null;
        }
    }, [selectedTab, data, mode])

    return {
        values: {
            isLoading,
            mode,
            data: data?.rules,
            user
        },
        functions: {
            renderComponent
        }
    }
}

export default useCreateMaskController
