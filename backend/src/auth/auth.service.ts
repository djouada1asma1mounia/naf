import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { User } from 'src/users/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { In, Repository } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { Department } from 'src/departments/entities/department.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Permission } from 'src/permissions/entities/permission.entity';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
        private jwtService: JwtService,
    ) { }

    async register(RegisterUserDto: RegisterUserDto) {
        const { email, nom, prenom, roleId, departmentId, permissionIds, password } = RegisterUserDto;

        const [role, department, existingUser] = await Promise.all([
            this.roleRepository.findOne({ where: { id: roleId } }),
            this.departmentRepository.findOne({ where: { id: departmentId } }),
            this.userRepository.findOne({ where: { email } }),
        ]);

        if (!role) {
            throw new NotFoundException('Role introuvable');
        }

        if (!department) {
            throw new NotFoundException('Département introuvable');
        }

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        let permissions: Permission[] = [];
        if (permissionIds?.length) {
            permissions = await this.permissionRepository.find({
                where: { id: In(permissionIds) },
            });

            if (permissions.length !== new Set(permissionIds).size) {
                throw new NotFoundException('Une ou plusieurs permissions sont introuvables');
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.userRepository.create({
            email,
            nom,
            prenom,
            password: hashedPassword,
            role,
            department,
            permissions,
        });

        await this.userRepository.save(newUser);

        return {
            message: 'Utilisateur enregistré avec succès',
        }
    }

    async login(LoginUserDto: LoginUserDto) {
        const { email, password } = LoginUserDto;


        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const tokens = await this.generateTokens(user);

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        user.refreshToken = hashedRefreshToken;
        await this.userRepository.save(user);

        return {
            data: user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            message: 'Connexion réussie',
        }
    }

    async refreshToken(refreshToken: string) {

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        let payload;

        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            })
        } catch {
            throw new UnauthorizedException('Token de rafraîchissement invalide');
        }

        const user = await this.userRepository.findOne({ where: { id: payload.sub } });
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Utilisateur non trouvé ou pas de token de rafraîchissement');
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch) {
            throw new UnauthorizedException('Token de rafraîchissement invalide');
        }

        const accessToken = await this.generateAccessToken(user);

        return {
            accessToken,
            message: 'Token de rafraîchissement réussi',
        }
    }

    async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '1h',
        })

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        })

        return {
            accessToken,
            refreshToken,
        }
    }

    async generateAccessToken(user: User) {
        const payload = { sub: user.id, email: user.email };
        return await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '1h',
        })
    }

    async changePassword(userId: string | undefined, dto: ChangePasswordDto) {
        if (!userId) {
            throw new UnauthorizedException('Utilisateur non authentifié');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Mot de passe actuel incorrect');
        }

        const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
        if (isSamePassword) {
            throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
        }

        user.password = await bcrypt.hash(dto.newPassword, 10);
        user.refreshToken = undefined;
        await this.userRepository.save(user);

        return {
            message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.',
        };
    }
}


