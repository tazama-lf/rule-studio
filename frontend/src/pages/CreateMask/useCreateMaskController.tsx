import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useMaskingTab } from "../../contexts/MaskingTabContext"
import { useGetMaskByIdQuery } from "../../redux/Api/Masking"
import { extractData } from "../../utils/Common/storage"
import Create from "./Create"
import Configure from "./Configure"

const useCreateMaskController = () => {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null
    const id = searchParams.get('id') ?? undefined

    const { data, isFetching: isLoading } = useGetMaskByIdQuery({ id }, { skip: !id, refetchOnMountOrArgChange: true })
    console.log('Fetched mask data:', data)
    const { selectedTab } = useMaskingTab()

    const user = extractData('user')

    const renderComponent = useCallback(() => {
        switch (selectedTab) {
            case 'create':
                return <Create mode={mode} id={id} maskData={data as Record<string, unknown> | undefined} />
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
            data,
            user
        },
        functions: {
            renderComponent
        }
    }
}

export default useCreateMaskController
