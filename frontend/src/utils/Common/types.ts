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