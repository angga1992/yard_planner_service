import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("scenarios")
export class Scenario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string; 

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "jsonb" })
    initial_yard_state: object; 

    @CreateDateColumn()
    createdAt: Date;
}