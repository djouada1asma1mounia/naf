import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { InterventionItem } from './entities/intervention-item.entity';
import { Intervention } from './entities/intervention.entity';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';

@Module({
    imports: [TypeOrmModule.forFeature([Intervention, InterventionItem, User])],
    controllers: [InterventionsController],
    providers: [InterventionsService],
})
export class InterventionsModule { }
