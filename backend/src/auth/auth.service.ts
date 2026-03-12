import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { User } from 'src/users/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
        private jwtService: JwtService,
    ) { }

    async register(RegisterUserDto: RegisterUserDto) {
        const { email, nom, prenom, roleId, departmentId, password } = RegisterUserDto;

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

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.userRepository.create({
            email,
            nom,
            prenom,
            password: hashedPassword,
            role,
            department,
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
}


