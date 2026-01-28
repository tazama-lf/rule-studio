import { useState } from "react"

interface UsePaginationOptions {
    default_offset?: number
    default_limit?: number
}

interface PaginationParams {
    offset: number
    limit: number
}

const usePagination = ({
    default_offset = 0,
    default_limit = 10,
}: UsePaginationOptions = {}) => {
    const [offset, setOffset] = useState<number>(default_offset)
    const [limit, setLimit] = useState<number>(default_limit)

    const getPaginationParams = (): PaginationParams => ({
        offset,
        limit,
    })

    const resetPagination = (): void => {
        setOffset(default_offset)
        setLimit(default_limit)
    }

    return {
        offset,
        limit,
        setOffset,
        setLimit,
        getPaginationParams,
        resetPagination,
    }
}

export default usePagination
