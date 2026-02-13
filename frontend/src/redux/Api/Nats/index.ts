import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.DEV 
    ? '/nats-proxy' 
    : (import.meta.env.VITE_NATS_API_URL as string);

export const natsApi = createApi({
    reducerPath: 'natsApi',
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
        ruleOnly: builder.mutation({
            query: (body) => ({
                url: `/natsPublish`,
                method: "POST",
                body: { ...body },
            }),
        }),
        endToEnd: builder.mutation({
            query: (body) => ({
                url: `/restPublish`,
                method: "POST",
                body: { ...body },
            }),
        }),
    }),
})

export const {
    useRuleOnlyMutation,
    useEndToEndMutation // Add this line to export the endToEnd mutation hook
} = natsApi
