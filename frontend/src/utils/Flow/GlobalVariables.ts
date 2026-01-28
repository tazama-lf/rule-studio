// TypeScript types for Global Variables API response
export interface GlobalVariablesResponse {
  success: boolean;
  RuleRequest: Record<string, unknown>;
  RuleConfig: Record<string, unknown>;
  RuleResult?: Record<string, unknown>;
}

// Static fallback data (used when API is not available or loading)
export const globalVariables = {
  RuleRequest: {
    pain001: {
      GroupHeader: {
        MessageId: "MSG20251031001",
        CreationDateTime: "2025-10-31T15:19:24Z",
        NumberOfTransactions: "1",
        InitiatingParty: {
          Name: "ACME Corp"
        }
      },
      PaymentInformation: {
        PaymentInformationId: "PMTINF20251031001",
        PaymentMethod: "TRF",
        RequestedExecutionDate: "2025-11-01",
        Debtor: {
          Name: "ACME Corp"
        },
        DebtorAccount: {
          IBAN: "DE89370400440532013000"
        },
        DebtorAgent: {
          BIC: "DEUTDEFF"
        },
        CreditTransferTransactionInformation: [
          {
            PaymentId: {
              EndToEndId: "E2E20251031001"
            },
            Amount: {
              InstructedAmount: {
                Currency: "EUR",
                Value: "1000.00"
              }
            },
            CreditorAgent: {
              BIC: "COBADEFF"
            },
            Creditor: {
              Name: "John Doe"
            },
            CreditorAccount: {
              IBAN: "DE75512108001245126199"
            }
          }
        ]
      }
    },
    TenantId: "123"
  },
  RuleConfig: {
    config: {
      parameters: {
        amountThreshold: 5.00 // $5 threshold for Rule 500
      },
      bands: [
        { subRuleRef: '.01', lowerLimit: 0, upperLimit: 5 }, // Amount < $5 = Low risk
        { subRuleRef: '.02', lowerLimit: 5, upperLimit: Number.POSITIVE_INFINITY } // Amount >= $5 = Medium risk
      ]
    }
  },
  RuleResult: {
    id: "0060@1.0.0",
    cfg: "",
    subRuleRef: ".err",
    reason: "Unhandled rule result outcome",
    prcgTm: -1
  }
};
