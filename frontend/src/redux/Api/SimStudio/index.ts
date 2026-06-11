import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../../../utils/Common/storage";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface FakerSemanticItem {
    id: string;
    name: string;
}

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
    related_transaction?: string | null;
    related_txtp_config_id?: number | null;
}

export interface FieldStrategy {
    id: number;
    context_txtp_config_id: number;
    field_path: string;
    strategy_code: string;
    static_value?: unknown;
    range_min?: number;
    range_max?: number;
    faker_semantic_type?: string;
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
    faker_semantic_type?: string;
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
    faker_semantic_type?: string;
    generator_type?: string;
    generator_options?: Record<string, unknown>;
    created_at: string;
}

export interface TriggerFieldStrategy {
    id: string;
    trigger_txtp_config_id: string;
    field_path: string;
    strategy_code: string;
    range_min: number | null;
    range_max: number | null;
    faker_semantic_type: string | null;
    generator_options: Record<string, unknown>;
    created_at: string;
    static_value?: unknown;
}

export interface TriggerTxtpConfigDetail {
    trigger_txtp_config_id: string | number;
    txtp: string;
    txtp_version: string;
    message_count: number;
    display_order: number;
    payload_template_json: Record<string, unknown>;
    link_to_context_pairs: boolean;
    expected_result_band?: string | null;
    notes?: string | null;
    related_txtp_config_id?: number | null;
    related_transaction?: string | null;
    field_strategies: TriggerFieldStrategy[];
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
    related_transaction?: string | null;
    related_txtp_config_id?: number | null;
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
        faker_semantic_type?: string;
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

export interface SuiteDetail {
    id: number;
    name: string;
    description?: string;
    rule_name?: string;
    rule_version?: string;
    rule_config?: Record<string, unknown>;
    primary_txtp?: string;
    primary_txtp_version?: string;
    status: string;
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

export interface SuitesCountData {
    total_suites: number;
    total_draft_suites: number;
    total_completed_suites: number;
    latest_run_at: string | number | null;
}

export interface SuitesCountResponse {
    success: boolean;
    data: SuitesCountData;
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

export interface SuiteTriggerResult {
    id: string;
    trigger_id: string;
    rule_result: Record<string, unknown>;
    independent_variable: string;
    sub_rule_ref: string;
}

export interface SuiteRunResult {
    run_id: string;
    generation_id: string;
    rule_name: string;
    rule_version: string;
    trigger_count: number;
    outcome: string;
    triggers: SuiteTriggerResult[];
}

export interface SuiteResultResponse {
    success: boolean;
    message: string;
    data: {
        suite_id: number;
        results: SuiteRunResult[];
    };
}

export interface MappingItem {
    primary: string;
    related: string;
}

export interface MappingData {
    id: string;
    primary_tx_id: string;
    related_tx_id: string;
    mapping: MappingItem[];
}

export interface MappingResponse {
    success: boolean;
    data: MappingData[];
}

export interface EnrichmentSchemaProperty {
    id: string;
    fieldName: string;
    type: string;
    strategy: string;
    staticValue: string;
    rangeMin: string;
    rangeMax: string;
    semanticId?: string;
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

        getSuitesCount: builder.query<SuitesCountResponse, void>({
            query: () => "suites/counts",
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
            { generationId: number; txtp: string; txtp_version: string; message_count?: number; display_order?: number; related_context_txtp_id?: number }
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
            { generationId: number; txtp: string; txtp_version: string; message_count?: number; related_trigger_txtp_id?: number }
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

        resumeGeneration: builder.query<{
            success: boolean;
            data: { id: number; suite_id: number; wizard_snapshot: { currentStep?: number; completedSteps?: number[] } };
        }, number>({
            query: (suiteId) => `suites/${suiteId}/generations/resume`,
        }),

        getSuiteById: builder.query<{ success: boolean; suite: SuiteDetail }, number>({
            query: (suiteId) => `suites/${suiteId}`,
        }),

        getFakerSemanticData: builder.query<{ success: boolean; data: FakerSemanticItem[] }, void>({
            query: () => `faker-semantic-data`,
            transformResponse: (response: { success: boolean; message?: string; data: FakerSemanticItem[] }) => ({ success: response.success, data: response.data }),
        }),

        getContextMapping: builder.query<MappingResponse, { primaryId: number; relatedId: number }>({
            query: ({ primaryId, relatedId }) => `context-mappings/${primaryId}/${relatedId}`,
        }),

        saveContextMapping: builder.mutation<{ success: boolean }, { primary_txtp_id: number; related_txtp_id: number; mapping: MappingItem[] }>({
            query: (body) => ({
                url: `context-mappings`,
                method: "POST",
                body,
            }),
        }),

        getTriggerMapping: builder.query<MappingResponse, { primaryId: number; relatedId: number }>({
            query: ({ primaryId, relatedId }) => `trigger-mappings/${primaryId}/${relatedId}`,
        }),

        saveTriggerMapping: builder.mutation<{ success: boolean }, { primary_txtp_id: number; related_txtp_id: number; mapping: MappingItem[] }>({
            query: (body) => ({
                url: `trigger-mappings`,
                method: "POST",
                body,
            }),
        }),

        updateWizardProgress: builder.mutation<{ success: boolean }, { generationId: number; current_step_num: number; completed_step_num: number }>({
            query: ({ generationId, current_step_num, completed_step_num }) => ({
                url: `generations/${generationId}/wizard-progress`,
                method: "PATCH",
                body: { current_step_num, completed_step_num },
            }),
            transformResponse: (response: { success: boolean; message?: string }) => ({ success: response.success }),
        }),

        getSuiteResult: builder.query<SuiteResultResponse, number>({
            query: (suiteId) => `suites/${suiteId}/result`,
        }),

        getTriggerConfigById: builder.query<{ success: boolean; data: TriggerTxtpConfigDetail }, number>({
            query: (configId) => `trigger-configs/${configId}`,
        }),
    }),
});

export const {
    useGetSuitesQuery,
    useGetSuitesCountQuery,
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
    useLazyResumeGenerationQuery,
    useLazyGetSuiteByIdQuery,
    useGetSuiteByIdQuery,
    useGetFakerSemanticDataQuery,
    useUpdateWizardProgressMutation,
    useLazyGetContextMappingQuery,
    useSaveContextMappingMutation,
    useLazyGetTriggerMappingQuery,
    useSaveTriggerMappingMutation,
    useGetSuiteResultQuery,
    useLazyGetTriggerConfigByIdQuery,
} = simStudioApi;
