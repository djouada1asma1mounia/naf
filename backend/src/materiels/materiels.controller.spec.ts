import { Test, TestingModule } from '@nestjs/testing';
import { MaterielsController } from './materiels.controller';
import { MaterielsService } from './materiels.service';

describe('MaterielsController', () => {
  let controller: MaterielsController;

  beforeEach(async () => {
    const materielsServiceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterielsController],
      providers: [{ provide: MaterielsService, useValue: materielsServiceMock }],
    }).compile();

    controller = module.get<MaterielsController>(MaterielsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
