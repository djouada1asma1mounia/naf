import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Decharge } from 'src/decharges/entities/decharge.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Intervention } from 'src/interventions/entities/intervention.entity';
import { Materiel } from 'src/materiels/entities/materiel.entity';
import { ServiceEntity } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import { StatistiqueController } from './statistique.controller';
import { StatistiqueService } from './statistique.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Materiel,
            Intervention,
            Decharge,
            User,
            Department,
            ServiceEntity,
        ]),
    ],
    controllers: [StatistiqueController],
    providers: [StatistiqueService],
    exports: [StatistiqueService],
})
export class StatistiqueModule { }
