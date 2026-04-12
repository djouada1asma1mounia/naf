import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Permissions } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { ExportsService } from './exports.service';

@Controller('exports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    @Get('excel')
    @Permissions('export-all-data')
    async exportAllModelsToExcel(@Res() res: Response): Promise<void> {
        await this.exportsService.exportAllModelsToExcel(res);
    }
}
