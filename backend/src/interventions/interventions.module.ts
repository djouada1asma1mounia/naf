import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from 'src/departments/entities/department.entity';
import { Materiel } from 'src/materiels/entities/materiel.entity';
import { User } from 'src/users/entities/user.entity';
import { InterventionItem } from './entities/intervention-item.entity';
import { Intervention } from './entities/intervention.entity';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';

@Module({
    imports: [TypeOrmModule.forFeature([Intervention, InterventionItem, User, Materiel, Department])],
    controllers: [InterventionsController],
    providers: [InterventionsService],
})
export class InterventionsModule { }
