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
import { MaintenanceType } from '../entities/decharge.entity';

export class CreateDechargeItemDto {
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

export class CreateDechargeDto {
    @IsEnum(MaintenanceType)
    maintenanceType!: MaintenanceType;

    @IsOptional()
    @IsString()
    observation?: string;

    @IsString()
    @IsNotEmpty()
    destinataire!: string;

    @IsString()
    @IsNotEmpty()
    receptionnaireNom!: string;

    @IsString()
    @IsNotEmpty()
    receptionnairePrenom!: string;

    @IsString()
    @IsNotEmpty()
    receptionnaireFonction!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateDechargeItemDto)
    items!: CreateDechargeItemDto[];
}
