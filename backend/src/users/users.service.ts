import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../departments/entities/department.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailDto, UserSummaryDto } from './dto/user-summary.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) { }

  async findAll(): Promise<{ data: UserSummaryDto[]; message: string }> {
    const users = await this.usersRepository.find({
      relations: ['role', 'department'],
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        role: {
          id: user.role?.id,
          name: user.role?.name,
        },
        department: {
          id: user.department?.id,
          name: user.department?.name,
        },
      })),
      message: 'Liste des utilisateurs récupérée avec succès',
    };
  }

  async findOne(id: string): Promise<{ data: UserDetailDto; message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'permissions', 'department'],
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id "${id}" introuvable`);
    }

    return {
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: {
          id: user.role?.id,
          name: user.role?.name,
        },
        department: {
          id: user.department?.id,
          name: user.department?.name,
        },
        permissions: user.permissions.map(p => ({ id: p.id, name: p.name })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: 'Utilisateur récupéré avec succès',
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<{ data: UserDetailDto; message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'permissions', 'department'],
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id "${id}" introuvable`);
    }

    const { roleId, departmentId, permissionIds, ...fields } = dto;

    Object.assign(user, fields);

    if (roleId !== undefined) {
      const role = await this.rolesRepository.findOne({ where: { id: roleId } });
      if (!role) throw new NotFoundException(`Rôle avec l'id "${roleId}" introuvable`);
      user.role = role;
    }

    if (departmentId !== undefined) {
      const department = await this.departmentRepository.findOne({ where: { id: departmentId } });
      if (!department) throw new NotFoundException(`Département avec l'id "${departmentId}" introuvable`);
      user.department = department;
    }

    if (permissionIds !== undefined) {
      user.permissions = permissionIds.length
        ? await this.permissionsRepository.findBy({ id: In(permissionIds) })
        : [];
    }

    const saved = await this.usersRepository.save(user);

    return {
      data: {
        id: saved.id,
        fullName: saved.fullName,
        email: saved.email,
        role: { id: saved.role?.id, name: saved.role?.name },
        department: { id: saved.department?.id, name: saved.department?.name },
        permissions: saved.permissions.map(p => ({ id: p.id, name: p.name })),
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
      message: 'Utilisateur mis à jour avec succès',
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id "${id}" introuvable`);
    }

    await this.usersRepository.remove(user);

    return { message: 'Utilisateur supprimé avec succès' };
  }
}
