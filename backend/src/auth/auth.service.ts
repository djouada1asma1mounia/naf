import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from 'src/users/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async register(RegisterUserDto: RegisterUserDto) {
        const { email, nom, prenom, password } = RegisterUserDto;

        const existingUser = await this.userRepository.findOne({ where: { email } });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.userRepository.create({
            email,
            nom,
            prenom,
            password: hashedPassword,
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

        return {
            data: user,
            message: 'Connexion réussie',
        }
    }
}
