import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from "../../permissions/entities/permission.entity";
import { Exclude } from "class-transformer";
import { Role } from "../../roles/entities/role.entity";
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

    @ManyToMany(() => Permission)
    @JoinTable()
    permissions: Permission[];

    @ManyToOne(() => Role, role => role.users)
    role: Role;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    @Exclude({ toPlainOnly: true })
    refreshToken?: string;

    get fullName(): string {
        return `${this.nom} ${this.prenom}`;
    }

}
