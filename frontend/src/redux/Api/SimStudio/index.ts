import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface CreateSuitePayload {
    name: string;
    description?: string;
    rule_repo?: string;
    rule_name?: string;
    rule_version?: string;
    primary_txtp: string;
    primary_txtp_version: string;
    wizard_progress?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface SuiteGeneration {
    id: number;
    suite_id: number;
    generation_number: number;
    status: string;
    simulation_type: string;
}

export interface ContextTxtpConfig {
    id: number;
    generation_id: number;
    txtp: string;
    txtp_version: string;
    display_order: number;
    message_count: number;
    faker_seed?: number;
    schema_snapshot: Record<string, unknown>;
    sample_payload_snapshot?: Record<string, unknown>;
    generator_profile?: Record<string, unknown>;
}

export interface FieldStrategy {
    id: number;
    context_txtp_config_id: number;
    field_path: string;
    strategy_code: string;
    static_value?: unknown;
    range_min?: number;
    range_max?: number;
    generator_type?: string;
    generator_options?: Record<string, unknown>;
    is_required_override?: boolean;
}

export interface UpsertFieldStrategyItem {
    field_path: string;
    strategy_code: "keep_sample" | "static" | "range" | "generated" | "null" | "skip";
    static_value?: unknown;
    range_min?: number;
    range_max?: number;
    generator_type?: string;
    generator_options?: Record<string, unknown>;
    is_required_override?: boolean;
}

export interface SuiteListItem {
    id: number;
    name: string;
    rule_name?: string;
    primary_txtp?: string;
    status: string;
    iteration_count: number;
    run_count: number;
    last_run_at?: string;
    updated_at: string;
    created_by: string;
    wizard_progress: Record<string, unknown>;
}

export interface SuitesListResponse {
    success: boolean;
    message: string;
    suites: SuiteListItem[];
    total: number;
}

export interface SuitesListQuery {
    search?: string;
    status?: string;
    rule_name?: string;
    txtp?: string;
    updated_from?: string;
    updated_to?: string;
    offset?: number;
    limit?: number;
}

export const simStudioApi = createApi({
    reducerPath: "simStudioApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/simulation-studio/`,
        prepareHeaders: (headers) => {
            const token = getAuthToken();
            if (token) headers.set("authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getSuites: builder.query<SuitesListResponse, SuitesListQuery>({
            query: (params = {}) => {
                const q = new URLSearchParams();
                if (params.search) q.set("search", params.search);
                if (params.status) q.set("status", params.status);
                if (params.rule_name) q.set("rule_name", params.rule_name);
                if (params.txtp) q.set("txtp", params.txtp);
                if (params.updated_from) q.set("updated_from", params.updated_from);
                if (params.updated_to) q.set("updated_to", params.updated_to);
                if (params.offset !== undefined) q.set("offset", String(params.offset));
                if (params.limit !== undefined) q.set("limit", String(params.limit));
                return `suites${q.toString() ? `?${q.toString()}` : ""}`;
            },
        }),

        createSuite: builder.mutation<{ success: boolean; data: { id: number; wizard_progress: Record<string, unknown> } }, CreateSuitePayload>({
            query: (body) => ({
                url: "suites",
                method: "POST",
                body,
            }),
        }),

        getLatestGeneration: builder.query<{ success: boolean; data: SuiteGeneration }, number>({
            query: (suiteId) => `suites/${suiteId}/generations/latest`,
        }),

        getContextConfigs: builder.query<{ success: boolean; data: ContextTxtpConfig[] }, number>({
            query: (generationId) => `generations/${generationId}/context-configs`,
        }),

        updateContextConfig: builder.mutation<
            { success: boolean; data: ContextTxtpConfig },
            { suiteId: number; configId: number; message_count?: number; faker_seed?: number; generator_profile?: Record<string, unknown> }
        >({
            query: ({ suiteId, configId, ...body }) => ({
                url: `suites/${suiteId}/context-configs/${configId}`,
                method: "PATCH",
                body,
            }),
        }),

        upsertFieldStrategies: builder.mutation<
            { success: boolean; data: FieldStrategy[] },
            { suiteId: number; configId: number; strategies: UpsertFieldStrategyItem[] }
        >({
            query: ({ suiteId, configId, strategies }) => ({
                url: `suites/${suiteId}/context-configs/${configId}/field-strategies`,
                method: "PUT",
                body: { strategies },
            }),
        }),
    }),
});

export const {
    useGetSuitesQuery,
    useCreateSuiteMutation,
    useGetLatestGenerationQuery,
    useLazyGetLatestGenerationQuery,
    useGetContextConfigsQuery,
    useLazyGetContextConfigsQuery,
    useUpdateContextConfigMutation,
    useUpsertFieldStrategiesMutation,
} = simStudioApi;
