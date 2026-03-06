import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
dotenv.config({ path: '.env' })

export default new DataSource({
    type: 'mysql',
    host: process.env.HOST,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.USERNAMEDB,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
})