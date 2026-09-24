import { Injectable, Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Decharge } from './entities/decharge.entity';
import { DechargeItem } from './entities/decharge-item.entity';
import { MaterielsService } from 'src/materiels/materiels.service';

@Injectable()
export class DechargeSubscriber implements EntitySubscriberInterface<Decharge> {
  private readonly logger = new Logger(DechargeSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly materielsService: MaterielsService,
  ) {
    dataSource.subscribers.push(this as any);
  }

  listenTo() {
    return Decharge;
  }

  async afterInsert(event: InsertEvent<Decharge>) {
    try {
      const decharge = event.entity;
      if (!decharge) return;

      // load items if not present
      const items =
        decharge.items && decharge.items.length
          ? decharge.items
          : await event.manager
              .getRepository(DechargeItem)
              .find({ where: { decharge: { id: (decharge as any).id } } });

      await this.materielsService.updateDateSortieForItems(
        items.map((i) => ({
          numeroSerie: (i as any).numeroSerie,
          numeroInventaire: (i as any).numeroInventaire,
        })),
        decharge.createdAt || new Date(),
      );
    } catch (err) {
      this.logger.warn(
        'Failed to update material dateSortie after decharge insert',
        err as any,
      );
    }
  }

  async afterUpdate(event: UpdateEvent<Decharge>) {
    try {
      const decharge = event.entity as Decharge;
      if (!decharge) return;

      const items =
        decharge.items && decharge.items.length
          ? decharge.items
          : await event.manager
              .getRepository(DechargeItem)
              .find({ where: { decharge: { id: (decharge as any).id } } });

      await this.materielsService.updateDateSortieForItems(
        items.map((i) => ({
          numeroSerie: (i as any).numeroSerie,
          numeroInventaire: (i as any).numeroInventaire,
        })),
        decharge.createdAt || new Date(),
      );
    } catch (err) {
      this.logger.warn(
        'Failed to update material dateSortie after decharge update',
        err as any,
      );
    }
  }
}
