import { useCallback, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useMaskingTab } from "../../contexts/MaskingTabContext/useMaskingTab"
import { useGetRuleByIdQuery } from "../../redux/Api/Rules"
import { LocalStorage } from "../../utils/Common/enums"
import { extractData, insertData } from "../../utils/Common/storage"
import Create from "./Create"
import Configure from "./Configure"

const useCreateMaskController = () => {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    const { selectedTab } = useMaskingTab()

    const user = extractData('user')

    const renderComponent = useCallback(() => {
        switch (selectedTab) {
            case 'create':
                return <Create />
            case 'configure':
                return <Configure />
            default:
                return null;
        }
    }, [selectedTab, mode])

    return {
        values: {
            mode,
            user
        },
        functions: {
            renderComponent
        }
    }
}

export default useCreateMaskController
