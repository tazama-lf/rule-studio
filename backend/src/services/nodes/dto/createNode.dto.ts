// ...existing code...
import { IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNodeDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  code_template?: string;

  @IsJSON()
  @IsOptional()
  default_data?: any;
}