import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

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
}
