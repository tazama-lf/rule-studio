import { Global, Module } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';

@Global()
@Module({
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
