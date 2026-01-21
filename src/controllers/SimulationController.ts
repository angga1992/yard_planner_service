// src/controllers/SimulationController.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Scenario } from "../entities/Scenario";
import { SimulationSession } from "../entities/SimulationSession";
import { User } from "../entities/User";
import { Simulator } from "../simulation/Simulator";
import { GreedyStrategy } from "../simulation/strategies/GreedyStrategy";
import { ReservationStrategy } from "../simulation/strategies/ReservationStrategy"; // IMPORT BARU

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// --- HELPER: RANDOM GENERATOR ---
const generateRandomYard = (totalBlocks: number = 4, baysPerBlock: number = 20) => {
    const blocks = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, totalBlocks);
    const rows = 5; 
    const tiers = 5; 
    const stacks: any[] = [];
    let containerCounter = 1000;

    blocks.forEach(block => {
        for (let bay = 1; bay <= baysPerBlock; bay++) {
            for (let row = 1; row <= rows; row++) {
                const currentStackHeight = Math.floor(Math.random() * (tiers + 1));
                const isReeferRow = (row === 1);
                const isHazardBlock = (block === 'C');

                for (let tier = 1; tier <= tiers; tier++) {
                    const isFilled = tier <= currentStackHeight;
                    const size = Math.random() > 0.7 ? 20 : 40; 
                    const contId = isFilled ? `RND-${containerCounter++}` : null;
                    
                    stacks.push({
                        yard: "Y1",
                        block: block,
                        bay: bay,
                        row: row,
                        tier: tier,
                        container_id: contId,
                        is_empty_space: isFilled ? 0 : 1,
                        size_ft: size,
                        weight_kg: isFilled ? 20000 : 0,
                        is_reefer_compatible: isReeferRow, 
                        is_hazard_compatible: isHazardBlock,
                        is_reefer: (isFilled && isReeferRow && Math.random() > 0.7) ? 1 : 0,
                        is_hazard: (isFilled && isHazardBlock && Math.random() > 0.9) ? 1 : 0,
                        iso_code: "42G1",
                        reserved_for: null // Init null
                    });
                }
            }
        }
    });
    return { stacks, cranes: [] };
};

export class SimulationController {

    static async initSession(req: Request, res: Response): Promise<any> {
        const { apiKey, scenarioId } = req.body;
        try {
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOneBy({ apiKey });
            if (!user) return res.status(401).json({ message: "API Key tidak valid!" });

            const scenarioRepo = AppDataSource.getRepository(Scenario);
            const scenario = await scenarioRepo.findOneBy({ id: scenarioId });
            if (!scenario) return res.status(404).json({ message: "Skenario tidak ditemukan" });

            const sessionRepo = AppDataSource.getRepository(SimulationSession);
            const newSession = new SimulationSession();
            newSession.user = user;
            newSession.scenario = scenario;
            newSession.current_yard_state = JSON.parse(JSON.stringify(scenario.initial_yard_state)); 
            newSession.status = "RUNNING";

            await sessionRepo.save(newSession);
            return res.json({ message: "Sesi Simulasi Siap!", sessionId: newSession.id });
        } catch (error) { return res.status(500).json({ message: "Gagal membuat sesi", error }); }
    }

    static async seedDummyData(req: Request, res: Response): Promise<any> {
        const source = req.body.source || 'json';
        const resetAll = req.body.resetAll !== false;
        try {
            if (resetAll) {
                await AppDataSource.query(`DELETE FROM simulation_sessions`);
                await AppDataSource.query(`DELETE FROM scenarios`);
            }
            const userRepo = AppDataSource.getRepository(User);
            let user = await userRepo.findOneBy({ username: "data_scientist_1" });
            if (!user) {
                user = new User();
                user.username = "data_scientist_1";
                user.apiKey = "kunci-rahasia-budi-123"; 
                await userRepo.save(user);
            }

            let yardData;
            let scenarioName = "";
            if (source === 'random') {
                yardData = generateRandomYard(4, 20); 
                scenarioName = "Random Generated Scenario";
            } else {
                const jsonPath = path.join(__dirname, '../../planning_event_environment_state.json');
                if (fs.existsSync(jsonPath)) {
                    const rawData = fs.readFileSync(jsonPath, 'utf-8');
                    yardData = JSON.parse(rawData);
                    scenarioName = "Real Data Import";
                } else {
                    yardData = generateRandomYard(4, 20);
                    scenarioName = "Fallback Random Scenario";
                }
            }
            const scenarioRepo = AppDataSource.getRepository(Scenario);
            const scenario = new Scenario();
            scenario.name = scenarioName;
            scenario.description = "Generated by System";
            scenario.initial_yard_state = yardData;
            await scenarioRepo.save(scenario);

            return res.json({ message: `Seed Berhasil (${source})`, scenario });
        } catch (error: any) { return res.status(500).json({ message: "Gagal seed data", error: error.message }); }
    }

    // --- NEW: GENERATE PRE-PLAN ---
    static async generatePreplan(req: Request, res: Response): Promise<any> {
        const { sessionId, incomingManifest } = req.body; 

        try {
            const sessionRepo = AppDataSource.getRepository(SimulationSession);
            const session = await sessionRepo.findOneBy({ id: sessionId });
            if (!session) return res.status(404).json({ message: "Sesi tidak ditemukan" });

            const sim = new Simulator(session.current_yard_state);
            // Planner menggunakan GreedyStrategy murni untuk mencari slot kosong
            const planningStrategy = new GreedyStrategy(); 

            let plannedCount = 0;
            const reservations = [];

            for (const item of incomingManifest) {
                const container = {
                    id: item.container_id,
                    size: item.size_ft || 40,
                    weight: item.weight_kg || 20000,
                    type: item.is_reefer ? 'REEFER' : 'DRY',
                    is_import: true
                };

                // Cari slot VIRTUAL
                // (Kita akses private property yardModel via casting any untuk simplify, idealnya via getter)
                const location = planningStrategy.findSlot((sim as any).yardModel, container);

                if (location) {
                    // Lakukan Reservasi
                    const success = (sim as any).yardModel.reserveSlot(container.id, location);
                    if (success) {
                        plannedCount++;
                        reservations.push({ container_id: container.id, location });
                    }
                }
            }

            session.current_yard_state = sim.getYardState();
            await sessionRepo.save(session);

            return res.json({
                message: "Pre-planning Selesai",
                planned_containers: plannedCount,
                total_manifest: incomingManifest.length,
                details: reservations 
            });

        } catch (error: any) {
            return res.status(500).json({ message: "Preplanning Gagal", error: error.message });
        }
    }

    static async executeAction(req: Request, res: Response): Promise<any> {
        const { sessionId, event } = req.body; 
        if (!event) return res.status(400).json({ message: "Body 'event' wajib diisi" });

        try {
            const sessionRepo = AppDataSource.getRepository(SimulationSession);
            const session = await sessionRepo.findOneBy({ id: sessionId });
            if (!session) return res.status(404).json({ message: "Sesi tidak ditemukan" });

            const sim = new Simulator(session.current_yard_state);
            // UPDATE: Gunakan ReservationStrategy
            const strategy = new ReservationStrategy(); 

            const result = await sim.processEvent(event, strategy);

            session.current_yard_state = sim.getYardState();
            await sessionRepo.save(session);

            return res.json({
                message: "Simulasi Berhasil",
                sessionId: sessionId,
                algorithm_used: "ReservationBased + SmartGreedy",
                simulation_metrics: {
                    total_time_simulated: result.totalTime,
                    action_taken: result.actionTaken,
                },
                logs: result.logs
            });

        } catch (error: any) { return res.status(500).json({ message: "Gagal menjalankan simulasi", error: error.message }); }
    }

    static async executeBatchAction(req: Request, res: Response): Promise<any> {
        const { sessionId, events } = req.body; 
        if (!events || !Array.isArray(events)) return res.status(400).json({ message: "Body 'events' harus array" });

        try {
            const sessionRepo = AppDataSource.getRepository(SimulationSession);
            const session = await sessionRepo.findOneBy({ id: sessionId });
            if (!session) return res.status(404).json({ message: "Sesi tidak ditemukan" });

            const sim = new Simulator(session.current_yard_state);
            // UPDATE: Gunakan ReservationStrategy
            const strategy = new ReservationStrategy();

            const batchResults = [];
            const startTime = performance.now(); 
            const craneTimelines: Record<string, number> = {}; 
            const TOTAL_TRUCKS = 5; 
            const truckPoolTimelines: number[] = new Array(TOTAL_TRUCKS).fill(0);

            console.log(`[Batch] Processing ${events.length} events...`);

            for (const event of events) {
                try {
                    const result = await sim.processEvent(event, strategy);
                    
                    let scheduleInfo = null;
                    if (result.success && result.actionTaken) {
                        const targetBlock = result.actionTaken.block; 
                        
                        // Resource Contention Logic
                        truckPoolTimelines.sort((a, b) => a - b);
                        const earliestTruckFreeTime = truckPoolTimelines[0]; 
                        const truckTravelTime = 60000; 
                        const truckJobFinishTime = earliestTruckFreeTime + truckTravelTime;
                        truckPoolTimelines[0] = truckJobFinishTime;

                        const craneFreeAt = craneTimelines[targetBlock] || 0;
                        const truckArriveAtBlock = earliestTruckFreeTime + (truckTravelTime / 2);
                        const craneStartTime = Math.max(craneFreeAt, truckArriveAtBlock);
                        const craneFinishTime = craneStartTime + result.totalTime;
                        craneTimelines[targetBlock] = craneFinishTime;

                        scheduleInfo = {
                            crane_id: `Crane-${targetBlock}`,
                            queue_start_time: earliestTruckFreeTime,
                            finish_time: craneFinishTime
                        };
                    }

                    batchResults.push({
                        status: result.success ? "OK" : "FAILED",
                        truck_id: event.truck_id,
                        container_id: event.container_id,
                        action: result.actionTaken,
                        simulation_data: scheduleInfo, 
                        error: result.success ? null : (result.logs.find(l => l.startsWith("Error")) || "Unknown Error")
                    });
                } catch (err: any) {
                    batchResults.push({ status: "ERROR", truck_id: event.truck_id, error: err.message });
                }
            }

            let maxSimulatedTime = 0;
            let busiestBlock = "-";
            for (const [block, time] of Object.entries(craneTimelines)) {
                if (time > maxSimulatedTime) {
                    maxSimulatedTime = time;
                    busiestBlock = block;
                }
            }

            session.current_yard_state = sim.getYardState(); 
            await sessionRepo.save(session);
            const endTime = performance.now();

            return res.json({
                message: "Batch Simulation Selesai",
                sessionId: sessionId,
                total_events: events.length,
                cpu_processing_time_ms: (endTime - startTime).toFixed(2), 
                total_operational_time_ms: maxSimulatedTime, 
                active_trucks: TOTAL_TRUCKS,
                busiest_block: busiestBlock,
                results: batchResults
            });

        } catch (error: any) { return res.status(500).json({ message: "Gagal batch", error: error.message }); }
    }

    static async getCurrentState(req: Request, res: Response): Promise<any> {
        const sessionId = req.params.sessionId as string;
        try {
            const sessionRepo = AppDataSource.getRepository(SimulationSession);
            const session = await sessionRepo.findOneBy({ id: sessionId });
            if (!session) return res.status(404).json({ message: "Sesi tidak ditemukan" });
            return res.json({ sessionId: session.id, yard_state: session.current_yard_state });
        } catch (error) { return res.status(500).json({ message: "Error snapshot", error }); }
    }

    static async listScenarios(req: Request, res: Response): Promise<any> {
        try {
            const scenarioRepo = AppDataSource.getRepository(Scenario);
            const scenarios = await scenarioRepo.find({
                select: { id: true, name: true, description: true }, order: { id: "DESC" }
            });
            return res.json(scenarios);
        } catch (error) { return res.status(500).json({ message: "Gagal list scenario" }); }
    }
}