import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Permissions } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { InterventionResponseDto } from './dto/intervention-response.dto';
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
    findAll(): Promise<{ data: InterventionResponseDto[]; message: string }> {
        return this.interventionsService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-intervention')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<{ data: InterventionResponseDto; message: string }> {
        return this.interventionsService.findOne(id);
    }
}
