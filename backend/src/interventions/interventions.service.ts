import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import {
    CreateInterventionDto,
    InterventionResponseDto,
    UpdateInterventionDto,
} from './dto';
import { Intervention } from './entities/intervention.entity';
import { InterventionItem } from './entities/intervention-item.entity';

@Injectable()
export class InterventionsService {
    constructor(
        @InjectRepository(Intervention)
        private readonly interventionsRepository: Repository<Intervention>,
    ) { }

    private baseQuery(repository: Repository<Intervention> = this.interventionsRepository) {
        return repository
            .createQueryBuilder('intervention')
            .leftJoinAndSelect('intervention.items', 'item')
            .leftJoinAndSelect('intervention.createdBy', 'createdBy')
            .addSelect(['createdBy.id', 'createdBy.nom', 'createdBy.prenom', 'createdBy.email'])
            .orderBy('intervention.createdAt', 'DESC')
            .addOrderBy('item.id', 'ASC');
    }

    private async generateReferenceForCurrentYear(transactionalRepository: Repository<Intervention>): Promise<string> {
        const currentYear = new Date().getFullYear();
        const likePattern = `%/${currentYear}`;

        const rows = await transactionalRepository.query(
            `
            SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(reference, '/', 1) AS UNSIGNED)), 0) AS maxNumber
            FROM interventions
            WHERE reference LIKE ?
            FOR UPDATE
            `,
            [likePattern],
        );

        const currentMax = Number(rows?.[0]?.maxNumber || 0);
        const nextNumber = currentMax + 1;

        return `${nextNumber}/${currentYear}`;
    }

    private async getInterventionOrFail(
        id: number,
        repository: Repository<Intervention> = this.interventionsRepository,
    ): Promise<Intervention> {
        const intervention = await this.baseQuery(repository)
            .where('intervention.id = :id', { id })
            .getOne();

        if (!intervention) {
            throw new NotFoundException(`Intervention avec l'id "${id}" introuvable`);
        }

        return intervention;
    }

    async create(createInterventionDto: CreateInterventionDto, userId?: string) {
        return this.interventionsRepository.manager.transaction(async (manager) => {
            const interventionRepository = manager.getRepository(Intervention);
            const itemRepository = manager.getRepository(InterventionItem);
            const userRepository = manager.getRepository(User);

            const reference = await this.generateReferenceForCurrentYear(interventionRepository);

            let createdBy: User | undefined;
            if (userId) {
                const user = await userRepository.findOne({ where: { id: userId } });
                createdBy = user || undefined;
            }

            const intervention = interventionRepository.create({
                reference,
                interventionType: createInterventionDto.interventionType,
                status: createInterventionDto.status,
                observation: createInterventionDto.observation,
                destinataire: createInterventionDto.destinataire,
                interventionnaireNom: createInterventionDto.interventionnaireNom,
                interventionnairePrenom: createInterventionDto.interventionnairePrenom,
                interventionnaireFonction: createInterventionDto.interventionnaireFonction,
                createdBy,
            });

            const savedIntervention = await interventionRepository.save(intervention);

            const items = createInterventionDto.items.map((item) =>
                itemRepository.create({
                    designation: item.designation,
                    quantity: item.quantity,
                    marque: item.marque,
                    numeroSerie: item.numeroSerie,
                    numeroInventaire: item.numeroInventaire,
                    intervention: savedIntervention,
                }),
            );

            await itemRepository.save(items);

            const created = await this.baseQuery()
                .where('intervention.id = :id', { id: savedIntervention.id })
                .getOne();

            return {
                data: created as InterventionResponseDto,
                message: 'Intervention créée avec succès',
            };
        });
    }

    async findAll(): Promise<{ data: InterventionResponseDto[]; message: string }> {
        const data = await this.baseQuery().getMany();

        return {
            data: data as InterventionResponseDto[],
            message: 'Liste des interventions récupérée avec succès',
        };
    }

    async findOne(id: number): Promise<{ data: InterventionResponseDto; message: string }> {
        const intervention = await this.getInterventionOrFail(id);

        return {
            data: intervention as InterventionResponseDto,
            message: 'Intervention récupérée avec succès',
        };
    }

    async update(
        id: number,
        updateInterventionDto: UpdateInterventionDto,
    ): Promise<{ data: InterventionResponseDto; message: string }> {
        return this.interventionsRepository.manager.transaction(async (manager) => {
            const interventionRepository = manager.getRepository(Intervention);
            const itemRepository = manager.getRepository(InterventionItem);

            const existingIntervention = await interventionRepository.findOne({ where: { id } });
            if (!existingIntervention) {
                throw new NotFoundException(`Intervention avec l'id "${id}" introuvable`);
            }

            const interventionPayload: Partial<Intervention> = {
                interventionType: updateInterventionDto.interventionType,
                status: updateInterventionDto.status,
                observation: updateInterventionDto.observation,
                destinataire: updateInterventionDto.destinataire,
                interventionnaireNom: updateInterventionDto.interventionnaireNom,
                interventionnairePrenom: updateInterventionDto.interventionnairePrenom,
                interventionnaireFonction: updateInterventionDto.interventionnaireFonction,
            };

            Object.keys(interventionPayload).forEach((key) => {
                const typedKey = key as keyof Intervention;
                if (interventionPayload[typedKey] === undefined) {
                    delete interventionPayload[typedKey];
                }
            });

            if (Object.keys(interventionPayload).length > 0) {
                await interventionRepository.update(id, interventionPayload);
            }

            if (updateInterventionDto.items !== undefined) {
                await itemRepository
                    .createQueryBuilder()
                    .delete()
                    .from(InterventionItem)
                    .where('interventionId = :interventionId', { interventionId: id })
                    .execute();

                const newItems = updateInterventionDto.items.map((item) =>
                    itemRepository.create({
                        designation: item.designation,
                        quantity: item.quantity,
                        marque: item.marque,
                        numeroSerie: item.numeroSerie,
                        numeroInventaire: item.numeroInventaire,
                        intervention: { id } as Intervention,
                    }),
                );

                if (newItems.length > 0) {
                    await itemRepository.save(newItems);
                }
            }

            const updated = await this.getInterventionOrFail(id, interventionRepository);

            return {
                data: updated as InterventionResponseDto,
                message: 'Intervention mise à jour avec succès',
            };
        });
    }

    async remove(id: number): Promise<{ message: string }> {
        const result = await this.interventionsRepository.delete(id);

        if (!result.affected) {
            throw new NotFoundException(`Intervention avec l'id "${id}" introuvable`);
        }

        return {
            message: 'Intervention supprimée avec succès',
        };
    }
}
