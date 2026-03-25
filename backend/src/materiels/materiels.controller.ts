import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MaterielsService } from './materiels.service';
import { CreateMaterielDto } from './dto/create-materiel.dto';
import { UpdateMaterielDto } from './dto/update-materiel.dto';

@Controller('materiels')
export class MaterielsController {
  constructor(private readonly materielsService: MaterielsService) { }

  @Post()
  create(@Body() createMaterielDto: CreateMaterielDto) {
    return this.materielsService.create(createMaterielDto);
  }

  @Get()
  findAll() {
    return this.materielsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') numeroSerie: string) {
    return this.materielsService.findOne(numeroSerie);
  }

  @Patch(':id')
  update(@Param('id') numeroSerie: string, @Body() updateMaterielDto: UpdateMaterielDto) {
    return this.materielsService.update(numeroSerie, updateMaterielDto);
  }

  @Delete(':id')
  remove(@Param('id') numeroSerie: string) {
    return this.materielsService.remove(numeroSerie);
  }
}
