import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from "../../permissions/entities/permission.entity";
import { Exclude } from "class-transformer";

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
    email?: string;

    @Column()
    @Exclude({ toPlainOnly: true })
    password: string;

    @ManyToMany(() => Permission)
    @JoinTable()
    permissions: Permission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;


    get fullName(): string {
        return `${this.nom} ${this.prenom}`;
    }

}
