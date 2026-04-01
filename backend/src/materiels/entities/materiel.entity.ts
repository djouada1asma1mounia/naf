import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { User } from '../../users/entities/user.entity';

export enum MaterielEtat {
    ACTIVE = 'Active',
    EN_PANNE = 'en Panne',
    EN_MAINTENANCE = 'en Maintenance',
}

@Entity('materiels')
export class Materiel {
    @PrimaryColumn()
    numeroSerie: string;

    @Column({ unique: true })
    numeroInventaire: string;

    @Column({ type: 'date', nullable: true })
    dateEntree?: string;

    @Column({
        type: 'enum',
        enum: MaterielEtat,
    })
    etat: MaterielEtat;

    @Column({ nullable: true })
    marque?: string;

    @Column({ nullable: true })
    modele?: string;

    @ManyToOne(() => Category, { nullable: false })
    @JoinColumn({ name: 'categorieId' })
    categorie: Category;

    @ManyToOne(() => ServiceEntity, (service) => service.materiels, { nullable: false })
    @JoinColumn({ name: 'serviceId' })
    service: ServiceEntity;

    @ManyToOne(() => User, (user) => user.materiels, { nullable: false })
    @JoinColumn({ name: 'proprietaireId' })
    proprietaire: User;
}
