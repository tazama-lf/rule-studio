import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL

export const maskingApi = createApi({
    reducerPath: 'maskingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/masking/api/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken()
            if (token) headers.set("authorization", `Bearer ${token}`)
            headers.set("Content-Type", "application/json")
            headers.set("Accept", "application/json")
            return headers
        }
    }),
    endpoints: (builder) => ({
        createMasking: builder.mutation({
            query: (body) => ({
                url: `create`,
                method: "POST",
                body: { ...body },
            }),
        }),
        getAllMasks: builder.mutation({
            query: ({ body, params }) => ({
                url: `all`,
                method: "POST",
                body: { ...body },
                params,
            }),
        }),
        getMaskById: builder.query({
            query: ({ id }) => ({
                url: `${id}`,
                method: "GET",
            }),
        }),
        updateMask: builder.mutation({
            query: ({ id, body }) => ({
                url: `${id}`,
                method: "PUT",
                body: { ...body },
            }),
        }),
    }),
})

export const {
    useCreateMaskingMutation,
    useGetAllMasksMutation,
    useGetMaskByIdQuery,
    useLazyGetMaskByIdQuery,
    useUpdateMaskMutation,
} = maskingApi
