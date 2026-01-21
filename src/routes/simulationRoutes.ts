import { Router } from "express";
import { SimulationController } from "../controllers/SimulationController";

const router = Router();

router.post("/init-session", SimulationController.initSession);
router.post("/seed", SimulationController.seedDummyData);
router.post("/execute", SimulationController.executeAction);
router.post("/execute-batch", SimulationController.executeBatchAction);
router.get("/state/:sessionId", SimulationController.getCurrentState);
router.get("/scenarios", SimulationController.listScenarios);

// --- ROUTE BARU ---
router.post("/preplan", SimulationController.generatePreplan);

export default router;