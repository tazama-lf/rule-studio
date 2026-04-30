import { IsString, IsNotEmpty } from 'class-validator';

export class TransactionTypeDto {
  @IsString()
  @IsNotEmpty()
  transaction_type: string;

  @IsString()
  @IsNotEmpty()
  endpoint_path: string;
}
