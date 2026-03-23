import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) { }

  async create(createPermissionDto: CreatePermissionDto) {
    const { name } = createPermissionDto;

    const isExistPermission = await this.permissionRepository.findOne({ where: { name } });
    if (isExistPermission) {
      throw new ConflictException('La permission existe déjà');
    }

    const permission = await this.permissionRepository.create({ name });
    await this.permissionRepository.save(permission);

    return {
      data: permission,
      message: 'Permission créée avec succès',
    }
  }

  async findAll() {
    const permissions = await this.permissionRepository.find();

    return {
      data: permissions,
      message: 'Permissions récupérées avec succès',
    };
  }

  async findOne(id: number) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['users', 'users.role'],
    });

    if (!permission) {
      throw new NotFoundException("Permission non trouvée");
    }

    return {
      data: {
        id: permission.id,
        name: permission.name,
        users: permission.users?.map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
            ? {
              id: user.role.id,
              name: user.role.name,
            }
            : null,
        })) ?? [],
      },
      message: 'Permission récupérée avec succès',
    }
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.permissionRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException("Permission non trouvée");
    }

    Object.assign(permission, updatePermissionDto);

    try {
      await this.permissionRepository.save(permission);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('La permission existe déjà');
      }
      throw error;
    }

    return {
      data: permission,
      message: 'Permission mise à jour avec succès',
    };
  }

  async remove(id: number) {
    const permission = await this.permissionRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException("Permission non trouvée");
    }

    await this.permissionRepository.remove(permission);

    return {
      data: permission,
      message: 'Permission supprimée avec succès',
    };
  }
}
