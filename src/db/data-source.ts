import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { User } from '../entities/User';
import {ServiceType} from "../entities/ServiceType";
import {Store} from "../entities/Store";
import {UserLocation} from "../entities/UserLocation";
import { Favorite } from '../entities/Favorite';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    // Bật timezone UTC để đồng nhất
    timezone: 'Z',
    entities: [User, ServiceType, Store, UserLocation, Favorite],
    synchronize: true, // luôn false trong prod
    logging: false
});
