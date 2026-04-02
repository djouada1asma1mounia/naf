import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Res,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Permissions } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { CreateDechargeDto } from './dto/create-decharge.dto';
import { DechargeResponseDto } from './dto/decharge-response.dto';
import { DechargesService } from './decharges.service';

@Controller('decharges')
export class DechargesController {
    constructor(private readonly dechargesService: DechargesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('create-decharge')
    create(@Body() createDechargeDto: CreateDechargeDto, @Req() req: any) {
        const userId = (req.user as { id?: string } | undefined)?.id;
        return this.dechargesService.create(createDechargeDto, userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-decharges')
    findAll(): Promise<{ data: DechargeResponseDto[]; message: string }> {
        return this.dechargesService.findAll();
    }

    @Get(':id/pdf')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-decharge')
    async generatePdf(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ): Promise<void> {
        const result = await this.dechargesService.generatePdf(id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
        res.send(result.buffer);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-decharge')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<{ data: DechargeResponseDto; message: string }> {
        return this.dechargesService.findOne(id);
    }
}
