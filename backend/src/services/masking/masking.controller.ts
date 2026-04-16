import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { Audit } from '../../decorators/audit.decorator';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from '../../decorators/swagger.decorator';
import { User } from '../../decorators/user.decorator';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateMaskDto, SuccessResponseDto } from './dto/mask.dto';
import { MaskingService } from './masking.service';

@ApiTags('Maskings')
@ApiBearerAuth('JWT-auth')
@Controller('masking')
@UseGuards(TazamaAuthGuard)
export class MaskingController {

    constructor(private readonly maskingService: MaskingService) { }

    @Post('/api/create')
    @RequireAnyClaims(TazamaClaims.DATA_ENGINEER_EDITOR)
    @Audit()
    @ApiBody({ type: CreateMaskDto, description: 'Masking data for creation' })
    @ApiSwagger({
        summary: 'Create new masking configuration',
        description: 'Creates a new masking configuration',
        responses: mergeResponses(
            CommonResponses.CREATED_201(SuccessResponseDto, 'Masking created successfully'),
            CommonResponses.BAD_REQUEST_400('Invalid input data or masking already exists'),
        ),
    })
    async createMask(
        @Body() body: CreateMaskDto,
        @User() user: AuthenticatedUser,
    ): Promise<ISuccess> {
        return await this.maskingService.create(body, user);
    }

}
