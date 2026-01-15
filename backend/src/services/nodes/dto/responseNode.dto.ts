import { IsString, IsNotEmpty, IsOptional, IsJSON, IsDate } from 'class-validator';

export class ResponseNodesDto {
  @IsString()
  tenant_id: string;

  @IsString()
  created_by: string;

  @IsJSON()
  node_json: any;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
}