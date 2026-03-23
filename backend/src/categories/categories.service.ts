import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {

  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name } = createCategoryDto;

    const existingCategory = await this.categoriesRepository.findOne({ where: { name } });
    if (existingCategory) {
      throw new ConflictException('La catégorie existe déjà');
    }

    const category = this.categoriesRepository.create({ name });
    await this.categoriesRepository.save(category);

    return {
      data: category,
      message: 'Catégorie créée avec succès',
    };
  }

  async findAll() {
    const categories = await this.categoriesRepository.find({
      order: { id: 'ASC' },
    });

    return {
      data: categories,
      message: 'Catégories récupérées avec succès',
    };
  }

  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    return {
      data: category,
      message: 'Catégorie récupérée avec succès',
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({ where: { name: updateCategoryDto.name } });
      if (existingCategory) {
        throw new ConflictException('La catégorie existe déjà');
      }
    }

    Object.assign(category, updateCategoryDto);
    await this.categoriesRepository.save(category);

    return {
      data: category,
      message: 'Catégorie mise à jour avec succès',
    };
  }

  async remove(id: number) {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    await this.categoriesRepository.remove(category);

    return {
      message: 'Catégorie supprimée avec succès',
    };
  }
}
