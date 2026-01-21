import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../entities/User";
import { Scenario } from "../entities/Scenario";
import { SimulationSession } from "../entities/SimulationSession";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true, 
    logging: false,
    entities: [User, Scenario, SimulationSession],
    subscribers: [],
    migrations: [],
    ssl: false 
});