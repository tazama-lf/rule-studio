export const RESET_TEST_CASE_PAYLOAD = {
  "nodes": [
    {
      "id": "start-node",
      "type": "Start",
      "label": "Start",
      "params": {},
      "position": {
        "x": 250,
        "y": 50
      }
    },
    {
      "id": "end-node",
      "type": "End",
      "label": "End",
      "params": {},
      "position": {
        "x": 254.10147599868117,
        "y": 1413.0441601616103
      }
    },
    {
      "id": "node-2",
      "type": "Import",
      "label": "Import",
      "params": {
        "importStatement": "/* eslint-disable @typescript-eslint/no-unused-vars */\nimport { type DataCache, type RuleConfig, type RuleRequest, type RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';\nimport {\n  DatabaseManagerMock,\n  determineOutcome,\n  LoggerServiceMock,\n  MockDatabaseManagerFactory,\n  MockLoggerServiceFactory,\n} from '@tazama-lf/frms-coe-lib/lib/tests/mocks';\nimport { handleTransaction, RuleExecutorConfig } from '../../src/rule';"
      },
      "position": {
        "x": 250.272705078125,
        "y": 168.2727279663086
      }
    },
    {
      "id": "node-4",
      "type": "RuleRequestFactory",
      "label": "Rule Request Factory",
      "params": {
        "factoryName": "getMockRequest",
        "ruleRequestData": "  const quote = {\n    transaction: JSON.parse(\n      `{\"TxTp\":\"pain.001.001.11\",\"TenantId\":\"tenantId\",\"CstmrCdtTrfInitn\":{\"GrpHdr\":{\"MsgId\":\"17fa-afea-48d6-b147-05c8463ea494\",\"CreDtTm\":\"2023-02-03T07:03:17.438Z\",\"NbOfTxs\":1,\"InitgPty\":{\"Id\":{\"PrvtId\":{\"Othr\":[{\"Id\":\"+36-432226947\",\"SchmeNm\":{\"Prtry\":\"MSISDN\"}}],\"DtAndPlcOfBirth\":{\"BirthDt\":\"1968-02-01\",\"CityOfBirth\":\"Unknown\",\"CtryOfBirth\":\"ZZ\"}}},\"Nm\":\"April Blake Grant\",\"CtctDtls\":{\"MobNb\":\"+36-432226947\"}}},\"PmtInf\":{\"Dbtr\":{\"Id\":{\"PrvtId\":{\"Othr\":[{\"Id\":\"+36-432226947\",\"SchmeNm\":{\"Prtry\":\"typolog028\"}}],\"DtAndPlcOfBirth\":{\"BirthDt\":\"1968-02-01\",\"CityOfBirth\":\"Unknown\",\"CtryOfBirth\":\"ZZ\"}}},\"Nm\":\"April Blake Grant\",\"CtctDtls\":{\"MobNb\":\"+36-432226947\"}},\"PmtMtd\":\"TRA\",\"DbtrAgt\":{\"FinInstnId\":{\"ClrSysMmbId\":{\"MmbId\":\"typolog028\"}}},\"DbtrAcct\":{\"Id\":{\"Othr\":[{\"Id\":\"+36-432226947\",\"SchmeNm\":{\"Prtry\":\"MSISDN\"}}]},\"Nm\":\"April Grant\"},\"PmtInfId\":\"23730c89dd57490a9a79f9b3747e3c08\",\"ReqdAdvcTp\":{\"DbtAdvc\":{\"Cd\":\"ADWD\",\"Prtry\":\"Advice with transaction details\"}},\"CdtTrfTxInf\":{\"Amt\":{\"EqvtAmt\":{\"Amt\":{\"Amt\":1234,\"Ccy\":\"USD\"},\"CcyOfTrf\":\"USD\"},\"InstdAmt\":{\"Amt\":{\"Amt\":31020.89,\"Ccy\":\"USD\"}}},\"Cdtr\":{\"Id\":{\"PrvtId\":{\"Othr\":[{\"Id\":\"+42-966969344\",\"SchmeNm\":{\"Prtry\":\"MSISDN\"}}],\"DtAndPlcOfBirth\":{\"BirthDt\":\"1935-05-08\",\"CityOfBirth\":\"Unknown\",\"CtryOfBirth\":\"ZZ\"}}},\"Nm\":\"Felicia Easton Quill\",\"CtctDtls\":{\"MobNb\":\"+42-966969344\"}},\"Purp\":{\"Cd\":\"MP2P\"},\"PmtId\":{\"EndToEndId\":\"8f37-9e6f-4c30-bb87-5e0e42f0f000\"},\"ChrgBr\":\"DEBT\",\"RmtInf\":{\"Ustrd\":\"Payment of USD 30713.75 from April to Felicia\"},\"CdtrAgt\":{\"FinInstnId\":{\"ClrSysMmbId\":{\"MmbId\":\"dfsp002\"}}},\"CdtrAcct\":{\"Id\":{\"Othr\":[{\"Id\":\"+42-966969344\",\"SchmeNm\":{\"Prtry\":\"MSISDN\"}}]},\"Nm\":\"Felicia Quill\"},\"PmtTpInf\":{\"CtgyPurp\":{\"Prtry\":\"TRANSFER BLANK\"}},\"RgltryRptg\":{\"Dtls\":{\"Cd\":\"100\",\"Tp\":\"BALANCE OF PAYMENTS\"}},\"SplmtryData\":{\"Envlp\":{\"Doc\":{\"Cdtr\":{\"FrstNm\":\"Felicia\",\"LastNm\":\"Quill\",\"MddlNm\":\"Easton\",\"MrchntClssfctnCd\":\"BLANK\"},\"Dbtr\":{\"FrstNm\":\"April\",\"LastNm\":\"Grant\",\"MddlNm\":\"Blake\",\"MrchntClssfctnCd\":\"BLANK\"},\"Xprtn\":\"2021-11-30T10:38:56.000Z\",\"DbtrFinSvcsPrvdrFees\":{\"Amt\":307.14,\"Ccy\":\"USD\"}}}}},\"ReqdExctnDt\":{\"Dt\":\"2023-02-03\",\"DtTm\":\"2023-02-03T07:03:17.438Z\"}},\"SplmtryData\":{\"Envlp\":{\"Doc\":{\"InitgPty\":{\"Glctn\":{\"Lat\":\"-3,1609\",\"Long\":\"38,3588\"},\"InitrTp\":\"CONSUMER\"}}}}}}`,\n    ),\n    networkMap: JSON.parse(\n      '{\"cfg\":\"1.0.0\",\"name\":\"Public E2E Test Network Map\",\"active\":true,\"messages\":[{\"id\":\"004@1.0.0\",\"cfg\":\"1.0.0\",\"txTp\":\"pacs.002.001.12\",\"typologies\":[{\"id\":\"typology-processor@1.0.0\",\"cfg\":\"999@1.0.0\",\"rules\":[{\"id\":\"EFRuP@1.0.0\",\"cfg\":\"none\"},{\"id\":\"901@1.0.0\",\"cfg\":\"1.0.0\"},{\"id\":\"902@1.0.0\",\"cfg\":\"1.0.0\"},{\"id\":\"028@1.0.0\",\"cfg\":\"1.0.0\"}],\"tenantId\":\"cbe\"},{\"id\":\"typology-processor-r28-r91@1.0.0\",\"cfg\":\"28-91@1.0.0\",\"rules\":[{\"id\":\"028@1.0.0\",\"cfg\":\"1.0.0\"},{\"id\":\"091@1.0.0\",\"cfg\":\"1.0.0\"}],\"tenantId\":\"cbe\"}]},{\"id\":\"transferamount@1.0.0\",\"cfg\":\"1.0.0\",\"txTp\":\"transferamount\",\"typologies\":[{\"id\":\"typology-processor-e2etest@1.0.0\",\"cfg\":\"e2etest@1.0.0\",\"rules\":[{\"id\":\"EFRuP@1.0.0\",\"cfg\":\"none\"},{\"id\":\"e2etest-amount@1.0.0\",\"cfg\":\"1.0.0\"}],\"tenantId\":\"cbe\"}]}],\"tenantId\":\"cbe\"}',\n    ),\n    DataCache: JSON.parse(\n      '{\"cdtrId\":\"tenantId+42-966969344MSISDN\",\"dbtrId\":\"+36-432226947typolog028\",\"cdtrAcctId\":\"+42-966969344MSISDNdfsp002\",\"intrBkSttlmAmt\":{\"ccy\":\"+36-432226947MSISDNtypolog028\"}}',\n    ),\n  };\n  return quote;"
      },
      "position": {
        "x": 249.64095928378782,
        "y": 412.7388060616423
      }
    },
    {
      "id": "node-5",
      "type": "RuleRequestScenario",
      "label": "Rule Request Scenario",
      "params": {
        "factoryName": "getMockRequestUnsuccessful",
        "modifications": "quote.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = 'RJCT';"
      },
      "position": {
        "x": 249.64095928378782,
        "y": 528.5967886893279
      }
    },
    {
      "id": "node-7",
      "type": "DataCacheFactory",
      "label": "Data Cache",
      "params": {
        "variableName": "dataCache",
        "dataCacheData": "{\"dbtrId\":\"dbtr_516c7065d75b4fcea6fffb52a9539357\",\"cdtrId\":\"cdtr_b086a1e193794192b32c8af8550d721d\",\"dbtrAcctId\":\"dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5\",\"cdtrAcctId\":\"cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64\"}"
      },
      "position": {
        "x": 248.0139447268396,
        "y": 754.2202436963653
      }
    },
    {
      "id": "node-8",
      "type": "DatabaseManager",
      "label": "Database Manager",
      "params": {
        "variableName": "databaseManager"
      },
      "position": {
        "x": 248.01394472683955,
        "y": 897.1714444464554
      }
    },
    {
      "id": "node-10",
      "type": "LoggerService",
      "label": "Logger Service",
      "params": {
        "variableName": "loggerService"
      },
      "position": {
        "x": 247.58558199540892,
        "y": 1016.6270366663143
      }
    },
    {
      "id": "node-11",
      "type": "Describe",
      "label": "Describe",
      "params": {
        "describeName": "handleTransaction"
      },
      "position": {
        "x": 792.8589551361913,
        "y": 1277.9041036920373
      }
    },
    {
      "id": "node-19",
      "type": "Describe",
      "label": "Describe",
      "params": {
        "describeName": "Exit Conditions"
      },
      "position": {
        "x": 1109.5023044600644,
        "y": 1277.538906982773
      }
    },
    {
      "id": "node-20",
      "type": "Code",
      "label": "Custom Code",
      "params": {
        "code": "let dataCache: DataCache;\r\nlet req: RuleRequest;"
      },
      "position": {
        "x": 1373.5023044600644,
        "y": 1285.538906982773
      }
    },
    {
      "id": "node-21",
      "type": "BeforeEach",
      "label": "beforeEach",
      "params": {
        "beforeEachCode": "dataCache = {\n    dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',\n    cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',\n    dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',\n    cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',\n};\nreq = getMockRequest();"
      },
      "position": {
        "x": 1646.565169102433,
        "y": 1285.815764272974
      }
    },
    {
      "id": "node-24",
      "type": "ErrorTestMissingBandsThrows",
      "label": "Error Test Missing bands throws",
      "params": {
        "dbData": "[1]",
        "testName": "No RuleConfig - bands",
        "expectStatement": "expect((error as Error).message).toBe('Invalid config provided - bands not provided');"
      },
      "position": {
        "x": 1944.3710766758882,
        "y": 1282.7073941754252
      }
    },
    {
      "id": "node-27",
      "type": "ErrorTestMissingExitConditions",
      "label": "Error Test: Missing exit conditions",
      "params": {
        "dbData": "[1, 2, 3]",
        "testName": "No exit conditions",
        "expectStatement": "expect((error as Error).message).toBe('Invalid config provided - exitConditions not provided');"
      },
      "position": {
        "x": 2218.075465523179,
        "y": 1280.9625849430104
      }
    },
    {
      "id": "node-30",
      "type": "ErrorTestNoTolerance",
      "label": "Error Test: No tolerance",
      "params": {
        "dbData": "[1, 2, 3]",
        "testName": "No tolerance",
        "expectStatement": "expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');"
      },
      "position": {
        "x": 2506.5588523829265,
        "y": 1278.7397461294172
      }
    },
    {
      "id": "node-31",
      "type": "ErrorTestToleranceNotNumber",
      "label": "Error Test: Tolerance not number",
      "params": {
        "dbData": "[1, 2, 3]",
        "testName": "No tolerance - not number",
        "toleranceValue": "zero point two",
        "expectStatement": "expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');"
      },
      "position": {
        "x": 2775.7552609407376,
        "y": 1281.7784919137457
      }
    },
    {
      "id": "node-32",
      "type": "Describe",
      "label": "Describe",
      "params": {
        "describeName": "Rule 021 Test"
      },
      "position": {
        "x": 247.86380177357933,
        "y": 1170.838902279596
      }
    },
    {
      "id": "node-33",
      "type": "BeforeEach",
      "label": "beforeEach",
      "params": {
        "beforeEachCode": "    loggerService = MockLoggerServiceFactory();\n    loggerService.resetMock();\n    databaseManager = MockDatabaseManagerFactory<RuleExecutorConfig>();\n    databaseManager.resetMock();"
      },
      "position": {
        "x": 489.8638017735793,
        "y": 1274.838902279596
      }
    },
    {
      "id": "node-35",
      "type": "RuleResultFactory",
      "label": "Rule Result Factory",
      "params": {
        "factoryName": "ruleResult",
        "ruleResultData": "const ruleResult: RuleResult = {\n  id: '021@1.0.0',\n  cfg: '1.0.0',\n  tenantId: 'DEFAULT',\n  subRuleRef: '.err',\n  reason: 'Unhandled rule result outcome',\n};"
      },
      "position": {
        "x": 254.51980367321798,
        "y": 641.4042954992578
      }
    },
    {
      "id": "node-37",
      "type": "RuleConfigFactory",
      "label": "Rule Config Factory",
      "params": {
        "factoryName": "getRuleConfig",
        "ruleConfigData": "{\"id\":\"e2etest-amount@1.0.0\",\"cfg\":\"1.0.0\",\"desc\":\"A large number of confusions - Me, myself, and I\",\"config\":{\"bands\":[{\"reason\":\"The amount is between 0 and 1999\",\"lowerLimit\":0,\"subRuleRef\":\".01\",\"upperLimit\":1999},{\"reason\":\"The amount is between 2000 and 4999\",\"lowerLimit\":2000,\"subRuleRef\":\".02\",\"upperLimit\":4999},{\"reason\":\"The amount is 5000 or more\",\"lowerLimit\":5000,\"subRuleRef\":\".03\"}],\"parameters\":{},\"exitConditions\":[]},\"tenantId\":\"cbe\"}"
      },
      "position": {
        "x": 249.81801190127777,
        "y": 280.27677848376595
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-nodesource-node-2target",
      "source": "start-node",
      "target": "node-2",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-4source-node-5target",
      "source": "node-4",
      "target": "node-5",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-7source-node-8target",
      "source": "node-7",
      "target": "node-8",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-8source-node-10target",
      "source": "node-8",
      "target": "node-10",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-19body-node-20target",
      "source": "node-19",
      "target": "node-20",
      "sourceHandle": "body",
      "targetHandle": "target",
      "label": "body",
      "style": {
        "stroke": "#9c27b0",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-20source-node-21target",
      "source": "node-20",
      "target": "node-21",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-30source-node-31target",
      "source": "node-30",
      "target": "node-31",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-10source-node-32target",
      "source": "node-10",
      "target": "node-32",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-32exit-end-nodetarget",
      "source": "node-32",
      "target": "end-node",
      "sourceHandle": "exit",
      "targetHandle": "target",
      "label": "exit",
      "style": {
        "stroke": "#000000",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-32body-node-33target",
      "source": "node-32",
      "target": "node-33",
      "sourceHandle": "body",
      "targetHandle": "target",
      "label": "body",
      "style": {
        "stroke": "#9c27b0",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-33source-node-11target",
      "source": "node-33",
      "target": "node-11",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-5source-node-35target",
      "source": "node-5",
      "target": "node-35",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-35source-node-7target",
      "source": "node-35",
      "target": "node-7",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-2source-node-37target",
      "source": "node-2",
      "target": "node-37",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-37source-node-4target",
      "source": "node-37",
      "target": "node-4",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-27source-node-30target",
      "source": "node-27",
      "target": "node-30",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-24source-node-27target",
      "source": "node-24",
      "target": "node-27",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-21source-node-24target",
      "source": "node-21",
      "target": "node-24",
      "sourceHandle": "source",
      "targetHandle": "target",
      "style": {
        "stroke": "#555",
        "strokeWidth": 2
      }
    },
    {
      "id": "xy-edge__node-11body-node-19target",
      "source": "node-11",
      "target": "node-19",
      "sourceHandle": "body",
      "targetHandle": "target",
      "label": "body",
      "style": {
        "stroke": "#9c27b0",
        "strokeWidth": 2
      }
    }
  ]
};
