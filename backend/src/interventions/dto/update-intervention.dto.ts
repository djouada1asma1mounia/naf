import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InterventionStatus, InterventionType } from '../entities/intervention.entity';

export class UpdateInterventionItemDto {
    @IsString()
    designation!: string;

    @IsInt()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsString()
    marque?: string;

    @IsOptional()
    @IsString()
    numeroSerie?: string;

    @IsOptional()
    @IsString()
    numeroInventaire?: string;
}

export class UpdateInterventionDto {
    @IsOptional()
    @IsEnum(InterventionType)
    interventionType?: InterventionType;

    @IsOptional()
    @IsEnum(InterventionStatus)
    status?: InterventionStatus;

    @IsOptional()
    @IsString()
    observation?: string;

    @IsOptional()
    @IsString()
    destinataire?: string;

    @IsOptional()
    @IsString()
    interventionnaireNom?: string;

    @IsOptional()
    @IsString()
    interventionnairePrenom?: string;

    @IsOptional()
    @IsString()
    interventionnaireFonction?: string;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UpdateInterventionItemDto)
    items?: UpdateInterventionItemDto[];
}