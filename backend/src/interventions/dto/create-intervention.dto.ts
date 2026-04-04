import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InterventionType } from '../entities/intervention.entity';

export class CreateInterventionItemDto {
    @IsString()
    @IsNotEmpty()
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

export class CreateInterventionDto {
    @IsEnum(InterventionType)
    interventionType!: InterventionType;

    @IsOptional()
    @IsString()
    observation?: string;

    @IsString()
    @IsNotEmpty()
    destinataire!: string;

    @IsString()
    @IsNotEmpty()
    interventionnaireNom!: string;

    @IsString()
    @IsNotEmpty()
    interventionnairePrenom!: string;

    @IsString()
    @IsNotEmpty()
    interventionnaireFonction!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateInterventionItemDto)
    items!: CreateInterventionItemDto[];
}
