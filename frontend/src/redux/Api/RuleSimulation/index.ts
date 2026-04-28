import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL

export const ruleSimulationApi = createApi({
    reducerPath: 'ruleSimulationApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/simulation/api`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            headers.set("Content-Type", "application/json")
            headers.set("Accept", "application/json")
            return headers
        }
    }),
    endpoints: (builder) => ({
        getExcludedTypes: builder.query({
            query: () => ({
                url: `/excluded/types`,
                method: "GET",
            }),
        }),
    }),
})

export const {
    useLazyGetExcludedTypesQuery
} = ruleSimulationApi
