import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private userRepositoy: Repository<User>,
    ) {
        super({

            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_ACCESS_SECRET,
        })
    }

    async validate(payload: any) {
        const user = await this.userRepositoy.findOne({ where: { id: payload.sub }, relations: ['permissions'] })
        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }
        return user;
    }
}