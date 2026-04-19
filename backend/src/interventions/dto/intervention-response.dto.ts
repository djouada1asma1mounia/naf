import { InterventionStatus, InterventionType } from '../entities/intervention.entity';

export class InterventionItemResponseDto {
    id!: number;
    category?: string;
    designation!: string;
    quantity!: number;
    marque?: string;
    numeroSerie?: string;
    numeroInventaire?: string;
}

export class InterventionCreatedByDto {
    id!: string;
    nom!: string;
    prenom!: string;
    email!: string;
}

export class InterventionResponseDto {
    id!: number;
    reference!: string;
    interventionType!: InterventionType;
    status!: InterventionStatus;
    observation?: string;
    destinataire!: string;
    interventionnaireNom!: string;
    interventionnairePrenom!: string;
    interventionnaireFonction!: string;
    createdAt!: Date;
    createdBy?: InterventionCreatedByDto;
    items!: InterventionItemResponseDto[];
}
