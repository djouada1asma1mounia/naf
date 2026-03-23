import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>) {
  }

  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;

    const existingRole = await this.roleRepository.findOne({ where: { name } });

    if (existingRole) {
      throw new ConflictException('Le rôle existe déjà');
    }

    const role = this.roleRepository.create({ name });

    await this.roleRepository.save(role);

    return {
      data: role,
      message: 'Rôle créé avec succès',
    }
  }

  async findAll() {
    const roles = await this.roleRepository.find();
    return {
      data: roles,
      message: 'Rôles récupérés avec succès',
    };
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException("Rôle non trouvé");
    }

    return {
      data: {
        id: role.id,
        name: role.name,
        users: role.users?.map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        })) ?? [],
      },
      message: 'Rôle récupéré avec succès',
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { name } = updateRoleDto;
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException("Rôle non trouvé");
    }

    const existingRole = await this.roleRepository.findOne({ where: { name } });

    if (existingRole && existingRole.id !== id) {
      throw new ConflictException('Le rôle existe déjà');
    }

    const updatedRole = await this.roleRepository.save({ ...role, name });

    return {
      data: updatedRole,
      message: 'Rôle mis à jour avec succès',
    }
  }

  async remove(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException("Rôle non trouvé");
    }

    await this.roleRepository.remove(role);

    return {
      message: 'Rôle supprimé avec succès',
    }
  }
}
