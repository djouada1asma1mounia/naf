import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaterielsService } from './materiels.service';
import { Materiel } from './entities/materiel.entity';
import { Category } from '../categories/entities/category.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';

describe('MaterielsService', () => {
  let service: MaterielsService;

  const repoMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterielsService,
        { provide: getRepositoryToken(Materiel), useValue: repoMock },
        { provide: getRepositoryToken(Category), useValue: repoMock },
        { provide: getRepositoryToken(Department), useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: repoMock },
      ],
    }).compile();

    service = module.get<MaterielsService>(MaterielsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
