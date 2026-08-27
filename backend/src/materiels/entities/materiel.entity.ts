import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { Subsidiary } from '../../subsidiaries/entities/subsidiary.entity';
import { User } from '../../users/entities/user.entity';

export enum MaterielEtat {
    EN_SERVICE = 'En Service',
    EN_PANNE = 'En Panne',
    REFORME = 'Reforme',
}

@Entity('materiels')
export class Materiel {
    @PrimaryColumn()
    numeroSerie: string;

    @Column({ unique: true, nullable: true })
    numeroInventaire?: string;

    @Column({ type: 'date', nullable: true })
    dateEntree?: string;

    @Column({ type: 'date', nullable: true })
    finGarontie?: string;

    @Column({
        type: 'enum',
        enum: MaterielEtat,
    })
    etat: MaterielEtat;

    @Column({ nullable: true })
    marque?: string;

    @Column({ nullable: true })
    modele?: string;

    @Column({ nullable: true })
    utilisateur?: string;

    @ManyToOne(() => Category, { nullable: false })
    @JoinColumn({ name: 'categorieId' })
    categorie: Category;

    @ManyToOne(() => ServiceEntity, (service) => service.materiels, { nullable: true })
    @JoinColumn({ name: 'serviceId' })
    service?: ServiceEntity;

    @ManyToOne(() => User, (user) => user.materiels, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'proprietaireId' })
    proprietaire?: User;

    @ManyToOne(() => Subsidiary, (subsidiary) => subsidiary.materiels, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'subsidiaryCode' })
    subsidiary?: Subsidiary;
}
