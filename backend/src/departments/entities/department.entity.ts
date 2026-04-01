import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Materiel } from "../../materiels/entities/materiel.entity";
import { ServiceEntity } from "../../services/entities/service.entity";

@Entity('departments')
export class Department {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    code: string;

    @OneToMany(() => User, user => user.department)
    users: User[];

    @OneToMany(() => Materiel, materiel => materiel.department)
    materiels: Materiel[];

    @OneToMany(() => ServiceEntity, service => service.department)
    services: ServiceEntity[];

    @OneToOne(() => User, User => User.departmentManager)
    @JoinColumn({ name: 'managerId' })
    managerId?: User;
}
