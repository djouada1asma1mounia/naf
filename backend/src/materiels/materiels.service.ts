import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMaterielDto } from './dto/create-materiel.dto';
import { UpdateMaterielDto } from './dto/update-materiel.dto';
import { Repository } from 'typeorm';
import { Materiel } from './entities/materiel.entity';
import { Category } from '../categories/entities/category.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { Subsidiary } from '../subsidiaries/entities/subsidiary.entity';
import { User } from '../users/entities/user.entity';
import { MaterielResponseDto } from './dto/materiel-response.dto';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { Response } from 'express';

@Injectable()
export class MaterielsService {
  constructor(
    @InjectRepository(Materiel)
    private readonly materielsRepository: Repository<Materiel>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
    @InjectRepository(Subsidiary)
    private readonly subsidiariesRepository: Repository<Subsidiary>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private baseQuery() {
    return this.materielsRepository
      .createQueryBuilder('materiel')
      .leftJoinAndSelect('materiel.categorie', 'categorie')
      .leftJoinAndSelect('materiel.service', 'service')
      .leftJoinAndSelect('service.department', 'department')
      .leftJoinAndSelect('materiel.subsidiary', 'subsidiary')
      .leftJoinAndSelect('materiel.proprietaire', 'proprietaire')
      .addSelect([
        'proprietaire.id',
        'proprietaire.nom',
        'proprietaire.prenom',
        'proprietaire.email',
      ]);
  }

  private async findSubsidiaryOrThrow(code: string): Promise<Subsidiary> {
    const subsidiary = await this.subsidiariesRepository.findOne({
      where: { code },
    });

    if (!subsidiary) {
      throw new NotFoundException(`Filiale avec le code "${code}" introuvable`);
    }

    return subsidiary;
  }

  private async findOneOrThrow(numeroSerie: string): Promise<Materiel> {
    const materiel = await this.baseQuery()
      .where('materiel.numeroSerie = :numeroSerie', { numeroSerie })
      .getOne();

    if (!materiel) {
      throw new NotFoundException(
        `Matériel avec le numéro de série "${numeroSerie}" introuvable`,
      );
    }

    return materiel;
  }

  private async ensureNumeroInventaireIsUnique(
    numeroInventaire: string,
    excludeNumeroSerie?: string,
  ): Promise<void> {
    const query = this.materielsRepository
      .createQueryBuilder('materiel')
      .where('materiel.numeroInventaire = :numeroInventaire', {
        numeroInventaire,
      });

    if (excludeNumeroSerie) {
      query.andWhere('materiel.numeroSerie != :excludeNumeroSerie', {
        excludeNumeroSerie,
      });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException(
        `Le numéro d'inventaire "${numeroInventaire}" existe déjà`,
      );
    }
  }

  private async ensureNumeroSerieIsUnique(numeroSerie: string): Promise<void> {
    const existing = await this.materielsRepository.findOne({
      where: { numeroSerie },
      select: ['numeroSerie'],
    });

    if (existing) {
      throw new ConflictException(
        `Le numéro de série "${numeroSerie}" existe déjà`,
      );
    }
  }

  private toResponse(materiel: Materiel): MaterielResponseDto {
    return {
      ...(materiel as unknown as MaterielResponseDto),
      department: materiel.service?.department ?? null,
    };
  }

  private toResponseList(materiels: Materiel[]): MaterielResponseDto[] {
    return materiels.map((materiel) => this.toResponse(materiel));
  }

  async create(createMaterielDto: CreateMaterielDto) {
    const {
      categorieId,
      serviceId,
      proprietaireId,
      subsidiaryCode,
      ...fields
    } = createMaterielDto;

    await this.ensureNumeroSerieIsUnique(createMaterielDto.numeroSerie);

    if (createMaterielDto.numeroInventaire) {
      await this.ensureNumeroInventaireIsUnique(
        createMaterielDto.numeroInventaire,
      );
    }

    const categorie = await this.categoriesRepository.findOne({
      where: { id: categorieId },
    });
    if (!categorie) {
      throw new NotFoundException(
        `Catégorie avec l'id "${categorieId}" introuvable`,
      );
    }

    let service: ServiceEntity | undefined;
    if (serviceId !== undefined && serviceId !== null) {
      const foundService = await this.servicesRepository.findOne({
        where: { id: serviceId },
      });
      if (!foundService) {
        throw new NotFoundException(
          `Service avec l'id "${serviceId}" introuvable`,
        );
      }
      service = foundService;
    }

    let proprietaire: User | undefined;
    if (proprietaireId) {
      const foundProprietaire = await this.usersRepository.findOne({
        where: { id: proprietaireId },
      });
      if (!foundProprietaire) {
        throw new NotFoundException(
          `Utilisateur avec l'id "${proprietaireId}" introuvable`,
        );
      }
      proprietaire = foundProprietaire;
    }

    const subsidiary = subsidiaryCode
      ? await this.findSubsidiaryOrThrow(subsidiaryCode)
      : null;

    const materiel = this.materielsRepository.create({
      ...fields,
      categorie,
      service,
      proprietaire,
      subsidiary: subsidiary ?? undefined,
    });

    await this.materielsRepository.save(materiel);
    const created = await this.findOneOrThrow(materiel.numeroSerie);

    return {
      data: this.toResponse(created),
      message: 'Matériel créé avec succès',
    };
  }

  async findAll() {
    const data = await this.baseQuery()
      .where('materiel.subsidiaryCode IS NULL')
      .orderBy('materiel.numeroSerie', 'ASC')
      .getMany();

    return {
      data: this.toResponseList(data),
      message: 'Liste des matériels sans filiale récupérée avec succès',
    };
  }

  async findBySubsidiary(subsidiaryCode?: string) {
    const query = this.baseQuery();

    if (subsidiaryCode) {
      await this.findSubsidiaryOrThrow(subsidiaryCode);
      query.where('subsidiary.code = :subsidiaryCode', { subsidiaryCode });
    } else {
      query.where('materiel.subsidiaryCode IS NULL');
    }

    const data = await query.orderBy('materiel.numeroSerie', 'ASC').getMany();

    return {
      data: this.toResponseList(data),
      message: subsidiaryCode
        ? 'Liste des matériels de la filiale récupérée avec succès'
        : 'Liste des matériels sans filiale récupérée avec succès',
    };
  }

  async findMine(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const data = await this.baseQuery()
      .where('proprietaire.id = :userId', { userId })
      .orderBy('materiel.numeroSerie', 'ASC')
      .getMany();

    return {
      data: this.toResponseList(data),
      message: 'Liste de mes matériels récupérée avec succès',
    };
  }

  async findOne(numeroSerie: string) {
    const materiel = await this.findOneOrThrow(numeroSerie);
    return {
      data: this.toResponse(materiel),
      message: 'Matériel récupéré avec succès',
    };
  }

  async update(numeroSerie: string, updateMaterielDto: UpdateMaterielDto) {
    const materiel = await this.findOneOrThrow(numeroSerie);

    const {
      numeroSerie: _,
      numeroInventaire,
      categorieId,
      serviceId,
      proprietaireId,
      subsidiaryCode,
      ...fields
    } = updateMaterielDto;

    Object.assign(materiel, fields);

    if (categorieId !== undefined) {
      const categorie = await this.categoriesRepository.findOne({
        where: { id: categorieId },
      });
      if (!categorie) {
        throw new NotFoundException(
          `Catégorie avec l'id "${categorieId}" introuvable`,
        );
      }
      materiel.categorie = categorie;
    }

    if (serviceId !== undefined) {
      if (serviceId === null) {
        materiel.service = undefined;
      } else {
        const service = await this.servicesRepository.findOne({
          where: { id: serviceId },
        });
        if (!service) {
          throw new NotFoundException(
            `Service avec l'id "${serviceId}" introuvable`,
          );
        }
        materiel.service = service;
      }
    }

    if (proprietaireId !== undefined) {
      if (proprietaireId === null || proprietaireId === '') {
        materiel.proprietaire = undefined;
      } else {
        const proprietaire = await this.usersRepository.findOne({
          where: { id: proprietaireId },
        });
        if (!proprietaire) {
          throw new NotFoundException(
            `Utilisateur avec l'id "${proprietaireId}" introuvable`,
          );
        }
        materiel.proprietaire = proprietaire;
      }
    }

    if (subsidiaryCode !== undefined) {
      if (subsidiaryCode === null || subsidiaryCode === '') {
        materiel.subsidiary = undefined;
      } else {
        materiel.subsidiary = await this.findSubsidiaryOrThrow(subsidiaryCode);
      }
    }

    if (
      numeroInventaire !== undefined &&
      numeroInventaire !== materiel.numeroInventaire
    ) {
      await this.ensureNumeroInventaireIsUnique(numeroInventaire, numeroSerie);
      materiel.numeroInventaire = numeroInventaire;
    }

    await this.materielsRepository.save(materiel);
    const updated = await this.findOneOrThrow(numeroSerie);

    return {
      data: this.toResponse(updated),
      message: 'Matériel mis à jour avec succès',
    };
  }

  async remove(numeroSerie: string) {
    const materiel = await this.materielsRepository.findOne({
      where: { numeroSerie },
    });
    if (!materiel) {
      throw new NotFoundException(
        `Matériel avec le numéro de série "${numeroSerie}" introuvable`,
      );
    }

    await this.materielsRepository.remove(materiel);

    return {
      message: 'Matériel supprimé avec succès',
    };
  }

  /**
   * Update dateSortie on materials matching the provided items.
   * items may contain numeroSerie and/or numeroInventaire fields.
   */
  async updateDateSortieForItems(
    items: { numeroSerie?: string; numeroInventaire?: string }[] = [],
    date?: Date | string,
  ): Promise<void> {
    if (!Array.isArray(items) || items.length === 0) return;

    const dateValue = date
      ? date instanceof Date
        ? date.toISOString().slice(0, 10)
        : new Date(String(date)).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    for (const it of items) {
      try {
        if (it.numeroSerie) {
          const mat = await this.materielsRepository.findOne({
            where: { numeroSerie: it.numeroSerie },
          });
          if (mat) {
            (mat as any).dateSortie = dateValue;
            await this.materielsRepository.save(mat);
          }
        } else if (it.numeroInventaire) {
          const mat = await this.materielsRepository.findOne({
            where: { numeroInventaire: it.numeroInventaire },
          });
          if (mat) {
            (mat as any).dateSortie = dateValue;
            await this.materielsRepository.save(mat);
          }
        }
      } catch (err) {
        // ignore individual failures to avoid blocking the main operation
      }
    }
  }

  async exportMaterialsToExcel(
    subsidiaryCode: string | undefined,
    onlyGd: boolean,
    res: Response,
  ): Promise<void> {
    const query = this.baseQuery();
    if (onlyGd) {
      query.where('materiel.subsidiaryCode IS NOT NULL');
    } else if (subsidiaryCode) {
      query.where('subsidiary.code = :subsidiaryCode', { subsidiaryCode });
    } else {
      query.where('materiel.subsidiaryCode IS NULL');
    }

    const materials = await query
      .orderBy('materiel.numeroSerie', 'ASC')
      .getMany();
    const rows = this.toResponseList(materials);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Naftal Backend';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Materials');
    worksheet.columns = [
      { header: 'Numéro série', key: 'numeroSerie', width: 20 },
      { header: 'Numéro inventaire', key: 'numeroInventaire', width: 18 },
      { header: 'Désignation', key: 'name', width: 30 },
      { header: 'Marque', key: 'marque', width: 18 },
      { header: 'Modèle', key: 'modele', width: 18 },
      { header: 'État', key: 'etat', width: 14 },
      { header: 'Date sortie', key: 'dateSortie', width: 14 },
      { header: 'Catégorie', key: 'categorie', width: 20 },
      { header: 'Service', key: 'service', width: 20 },
      { header: 'Propriétaire', key: 'proprietaire', width: 22 },
      { header: 'Filiale', key: 'subsidiaryCode', width: 12 },
      { header: 'Date entrée', key: 'dateEntree', width: 14 },
      { header: 'Fin garantie', key: 'finGarontie', width: 14 },
    ];

     rows.forEach((m) => {
      worksheet.addRow({
        numeroSerie: m.numeroSerie || '-',
        numeroInventaire: m.numeroInventaire || '-',
        name: (m as any).designation || (m as any).name || '-', 
        marque: m.marque || '-',
        modele: m.modele || '-',
        etat: m.etat || '-',
        dateSortie: m.dateSortie || '-',
        categorie: typeof m.categorie === 'object' ? m.categorie?.name || '-' : m.categorie || '-',
        service: typeof m.service === 'object' ? m.service?.name || '-' : m.service || '-',
        proprietaire: m.proprietaire
          ? `${m.proprietaire.prenom || ''} ${m.proprietaire.nom || ''}`.trim()
          : '-',
        subsidiaryCode: typeof m.subsidiary === 'object' ? m.subsidiary?.code || m.subsidiary?.name || '-' : m.subsidiary || '-',
        dateEntree: m.dateEntree || '-',
        finGarontie: m.finGarontie || '-',
      });
    });

    const fileName = `materiels-${new Date().toISOString().replace(/[.:]/g, '-')}.xlsx`;
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

  async exportMaterialsToPdf(
    subsidiaryCode: string | undefined,
    onlyGd: boolean,
    res: Response,
  ): Promise<void> {
    const query = this.baseQuery();
    if (onlyGd) {
      query.where('materiel.subsidiaryCode IS NOT NULL');
    } else if (subsidiaryCode) {
      query.where('subsidiary.code = :subsidiaryCode', { subsidiaryCode });
    } else {
      query.where('materiel.subsidiaryCode IS NULL');
    }

    const materials = await query
      .orderBy('materiel.numeroSerie', 'ASC')
      .getMany();

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const fileName = `materiels-${new Date().toISOString().replace(/[.:]/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    doc.fontSize(16).text('Liste Matériels', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Généré le: ${new Date().toLocaleString('fr-FR')}`);
    doc.moveDown(0.8);

    const tableTop = doc.y;
    const columnWidths = [90, 80, 120, 70, 60];

    // Header
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Série', 36, tableTop, { width: columnWidths[0] });
    doc.text('Inventaire', 36 + columnWidths[0], tableTop, {
      width: columnWidths[1],
    });
    doc.text('Désignation', 36 + columnWidths[0] + columnWidths[1], tableTop, {
      width: columnWidths[2],
    });
    doc.text(
      'Marque',
      36 + columnWidths[0] + columnWidths[1] + columnWidths[2],
      tableTop,
      { width: columnWidths[3] },
    );
    doc.text(
      'Filiale',
      36 +
        columnWidths[0] +
        columnWidths[1] +
        columnWidths[2] +
        columnWidths[3],
      tableTop,
      { width: columnWidths[4] },
    );
    doc.moveDown(0.6);
    doc.font('Helvetica');

    materials.forEach((m) => {
      const y = doc.y;
      doc
        .fontSize(9)
        .text(m.numeroSerie || '-', 36, y, { width: columnWidths[0] });
      doc.text(m.numeroInventaire || '-', 36 + columnWidths[0], y, {
        width: columnWidths[1],
      });
      doc.text(
        (m as any).name || m.modele || '-',
        36 + columnWidths[0] + columnWidths[1],
        y,
        { width: columnWidths[2] },
      );
      doc.text(
        m.marque || '-',
        36 + columnWidths[0] + columnWidths[1] + columnWidths[2],
        y,
        { width: columnWidths[3] },
      );
      doc.text(
        m.subsidiary?.code || '-',
        36 +
          columnWidths[0] +
          columnWidths[1] +
          columnWidths[2] +
          columnWidths[3],
        y,
        { width: columnWidths[4] },
      );
      doc.moveDown(0.6);
    });

    doc.end();
  }
}
