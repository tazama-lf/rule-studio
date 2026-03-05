import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL

export const logsApi = createApi({
    reducerPath: 'logsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            headers.set("Content-Type", "application/json")
            headers.set("Accept", "application/json")
            return headers
        }
    }),
    endpoints: (builder) => ({
        getSimulationLogs: builder.query({
            query: ({ ruleId }) => ({
                url: `/simulation-logs/${ruleId}`,
                method: "GET",
            }),
        }),
        addSimulationlogs: builder.mutation({
            query: ({ body, id }) => ({
                url: `/simulation-logs/insert/${id}`,
                method: "POST",
                body: { ...body },
            }),
        }),
    }),
})

export const {
    useGetSimulationLogsQuery,
    useAddSimulationlogsMutation
} = logsApi
