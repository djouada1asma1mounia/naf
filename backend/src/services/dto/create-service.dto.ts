import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    code: string;

    @IsInt()
    @Min(1)
    departmentId: number;
}
