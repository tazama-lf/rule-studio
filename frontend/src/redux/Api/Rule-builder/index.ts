import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";
import type { QueryExecutionRequest, QueryExecutionResponse } from "../../../types/queryExecution";

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
            query: (category: string = 'rule_builder') => ({
                url: `nodes?category=${category}`,
                method: "GET",
            }),
        }),
        getFlow: builder.query({
            query: ({ ruleId, category = 'rule_builder' }: { ruleId: string | number; category?: string }) => ({
                url: `rules/api/${ruleId}/flow?category=${category}`,
                method: "GET",
            }),
        }),
        saveFlow: builder.mutation({
            query: ({ ruleId, flowData, category = 'rule_builder' }: { ruleId: string | number; flowData: unknown; category?: string }) => ({
                url: `rules/api/${ruleId}/flow`,
                method: "PUT",
                body: { ...(flowData as Record<string, unknown>), category },
            }),
        }),
        getGlobalVariables: builder.query({
            query: (ruleId: string) => ({
                url: `rules/api/global-variables/${ruleId}`,
                method: "GET",
            }),
        }),
        executeQuery: builder.mutation<QueryExecutionResponse, QueryExecutionRequest>({
            query: (queryData: QueryExecutionRequest) => ({
                url: `nodes/execute-query`,
                method: "POST",
                body: queryData,
            }),
        }),
        getRuleFlowStatus: builder.query({
            query: ({ ruleId, category = 'rule_builder' }: { ruleId: string | number; category?: string }) => ({
                url: `rules/api/${ruleId}/flow/status?category=${category}`,
                method: "GET",
            }), 
        })
    }),
})

export const {
    useGetNodesQuery,
    useGetFlowQuery,
    useSaveFlowMutation,
    useGetGlobalVariablesQuery,
    useExecuteQueryMutation,
    useGetRuleFlowStatusQuery
} = ruleBuilderApi
