import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_NATS_API_URL
const DEMS_URL = import.meta.env.VITE_DEMS_ENDPOINT
const ADMIN_URL = import.meta.env.VITE_ADMIN_ENDPOINT

export const natsApi = createApi({
    reducerPath: 'natsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: ``,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            headers.set("Content-Type", "application/json")
            headers.set("Accept", "application/json")
            return headers
        }
    }),
    endpoints: (builder) => ({
        ruleOnly: builder.mutation({
            query: (body) => ({
                url: `${BASE_URL}/natsPublish`,
                method: "POST",
                body: { ...body },
            }),
        }),
        endToEnd: builder.mutation({
            query: ({ body, endpointPath }) => ({
                url: `${DEMS_URL}${endpointPath}`,
                method: "POST",
                body: { ...body },
            }),
        }),
        getEndReport: builder.query({
            query: ({ msgId }) => ({
                url: `${ADMIN_URL}/v1/admin/reports/getreportbymsgid?msgid=${msgId}`,
                method: "GET",
            }),
        }),
    }),
})

export const {
    useRuleOnlyMutation,
    useEndToEndMutation,
    useLazyGetEndReportQuery
} = natsApi
