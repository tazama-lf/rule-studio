import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {RuleConfig,RuleRequest, RuleResult} from '@tazama-lf/frms-coe-lib/lib/interfaces';

export class Rules {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  txtp: string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsOptional()
  @IsString()
  txtpVersion?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  publishing_status?: string;

  @IsOptional()
  @IsString()
  rule_type?: string;

  @IsOptional()
  @IsString()
  rule_config_id?: string;

  @IsOptional()
  @IsDateString()
  updated_at?: Date;

  @IsOptional()
  @IsDateString()
  created_at?: Date;
}

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  rule_id: string;

  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  txtp: string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsOptional()
  @IsString()
  txtpVersion?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  publishing_status?: string;

  @IsString()
  @IsNotEmpty()
  updated_by: string;

  @IsString()
  @IsNotEmpty()
  rule_type: string;

  @IsOptional()
  @IsString()
  rule_config_id?: string;
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  rule_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  txtp?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  txtpVersion?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  publishing_status?: string;

  @IsOptional()
  @IsString()
  rule_type?: string;

  @IsOptional()
  @IsString()
  rule_config_id?: string;
}

export class RuleIdDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsString()
  @IsNotEmpty()
  ruleCfg: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

export class RuleConfigurationDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsNotEmpty()
  configuration: any;
}

export class PositionDto {
  @IsNumber()
  @IsNotEmpty()
  x: number;

  @IsNumber()
  @IsNotEmpty()
  y: number;
}

export class NodeParamsDto {
  [key: string]: any;
}



export class FlowEdgeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  target: string;
}

export class FlowDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  @IsNotEmpty()
  nodes: FlowNodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowEdgeDto)
  @IsNotEmpty()
  edges: FlowEdgeDto[];
}

export class CreateRuleFlowDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  @IsNotEmpty()
  nodes: FlowNodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowEdgeDto)
  @IsNotEmpty()
  edges: FlowEdgeDto[];
}

export class ResponseRuleFlowDto {
  @IsString()
  @IsNotEmpty()
  rule_id: string;

  @IsObject()
  @IsNotEmpty()
  flow: FlowDto;
}

export class FlowNodeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsObject()
  @IsOptional()
  params?: NodeParamsDto;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ValidateNested()
  @Type(() => FlowDto)
  @IsOptional()
  nestedFlow?: FlowDto;
}

export class GlobalVariableDto {
  @IsNotEmpty()
  @IsObject()
  RuleRequest: RuleRequest;

  @IsNotEmpty()
  @IsObject()
  RuleConfig: RuleConfig;

  @IsNotEmpty()
  @IsObject()
  RuleResult: RuleResult;
}
