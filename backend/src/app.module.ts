import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('HOST')!,
        port: parseInt(config.get<string>('DB_PORT')!, 10),
        username: config.get<string>('USERNAMEDB')!,
        password: config.get<string>('PASSWORD')!,
        database: config.get<string>('DATABASE')!,
        synchronize: false,
        autoLoadEntities: true,
        ssl: {
          rejectUnauthorized: false
        },

      }),
    }),
    UsersModule,
    PermissionsModule,
    AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
