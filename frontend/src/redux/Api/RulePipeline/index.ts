import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export type RuleBuildStatus = "queued" | "running" | "passed" | "failed" | "error";

export interface RuleBuild {
    buildId: string;
    ruleDbId: number;
    ruleConfigId: string;
    ruleId: string;
    version: string;
    status: RuleBuildStatus;
    stage?: string;
    simulate: boolean;
    requestedBy?: string;
    createdAt: string;
    finishedAt?: string;
    error?: string;
    tests?: { total: number; passed: number; failed: number; success: boolean; coverageThresholdMet: boolean };
    package?: { file: string; integrity: string; shasum: string; size: number };
    image?: { ref: string; id: string; digest?: string };
    gitRepo?: string;
    durationsMs?: Record<string, number>;
    simulation?: { ok: boolean; upMs?: number; subject?: string; error?: string };
    hasReport: boolean;
}

export interface RulePipelineConfig {
    enabled: boolean;
    npm: { source: string; registry?: string; scopeRegistry?: string; cache?: string };
    image: { build: boolean; registry?: string; namespace: string };
    git: { kind: string; url?: string; owner?: string; branch?: string };
}

export const rulePipelineUrl = `${BASE_URL}/rule-pipeline`;

export const rulePipelineApi = createApi({
    reducerPath: "rulePipelineApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${rulePipelineUrl}/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken();
            if (token) headers.set("authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getPipelineConfig: builder.query<RulePipelineConfig, void>({
            query: () => ({ url: "config", method: "GET" }),
        }),
        startRuleBuild: builder.mutation<RuleBuild, { ruleId: number; simulate: boolean }>({
            query: ({ ruleId, simulate }) => ({ url: `rules/${ruleId}/builds`, method: "POST", body: { simulate } }),
        }),
        getLatestRuleBuild: builder.query<{ build: RuleBuild | null }, number>({
            query: (ruleId) => ({ url: `rules/${ruleId}/builds/latest`, method: "GET" }),
        }),
        getRuleBuild: builder.query<RuleBuild, string>({
            query: (buildId) => ({ url: `builds/${buildId}`, method: "GET" }),
        }),
        getRuleBuildReport: builder.query<string, string>({
            query: (buildId) => ({ url: `builds/${buildId}/report`, method: "GET", responseHandler: "text" }),
        }),
    }),
});

export const {
    useGetPipelineConfigQuery,
    useStartRuleBuildMutation,
    useGetLatestRuleBuildQuery,
    useGetRuleBuildQuery,
    useGetRuleBuildReportQuery,
} = rulePipelineApi;
