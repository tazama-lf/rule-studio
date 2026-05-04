import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import { FetchFromDlhService } from '../fetch-from-dlh/fetch-from-dlh.service';
import type { FetchFromDlhResponseDto } from '../fetch-from-dlh/dto/fetch-from-dlh.dto';

interface RawMask {
  id: number;
  tenant_id: string;
  txtp: string;
  txtp_version: string;
  tokenize: Record<string, unknown> | null;
  status: string;
  fields_masked: number;
  total_fields: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class FetchCountService {
  private readonly logger = new Logger(FetchCountService.name);

   constructor(
      private readonly adminServiceClient: AdminServiceClient,
      private readonly fetchFromDlhService: FetchFromDlhService,
    ) {}

  async fetchCount(startDtTm: string, endDtTm: string, token: string): Promise<FetchFromDlhResponseDto> {
    // const response = await this.adminServiceClient.fetchMaskingConfig(token);

    // const rawMasks = (response?.masks ?? []) as RawMask[];

    // const tuples = rawMasks.map((m) => ({
    //   tenant_id: m.tenant_id,
    //   txtp: m.txtp,
    //   txtp_version: m.txtp_version,
    // }));

    // // these are the ones on which the simulation will run, 
    // const activeMasks = await this.adminServiceClient.fetchActiveMaskingConfigs(tuples, token);

    // const tokenizeByTxtp = new Map(rawMasks.map((m) => [m.txtp, m.tokenize]));
    // const masksWithTokenize = activeMasks.map((m) => ({
    //   ...m,
    //   tokenize: tokenizeByTxtp.get(m.txtp) ?? null,
    // }));

    // console.log('Active masks with tokenize info:', masksWithTokenize);

     // ------------------ if txtp repeats in active configs, throw error ------------------
    // const txtp_counts = activeMasks.reduce<Record<string, number>>((acc, m) => {
    //   acc[m.txtp] = (acc[m.txtp] ?? 0) + 1;
    //   return acc;
    // }, {});

    // const duplicates = Object.entries(txtp_counts)
    //   .filter(([, count]) => count > 1)
    //   .map(([txtp]) => txtp);

    // if (duplicates.length > 0) {
    //   throw new HttpException(
    //     `Duplicate transaction type(s) found in active configurations: ${duplicates.join(', ')}`,
    //     HttpStatus.CONFLICT,
    //   );
    // }
    // ---------------------------------------------------------------------------------------


    // Build one DLH query per active masked txtp.
    // mask_fields: if tokenize is an array use it directly, otherwise use its keys.
    // const queries = masksWithTokenize.map((m) => ({
    //   txtp: m.txtp,
    //   mask_fields: Array.isArray(m.tokenize)
    //     ? (m.tokenize as string[])
    //     : Object.keys(m.tokenize ?? {}),
    //   startDtTm,
    //   endDtTm,
    //   endpoint_path: m.endpoint_path,
    // }));

    // currently, DLH only supports pacs002, so we'll hardcode a single query for that until we have more txtps and can test the multi-query logic
    const queries = [
  {
    txtp: 'pacs002',
    mask_fields: [],
    startDtTm: '2026-01-28T00:00:00',
    endDtTm: '2026-01-28T23:59:59',
    endpoint_path: '/cbe/1.0.0/evaluate/dems_pacs002',
  }
]

    console.log('Constructed DLH queries:', queries);

    // this.logger.log(`Fetching DLH data for ${queries.length} txtp(s): ${queries.map((q) => q.txtp).join(', ')}`);

    return await this.fetchFromDlhService.fetchFromDlh(queries, 'DEFAULT', token);
  }
}
