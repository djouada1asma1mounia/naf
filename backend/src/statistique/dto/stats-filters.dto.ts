import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { MaintenanceType } from 'src/decharges/entities/decharge.entity';
import { InterventionStatus, InterventionType } from 'src/interventions/entities/intervention.entity';
import { MaterielEtat } from 'src/materiels/entities/materiel.entity';

const toStringArray = ({ value }: { value: unknown }): string[] | undefined => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0);
    }

    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

export class StatsFiltersDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    categoryId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    serviceId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    departmentId?: number;

    @IsOptional()
    @IsString()
    subsidiaryCode?: string;

    @IsOptional()
    @IsString()
    ownerId?: string;

    @IsOptional()
    @IsString()
    destinataire?: string;

    @IsOptional()
    @Transform(toStringArray)
    @IsArray()
    @IsEnum(MaterielEtat, { each: true })
    materialStatuses?: MaterielEtat[];

    @IsOptional()
    @Transform(toStringArray)
    @IsArray()
    @IsEnum(InterventionType, { each: true })
    interventionTypes?: InterventionType[];

    @IsOptional()
    @Transform(toStringArray)
    @IsArray()
    @IsEnum(InterventionStatus, { each: true })
    interventionStatuses?: InterventionStatus[];

    @IsOptional()
    @Transform(toStringArray)
    @IsArray()
    @IsEnum(MaintenanceType, { each: true })
    dechargeTypes?: MaintenanceType[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(24)
    months?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    top?: number;
}
