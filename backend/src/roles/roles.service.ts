import { ConflictException, Injectable } from '@nestjs/common';
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

  findAll() {
    return `This action returns all roles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
