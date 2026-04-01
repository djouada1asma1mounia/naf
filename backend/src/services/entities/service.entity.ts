import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';

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
}
