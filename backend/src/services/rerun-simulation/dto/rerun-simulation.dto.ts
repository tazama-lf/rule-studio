import { IsString, IsNotEmpty } from 'class-validator';

export class RerunSimulationRequestDto {
  @IsString()
  @IsNotEmpty()
  tableName!: string;
}

export interface RerunSimulationResponseDto {
  jobId: string;
  tableName: string;
}
