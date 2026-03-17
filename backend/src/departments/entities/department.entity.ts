import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

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

    @OneToOne(() => User, User => User.departmentManager)
    @JoinColumn({ name: 'managerId' })
    managerId?: User;
}
