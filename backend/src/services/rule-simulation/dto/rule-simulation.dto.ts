import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ExcludedTypeProps {
    @IsOptional()
    @IsString()
    masking_id?: null | string;

    @IsString()
    @IsNotEmpty()
    txtp?: string;

    @IsString()
    @IsNotEmpty()
    txtp_version?: string;

    @IsString()
    @IsNotEmpty()
    record_status?: string;
}
