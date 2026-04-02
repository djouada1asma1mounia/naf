import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Decharge } from './decharge.entity';

@Entity('decharge_items')
export class DechargeItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    designation!: string;

    @Column({ type: 'int', unsigned: true })
    quantity!: number;

    @Column({ nullable: true })
    marque?: string;

    @Column({ nullable: true })
    numeroSerie?: string;

    @Column({ nullable: true })
    numeroInventaire?: string;

    @ManyToOne(() => Decharge, (decharge) => decharge.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'dechargeId' })
    decharge!: Decharge;
}
