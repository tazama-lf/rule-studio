import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL

export const sendToDemsApi = createApi({
    reducerPath: 'sendToDemsApi',
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
        runSimulation: builder.mutation({
            query: (body) => ({
                url: `/send-to-dems/simulate`,
                method: "POST",
                body: { ...body },
            }),
        }),
    }),
})

export const {
    useRunSimulationMutation
} = sendToDemsApi
