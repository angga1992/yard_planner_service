import express from "express";
import cors from "cors"; // <--- 1. Import ini
import { AppDataSource } from "./config/data-source";
import simulationRoutes from "./routes/simulationRoutes";
import userRoutes from "./routes/userRoutes"

const app = express();
const PORT = process.env.PORT || 3000;

// --- 2. PASANG INI (Wajib paling atas sebelum routes) ---
app.use(cors()); 
// --------------------------------------------------------

app.use(express.json());

// Routes
app.use("/api/simulation", simulationRoutes);

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("Yard Planner Backend is Running!");
});

AppDataSource.initialize()
    .then(() => {
        console.log("🔥 Database Connected (Office Server)");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => console.log(error));