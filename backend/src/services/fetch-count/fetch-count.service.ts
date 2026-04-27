import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { FetchCountResponseDto } from './dto/fetch-count.dto';
import { AdminServiceClient } from '../admin-service-client';

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
    ) {}

  async fetchCount(token: string): Promise<FetchCountResponseDto> {
    const response = await this.adminServiceClient.fetchMaskingConfig(token);

    console.log('Raw response from fetchMaskingConfig:', response);

    const rawMasks = (response?.masks ?? []) as RawMask[];

    const tuples = rawMasks.map((m) => ({
      tenant_id: m.tenant_id,
      txtp: m.txtp,
      txtp_version: m.txtp_version,
    }));

    // these are the ones on which the simulation will run, 
    const activeMasks = await this.adminServiceClient.fetchActiveMaskingConfigs(tuples, token);

    const tokenizeByTxtp = new Map(rawMasks.map((m) => [m.txtp, m.tokenize]));
    const masksWithTokenize = activeMasks.map((m) => ({
      ...m,
      tokenize: tokenizeByTxtp.get(m.txtp) ?? null,
    }));

    console.log('Active masks with tokenize field:', masksWithTokenize);

    // payload
    // {
    //     "txtp": "pacs002",
    //     "mask_fields": [
    //         "name",
    //         "address"
    //     ],
    //     "startDtTm": "2026-01-28T00:00:00",
    //     "endDtTm": "2026-01-28T23:59:59"
    // }

    // const activeMasks = [
    //     {
    //         tenant_id: "cbe",
    //         txtp: "pacs002",
    //         txtp_version: "1.0.0",
    //         endpoint_path: "/cbe/1.0.0/evaluate/dems_pacs002"
    //     }
    // ];


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

    return { masks: masksWithTokenize, total: masksWithTokenize.length };
  }
}
