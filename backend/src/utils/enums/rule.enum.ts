export enum RuleCategory {
    RULE_BUILDER = 'rule_builder',
    TEST_CASE = 'test_case_generation',
}

export enum RuleFlowStatus {
    INITIAL = 'initial',
    PASS = 'pass',
    FAIL = 'fail'
}

export enum RuleType {
    FRAUD_DETECTION = 'fraud_detection',
    AML = 'aml',
    SECURITY = 'security',
    COMPLIANCE = 'compliance',
}

export enum RuleStatus {
    STATUS_01_IN_PROGRESS = 'STATUS_01_IN_PROGRESS',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    TESTING = 'TESTING',
}

export enum PublishingStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    PUBLISHED = 'PUBLISHED',
}

export enum TransactionTypeStatus {
    DEPLOYED = 'deployed',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    PENDING = 'pending',
}