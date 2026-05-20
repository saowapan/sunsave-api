import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const dbStatus = await this.checkDatabase();
    const allHealthy = dbStatus.status === 'ok';

    const payload = {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbStatus,
      },
    };

    if (!allHealthy) {
      // 503 — load balancers, k8s readiness probes, uptime monitors look for this
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'down';
    error?: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
