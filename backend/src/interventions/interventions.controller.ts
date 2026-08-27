import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Res,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Permissions } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import {
    CreateInterventionDto,
    InterventionResponseDto,
    UpdateInterventionDto,
} from './dto';
import { FindInterventionsQueryDto } from './dto/find-interventions-query.dto';
import { InterventionsService } from './interventions.service';

@Controller('interventions')
export class InterventionsController {
    constructor(private readonly interventionsService: InterventionsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('create-intervention')
    create(@Body() createInterventionDto: CreateInterventionDto, @Req() req: any) {
        const userId = (req.user as { id?: string } | undefined)?.id;
        return this.interventionsService.create(createInterventionDto, userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-interventions')
    findAll(
        @Query() filters: FindInterventionsQueryDto,
    ): Promise<{ data: InterventionResponseDto[]; message: string }> {
        return this.interventionsService.findAll(filters);
    }

    @Get('export/pdf')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-interventions')
    exportPdf(
        @Query() filters: FindInterventionsQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        return this.interventionsService.exportFilteredInterventionsToPdf(filters, res);
    }

    @Get('export/excel')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-interventions')
    exportExcel(
        @Query() filters: FindInterventionsQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        return this.interventionsService.exportFilteredInterventionsToExcel(filters, res);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-interventions')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<{ data: InterventionResponseDto; message: string }> {
        return this.interventionsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('update-intervention')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateInterventionDto: UpdateInterventionDto,
    ): Promise<{ data: InterventionResponseDto; message: string }> {
        return this.interventionsService.update(id, updateInterventionDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('delete-intervention')
    remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
        return this.interventionsService.remove(id);
    }
}
