import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMaterielDto } from './dto/create-materiel.dto';
import { UpdateMaterielDto } from './dto/update-materiel.dto';
import { MaterielListResponseDto } from './dto/materiel-response.dto';
import { Repository } from 'typeorm';
import { Materiel } from './entities/materiel.entity';
import { Category } from '../categories/entities/category.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MaterielsService {
  constructor(
    @InjectRepository(Materiel)
    private readonly materielsRepository: Repository<Materiel>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  private baseQuery() {
    return this.materielsRepository
      .createQueryBuilder('materiel')
      .leftJoinAndSelect('materiel.categorie', 'categorie')
      .leftJoinAndSelect('materiel.department', 'department')
      .leftJoinAndSelect('materiel.proprietaire', 'proprietaire')
      .addSelect(['proprietaire.id', 'proprietaire.nom', 'proprietaire.prenom', 'proprietaire.email']);
  }

  private async findOneOrThrow(numeroSerie: string): Promise<Materiel> {
    const materiel = await this.baseQuery()
      .where('materiel.numeroSerie = :numeroSerie', { numeroSerie })
      .getOne();

    if (!materiel) {
      throw new NotFoundException(`Matériel avec le numéro de série "${numeroSerie}" introuvable`);
    }

    return materiel;
  }

  async create(createMaterielDto: CreateMaterielDto) {
    const { categorieId, departmentId, proprietaireId, ...fields } = createMaterielDto;

    const categorie = await this.categoriesRepository.findOne({ where: { id: categorieId } });
    if (!categorie) {
      throw new NotFoundException(`Catégorie avec l'id "${categorieId}" introuvable`);
    }

    const department = await this.departmentsRepository.findOne({ where: { id: departmentId } });
    if (!department) {
      throw new NotFoundException(`Département avec l'id "${departmentId}" introuvable`);
    }

    const proprietaire = await this.usersRepository.findOne({ where: { id: proprietaireId } });
    if (!proprietaire) {
      throw new NotFoundException(`Utilisateur avec l'id "${proprietaireId}" introuvable`);
    }

    const materiel = this.materielsRepository.create({
      ...fields,
      categorie,
      department,
      proprietaire,
    });

    await this.materielsRepository.save(materiel);
    const created = await this.findOneOrThrow(materiel.numeroSerie);

    return {
      data: created,
      message: 'Matériel créé avec succès',
    };
  }

  async findAll() {
    const materiels = await this.baseQuery()
      .orderBy('materiel.numeroSerie', 'ASC')
      .getMany();

    const data: MaterielListResponseDto[] = materiels.map(materiel => ({
      numeroSerie: materiel.numeroSerie,
      etat: materiel.etat,
      proprietaireName: `${materiel.proprietaire.nom} ${materiel.proprietaire.prenom}`,
    }));

    return {
      data,
      message: 'Liste des matériels récupérée avec succès',
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
      categorieId,
      departmentId,
      proprietaireId,
      ...fields
    } = updateMaterielDto;

    Object.assign(materiel, fields);

    if (categorieId !== undefined) {
      const categorie = await this.categoriesRepository.findOne({ where: { id: categorieId } });
      if (!categorie) {
        throw new NotFoundException(`Catégorie avec l'id "${categorieId}" introuvable`);
      }
      materiel.categorie = categorie;
    }

    if (departmentId !== undefined) {
      const department = await this.departmentsRepository.findOne({ where: { id: departmentId } });
      if (!department) {
        throw new NotFoundException(`Département avec l'id "${departmentId}" introuvable`);
      }
      materiel.department = department;
    }

    if (proprietaireId !== undefined) {
      const proprietaire = await this.usersRepository.findOne({ where: { id: proprietaireId } });
      if (!proprietaire) {
        throw new NotFoundException(`Utilisateur avec l'id "${proprietaireId}" introuvable`);
      }
      materiel.proprietaire = proprietaire;
    }

    await this.materielsRepository.save(materiel);
    const updated = await this.findOneOrThrow(numeroSerie);

    return {
      data: updated,
      message: 'Matériel mis à jour avec succès',
    };
  }

  async remove(numeroSerie: string) {
    const materiel = await this.materielsRepository.findOne({ where: { numeroSerie } });
    if (!materiel) {
      throw new NotFoundException(`Matériel avec le numéro de série "${numeroSerie}" introuvable`);
    }

    await this.materielsRepository.remove(materiel);

    return {
      message: 'Matériel supprimé avec succès',
    };
  }
}
