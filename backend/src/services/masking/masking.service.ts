import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { AuthenticatedUser } from '../auth/auth.types';
import { AdminServiceClient } from '../admin-service-client';
import { CreateMaskDto } from './dto/mask.dto';

@Injectable()
export class MaskingService {

    private readonly logger = new Logger(MaskingService.name);

    constructor(
        private readonly adminServiceClient: AdminServiceClient
    ) { }

    async create(
        masking: CreateMaskDto,
        user: AuthenticatedUser
    ): Promise<ISuccess> {
        try {
            const payload = {
                txtp: masking.txtp,
                txtp_version: masking.txtpVersion,
            };
            return await this.adminServiceClient.createMask(payload, user.token.tokenString);
        } catch (error) {
            this.logger.error(
                `Error While Creating Masking : ${error instanceof Error ? error.message : String(error)}`,
            );

            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('duplicate key value violates unique constraint')) {
                throw new BadRequestException(
                    'A masking configuration with this type and version already exists. Please use a different type or version combination.'
                );
            } else {
                throw new BadRequestException(errorMessage);
            }
        }
    }
}
