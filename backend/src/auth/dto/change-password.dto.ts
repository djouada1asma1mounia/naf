import { IsString, MinLength } from 'class-validator';
import { Match } from 'src/validators/match.validators';

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(6)
    newPassword: string;

    @IsString()
    @Match('newPassword', { message: 'Les mots de passe ne correspondent pas' })
    confirmNewPassword: string;
}
