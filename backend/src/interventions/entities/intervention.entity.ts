import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { InterventionItem } from './intervention-item.entity';
import { User } from '../../users/entities/user.entity';

export enum InterventionType {
    HARD = 'HARD',
    SOFT = 'SOFT',
}

@Entity('interventions')
export class Intervention {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    reference!: string;

    @Column({
        type: 'enum',
        enum: InterventionType,
    })
    interventionType!: InterventionType;

    @Column({ type: 'text', nullable: true })
    observation?: string;

    @Column()
    destinataire!: string;

    @Column()
    interventionnaireNom!: string;

    @Column()
    interventionnairePrenom!: string;

    @Column()
    interventionnaireFonction!: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'createdById' })
    createdBy?: User;

    @OneToMany(() => InterventionItem, (item) => item.intervention, {
        cascade: ['insert', 'update'],
        eager: false,
    })
    items!: InterventionItem[];

    @CreateDateColumn()
    createdAt!: Date;
}
