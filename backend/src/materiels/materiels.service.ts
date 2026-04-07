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
  ) { }

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
      throw new NotFoundException(
        `Filiale avec le code "${code}" introuvable`,
      );
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

  async create(createMaterielDto: CreateMaterielDto) {
    const { categorieId, serviceId, proprietaireId, subsidiaryCode, ...fields } =
      createMaterielDto;

    await this.ensureNumeroInventaireIsUnique(createMaterielDto.numeroInventaire);

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
      data: created,
      message: 'Matériel créé avec succès',
    };
  }

  async findAll() {
    const data = await this.baseQuery()
      .where('materiel.subsidiaryCode IS NULL')
      .orderBy('materiel.numeroSerie', 'ASC')
      .getMany();

    return {
      data,
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
      data,
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
      data,
      message: 'Liste de mes matériels récupérée avec succès',
    };
  }

  async findOne(numeroSerie: string) {
    const materiel = await this.findOneOrThrow(numeroSerie);
    return {
      data: materiel,
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
      data: updated,
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
}
