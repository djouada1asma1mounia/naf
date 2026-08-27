import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import PDFDocument = require('pdfkit');
import { SelectQueryBuilder, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Materiel } from 'src/materiels/entities/materiel.entity';
import { Department } from 'src/departments/entities/department.entity';
import {
    CreateInterventionDto,
    InterventionResponseDto,
    UpdateInterventionDto,
} from './dto';
import { Intervention } from './entities/intervention.entity';
import { InterventionItem } from './entities/intervention-item.entity';
import { FindInterventionsQueryDto } from './dto/find-interventions-query.dto';

@Injectable()
export class InterventionsService {
    constructor(
        @InjectRepository(Intervention)
        private readonly interventionsRepository: Repository<Intervention>,
        @InjectRepository(Materiel)
        private readonly materielsRepository: Repository<Materiel>,
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
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

    private parseDayBounds(dateInput: string): { start: Date; endExclusive: Date } {
        const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateInput);
        const start = isDateOnly ? new Date(`${dateInput}T00:00:00.000Z`) : new Date(dateInput);

        if (Number.isNaN(start.getTime())) {
            throw new BadRequestException(`Date invalide: ${dateInput}`);
        }

        if (isDateOnly) {
            const endExclusive = new Date(start);
            endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
            return { start, endExclusive };
        }

        const endExclusive = new Date(start);
        endExclusive.setUTCHours(23, 59, 59, 999);
        endExclusive.setUTCMilliseconds(endExclusive.getUTCMilliseconds() + 1);

        return { start, endExclusive };
    }

    private applyFilters(
        queryBuilder: SelectQueryBuilder<Intervention>,
        filters?: FindInterventionsQueryDto,
    ): SelectQueryBuilder<Intervention> {
        if (!filters) {
            return queryBuilder;
        }

        const { type, status, structure, date, dateFrom, dateTo } = filters;

        if (date && (dateFrom || dateTo)) {
            throw new BadRequestException(
                'Le filtre date est exclusif: utilisez soit date, soit dateFrom/dateTo.',
            );
        }

        if (type) {
            queryBuilder.andWhere('intervention.interventionType = :type', { type });
        }

        if (status) {
            queryBuilder.andWhere('intervention.status = :status', { status });
        }

        if (structure) {
            queryBuilder.andWhere('LOWER(intervention.destinataire) LIKE LOWER(:structure)', {
                structure: `%${structure.trim()}%`,
            });
        }

        if (date) {
            const { start, endExclusive } = this.parseDayBounds(date);
            queryBuilder
                .andWhere('intervention.createdAt >= :dateStart', { dateStart: start })
                .andWhere('intervention.createdAt < :dateEndExclusive', {
                    dateEndExclusive: endExclusive,
                });

            return queryBuilder;
        }

        if (dateFrom) {
            const { start } = this.parseDayBounds(dateFrom);
            queryBuilder.andWhere('intervention.createdAt >= :dateFrom', { dateFrom: start });
        }

        if (dateTo) {
            const { endExclusive } = this.parseDayBounds(dateTo);
            queryBuilder.andWhere('intervention.createdAt < :dateToExclusive', {
                dateToExclusive: endExclusive,
            });
        }

        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);

            if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
                throw new BadRequestException('Plage de dates invalide.');
            }

            if (from > to) {
                throw new BadRequestException('dateFrom doit etre inferieure ou egale a dateTo.');
            }
        }

        return queryBuilder;
    }

    private async findAllEntities(filters?: FindInterventionsQueryDto): Promise<Intervention[]> {
        const queryBuilder = this.baseQuery();
        this.applyFilters(queryBuilder, filters);
        return queryBuilder.getMany();
    }

    private formatPdfDate(date: Date): string {
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    private truncateCellText(value: string, maxLength: number): string {
        const normalized = value.trim();
        if (normalized.length <= maxLength) {
            return normalized;
        }
        return `${normalized.slice(0, Math.max(0, maxLength - 1))}...`;
    }

    private buildFilterSummary(filters?: FindInterventionsQueryDto): string {
        if (!filters) {
            return 'Aucun filtre';
        }

        const parts: string[] = [];
        if (filters.type) {
            parts.push(`Type: ${filters.type}`);
        }
        if (filters.status) {
            parts.push(`Statut: ${filters.status}`);
        }
        if (filters.structure) {
            parts.push(`Structure: ${filters.structure}`);
        }
        if (filters.date) {
            parts.push(`Date: ${filters.date}`);
        }
        if (filters.dateFrom || filters.dateTo) {
            const from = filters.dateFrom ?? '...';
            const to = filters.dateTo ?? '...';
            parts.push(`Plage: ${from} -> ${to}`);
        }

        return parts.length > 0 ? parts.join(' | ') : 'Aucun filtre';
    }

    private async resolveCategoryByInventaire(
        interventions: Intervention[],
    ): Promise<Map<string, string>> {
        const numeroInventaires = Array.from(
            new Set(
                interventions
                    .flatMap((intervention) => intervention.items ?? [])
                    .map((item) => (item.numeroInventaire ?? '').trim())
                    .filter((numeroInventaire) => numeroInventaire.length > 0),
            ),
        );

        if (numeroInventaires.length === 0) {
            return new Map<string, string>();
        }

        const materiels = await this.materielsRepository
            .createQueryBuilder('materiel')
            .leftJoinAndSelect('materiel.categorie', 'categorie')
            .where('materiel.numeroInventaire IN (:...numeroInventaires)', { numeroInventaires })
            .getMany();

        const categoryByInventaire = new Map<string, string>();
        for (const materiel of materiels) {
            if (materiel.numeroInventaire) {
                categoryByInventaire.set(
                    materiel.numeroInventaire,
                    materiel.categorie?.name?.trim() || '-',
                );
            }
        }

        return categoryByInventaire;
    }

    private async resolveDepartmentNameByDestinataire(
        interventions: Intervention[],
    ): Promise<Map<string, string>> {
        const destinataires = Array.from(
            new Set(
                interventions
                    .map((intervention) => (intervention.destinataire ?? '').trim())
                    .filter((destinataire) => destinataire.length > 0),
            ),
        );

        if (destinataires.length === 0) {
            return new Map<string, string>();
        }

        const departments = await this.departmentsRepository
            .createQueryBuilder('department')
            .where('LOWER(department.name) IN (:...destinataires)', {
                destinataires: destinataires.map((destinataire) => destinataire.toLowerCase()),
            })
            .getMany();

        const departmentByName = new Map<string, string>();
        for (const department of departments) {
            if (department.name) {
                departmentByName.set(department.name.trim().toLowerCase(), department.name.trim());
            }
        }

        return departmentByName;
    }

    private async enrichWithItemCategories(
        interventions: Intervention[],
    ): Promise<InterventionResponseDto[]> {
        const categoryByInventaire = await this.resolveCategoryByInventaire(interventions);

        return interventions.map((intervention) => ({
            ...(intervention as unknown as InterventionResponseDto),
            items: (intervention.items || []).map((item) => ({
                ...(item as unknown as InterventionResponseDto['items'][number]),
                category: categoryByInventaire.get(item.numeroInventaire?.trim() || '') || '-',
            })),
        }));
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

    async findAll(
        filters?: FindInterventionsQueryDto,
    ): Promise<{ data: InterventionResponseDto[]; message: string }> {
        const interventions = await this.findAllEntities(filters);
        const data = await this.enrichWithItemCategories(interventions);

        return {
            data,
            message: 'Liste des interventions récupérée avec succès',
        };
    }

    async exportFilteredInterventionsToPdf(
        filters: FindInterventionsQueryDto,
        res: Response,
    ): Promise<void> {
        const interventions = await this.findAllEntities(filters);
        const categoryByInventaire = await this.resolveCategoryByInventaire(interventions);
        const departmentByName = await this.resolveDepartmentNameByDestinataire(interventions);

        const fileName = `interventions-${new Date().toISOString().replace(/[.:]/g, '-')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        doc.pipe(res);

        doc.fontSize(16).text('Liste Intervetions', { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(10).text(`Genere le: ${this.formatPdfDate(new Date())}`);
        doc.moveDown(0.2);
        doc.fontSize(10).text(`Total: ${interventions.length} intervention(s)`);
        doc.moveDown(1);

        const headers = ['Category', 'Designation', 'Type', 'Structure', 'Date'];
        const widths = [110, 125, 60, 140, 110];
        const rowHeight = 18;
        const startX = doc.x;

        const rows = interventions.flatMap((intervention) => {
            if (!intervention.items || intervention.items.length === 0) {
                const structure = intervention.destinataire?.trim() || '-';
                const normalizedStructure = structure.toLowerCase();
                return [
                    {
                        category: '-',
                        designation: '-',
                        type: intervention.interventionType ?? '-',
                        structure: departmentByName.get(normalizedStructure) ?? structure,
                        date: intervention.createdAt ? this.formatPdfDate(intervention.createdAt) : '-',
                    },
                ];
            }

            const structure = intervention.destinataire?.trim() || '-';
            const normalizedStructure = structure.toLowerCase();

            return intervention.items.map((item) => {
                const numeroInventaire = item.numeroInventaire?.trim() || '';

                return {
                    category: categoryByInventaire.get(numeroInventaire) ?? '-',
                    designation: item.designation ?? '-',
                    type: intervention.interventionType ?? '-',
                    structure: departmentByName.get(normalizedStructure) ?? structure,
                    date: intervention.createdAt ? this.formatPdfDate(intervention.createdAt) : '-',
                };
            });
        });

        const drawHeader = () => {
            let x = startX;
            const y = doc.y;
            doc.font('Helvetica-Bold').fontSize(9);
            headers.forEach((header, index) => {
                doc
                    .rect(x, y, widths[index], rowHeight)
                    .fillAndStroke('#FFFFFF', '#D0D5DD');
                doc
                    .fillColor('#101828')
                    .text(header, x + 4, y + 5, {
                        width: widths[index] - 8,
                        align: 'center',
                        ellipsis: true,
                    });
                x += widths[index];
            });
            doc.moveDown();
            doc.y = y + rowHeight;
            doc.font('Helvetica').fillColor('#101828');
        };

        const ensurePageSpace = () => {
            if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                drawHeader();
            }
        };

        drawHeader();

        rows.forEach((row) => {
            ensurePageSpace();

            const rowValues = [
                this.truncateCellText(row.category, 22),
                this.truncateCellText(row.designation, 28),
                this.truncateCellText(row.type, 10),
                this.truncateCellText(row.structure, 28),
                this.truncateCellText(row.date, 18),
            ];

            let x = startX;
            const y = doc.y;

            rowValues.forEach((value, index) => {
                doc
                    .rect(x, y, widths[index], rowHeight)
                    .fillAndStroke('#FFFFFF', '#D0D5DD');
                doc
                    .fillColor('#101828')
                    .fontSize(8)
                    .text(value, x + 4, y + 5, {
                        width: widths[index] - 8,
                        align: 'center',
                        ellipsis: true,
                    });
                x += widths[index];
            });

            doc.y = y + rowHeight;
        });

        doc.end();
    }

    async exportFilteredInterventionsToExcel(
        filters: FindInterventionsQueryDto,
        res: Response,
    ): Promise<void> {
        const interventions = await this.findAllEntities(filters);
        const categoryByInventaire = await this.resolveCategoryByInventaire(interventions);
        const departmentByName = await this.resolveDepartmentNameByDestinataire(interventions);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Naftal Backend';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Interventions');
        worksheet.columns = [
            { header: 'Reference', key: 'reference', width: 18 },
            { header: 'Type', key: 'type', width: 12 },
            { header: 'Statut', key: 'status', width: 14 },
            { header: 'Structure', key: 'structure', width: 28 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Designation', key: 'designation', width: 34 },
            { header: 'Quantite', key: 'quantity', width: 12 },
            { header: 'Marque', key: 'marque', width: 18 },
            { header: 'Numero Serie', key: 'numeroSerie', width: 22 },
            { header: 'Numero Inventaire', key: 'numeroInventaire', width: 22 },
            { header: 'Interventionnaire', key: 'interventionnaire', width: 28 },
            { header: 'Fonction', key: 'fonction', width: 20 },
            { header: 'Observation', key: 'observation', width: 36 },
        ];

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };

        interventions.forEach((intervention) => {
            const structure = intervention.destinataire?.trim() || '-';
            const normalizedStructure = structure.toLowerCase();
            const resolvedStructure = departmentByName.get(normalizedStructure) ?? structure;
            const staffName = `${intervention.interventionnaireNom ?? ''} ${intervention.interventionnairePrenom ?? ''}`.trim() || '-';
            const createdAt = intervention.createdAt ? this.formatPdfDate(intervention.createdAt) : '-';
            const items = intervention.items ?? [];

            if (items.length === 0) {
                worksheet.addRow({
                    reference: intervention.reference ?? '-',
                    type: intervention.interventionType ?? '-',
                    status: intervention.status ?? '-',
                    structure: resolvedStructure,
                    date: createdAt,
                    category: '-',
                    designation: '-',
                    quantity: '-',
                    marque: '-',
                    numeroSerie: '-',
                    numeroInventaire: '-',
                    interventionnaire: staffName,
                    fonction: intervention.interventionnaireFonction ?? '-',
                    observation: intervention.observation ?? '-',
                });
                return;
            }

            items.forEach((item) => {
                const numeroInventaire = item.numeroInventaire?.trim() || '';
                worksheet.addRow({
                    reference: intervention.reference ?? '-',
                    type: intervention.interventionType ?? '-',
                    status: intervention.status ?? '-',
                    structure: resolvedStructure,
                    date: createdAt,
                    category: categoryByInventaire.get(numeroInventaire) ?? '-',
                    designation: item.designation ?? '-',
                    quantity: item.quantity ?? '-',
                    marque: item.marque ?? '-',
                    numeroSerie: item.numeroSerie ?? '-',
                    numeroInventaire: item.numeroInventaire ?? '-',
                    interventionnaire: staffName,
                    fonction: intervention.interventionnaireFonction ?? '-',
                    observation: intervention.observation ?? '-',
                });
            });
        });

        const fileName = `interventions-${new Date().toISOString().replace(/[.:]/g, '-')}.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const buffer = await workbook.xlsx.writeBuffer();
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
        res.setHeader('Content-Length', String(nodeBuffer.length));
        res.send(nodeBuffer);
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
