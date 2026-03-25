import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Department } from '../../departments/entities/department.entity';
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

    @ManyToOne(() => Department, (department) => department.materiels, { nullable: false })
    @JoinColumn({ name: 'departmentId' })
    department: Department;

    @ManyToOne(() => User, (user) => user.materiels, { nullable: false })
    @JoinColumn({ name: 'proprietaireId' })
    proprietaire: User;
}
