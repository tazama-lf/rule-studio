import { useEffect } from "react"
import usePagination from "./usePagination"
import useDebouncedSearch from "./useDebouncedSearch"

interface UseFiltersOptions {
    default_offset?: number
    default_limit?: number
    search_delay?: number
    initial_search?: string
}

const useFilters = ({
    default_offset = 0,
    default_limit = 10,
    search_delay = 500,
    initial_search = "",
}: UseFiltersOptions = {}) => {
    const {
        offset,
        limit,
        setOffset,
        setLimit,
        getPaginationParams,
        resetPagination,
    } = usePagination({ default_offset, default_limit })

    const [search, debouncedSearch, setSearch] = useDebouncedSearch(
        initial_search,
        search_delay
    )

    useEffect(() => {
        setOffset(default_offset)
    }, [debouncedSearch, setOffset, default_offset])

    return {
        search,
        debouncedSearch,
        setSearch,
        offset,
        limit,
        setOffset,
        setLimit,
        getPaginationParams,
        resetPagination,
    }
}

export default useFilters
