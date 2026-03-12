import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) { }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.departmentRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Un département avec ce nom existe déjà');
    }
    const department = this.departmentRepository.create(dto);
    await this.departmentRepository.save(department);
    return { data: department, message: 'Département créé avec succès' };
  }

  async findAll() {
    const departments = await this.departmentRepository.find({ order: { id: 'ASC' } });
    return { data: departments, message: 'Liste des départements récupérée avec succès' };
  }

  async findOne(id: number) {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Département avec l'id "${id}" introuvable`);
    }
    return { data: department, message: 'Département récupéré avec succès' };
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Département avec l'id "${id}" introuvable`);
    }
    Object.assign(department, dto);
    await this.departmentRepository.save(department);
    return { data: department, message: 'Département mis à jour avec succès' };
  }

  async remove(id: number) {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Département avec l'id "${id}" introuvable`);
    }
    await this.departmentRepository.remove(department);
    return { message: 'Département supprimé avec succès' };
  }
}
