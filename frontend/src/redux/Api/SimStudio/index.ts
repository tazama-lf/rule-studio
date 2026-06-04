import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface CreateSuitePayload {
    name: string;
    description?: string;
    rule_repo?: string;
    rule_name?: string;
    rule_version?: string;
    rule_config: Record<string, unknown>;
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
    context_txtp_config_id?: string | number;
    generation_id: number;
    txtp: string;
    txtp_version: string;
    display_order: number;
    message_count: number;
    faker_seed?: number;
    schema_snapshot: Record<string, unknown>;
    sample_payload_snapshot?: Record<string, unknown>;
    generator_profile?: Record<string, unknown>;
    field_strategies?: FieldStrategy[];
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

export interface BulkConfigItem {
    context_txtp_config_id: number;
    message_count?: number;
    faker_seed?: number;
    generator_profile?: Record<string, unknown>;
    field_strategies?: UpsertFieldStrategyItem[];
}

export interface TriggerFieldOverride {
    id: string | number;
    trigger_txtp_config_id: string | number;
    field_path: string;
    override_type: string;
    static_value?: unknown;
    range_min?: number;
    range_max?: number;
    generator_type?: string;
    generator_options?: Record<string, unknown>;
    created_at: string;
}

export interface TriggerTxtpConfig {
    trigger_txtp_config_id: string | number;
    txtp: string;
    txtp_version: string;
    message_count: number;
    display_order: number;
    payload_template_json: Record<string, unknown>;
    link_to_context_pairs: boolean;
    expected_result_band?: string;
    notes?: string;
    field_overrides: TriggerFieldOverride[];
}

export interface BulkTriggerConfigItem {
    trigger_txtp_config_id: number;
    message_count?: number;
    payload_template_json?: Record<string, unknown>;
    field_overrides?: {
        field_path: string;
        override_type: string;
        static_value?: unknown;
        range_min?: number;
        range_max?: number;
        generator_type?: string;
        generator_options?: Record<string, unknown>;
    }[];
}

export interface SuiteListItem {
    id: number;
    name: string;
    rule_name?: string;
    rule_config?: Record<string, unknown>;
    primary_txtp?: string;
    status: string;
    iteration_count: number;
    run_count: number;
    last_run_at?: string;
    updated_at: string;
    created_by: string;
    wizard_progress: Record<string, unknown>;
    generation_id?: number;
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

export interface ContextTxtpSummary {
    txtp: string;
    txtp_version: string;
    message_count: number;
}

export interface GenerationSummaryData {
    generation_id: string;
    generation_number: number;
    status: string;
    suite_name: string;
    associated_rule: string | null;
    primary_txtp: string | null;
    context_txtp_configs: ContextTxtpSummary[];
    enrichment_table_names: string[];
    context_count: number;
    trigger_count: number;
    enrichment_table_count: number;
    iteration_number: number;
}

export interface GenerationSummaryResponse {
    success: boolean;
    data: GenerationSummaryData;
}

export interface EnrichmentSchemaProperty {
    id: string;
    fieldName: string;
    type: string;
    strategy: string;
    staticValue: string;
    rangeMin: string;
    rangeMax: string;
}

export interface EnrichmentTableDto {
    id: number;
    table_name: string;
    table_order: number;
    row_count: number;
    payload_template_json: Record<string, unknown>;
    schema_template_json: { properties: EnrichmentSchemaProperty[] };
}

export interface CreateEnrichmentTablePayload {
    generationId: number;
    table_name: string;
    row_count: number;
    payload_template_json: Record<string, unknown>;
    schema_template_json: Record<string, unknown>;
}

export const simStudioApi = createApi({
    reducerPath: "simStudioApi",
    tagTypes: ["EnrichmentTables"] as const,
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

        createSuite: builder.mutation<{ success: boolean; data: {
            generation_id(generation_id: any, arg1: string, LocalStorage: string, arg3: boolean): unknown; id: number; wizard_progress: Record<string, unknown> 
} }, CreateSuitePayload>({
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

        createContextConfig: builder.mutation<
            { success: boolean; data: ContextTxtpConfig },
            { generationId: number; txtp: string; txtp_version: string; message_count?: number; display_order?: number }
        >({
            query: ({ generationId, ...body }) => ({
                url: `generations/${generationId}/context-configs`,
                method: "POST",
                body,
            }),
        }),

        bulkUpdateContextConfigs: builder.mutation<
            { success: boolean; data: ContextTxtpConfig[] },
            { generationId: number; items: BulkConfigItem[] }
        >({
            query: ({ generationId, items }) => ({
                url: `generations/${generationId}/context-configs`,
                method: "PATCH",
                body: items,
            }),
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

        getTriggerConfigs: builder.query<{ success: boolean; data: TriggerTxtpConfig[] }, number>({
            query: (generationId) => `generations/${generationId}/trigger-configs`,
        }),

        createTriggerConfig: builder.mutation<
            { success: boolean; data: TriggerTxtpConfig },
            { generationId: number; txtp: string; txtp_version: string; message_count?: number }
        >({
            query: ({ generationId, ...body }) => ({
                url: `generations/${generationId}/trigger-configs`,
                method: "POST",
                body,
            }),
        }),

        bulkUpdateTriggerConfigs: builder.mutation<
            { success: boolean; data: TriggerTxtpConfig[] },
            { generationId: number; items: BulkTriggerConfigItem[] }
        >({
            query: ({ generationId, items }) => ({
                url: `generations/${generationId}/trigger-configs`,
                method: "PATCH",
                body: items,
            }),
        }),

        deleteContextConfig: builder.mutation<{ success: boolean; message: string }, { generationId: number; configId: number }>({
            query: ({ generationId, configId }) => ({
                url: `generations/${generationId}/context-configs/${configId}`,
                method: "DELETE",
            }),
        }),

        deleteTriggerConfig: builder.mutation<{ success: boolean; message: string }, { generationId: number; configId: number }>({
            query: ({ generationId, configId }) => ({
                url: `generations/${generationId}/trigger-configs/${configId}`,
                method: "DELETE",
            }),
        }),

        getEnrichmentTables: builder.query<{ success: boolean; data: EnrichmentTableDto[] }, number>({
            query: (generationId) => `generations/${generationId}/enrichment-tables`,
            providesTags: ["EnrichmentTables"],
        }),

        createEnrichmentTable: builder.mutation<{ success: boolean; data: EnrichmentTableDto }, CreateEnrichmentTablePayload>({
            query: ({ generationId, ...body }) => ({
                url: `generations/${generationId}/enrichment-tables`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["EnrichmentTables"],
        }),

        deleteEnrichmentTable: builder.mutation<{ success: boolean; message: string }, { generationId: number; tableId: number }>({
            query: ({ generationId, tableId }) => ({
                url: `generations/${generationId}/enrichment-tables/${tableId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["EnrichmentTables"],
        }),

        getGenerationSummary: builder.query<GenerationSummaryResponse, number>({
            query: (generationId) => `generations/${generationId}/summary`,
        }),

        updateWizardProgress: builder.mutation<{ success: boolean }, { generationId: number; current_step_num: number; completed_step_num: number }>({
            query: ({ generationId, current_step_num, completed_step_num }) => ({
                url: `generations/${generationId}/wizard-progress`,
                method: "PATCH",
                body: { current_step_num, completed_step_num },
            }),
            transformResponse: (response: { success: boolean; message?: string }) => ({ success: response.success }),
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
    useCreateContextConfigMutation,
    useBulkUpdateContextConfigsMutation,
    useUpdateContextConfigMutation,
    useUpsertFieldStrategiesMutation,
    useLazyGetTriggerConfigsQuery,
    useCreateTriggerConfigMutation,
    useBulkUpdateTriggerConfigsMutation,
    useDeleteContextConfigMutation,
    useDeleteTriggerConfigMutation,
    useGetEnrichmentTablesQuery,
    useCreateEnrichmentTableMutation,
    useDeleteEnrichmentTableMutation,
    useGetGenerationSummaryQuery,
    useUpdateWizardProgressMutation,
} = simStudioApi;
