import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Materiel } from '../../materiels/entities/materiel.entity';

@Entity('subsidiaries')
export class Subsidiary {
    @PrimaryColumn()
    code: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => Materiel, (materiel) => materiel.subsidiary)
    materiels: Materiel[];
}
