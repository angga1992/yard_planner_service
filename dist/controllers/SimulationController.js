"use strict";
// src/controllers/SimulationController.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationController = void 0;
const data_source_1 = require("../config/data-source");
const Scenario_1 = require("../entities/Scenario");
const SimulationSession_1 = require("../entities/SimulationSession");
const User_1 = require("../entities/User");
const Simulator_1 = require("../simulation/Simulator");
const GreedyStrategy_1 = require("../simulation/strategies/GreedyStrategy");
const ReservationStrategy_1 = require("../simulation/strategies/ReservationStrategy"); // IMPORT BARU
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const perf_hooks_1 = require("perf_hooks");
// --- HELPER: RANDOM GENERATOR ---
const generateRandomYard = (totalBlocks = 4, baysPerBlock = 20) => {
    const blocks = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, totalBlocks);
    const rows = 5;
    const tiers = 5;
    const stacks = [];
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
class SimulationController {
    static initSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { apiKey, scenarioId } = req.body;
            try {
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                const user = yield userRepo.findOneBy({ apiKey });
                if (!user)
                    return res.status(401).json({ message: "API Key tidak valid!" });
                const scenarioRepo = data_source_1.AppDataSource.getRepository(Scenario_1.Scenario);
                const scenario = yield scenarioRepo.findOneBy({ id: scenarioId });
                if (!scenario)
                    return res.status(404).json({ message: "Skenario tidak ditemukan" });
                const sessionRepo = data_source_1.AppDataSource.getRepository(SimulationSession_1.SimulationSession);
                const newSession = new SimulationSession_1.SimulationSession();
                newSession.user = user;
                newSession.scenario = scenario;
                newSession.current_yard_state = JSON.parse(JSON.stringify(scenario.initial_yard_state));
                newSession.status = "RUNNING";
                yield sessionRepo.save(newSession);
                return res.json({ message: "Sesi Simulasi Siap!", sessionId: newSession.id });
            }
            catch (error) {
                return res.status(500).json({ message: "Gagal membuat sesi", error });
            }
        });
    }
    static seedDummyData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const source = req.body.source || 'json';
            const resetAll = req.body.resetAll !== false;
            try {
                if (resetAll) {
                    yield data_source_1.AppDataSource.query(`DELETE FROM simulation_sessions`);
                    yield data_source_1.AppDataSource.query(`DELETE FROM scenarios`);
                }
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                let user = yield userRepo.findOneBy({ username: "data_scientist_1" });
                if (!user) {
                    user = new User_1.User();
                    user.username = "data_scientist_1";
                    user.apiKey = "kunci-rahasia-budi-123";
                    yield userRepo.save(user);
                }
                let yardData;
                let scenarioName = "";
                if (source === 'random') {
                    yardData = generateRandomYard(4, 20);
                    scenarioName = "Random Generated Scenario";
                }
                else {
                    const jsonPath = path.join(__dirname, '../../planning_event_environment_state.json');
                    if (fs.existsSync(jsonPath)) {
                        const rawData = fs.readFileSync(jsonPath, 'utf-8');
                        yardData = JSON.parse(rawData);
                        scenarioName = "Real Data Import";
                    }
                    else {
                        yardData = generateRandomYard(4, 20);
                        scenarioName = "Fallback Random Scenario";
                    }
                }
                const scenarioRepo = data_source_1.AppDataSource.getRepository(Scenario_1.Scenario);
                const scenario = new Scenario_1.Scenario();
                scenario.name = scenarioName;
                scenario.description = "Generated by System";
                scenario.initial_yard_state = yardData;
                yield scenarioRepo.save(scenario);
                return res.json({ message: `Seed Berhasil (${source})`, scenario });
            }
            catch (error) {
                return res.status(500).json({ message: "Gagal seed data", error: error.message });
            }
        });
    }
    // --- NEW: GENERATE PRE-PLAN ---
    static generatePreplan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, incomingManifest } = req.body;
            try {
                const sessionRepo = data_source_1.AppDataSource.getRepository(SimulationSession_1.SimulationSession);
                const session = yield sessionRepo.findOneBy({ id: sessionId });
                if (!session)
                    return res.status(404).json({ message: "Sesi tidak ditemukan" });
                const sim = new Simulator_1.Simulator(session.current_yard_state);
                // Planner menggunakan GreedyStrategy murni untuk mencari slot kosong
                const planningStrategy = new GreedyStrategy_1.GreedyStrategy();
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
                    const location = planningStrategy.findSlot(sim.yardModel, container);
                    if (location) {
                        // Lakukan Reservasi
                        const success = sim.yardModel.reserveSlot(container.id, location);
                        if (success) {
                            plannedCount++;
                            reservations.push({ container_id: container.id, location });
                        }
                    }
                }
                session.current_yard_state = sim.getYardState();
                yield sessionRepo.save(session);
                return res.json({
                    message: "Pre-planning Selesai",
                    planned_containers: plannedCount,
                    total_manifest: incomingManifest.length,
                    details: reservations
                });
            }
            catch (error) {
                return res.status(500).json({ message: "Preplanning Gagal", error: error.message });
            }
        });
    }
    static executeAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, event } = req.body;
            if (!event)
                return res.status(400).json({ message: "Body 'event' wajib diisi" });
            try {
                const sessionRepo = data_source_1.AppDataSource.getRepository(SimulationSession_1.SimulationSession);
                const session = yield sessionRepo.findOneBy({ id: sessionId });
                if (!session)
                    return res.status(404).json({ message: "Sesi tidak ditemukan" });
                const sim = new Simulator_1.Simulator(session.current_yard_state);
                // UPDATE: Gunakan ReservationStrategy
                const strategy = new ReservationStrategy_1.ReservationStrategy();
                const result = yield sim.processEvent(event, strategy);
                session.current_yard_state = sim.getYardState();
                yield sessionRepo.save(session);
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
            }
            catch (error) {
                return res.status(500).json({ message: "Gagal menjalankan simulasi", error: error.message });
            }
        });
    }
    static executeBatchAction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, events } = req.body;
            if (!events || !Array.isArray(events))
                return res.status(400).json({ message: "Body 'events' harus array" });
            try {
                const sessionRepo = data_source_1.AppDataSource.getRepository(SimulationSession_1.SimulationSession);
                const session = yield sessionRepo.findOneBy({ id: sessionId });
                if (!session)
                    return res.status(404).json({ message: "Sesi tidak ditemukan" });
                const sim = new Simulator_1.Simulator(session.current_yard_state);
                // UPDATE: Gunakan ReservationStrategy
                const strategy = new ReservationStrategy_1.ReservationStrategy();
                const batchResults = [];
                const startTime = perf_hooks_1.performance.now();
                const craneTimelines = {};
                const TOTAL_TRUCKS = 5;
                const truckPoolTimelines = new Array(TOTAL_TRUCKS).fill(0);
                console.log(`[Batch] Processing ${events.length} events...`);
                for (const event of events) {
                    try {
                        const result = yield sim.processEvent(event, strategy);
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
                    }
                    catch (err) {
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
                yield sessionRepo.save(session);
                const endTime = perf_hooks_1.performance.now();
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
            }
            catch (error) {
                return res.status(500).json({ message: "Gagal batch", error: error.message });
            }
        });
    }
    static getCurrentState(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = req.params.sessionId;
            try {
                const sessionRepo = data_source_1.AppDataSource.getRepository(SimulationSession_1.SimulationSession);
                const session = yield sessionRepo.findOneBy({ id: sessionId });
                if (!session)
                    return res.status(404).json({ message: "Sesi tidak ditemukan" });
                return res.json({ sessionId: session.id, yard_state: session.current_yard_state });
            }
            catch (error) {
                return res.status(500).json({ message: "Error snapshot", error });
            }
        });
    }
    static listScenarios(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scenarioRepo = data_source_1.AppDataSource.getRepository(Scenario_1.Scenario);
                const scenarios = yield scenarioRepo.find({
                    select: { id: true, name: true, description: true }, order: { id: "DESC" }
                });
                return res.json(scenarios);
            }
            catch (error) {
                return res.status(500).json({ message: "Gagal list scenario" });
            }
        });
    }
}
exports.SimulationController = SimulationController;
