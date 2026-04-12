import {
    BadRequestException,
    Controller,
    Get,
    HttpCode,
    Post,
    Query,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Permissions } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { ExportsService } from './exports.service';
import { ImportExcelQueryDto } from './dto/import-excel-query.dto';

@Controller('exports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    @Get('excel')
    @Permissions('export-all-data')
    async exportAllModelsToExcel(@Res() res: Response): Promise<void> {
        await this.exportsService.exportAllModelsToExcel(res);
    }

    @Post('excel/import')
    @HttpCode(200)
    @Permissions('export-all-data')
    @UseInterceptors(FileInterceptor('file'))
    async importAllModelsFromExcel(
        @UploadedFile() file: { buffer: Buffer },
        @Query() query: ImportExcelQueryDto,
    ) {
        if (!file?.buffer) {
            throw new BadRequestException('Fichier Excel requis');
        }

        return this.exportsService.importAllModelsFromExcel(file.buffer, {
            onMissingForeign: query.onMissingForeign ?? 'skip',
            batchSize: query.batchSize ?? 200,
            transactionMode: query.transactionMode ?? 'partial',
        });
    }
}
