import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface FeaturesResponse {
    dockerPublish: boolean;
    simStudio: boolean;
}

export const featuresApi = createApi({
    reducerPath: "featuresApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/config/api/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken();
            if (token) headers.set("authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getFeatures: builder.query<FeaturesResponse, void>({
            query: () => ({ url: "features", method: "GET" }),
        }),
    }),
});

export const { useGetFeaturesQuery } = featuresApi;
