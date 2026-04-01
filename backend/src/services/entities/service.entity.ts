import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Materiel } from '../../materiels/entities/materiel.entity';

@Entity('services')
@Index(['department', 'name'], { unique: true })
@Index(['department', 'code'], { unique: true })
export class ServiceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    code: string;

    @ManyToOne(() => Department, (department) => department.services, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'departmentId' })
    department: Department;

    @OneToMany(() => Materiel, (materiel) => materiel.service)
    materiels: Materiel[];
}
