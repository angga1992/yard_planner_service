"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SimulationController_1 = require("../controllers/SimulationController");
const router = (0, express_1.Router)();
router.post("/init-session", SimulationController_1.SimulationController.initSession);
router.post("/seed", SimulationController_1.SimulationController.seedDummyData);
router.post("/execute", SimulationController_1.SimulationController.executeAction);
router.post("/execute-batch", SimulationController_1.SimulationController.executeBatchAction);
router.get("/state/:sessionId", SimulationController_1.SimulationController.getCurrentState);
router.get("/scenarios", SimulationController_1.SimulationController.listScenarios);
// --- ROUTE BARU ---
router.post("/preplan", SimulationController_1.SimulationController.generatePreplan);
exports.default = router;
