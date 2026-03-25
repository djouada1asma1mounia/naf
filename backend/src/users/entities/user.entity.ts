import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from "../../permissions/entities/permission.entity";
import { Exclude } from "class-transformer";
import { Role } from "../../roles/entities/role.entity";
import { Department } from "../../departments/entities/department.entity";
import { Materiel } from "../../materiels/entities/materiel.entity";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nom: string;

    @Column()
    prenom: string;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    @Exclude({ toPlainOnly: true })
    password: string;

    @ManyToMany(() => Permission, permission => permission.users)
    @JoinTable()
    permissions: Permission[];

    @ManyToOne(() => Role, role => role.users)
    role: Role;

    @ManyToOne(() => Department, department => department.users)
    department: Department;

    @OneToMany(() => Materiel, materiel => materiel.proprietaire)
    materiels: Materiel[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    @Exclude({ toPlainOnly: true })
    refreshToken?: string;

    @OneToOne(() => Department, department => department.managerId)
    departmentManager: Department;

    get fullName(): string {
        return `${this.nom} ${this.prenom}`;
    }

}
