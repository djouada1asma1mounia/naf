import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User } from 'src/users/entities/user.entity';
import { DepartmentResponseDto } from './dto/department-response.dto';

@Injectable()
export class DepartmentsService {

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  private toResponse(department: Department): DepartmentResponseDto {
    const manager = department.managerId
      ? { id: department.managerId.id, fullName: department.managerId.fullName }
      : null;

    return {
      id: department.id,
      name: department.name,
      code: department.code,
      manager,
    };
  }

  private async findOneWithManagerOrThrow(id: number): Promise<Department> {
    const department = await this.departmentRepository
      .createQueryBuilder('department')
      .leftJoin('department.managerId', 'manager')
      .addSelect(['manager.id', 'manager.nom', 'manager.prenom'])
      .where('department.id = :id', { id })
      .getOne();

    if (!department) {
      throw new NotFoundException(`Département avec l'id "${id}" introuvable`);
    }

    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const { name, code, managerId } = dto;
    const existing = await this.departmentRepository.findOne({
      where: [{ name }, { code }],
      select: { id: true, name: true, code: true },
    });
    if (existing) {
      if (existing.name === name) {
        throw new ConflictException('Un département avec ce nom existe déjà');
      }
      throw new ConflictException('Un département avec ce code existe déjà');
    }

    const department = this.departmentRepository.create({ name, code });

    if (managerId) {
      const manager = await this.userRepository.findOne({
        where: { id: managerId },
        select: { id: true, nom: true, prenom: true },
      });
      if (!manager) {
        throw new NotFoundException(`Utilisateur avec l'id "${managerId}" introuvable`);
      }
      department.managerId = manager;
    }

    await this.departmentRepository.save(department);
    return { data: this.toResponse(department), message: 'Département créé avec succès' };
  }

  async findAll() {
    const departments = await this.departmentRepository
      .createQueryBuilder('department')
      .leftJoin('department.managerId', 'manager')
      .addSelect(['manager.id', 'manager.nom', 'manager.prenom'])
      .orderBy('department.id', 'ASC')
      .getMany();

    return {
      data: departments.map((d) => this.toResponse(d)),
      message: 'Liste des départements récupérée avec succès',
    };
  }

  async findOne(id: number) {
    const department = await this.findOneWithManagerOrThrow(id);
    return { data: this.toResponse(department), message: 'Département récupéré avec succès' };
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    const department = await this.findOneWithManagerOrThrow(id);

    if (dto.code && dto.code !== department.code) {
      const existingByCode = await this.departmentRepository.findOne({
        where: { code: dto.code },
        select: { id: true },
      });
      if (existingByCode) {
        throw new ConflictException('Un département avec ce code existe déjà');
      }
    }

    const { managerId, ...rest } = dto as UpdateDepartmentDto & { managerId?: string };
    Object.assign(department, rest);

    if (managerId !== undefined) {
      if (managerId === null || managerId === '') {
        department.managerId = undefined;
      } else {
        const manager = await this.userRepository.findOne({
          where: { id: managerId },
          select: { id: true, nom: true, prenom: true },
        });
        if (!manager) {
          throw new NotFoundException(`Utilisateur avec l'id "${managerId}" introuvable`);
        }
        department.managerId = manager;
      }
    }

    await this.departmentRepository.save(department);
    return { data: this.toResponse(department), message: 'Département mis à jour avec succès' };
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
