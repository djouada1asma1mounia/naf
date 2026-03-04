import { IsEmail, IsString, MinLength } from "class-validator";
import { Match } from "src/validators/match.validators";

export class RegisterUserDto {

    @IsEmail()
    email: string;

    @IsString()
    nom: string;

    @IsString()
    prenom: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @Match('password', { message: 'Les mots de passe ne correspondent pas' })
    password_confirmed: string;
}