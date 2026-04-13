import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { Audit } from 'src/decorators/audit.decorator';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from 'src/decorators/swagger.decorator';
import { User } from 'src/decorators/user.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateMaskDto, Masking } from './dto/mask.dto';
import { MaskingService } from './masking.service';

@ApiTags('Maskings')
@ApiBearerAuth('JWT-auth')
@Controller('masking')
@UseGuards(TazamaAuthGuard)
export class MaskingController {

    constructor(private readonly maskingService: MaskingService) { }

    @Post('/api/create')
    @RequireAnyClaims(TazamaClaims.EDITOR)
    @Audit()
    @ApiBody({ type: Masking, description: 'Rule data for creation' })
    @ApiSwagger({
        summary: 'Create new masking configuration',
        description: 'Creates a new masking configuration',
        responses: mergeResponses(
            CommonResponses.CREATED_201(Masking, 'Masking created successfully'),
            CommonResponses.BAD_REQUEST_400('Invalid input data or masking already exists'),
        ),
    })
    async createRule(
        @Body() body: CreateMaskDto,
        @User() user: AuthenticatedUser,
    ): Promise<ISuccess> {
        return await this.maskingService.create(body, user);
    }

}
