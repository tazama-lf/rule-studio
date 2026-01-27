import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const parseApi = createApi({
    reducerPath: 'parseApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/parse/api/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            return headers
        }
    }),
    endpoints: (builder) => ({
        parsePayload: builder.mutation({
            query: (body) => ({
                url: `validatePayload`,
                method: "POST",
                body: { ...body },
            }),
        }),
    }),
})

export const {
    useParsePayloadMutation
} = parseApi
