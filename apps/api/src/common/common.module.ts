import { Module, Global } from '@nestjs/common';
import { GeoLocationService } from './services/geo-location.service';
import { ComplianceAuditService } from './services/compliance-audit.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CommonModule - Shared services available across the application
 *
 * This module is marked as @Global so services are available
 * everywhere without needing to import the module
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    GeoLocationService,
    ComplianceAuditService,
  ],
  exports: [
    GeoLocationService,
    ComplianceAuditService,
  ],
})
export class CommonModule {}
