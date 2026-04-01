import { Module } from '@nestjs/common';
import { MaterielsService } from './materiels.service';
import { MaterielsController } from './materiels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Materiel } from './entities/materiel.entity';
import { Category } from '../categories/entities/category.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Materiel, Category, ServiceEntity, User])],
  controllers: [MaterielsController],
  providers: [MaterielsService],
})
export class MaterielsModule { }
