import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { MaterielsModule } from 'src/materiels/materiels.module';
import { DechargesController } from './decharges.controller';
import { DechargesService } from './decharges.service';
import { DechargeSubscriber } from './decharge.subscriber';
import { DechargeItem } from './entities/decharge-item.entity';
import { Decharge } from './entities/decharge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decharge, DechargeItem, User]),
    MaterielsModule,
  ],
  controllers: [DechargesController],
  providers: [DechargesService, DechargeSubscriber],
})
export class DechargesModule {}
