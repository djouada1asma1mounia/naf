import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { MaterielsService } from './materiels.service';
import { CreateMaterielDto } from './dto/create-materiel.dto';
import { UpdateMaterielDto } from './dto/update-materiel.dto';
import { MaterielResponseDto } from './dto/materiel-response.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { Permissions } from 'src/permissions/permissions.decorator';

@Controller('materiels')
export class MaterielsController {
  constructor(private readonly materielsService: MaterielsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create-materiel')
  create(@Body() createMaterielDto: CreateMaterielDto) {
    return this.materielsService.create(createMaterielDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read-materiels')
  findAll(): Promise<{ data: MaterielResponseDto[]; message: string }> {
    return this.materielsService.findAll();
  }

  @Get('by-subsidiary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read-materiels')
  findBySubsidiary(
    @Query('subsidiaryCode') subsidiaryCode?: string,
  ): Promise<{ data: MaterielResponseDto[]; message: string }> {
    return this.materielsService.findBySubsidiary(subsidiaryCode);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read-my-materiels')
  findMyMaterials(
    @Req() req: any,
  ): Promise<{ data: MaterielResponseDto[]; message: string }> {
    const userId = (req.user as { id?: string } | undefined)?.id;
    return this.materielsService.findMine(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read-materiels')
  findOne(@Param('id') numeroSerie: string): Promise<{ data: MaterielResponseDto; message: string }> {
    return this.materielsService.findOne(numeroSerie);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update-materiel')
  update(@Param('id') numeroSerie: string, @Body() updateMaterielDto: UpdateMaterielDto) {
    return this.materielsService.update(numeroSerie, updateMaterielDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete-materiel')
  remove(@Param('id') numeroSerie: string) {
    return this.materielsService.remove(numeroSerie);
  }
}
