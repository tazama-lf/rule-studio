import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_SANDBOX_API_URL as string;

export const simulationApi = createApi({
    reducerPath: 'simulationApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/api/v1/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            return headers
        }
    }),

    endpoints: (builder) => ({
        createRepo: builder.mutation({
            query: (body) => ({
                url: `bootstrap`,
                method: "POST",
                body: { ...body },
            }),
        }),
        uploadCode: builder.mutation({
            query: (body) => ({
                url: `populate`,
                method: "POST",
                body: { ...body },
            }),
        }),
        mergeBranch: builder.mutation({
            query: (body) => ({
                url: `promote`,
                method: "POST",
                body: { ...body },
            }),
        }),
        getReport: builder.query({
            query: ({ branchName, organization, ruleId }) => ({
                url: `report?organization=${organization}&ruleId=${ruleId}&branchName=${branchName}`,
                method: "GET",
                responseHandler: (response) => response.text(),
            }),
        }),
    }),
})

export const {
    useCreateRepoMutation,
    useUploadCodeMutation,
    useMergeBranchMutation,
    useLazyGetReportQuery
} = simulationApi
