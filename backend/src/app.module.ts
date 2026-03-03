import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

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
        port: parseInt(config.get<string>('PORT')!, 10),
        username: config.get<string>('USERNAMEDB')!,
        password: config.get<string>('PASSWORD')!,
        database: config.get<string>('DATABASE')!,
        synchronize: config.get<string>('SYNCHRONIZE') === 'true',
        autoLoadEntities: true,
      }),
    })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
