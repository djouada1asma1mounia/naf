import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity('departments')
export class Department {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => User, user => user.department)
    users: User[];
}
