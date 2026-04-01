import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('subsidiaries')
export class Subsidiary {
    @PrimaryColumn()
    code: string;

    @Column({ unique: true })
    name: string;
}
