import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { DechargeItem } from './decharge-item.entity';
import { User } from '../../users/entities/user.entity';
export enum MaintenanceType {
    HARD = 'HARD',
    SOFT = 'SOFT',
}

@Entity('decharges')
export class Decharge {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    reference!: string;

    @Column({
        type: 'enum',
        enum: MaintenanceType,
    })
    maintenanceType!: MaintenanceType;

    @Column({ type: 'text', nullable: true })
    observation?: string;

    @Column()
    destinataire!: string;

    @Column()
    receptionnaireNom!: string;

    @Column()
    receptionnairePrenom!: string;

    @Column()
    receptionnaireFonction!: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'createdById' })
    createdBy?: User;

    @OneToMany(() => DechargeItem, (item) => item.decharge, {
        cascade: ['insert', 'update'],
        eager: false,
    })
    items!: DechargeItem[];

    @CreateDateColumn()
    createdAt!: Date;
}
