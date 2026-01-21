import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const ruleBuilderApi = createApi({
    reducerPath: 'ruleBuilderApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("Authorization", `Bearer ${token}`)
            return headers
        }
    }),
    endpoints: (builder) => ({
        getNodes: builder.query({
            query: () => ({
                url: `nodes?category=rule_builder`,
                method: "GET",
            }),
        }),
        getFlow: builder.query({
            query: (ruleId: string | number) => ({
                url: `rules/api/${ruleId}/flow`,
                method: "GET",
            }),
        }),
        saveFlow: builder.mutation({
            query: ({ ruleId, flowData }: { ruleId: string | number; flowData: unknown }) => ({
                url: `rules/api/${ruleId}/flow`,
                method: "PUT",
                body: flowData,
            }),
        }),
        getGlobalVariables: builder.query({
            query: (ruleId: string) => ({
                url: `rules/api/global-variables/${ruleId}`,
                method: "GET",
            }),
        }),
    }),
})

export const {
    useGetNodesQuery,
    useGetFlowQuery,
    useSaveFlowMutation,
    useGetGlobalVariablesQuery,
} = ruleBuilderApi
