import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useMaskingTab } from "../../contexts/MaskingTabContext/useMaskingTab"
import { extractData } from "../../utils/Common/storage"
import Configure from "./Configure"
import Create from "./Create"

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
