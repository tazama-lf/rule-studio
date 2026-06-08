import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

export const simulations = [
    {
        id: 1,
        icon: ElectricBoltIcon,
        title: 'Rule-Only Simulation',
        description: 'Test this rule in isolation with minimal inputs',
        complexity: 'Simple',
        cost: "Low"
    },
    {
        id: 2,
        icon: AccountTreeIcon,
        title: 'DEMS-driven Simulation',
        description: 'Ingesting a transaction through DEMS to simulate the rule behavior',
        complexity: 'Complex',
        cost: "High"
    },
]


export const simulationTableData = [
    {
        message_id: "MSG-2026-04-27-001",
        txtp: "pacs.008",
        time: "10:23:15",
        outcome: "Hit",
        score: 87,
        reason: "High-risk transaction pattern detected",
        triggered_rules: [
            { ruleId: "028@1.0.0", description: "Age classification – debtor", status: "Triggered" },
            { ruleId: "030@1.0.0", description: "Income inconsistency check", status: "Triggered" },
            { ruleId: "045@1.0.0", description: "Round amount detection", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-processor@1.0.0",
                score: 800.0,
                rules: [
                    { ruleId: "028@1.0.0", weight: 100.0, subRef: ".02" },
                    { ruleId: "030@1.0.0", weight: 200.0, subRef: ".01" },
                    { ruleId: "045@1.0.0", weight: 200.0, subRef: ".02" },
                ],
            },
            { name: "typology-028@1.0.0", score: 500.0, rules: [] },
        ],
    },
    {
        message_id: "MSG-2026-04-27-002",
        txtp: "pacs.002",
        time: "10:24:32",
        outcome: "No-Hit",
        score: 12,
        reason: "Normal transaction behavior",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-003",
        txtp: "pacs.008",
        time: "10:25:47",
        outcome: "Hit",
        score: 92,
        reason: "Unusual transfer amount",
        triggered_rules: [
            { ruleId: "044@1.0.0", description: "Beneficiary risk scoring", status: "Triggered" },
            { ruleId: "078@1.0.0", description: "Unusual account balance spike", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-047@1.0.0",
                score: 450.0,
                rules: [
                    { ruleId: "044@1.0.0", weight: 200.0, subRef: ".02" },
                    { ruleId: "078@1.0.0", weight: 250.0, subRef: ".01" },
                ],
            },
        ],
    },
    {
        message_id: "MSG-2026-04-27-004",
        txtp: "pain.001",
        time: "10:26:18",
        outcome: "No-Hit",
        score: 8,
        reason: "Standard payment initiation",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-005",
        txtp: "pacs.008",
        time: "10:27:55",
        outcome: "Hit",
        score: 95,
        reason: "Multiple rule violations detected",
        triggered_rules: [
            { ruleId: "028@1.0.0", description: "Age classification – debtor", status: "Triggered" },
            { ruleId: "030@1.0.0", description: "Income inconsistency check", status: "Triggered" },
            { ruleId: "044@1.0.0", description: "Beneficiary risk scoring", status: "Triggered" },
            { ruleId: "045@1.0.0", description: "Round amount detection", status: "Triggered" },
            { ruleId: "078@1.0.0", description: "Unusual account balance spike", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-processor@1.0.0",
                score: 800.0,
                rules: [
                    { ruleId: "044@1.0.0", weight: 200.0, subRef: ".02" },
                    { ruleId: "030@1.0.0", weight: 200.0, subRef: ".01" },
                    { ruleId: "045@1.0.0", weight: 200.0, subRef: ".02" },
                    { ruleId: "028@1.0.0", weight: 100.0, subRef: ".02" },
                ],
            },
            { name: "typology-028@1.0.0", score: 500.0, rules: [] },
            { name: "typology-047@1.0.0", score: 450.0, rules: [] },
        ],
    },
    {
        message_id: "MSG-2026-04-27-006",
        txtp: "pacs.004",
        time: "10:28:12",
        outcome: "No-Hit",
        score: 15,
        reason: "Valid return transaction",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-007",
        txtp: "pacs.008",
        time: "10:29:33",
        outcome: "Hit",
        score: 78,
        reason: "Velocity check triggered",
        triggered_rules: [
            { ruleId: "030@1.0.0", description: "Income inconsistency check", status: "Triggered" },
            { ruleId: "045@1.0.0", description: "Round amount detection", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-028@1.0.0",
                score: 500.0,
                rules: [
                    { ruleId: "030@1.0.0", weight: 200.0, subRef: ".01" },
                    { ruleId: "045@1.0.0", weight: 200.0, subRef: ".02" },
                ],
            },
        ],
    },
    {
        message_id: "MSG-2026-04-27-008",
        txtp: "pain.001",
        time: "10:30:45",
        outcome: "No-Hit",
        score: 5,
        reason: "Low-risk customer profile",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-009",
        txtp: "pacs.008",
        time: "10:31:22",
        outcome: "Hit",
        score: 98,
        reason: "Sanctioned entity match found",
        triggered_rules: [
            { ruleId: "028@1.0.0", description: "Age classification – debtor", status: "Triggered" },
            { ruleId: "044@1.0.0", description: "Beneficiary risk scoring", status: "Triggered" },
            { ruleId: "078@1.0.0", description: "Unusual account balance spike", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-processor@1.0.0",
                score: 750.0,
                rules: [
                    { ruleId: "028@1.0.0", weight: 100.0, subRef: ".02" },
                    { ruleId: "044@1.0.0", weight: 200.0, subRef: ".02" },
                    { ruleId: "078@1.0.0", weight: 250.0, subRef: ".01" },
                ],
            },
            { name: "typology-047@1.0.0", score: 450.0, rules: [] },
        ],
    },
    {
        message_id: "MSG-2026-04-27-010",
        txtp: "pacs.002",
        time: "10:32:08",
        outcome: "No-Hit",
        score: 10,
        reason: "Payment status report - normal",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-011",
        txtp: "pacs.008",
        time: "10:33:41",
        outcome: "Hit",
        score: 82,
        reason: "Geographic risk indicator",
        triggered_rules: [
            { ruleId: "030@1.0.0", description: "Income inconsistency check", status: "Triggered" },
            { ruleId: "078@1.0.0", description: "Unusual account balance spike", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-028@1.0.0",
                score: 400.0,
                rules: [
                    { ruleId: "030@1.0.0", weight: 200.0, subRef: ".01" },
                    { ruleId: "078@1.0.0", weight: 250.0, subRef: ".01" },
                ],
            },
        ],
    },
    {
        message_id: "MSG-2026-04-27-012",
        txtp: "pain.001",
        time: "10:34:56",
        outcome: "No-Hit",
        score: 18,
        reason: "Authorized merchant transaction",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-013",
        txtp: "pacs.008",
        time: "10:35:19",
        outcome: "Hit",
        score: 89,
        reason: "Structuring pattern identified",
        triggered_rules: [
            { ruleId: "028@1.0.0", description: "Age classification – debtor", status: "Triggered" },
            { ruleId: "044@1.0.0", description: "Beneficiary risk scoring", status: "Triggered" },
            { ruleId: "045@1.0.0", description: "Round amount detection", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-processor@1.0.0",
                score: 600.0,
                rules: [
                    { ruleId: "028@1.0.0", weight: 100.0, subRef: ".02" },
                    { ruleId: "044@1.0.0", weight: 200.0, subRef: ".02" },
                    { ruleId: "045@1.0.0", weight: 200.0, subRef: ".02" },
                ],
            },
        ],
    },
    {
        message_id: "MSG-2026-04-27-014",
        txtp: "pacs.004",
        time: "10:36:27",
        outcome: "No-Hit",
        score: 7,
        reason: "Legitimate refund request",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-015",
        txtp: "pacs.008",
        time: "10:37:53",
        outcome: "No-Hit",
        score: 22,
        reason: "Within normal thresholds",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-016",
        txtp: "pain.001",
        time: "10:38:14",
        outcome: "Hit",
        score: 75,
        reason: "New payee - increased scrutiny",
        triggered_rules: [
            { ruleId: "030@1.0.0", description: "Income inconsistency check", status: "Triggered" },
        ],
        triggered_typologies: [
            { name: "typology-028@1.0.0", score: 300.0, rules: [{ ruleId: "030@1.0.0", weight: 200.0, subRef: ".01" }] },
        ],
    },
    {
        message_id: "MSG-2026-04-27-017",
        txtp: "pacs.008",
        time: "10:39:02",
        outcome: "No-Hit",
        score: 14,
        reason: "Recurring payment - verified",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-018",
        txtp: "pacs.002",
        time: "10:40:28",
        outcome: "No-Hit",
        score: 9,
        reason: "Status confirmation - no issues",
        triggered_rules: [],
        triggered_typologies: [],
    },
    {
        message_id: "MSG-2026-04-27-019",
        txtp: "pacs.008",
        time: "10:41:37",
        outcome: "Hit",
        score: 93,
        reason: "PEP (Politically Exposed Person) match",
        triggered_rules: [
            { ruleId: "028@1.0.0", description: "Age classification – debtor", status: "Triggered" },
            { ruleId: "044@1.0.0", description: "Beneficiary risk scoring", status: "Triggered" },
            { ruleId: "078@1.0.0", description: "Unusual account balance spike", status: "Triggered" },
        ],
        triggered_typologies: [
            {
                name: "typology-processor@1.0.0",
                score: 700.0,
                rules: [
                    { ruleId: "028@1.0.0", weight: 100.0, subRef: ".02" },
                    { ruleId: "044@1.0.0", weight: 200.0, subRef: ".02" },
                    { ruleId: "078@1.0.0", weight: 250.0, subRef: ".01" },
                ],
            },
            { name: "typology-047@1.0.0", score: 450.0, rules: [] },
        ],
    },
    {
        message_id: "MSG-2026-04-27-020",
        txtp: "pain.001",
        time: "10:42:55",
        outcome: "No-Hit",
        score: 11,
        reason: "Established customer relationship",
        triggered_rules: [],
        triggered_typologies: [],
    },
];


export const sampleRuleRequest = {
    "transaction": {
        "TenantId": "DEFAULT",
        "TxTp": "pacs.002.001.12",
        "FIToFIPmtSts": {
            "GrpHdr": {
                "MsgId": "6cff4f7c20c243a7886ad448839b726f",
                "CreDtTm": "2026-01-28T12:30:00.777Z"
            },
            "TxInfAndSts": {
                "OrgnlInstrId": "5ab4fc7355de4ef8a75b78b00a681ed2",
                "OrgnlEndToEndId": "0e9583c8714c461891008348ac40e5a3",
                "TxSts": "ACCC",
                "AccptncDtTm": "2023-06-02T07:52:31.000Z",
                "InstgAgt": {
                    "FinInstnId": {
                        "ClrSysMmbId": {
                            "MmbId": "fsp001"
                        }
                    }
                },
                "InstdAgt": {
                    "FinInstnId": {
                        "ClrSysMmbId": {
                            "MmbId": "fsp002"
                        }
                    }
                },
                "ChrgsInf": [
                    {
                        "Amt": { "Amt": 0, "Ccy": "USD" },
                        "Agt": {
                            "FinInstnId": {
                                "ClrSysMmbId": { "MmbId": "fsp001" }
                            }
                        }
                    },
                    {
                        "Amt": { "Amt": 0, "Ccy": "USD" },
                        "Agt": {
                            "FinInstnId": {
                                "ClrSysMmbId": { "MmbId": "fsp001" }
                            }
                        }
                    },
                    {
                        "Amt": { "Amt": 0, "Ccy": "USD" },
                        "Agt": {
                            "FinInstnId": {
                                "ClrSysMmbId": { "MmbId": "fsp002" }
                            }
                        }
                    }
                ]
            }
        }
    },
    "DataCache": {
        "dbtrId": "dbtr_23dd53293b5348b385b87c7d741d9ea2TAZAMA_EID",
        "cdtrId": "cdtr_7cf52237dc2e4b528793d9da79c49931TAZAMA_EID",
        "dbtrAcctId": "dbtrAcct_ed55196be37a4719accc8367855016cfMSISDNfsp001",
        "cdtrAcctId": "cdtrAcct_9ce6454753014c21847a7b43575ac3a2MSISDNfsp002",
        "creDtTm": "2026-01-28T12:25:00.777Z",
        "instdAmt": {
            "amt": 657.95,
            "ccy": "XTS"
        },
        "intrBkSttlmAmt": {
            "amt": 657.95,
            "ccy": "XTS"
        },
        "xchgRate": 1
    },
    "networkMap": {
        "messages": [
            {
                "id": "6cff4f7c20c243a7886ad448839b726f",
                "cfg": "1.0.0",
                "txTp": "pacs.002.001.12",
                "typologies": [
                    {
                        "id": "typology-processor@1.0.0",
                        "cfg": "999-901@1.0.0",
                        "rules": [
                            {
                                "id": "901@1.0.0",
                                "cfg": "1.0.0"
                            }
                        ]
                    }
                ]
            }
        ],
        "active": true
    }
}

export const samplePayload = {
    "TxTp": "pacs.002.001.12",
    "FIToFIPmtSts": {
        "GrpHdr": {
            "MsgId": "c05423ef3b454900a44202c43d5e179b",
            "CreDtTm": "2026-01-29T11:32:41.628Z"
        },
        "TxInfAndSts": {
            "OrgnlInstrId": "5ab4fc7355de4ef8a75b78b00a681ed2",
            "OrgnlEndToEndId": "c2bb30cdfa1141bdbc9a24582492d626",
            "TxSts": "ACCC",
            "ChrgsInf": [
                {
                    "Amt": {
                        "Amt": 0,
                        "Ccy": "USD"
                    },
                    "Agt": {
                        "FinInstnId": {
                            "ClrSysMmbId": {
                                "MmbId": "fsp001"
                            }
                        }
                    }
                },
                {
                    "Amt": {
                        "Amt": 0,
                        "Ccy": "USD"
                    },
                    "Agt": {
                        "FinInstnId": {
                            "ClrSysMmbId": {
                                "MmbId": "fsp001"
                            }
                        }
                    }
                },
                {
                    "Amt": {
                        "Amt": 0,
                        "Ccy": "USD"
                    },
                    "Agt": {
                        "FinInstnId": {
                            "ClrSysMmbId": {
                                "MmbId": "fsp002"
                            }
                        }
                    }
                }
            ],
            "AccptncDtTm": "2023-06-02T07:52:31.000Z",
            "InstgAgt": {
                "FinInstnId": {
                    "ClrSysMmbId": {
                        "MmbId": "fsp001"
                    }
                }
            },
            "InstdAgt": {
                "FinInstnId": {
                    "ClrSysMmbId": {
                        "MmbId": "fsp002"
                    }
                }
            }
        }
    }
}


export const publishingStatus = {
    Active: 'ACTIVE',
    Inactive: 'INACTIVE'
}

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
        label: 'Rule Builder',
        value: 'rule_builder',
        enabled: false
    },
    {
        label: 'Generate Test Cases',
        value: 'test_cases',
        enabled: false
    },
    {
        label: 'Simulation',
        value: 'simulation',
        enabled: false
    },
    {
        label: 'History',
        value: 'history',
        enabled: false
    },
]

export const MaskingTabs = [
    {
        label: 'Dataset',
        value: 'create',
        enabled: false
    },
    {
        label: 'Configure',
        value: 'configure',
        enabled: false
    }
]

export const SimulationTabs = [
    {
        label: 'New Simulation',
        value: 'new_simulation',
        enabled: false
    },
    {
        label: 'Execution',
        value: 'evaluation',
        enabled: false
    },
]

export const SimStudioTabs = [
    { label: 'Rule & Details',      value: 'create_generation',   enabled: false },
    { label: 'TXTP Selection',      value: 'txtp_selection',      enabled: false },
    { label: 'Trigger Data',        value: 'trigger_data',        enabled: false },
    { label: 'Enrichment Data',     value: 'enrichment_data',     enabled: false },
    { label: 'Preview & Save',      value: 'preview_save',        enabled: false },
    { label: 'Simulation Results',  value: 'simulation_results',  enabled: false },
]

export const claims = {
    editor: 'editor',
    approver: 'approver',
    publisher: 'publisher',
    data_engineer_editor: 'data_engineer_editor',
    data_engineer_approver: 'data_engineer_approver',
}

export const DATA_ENGINEER_ROLES: string[] = [
    claims.data_engineer_editor,
    claims.data_engineer_approver,
]

export const TRS_ROLES: string[] = [
    claims.editor,
    claims.approver,
    claims.publisher,
]

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

// Backward compatibility alias
export { sampleRuleRequest as sampelRuleRequest };


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

export const PII = [
    "Creditor Name",
    "Debtor Name",
    "Account Number",
    "Identity",
    "Phone Number",
    "Demographic",
];