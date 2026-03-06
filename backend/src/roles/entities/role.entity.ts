import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('roles')
export class Role {

    @PrimaryGeneratedColumn()
    id: string;

    @Column({
        unique: true,
    })
    name: string;
}
