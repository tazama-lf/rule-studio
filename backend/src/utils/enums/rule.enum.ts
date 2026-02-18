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
    STATUS_02_ON_HOLD = 'STATUS_02_ON_HOLD',
    STATUS_03_UNDER_REVIEW = 'STATUS_03_UNDER_REVIEW',
    STATUS_04_APPROVED = 'STATUS_04_APPROVED',
    STATUS_05_REJECTED = 'STATUS_05_REJECTED',
    STATUS_08_DEPLOYED = 'STATUS_08_DEPLOYED',
}

export enum PublishingStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
}

export enum TransactionTypeStatus {
    STATUS_01_IN_PROGRESS = 'STATUS_01_IN_PROGRESS',
    STATUS_02_ON_HOLD = 'STATUS_02_ON_HOLD',
    STATUS_03_UNDER_REVIEW = 'STATUS_03_UNDER_REVIEW',
    STATUS_04_APPROVED = 'STATUS_04_APPROVED',
    STATUS_05_REJECTED = 'STATUS_05_REJECTED',
    STATUS_06_EXPORTED = 'STATUS_06_EXPORTED',
    STATUS_07_READY_FOR_DEPLOYMENT = 'STATUS_07_READY_FOR_DEPLOYMENT',
    STATUS_08_DEPLOYED = 'STATUS_08_DEPLOYED',
}