import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { User } from "./User";
import { Scenario } from "./Scenario";

@Entity("simulation_sessions")
export class SimulationSession {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // Relasi ke User
    @Column()
    userId: string;
    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User;

    // Relasi ke Scenario Asal
    @Column()
    scenarioId: number;
    @ManyToOne(() => Scenario)
    @JoinColumn({ name: "scenarioId" })
    scenario: Scenario;

    // SANDBOX STATE:
    // Awalnya copy dari scenario, lalu berubah seiring simulasi jalan
    @Column({ type: "jsonb" })
    current_yard_state: object; 

    @Column({ default: "RUNNING" })
    status: string; 

    @CreateDateColumn()
    startedAt: Date;
}