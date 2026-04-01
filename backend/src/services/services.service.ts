import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity';
import { Department } from '../departments/entities/department.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(ServiceEntity)
        private readonly serviceRepository: Repository<ServiceEntity>,
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) { }

    private toResponse(service: ServiceEntity): ServiceResponseDto {
        return {
            id: service.id,
            name: service.name,
            code: service.code,
            department: {
                id: service.department.id,
                name: service.department.name,
                code: service.department.code,
            },
        };
    }

    private baseQuery() {
        return this.serviceRepository
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.department', 'department');
    }

    private async findOneOrThrow(id: number): Promise<ServiceEntity> {
        const service = await this.baseQuery()
            .where('service.id = :id', { id })
            .getOne();

        if (!service) {
            throw new NotFoundException(`Service avec l'id "${id}" introuvable`);
        }

        return service;
    }

    private async findDepartmentOrThrow(departmentId: number): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });

        if (!department) {
            throw new NotFoundException(
                `Département avec l'id "${departmentId}" introuvable`,
            );
        }

        return department;
    }

    private async ensureUniqueConstraints(
        dto: { name?: string; code?: string; departmentId?: number },
        excludeId?: number,
    ) {
        if (!dto.departmentId) {
            return;
        }

        if (dto.name) {
            const existingByName = await this.serviceRepository
                .createQueryBuilder('service')
                .leftJoin('service.department', 'department')
                .where('department.id = :departmentId', { departmentId: dto.departmentId })
                .andWhere('LOWER(service.name) = LOWER(:name)', { name: dto.name })
                .andWhere(excludeId ? 'service.id != :excludeId' : '1=1', { excludeId })
                .getOne();

            if (existingByName) {
                throw new ConflictException(
                    'Un service avec ce nom existe déjà dans ce département',
                );
            }
        }

        if (dto.code) {
            const existingByCode = await this.serviceRepository
                .createQueryBuilder('service')
                .leftJoin('service.department', 'department')
                .where('department.id = :departmentId', { departmentId: dto.departmentId })
                .andWhere('LOWER(service.code) = LOWER(:code)', { code: dto.code })
                .andWhere(excludeId ? 'service.id != :excludeId' : '1=1', { excludeId })
                .getOne();

            if (existingByCode) {
                throw new ConflictException(
                    'Un service avec ce code existe déjà dans ce département',
                );
            }
        }
    }

    async create(dto: CreateServiceDto) {
        const department = await this.findDepartmentOrThrow(dto.departmentId);
        await this.ensureUniqueConstraints(dto);

        const service = this.serviceRepository.create({
            name: dto.name,
            code: dto.code,
            department,
        });

        await this.serviceRepository.save(service);
        const created = await this.findOneOrThrow(service.id);

        return {
            data: this.toResponse(created),
            message: 'Service créé avec succès',
        };
    }

    async findAll() {
        const services = await this.baseQuery()
            .orderBy('service.id', 'ASC')
            .getMany();

        return {
            data: services.map((service) => this.toResponse(service)),
            message: 'Liste des services récupérée avec succès',
        };
    }

    async findByDepartment(departmentId: number) {
        await this.findDepartmentOrThrow(departmentId);

        const services = await this.baseQuery()
            .where('department.id = :departmentId', { departmentId })
            .orderBy('service.id', 'ASC')
            .getMany();

        return {
            data: services.map((service) => this.toResponse(service)),
            message: 'Liste des services du département récupérée avec succès',
        };
    }

    async findOne(id: number) {
        const service = await this.findOneOrThrow(id);

        return {
            data: this.toResponse(service),
            message: 'Service récupéré avec succès',
        };
    }

    async update(id: number, dto: UpdateServiceDto) {
        const service = await this.findOneOrThrow(id);

        const targetDepartmentId = dto.departmentId ?? service.department.id;

        if (
            dto.departmentId !== undefined &&
            dto.departmentId !== service.department.id
        ) {
            service.department = await this.findDepartmentOrThrow(dto.departmentId);
        }

        await this.ensureUniqueConstraints(
            {
                name: dto.name ?? service.name,
                code: dto.code ?? service.code,
                departmentId: targetDepartmentId,
            },
            id,
        );

        if (dto.name !== undefined) {
            service.name = dto.name;
        }

        if (dto.code !== undefined) {
            service.code = dto.code;
        }

        await this.serviceRepository.save(service);
        const updated = await this.findOneOrThrow(id);

        return {
            data: this.toResponse(updated),
            message: 'Service mis à jour avec succès',
        };
    }

    async remove(id: number) {
        const service = await this.serviceRepository.findOne({ where: { id } });

        if (!service) {
            throw new NotFoundException(`Service avec l'id "${id}" introuvable`);
        }

        await this.serviceRepository.remove(service);

        return {
            message: 'Service supprimé avec succès',
        };
    }
}
