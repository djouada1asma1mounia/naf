import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubsidiaryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;
}
