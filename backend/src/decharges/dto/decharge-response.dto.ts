import { MaintenanceType } from '../entities/decharge.entity';

export class DechargeItemResponseDto {
    id!: number;
    designation!: string;
    quantity!: number;
    marque?: string;
    numeroSerie?: string;
    numeroInventaire?: string;
}

export class DechargeCreatedByDto {
    id!: string;
    nom!: string;
    prenom!: string;
    email!: string;
}

export class DechargeResponseDto {
    id!: number;
    reference!: string;
    maintenanceType!: MaintenanceType;
    observation?: string;
    destinataire!: string;
    receptionnaireNom!: string;
    receptionnairePrenom!: string;
    receptionnaireFonction!: string;
    createdAt!: Date;
    createdBy?: DechargeCreatedByDto;
    items!: DechargeItemResponseDto[];
}
