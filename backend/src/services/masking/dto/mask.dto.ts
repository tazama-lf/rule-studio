import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SuccessResponseDto {
    @ApiProperty({ description: 'Operation success status', example: true })
    @IsBoolean()
    success!: boolean;

    @ApiProperty({ description: 'Success message', example: 'Masking created successfully' })
    @IsString()
    message!: string;
}

export class MaskDto {
    @ApiProperty({ description: 'Transaction type', example: 'pain.001.001.11' })
    @IsString()
    @IsNotEmpty()
    txtp!: string;

    @ApiPropertyOptional({ description: 'Transaction type version', example: '11' })
    @IsOptional()
    @IsString()
    txtpVersion?: string;
}


export class CreateMaskDto extends MaskDto { }

export class Masking extends MaskDto {
    @IsString()
    id!: string;

    @IsDateString()
    updated_at!: string;

    @IsDateString()
    created_at!: string;
}