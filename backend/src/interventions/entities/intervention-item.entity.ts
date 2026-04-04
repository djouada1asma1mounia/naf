import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Intervention } from './intervention.entity';

@Entity('intervention_items')
export class InterventionItem {
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

    @ManyToOne(() => Intervention, (intervention) => intervention.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'interventionId' })
    intervention!: Intervention;
}
