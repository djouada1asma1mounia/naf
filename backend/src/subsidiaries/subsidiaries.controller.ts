import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SubsidiariesService } from './subsidiaries.service';
import { CreateSubsidiaryDto } from './dto/create-subsidiary.dto';
import { UpdateSubsidiaryDto } from './dto/update-subsidiary.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { Permissions } from 'src/permissions/permissions.decorator';

@Controller('subsidiaries')
export class SubsidiariesController {
    constructor(private readonly subsidiariesService: SubsidiariesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('create-subsidiary')
    create(@Body() createSubsidiaryDto: CreateSubsidiaryDto) {
        return this.subsidiariesService.create(createSubsidiaryDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-subsidiaries')
    findAll() {
        return this.subsidiariesService.findAll();
    }

    @Get(':code')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read-subsidiaries')
    findOne(@Param('code') code: string) {
        return this.subsidiariesService.findOne(code);
    }

    @Patch(':code')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('update-subsidiary')
    update(
        @Param('code') code: string,
        @Body() updateSubsidiaryDto: UpdateSubsidiaryDto,
    ) {
        return this.subsidiariesService.update(code, updateSubsidiaryDto);
    }

    @Delete(':code')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('delete-subsidiary')
    remove(@Param('code') code: string) {
        return this.subsidiariesService.remove(code);
    }
}
