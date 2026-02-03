export const Status = {
    STATUS_01_IN_PROGRESS: 'STATUS_01_IN_PROGRESS',
    STATUS_02_ON_HOLD: 'STATUS_02_ON_HOLD',
    STATUS_03_UNDER_REVIEW: 'STATUS_03_UNDER_REVIEW',
    STATUS_04_APPROVED: 'STATUS_04_APPROVED',
    STATUS_05_REJECTED: 'STATUS_05_REJECTED',
    STATUS_07_READY_FOR_DEPLOYMENT: 'STATUS_07_READY_FOR_DEPLOYMENT',
    STATUS_08_DEPLOYED: 'STATUS_08_DEPLOYED',
    STATUS_09_ARCHIVED: 'STATUS_09_ARCHIVED',
}

export const publishingStatus = {
    Active: 'ACTIVE',
    Inactive: 'INACTIVE'
}

export const Tabs = [
    {
        label: 'Overview',
        value: 'overview',
        enabled: false
    },
    {
        label: 'Rule Request',
        value: 'rule_request',
        enabled: false
    },
    {
        label: 'Simulation',
        value: 'simulation',
        enabled: false
    },
    {
        label: 'History',
        value: 'History',
        enabled: false
    },
]


export const claims = {
    editor: 'editor',
    approver: 'approver',
    publisher: 'publisher'
}

export const RoleStatusMap: Record<string, string[]> = {
    editor: Object.values(Status),
    approver: [
        Status.STATUS_03_UNDER_REVIEW,
        Status.STATUS_04_APPROVED,
        Status.STATUS_05_REJECTED,
    ],
    deployer: [
        Status.STATUS_07_READY_FOR_DEPLOYMENT,
        Status.STATUS_08_DEPLOYED,
    ],
};

export const getStatusOptionsForRole = (role: string) => {
    const allowedStatuses = RoleStatusMap[role] ?? [];
    return [
        ...allowedStatuses.map((value) => ({ label: value, value })),
    ];
};


export const ruleTypes = [
    {
        display: 'Fraud',
        value: 'FRAUD'
    },
    {
        display: 'AML',
        value: 'AML'
    },
    {
        display: 'Fraud & AML',
        value: 'FRAUD/AML'
    },
]

