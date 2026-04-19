import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ImportExcelQueryDto {
    @IsOptional()
    @IsIn(['error', 'skip'])
    onMissingForeign?: 'error' | 'skip';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(1000)
    batchSize?: number;

    @IsOptional()
    @IsIn(['partial', 'full'])
    transactionMode?: 'partial' | 'full';

    @IsOptional()
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value
                .flatMap((entry) => String(entry).split(','))
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0);
        }

        if (typeof value === 'string') {
            return value
                .split(',')
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0);
        }

        return undefined;
    })
    @IsArray()
    @IsString({ each: true })
    targetSheets?: string[];
}
