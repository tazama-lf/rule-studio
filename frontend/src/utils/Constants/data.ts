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
  "Customer Name",
  "Account Number",
  "Identity",
  "Phone Number",
  "Beneficiary Name",
  "Contact Information",
  "Demographic data",
];