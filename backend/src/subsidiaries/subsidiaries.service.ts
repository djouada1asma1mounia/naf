import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subsidiary } from './entities/subsidiary.entity';
import { CreateSubsidiaryDto } from './dto/create-subsidiary.dto';
import { UpdateSubsidiaryDto } from './dto/update-subsidiary.dto';

@Injectable()
export class SubsidiariesService {
    constructor(
        @InjectRepository(Subsidiary)
        private readonly subsidiariesRepository: Repository<Subsidiary>,
    ) { }

    private async findOneOrThrow(code: string): Promise<Subsidiary> {
        const subsidiary = await this.subsidiariesRepository.findOne({
            where: { code },
        });

        if (!subsidiary) {
            throw new NotFoundException(`Filiale avec le code "${code}" introuvable`);
        }

        return subsidiary;
    }

    async create(dto: CreateSubsidiaryDto) {
        const existingByCode = await this.subsidiariesRepository.findOne({
            where: { code: dto.code },
            select: { code: true },
        });

        if (existingByCode) {
            throw new ConflictException('Une filiale avec ce code existe déjà');
        }

        const existingByName = await this.subsidiariesRepository.findOne({
            where: { name: dto.name },
            select: { code: true },
        });

        if (existingByName) {
            throw new ConflictException('Une filiale avec ce nom existe déjà');
        }

        const subsidiary = this.subsidiariesRepository.create(dto);
        await this.subsidiariesRepository.save(subsidiary);

        return {
            data: subsidiary,
            message: 'Filiale créée avec succès',
        };
    }

    async findAll() {
        const subsidiaries = await this.subsidiariesRepository
            .createQueryBuilder('subsidiary')
            .orderBy('subsidiary.code', 'ASC')
            .getMany();

        return {
            data: subsidiaries,
            message: 'Liste des filiales récupérée avec succès',
        };
    }

    async findOne(code: string) {
        const subsidiary = await this.findOneOrThrow(code);

        return {
            data: subsidiary,
            message: 'Filiale récupérée avec succès',
        };
    }

    async update(code: string, dto: UpdateSubsidiaryDto) {
        const subsidiary = await this.findOneOrThrow(code);

        if (dto.code && dto.code !== subsidiary.code) {
            const existingByCode = await this.subsidiariesRepository.findOne({
                where: { code: dto.code },
                select: { code: true },
            });
            if (existingByCode) {
                throw new ConflictException('Une filiale avec ce code existe déjà');
            }
            subsidiary.code = dto.code;
        }

        if (dto.name && dto.name !== subsidiary.name) {
            const existingByName = await this.subsidiariesRepository.findOne({
                where: { name: dto.name },
                select: { code: true },
            });
            if (existingByName) {
                throw new ConflictException('Une filiale avec ce nom existe déjà');
            }
            subsidiary.name = dto.name;
        }

        await this.subsidiariesRepository.save(subsidiary);

        return {
            data: subsidiary,
            message: 'Filiale mise à jour avec succès',
        };
    }

    async remove(code: string) {
        const subsidiary = await this.findOneOrThrow(code);
        await this.subsidiariesRepository.remove(subsidiary);

        return {
            message: 'Filiale supprimée avec succès',
        };
    }
}
