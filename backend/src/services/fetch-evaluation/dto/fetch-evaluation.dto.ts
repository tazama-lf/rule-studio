import { ApiProperty } from '@nestjs/swagger';

export class FetchEvaluationRequestDto {
  @ApiProperty({ example: '2026-01-28T00:00:00', description: 'Start date-time filter (ISO 8601)' })
  startDtTm!: string;

  @ApiProperty({ example: '2026-01-28T23:59:59', description: 'End date-time filter (ISO 8601)' })
  endDtTm!: string;
}

export interface EvaluationRow {
  evaluation: Record<string, unknown>;
  messageid: string;
  tenantid: string;
  credttm: string;
  upddttm: string;
}

export class FetchEvaluationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ description: 'Fetched evaluation rows' })
  data?: EvaluationRow[];

  @ApiProperty({ example: 'Evaluations fetched successfully' })
  message?: string;
}
