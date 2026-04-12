import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { Permissions } from 'src/permissions/permissions.decorator';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('create-service')
    create(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(createServiceDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-services')
    findAll() {
        return this.servicesService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-services')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.servicesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('update-service')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateServiceDto: UpdateServiceDto,
    ) {
        return this.servicesService.update(id, updateServiceDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('delete-service')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.servicesService.remove(id);
    }
}
