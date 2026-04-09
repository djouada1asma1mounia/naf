import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { Role } from 'src/roles/entities/role.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Permission } from 'src/permissions/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Department, Permission]),
  JwtModule.register({
    secret: process.env.JWT_ACCESS_SECRET,
    signOptions: { expiresIn: '1h' },
  })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
