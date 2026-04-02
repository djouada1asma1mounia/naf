import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { DechargesController } from './decharges.controller';
import { DechargesService } from './decharges.service';
import { DechargeItem } from './entities/decharge-item.entity';
import { Decharge } from './entities/decharge.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Decharge, DechargeItem, User])],
    controllers: [DechargesController],
    providers: [DechargesService],
})
export class DechargesModule { }
