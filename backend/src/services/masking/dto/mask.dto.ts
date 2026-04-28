import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SuccessResponseDto {
    @ApiProperty({ description: 'Whether the operation succeeded', example: true })
    success!: boolean;

    @ApiProperty({ description: 'Result message', example: 'Masking configuration created successfully' })
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