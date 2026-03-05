export interface User {
    id: string;
    username: string;
    email?: string;
    claims?: string;
    tenantId?: string;
}

export interface Option {
    label: string,
    value: unknown
}

export interface Rule {
    id?: string;
    description: string;
    txtp: string;
    version: string;
    txtpVersion?: string;
    status?: string;
    publishing_status?: string;
    rule_type?: string;
    rule_config_id?: string;
    flow_id?: string;
    updated_at?: string;
    created_at?: string;
    [key: string]: unknown;
}

export interface RuleResponse {
    rules: Rule;
}

export type IResult = {
    success: boolean;
    message: string;
    proccessedAt: string;
    transactionType: string,
    correlationId: string,
    configPayload: {
        success: boolean,
        transactionType: string,
        tenantId: string,
        config: unknown
    }
    validationErrors?: string[]
    validatedPayload?: unknown,
    ruleRequest?: {
        transaction: unknown,
        networkMap: unknown,
        DataCache: unknown,
        metaData: unknown
    },
}