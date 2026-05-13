import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_SANDBOX_API_URL as string;

export const simulationApi = createApi({
    reducerPath: 'simulationApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            return headers
        }
    }),

    endpoints: (builder) => ({
        createRepo: builder.mutation({
            query: (body) => ({
                url: `/api/v1/bootstrap`,
                method: "POST",
                body: { ...body },
            }),
        }),
        uploadCode: builder.mutation({
            query: (body) => ({
                url: `/api/v1/populate`,
                method: "POST",
                body: { ...body },
            }),
        }),
        mergeBranch: builder.mutation({
            query: (body) => ({
                url: `/api/v1/promote`,
                method: "POST",
                body: { ...body },
            }),
        }),
        getReport: builder.query({
            query: ({ ruleId }) => ({
                url: `/api/v1/report?&ruleId=${ruleId}`,
                method: "GET",
                responseHandler: (response) => response.text(),
            }),
        }),
        getReportStatus: builder.query({
            query: ({ ruleId }) => ({
                url: `/api/v1/unit-tests/status?&ruleId=${ruleId}`,
                method: "GET",
            }),
        }),
        getOrganization: builder.query<{ organization: string }, void>({
            query: () => ({
                url: `/api/v1/organization`,
                method: "GET",
            }),
        }),
    }),
})

export const {
    useCreateRepoMutation,
    useUploadCodeMutation,
    useMergeBranchMutation,
    useLazyGetReportQuery,
    useLazyGetReportStatusQuery,
    useLazyGetOrganizationQuery,
} = simulationApi
