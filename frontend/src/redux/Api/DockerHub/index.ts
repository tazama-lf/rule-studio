import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface DockerHubRule {
    name: string;
    namespace: string;
    repository_type: string;
    pull_count: number;
    last_updated: string;
}

export interface DockerHubRulesResponse {
    rules: DockerHubRule[];
    count: number;
}

export interface DockerHubTag {
    name: string;
    last_updated: string;
    digest: string;
}

export interface DockerHubTagsResponse {
    rule: string;
    tags: DockerHubTag[];
    count: number;
}

export const dockerHubApi = createApi({
    reducerPath: "dockerHubApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/dockerhub/api/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken();
            if (token) headers.set("authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getRules: builder.query<DockerHubRulesResponse, void>({
            query: () => ({
                url: "rules",
                method: "GET",
            }),
        }),
        getRuleTags: builder.query<DockerHubTagsResponse, { rule: string }>({
            query: ({ rule }) => ({
                url: `tags`,
                method: "GET",
                params: { rule },
            }),
        }),
    }),
});

export const { useGetRulesQuery, useLazyGetRuleTagsQuery } = dockerHubApi;
