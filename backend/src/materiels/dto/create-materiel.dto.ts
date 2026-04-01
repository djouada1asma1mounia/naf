import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaterielEtat } from '../entities/materiel.entity';

export class CreateMaterielDto {
    @IsString()
    @IsNotEmpty()
    numeroSerie: string;

    @IsString()
    @IsNotEmpty()
    numeroInventaire: string;

    @IsInt()
    categorieId: number;

    @IsInt()
    serviceId: number;

    @IsUUID()
    proprietaireId: string;

    @IsOptional()
    @IsDateString()
    dateEntree?: string;

    @IsEnum(MaterielEtat)
    etat: MaterielEtat;

    @IsOptional()
    @IsString()
    marque?: string;

    @IsOptional()
    @IsString()
    modele?: string;
}
