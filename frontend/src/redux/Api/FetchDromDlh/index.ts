import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL

export const fetchFromDlhApi = createApi({
    reducerPath: 'fetchFromDlhApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/fetch-from-dlh`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            headers.set("Content-Type", "application/json")
            headers.set("Accept", "application/json")
            return headers
        }
    }),
    endpoints: (builder) => ({
        getDlhCount: builder.mutation({
            query: (body) => ({
                url: `/api/count`,
                method: "POST",
                body: { ...body },
            }),
        }),
    }),
})

export const {
    useGetDlhCountMutation
} = fetchFromDlhApi
