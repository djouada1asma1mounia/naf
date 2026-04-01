import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subsidiary } from './entities/subsidiary.entity';
import { SubsidiariesController } from './subsidiaries.controller';
import { SubsidiariesService } from './subsidiaries.service';

@Module({
    imports: [TypeOrmModule.forFeature([Subsidiary])],
    controllers: [SubsidiariesController],
    providers: [SubsidiariesService],
})
export class SubsidiariesModule { }
