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
        getAllSimulations: builder.query({
            query: ({ offset = 0, limit = 10 }) => ({
                url: `/all`,
                method: "GET",
                params: { offset, limit },
            }),
        }),
        getSimulationStats: builder.query({
            query: ({ sim, iteration_no }: { sim: string; iteration_no: string }) => ({
                url: `/get_simulation_stats`,
                method: "GET",
                params: { sim, iteration_no },
            }),
        }),
        getSimulationResults: builder.query({
            query: ({
                sim,
                iteration_no,
                limit = 10,
                offset = 0,
                msg_id,
                msg_type,
                outcome,
            }: {
                sim: string;
                iteration_no: string;
                limit?: number;
                offset?: number;
                msg_id?: string;
                msg_type?: string;
                outcome?: string;
            }) => ({
                url: `/get_simulation_results`,
                method: "GET",
                params: {
                    sim,
                    iteration_no,
                    limit,
                    offset,
                    ...(msg_id ? { msg_id } : {}),
                    ...(msg_type ? { msg_type } : {}),
                    ...(outcome ? { outcome } : {}),
                },
            }),
        }),
    }),
})

export const {
    useLazyGetExcludedTypesQuery,
    useGetAllSimulationsQuery,
    useLazyGetAllSimulationsQuery,
    useLazyGetSimulationStatsQuery,
    useLazyGetSimulationResultsQuery,
} = ruleSimulationApi
