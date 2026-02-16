import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const rulesApi = createApi({
    reducerPath: 'rulesApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/rules/api/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            return headers
        }
    }),
    tagTypes: ['rule'],
    endpoints: (builder) => ({
        getRules: builder.mutation({
            query: ({ body, params }) => ({
                url: `all`,
                method: "POST",
                body: { ...body },
                params,
            }),
        }),
        createRule: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body: { ...body },
            }),
            invalidatesTags: ['rule']
        }),
        cloneRule: builder.mutation({
            query: ({ id, body }) => ({
                url: `clone/${id}`,
                method: "POST",
                body
            }),
            invalidatesTags: ['rule']
        }),
        updateRule: builder.mutation({
            query: ({ id, body }) => ({
                url: `${id}`,
                method: "PUT",
                body: { ...body },
            }),
        }),
        updateStatus: builder.mutation({
            query: ({ id, body }) => ({
                url: `${id}/status`,
                method: "PUT",
                body: { ...body },
            }),
            invalidatesTags: ['rule']
        }),
        updateMetadata: builder.mutation({
            query: ({ id, body }) => ({
                url: `${id}/metadata`,
                method: "PUT",
                body: { ...body },
            }),
            invalidatesTags: ['rule']
        }),
        getRuleById: builder.query({
            query: ({ id }) => ({
                url: `${id}`,
                method: "GET",
                providesTags: ['rule']
            }),
        }),
        getRuleConfigsIds: builder.query({
            query: () => ({
                url: `ids`,
                method: "GET",
            }),
        }),
        getRuleConfig: builder.query({
            query: ({ id }) => ({
                url: `configuration/${id}`,
                method: "GET",
            }),
        }),
        getNetworkMap: builder.query({
            query: () => ({
                url: `network-map/active`,
                method: "GET",
            }),
        }),
        getStatus: builder.query({
            query: () => ({
                url: `status`,
                method: "GET",
            }),
        }),
    }),
})

export const {
    useGetRulesMutation,
    useGetRuleByIdQuery,
    useGetRuleConfigsIdsQuery,
    useLazyGetRuleConfigQuery,
    useGetNetworkMapQuery,
    useCreateRuleMutation,
    useGetStatusQuery,
    useUpdateRuleMutation,
    useUpdateStatusMutation,
    useCloneRuleMutation,
    useUpdateMetadataMutation
} = rulesApi
