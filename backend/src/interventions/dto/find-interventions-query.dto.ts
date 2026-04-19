import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InterventionStatus, InterventionType } from '../entities/intervention.entity';

export class FindInterventionsQueryDto {
    @IsOptional()
    @IsEnum(InterventionType)
    type?: InterventionType;

    @IsOptional()
    @IsEnum(InterventionStatus)
    status?: InterventionStatus;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    structure?: string;

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;
}
