import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export type RuleBuildStatus = "queued" | "running" | "passed" | "failed" | "error";

export interface RuleResult {
    id?: string;
    cfg?: string;
    subRuleRef: string;
    reason?: string;
    indpdntVarbl?: number;
    wght?: number;
    prcgTm?: number;
    [key: string]: unknown;
}

export interface RuleBuild {
    buildId: string;
    ruleDbId: number;
    ruleConfigId: string;
    ruleId: string;
    version: string;
    status: RuleBuildStatus;
    stage?: string;
    requestedBy?: string;
    createdAt: string;
    finishedAt?: string;
    error?: string;
    tests?: { total: number; passed: number; failed: number; success: boolean; coverageThresholdMet: boolean };
    package?: { file: string; integrity: string; shasum: string; size: number };
    image?: { ref: string; id: string; digest?: string };
    gitRepo?: string;
    durationsMs?: Record<string, number>;
    hasReport: boolean;
}

export interface RuleDeployResult {
    ok: boolean;
    container?: string;
    network?: string;
    image?: string;
    typology?: string;
    networkMap?: string;
    error?: string;
}

export interface TypologyResult {
    cfg: string;
    result?: number;
    workflow?: { alertThreshold?: number; interdictionThreshold?: number };
    ruleResults?: Array<RuleResult & { id: string }>;
}

export interface Evaluation {
    evaluationID?: string;
    status?: string;
    timestamp?: string;
    tadpResult?: { typologyResult?: TypologyResult[] };
}

export interface RuleAlert {
    report: Evaluation;
    transaction?: Record<string, unknown>;
    networkMap?: Record<string, unknown>;
    dataCache?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RuleRun {
    kind: "rule" | "e2e";
    ok: boolean;
    msgId?: string;
    ranAt: string;
    tookMs: number;
    result?: RuleResult;
    reason?: string;
    alert?: RuleAlert;
    error?: string;
}

export interface RuleDeployment {
    enabled: boolean;
    deployed: boolean;
    state?: "deployed" | "starting" | "restarting" | "stopped";
    restarts?: number;
    exitCode?: number;
    current?: boolean;
    container?: string;
    network?: string;
    rule?: string;
    image?: string;
    startedAt?: string;
    runs?: { rule?: RuleRun; e2e?: RuleRun };
}

export interface RulePipelineConfig {
    enabled: boolean;
    npm: { source: string; registry?: string; scopeRegistry?: string; cache?: string };
    image: { build: boolean; registry: string; namespace: string };
    git: { kind: string; url?: string; owner?: string; branch?: string };
    deploy: { enabled: boolean; network?: string };
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
    tagTypes: ["Deployment"],
    endpoints: (builder) => ({
        getPipelineConfig: builder.query<RulePipelineConfig, void>({
            query: () => ({ url: "config", method: "GET" }),
        }),
        startRuleBuild: builder.mutation<RuleBuild, number>({
            query: (ruleId) => ({ url: `rules/${ruleId}/builds`, method: "POST" }),
        }),
        getRuleDeployment: builder.query<RuleDeployment, number>({
            query: (ruleId) => ({ url: `rules/${ruleId}/deployment`, method: "GET" }),
            providesTags: ["Deployment"],
        }),
        deployRule: builder.mutation<RuleDeployResult, number>({
            query: (ruleId) => ({ url: `rules/${ruleId}/deployment`, method: "POST" }),
            invalidatesTags: ["Deployment"],
        }),
        runDeployedRule: builder.mutation<RuleRun, number>({
            query: (ruleId) => ({ url: `rules/${ruleId}/runs/rule`, method: "POST" }),
            invalidatesTags: ["Deployment"],
        }),
        runEndToEnd: builder.mutation<RuleRun, number>({
            query: (ruleId) => ({ url: `rules/${ruleId}/runs/end-to-end`, method: "POST" }),
            invalidatesTags: ["Deployment"],
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
    useGetRuleDeploymentQuery,
    useDeployRuleMutation,
    useRunDeployedRuleMutation,
    useRunEndToEndMutation,
} = rulePipelineApi;
