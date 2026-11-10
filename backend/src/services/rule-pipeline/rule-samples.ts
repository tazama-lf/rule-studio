import { randomUUID } from 'node:crypto';

export type Message = Record<string, unknown> & { TxTp: string };

export function sampleTransactions(now = new Date()): Message[] {
  const id = (): string => randomUUID().replace(/-/g, '');
  const at = (offsetMs: number): string => new Date(now.getTime() + offsetMs).toISOString();
  const [endToEndId, instrId, debtor, creditor] = [id(), id(), id(), id()];
  const party = (name: string, ref: string): Record<string, unknown> => ({
    Nm: name,
    Id: { PrvtId: { DtAndPlcOfBirth: { BirthDt: '1968-02-01', CityOfBirth: 'Unknown', CtryOfBirth: 'ZZ' }, Othr: [{ Id: ref, SchmeNm: { Prtry: 'MSISDN' } }] } },
    CtctDtls: { MobNb: '+27-730975224' },
  });
  const account = (name: string, ref: string): Record<string, unknown> => ({ Id: { Othr: [{ Id: ref, SchmeNm: { Prtry: 'MSISDN' } }] }, Nm: name });
  const agent = (member: string): Record<string, unknown> => ({ FinInstnId: { ClrSysMmbId: { MmbId: member } } });
  const amount = { Amt: 100, Ccy: 'USD' };
  const pacs008: Message = {
    TxTp: 'pacs.008.001.10',
    FIToFICstmrCdtTrf: {
      GrpHdr: { MsgId: id(), CreDtTm: at(0), NbOfTxs: 1, SttlmInf: { SttlmMtd: 'CLRG' } },
      CdtTrfTxInf: {
        PmtId: { InstrId: instrId, EndToEndId: endToEndId },
        IntrBkSttlmAmt: { Amt: amount },
        InstdAmt: { Amt: amount },
        XchgRate: 1,
        ChrgBr: 'DEBT',
        ChrgsInf: { Amt: { Amt: 0, Ccy: 'USD' }, Agt: agent('fsp001') },
        InitgPty: party('Rule Studio Debtor', debtor),
        Dbtr: party('Rule Studio Debtor', debtor),
        DbtrAcct: account('Rule Studio Debtor', `${debtor}-acct`),
        DbtrAgt: agent('fsp001'),
        CdtrAgt: agent('fsp002'),
        Cdtr: party('Rule Studio Creditor', creditor),
        CdtrAcct: account('Rule Studio Creditor', `${creditor}-acct`),
        Purp: { Cd: 'MP2P' },
      },
      RgltryRptg: { Dtls: { Tp: 'BALANCE OF PAYMENTS', Cd: '100' } },
      RmtInf: { Ustrd: 'Rule Studio end-to-end check' },
      SplmtryData: { Envlp: { Doc: { Xprtn: at(60_000), InitgPty: { Glctn: { Lat: '-3.1609', Long: '38.3588' } } } } },
    },
  };
  const pacs002: Message = {
    TxTp: 'pacs.002.001.12',
    FIToFIPmtSts: {
      GrpHdr: { MsgId: id(), CreDtTm: at(1000) },
      TxInfAndSts: {
        OrgnlInstrId: instrId,
        OrgnlEndToEndId: endToEndId,
        TxSts: 'ACCC',
        ChrgsInf: [{ Amt: { Amt: 0, Ccy: 'USD' }, Agt: agent('fsp001') }],
        AccptncDtTm: at(1000),
        InstgAgt: agent('fsp001'),
        InstdAgt: agent('fsp002'),
      },
    },
  };
  return [pacs008, pacs002];
}

export const msgIdOf = (message: Record<string, unknown>): string | undefined =>
  Object.values(message)
    .map((part) => (part as { GrpHdr?: { MsgId?: string } } | undefined)?.GrpHdr?.MsgId)
    .find(Boolean);
