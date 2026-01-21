import "reflect-metadata"; // Penting untuk TypeORM
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source";
import simulationRoutes from "./routes/simulationRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS & JSON Middleware
app.use(cors());
app.use(express.json());

// =================================================================
// 2. MIDDLEWARE DATABASE (SOLUSI VERCEL)
// Di serverless, kita cek koneksi DB setiap kali ada request masuk.
// Jika belum connect, baru kita connect.
// =================================================================
app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
            console.log("🔥 Database Connected (Lazy Load)");
        } catch (error) {
            console.error("Database Connection Error:", error);
            return res.status(500).json({ message: "Database Connection Failed", error });
        }
    }
    next();
});

// 3. Routes
app.get("/", (req, res) => {
    res.send("Yard Planner Backend is Running!");
});

app.use("/api/simulation", simulationRoutes);
app.use("/api/users", userRoutes);

// =================================================================
// 4. EXPORT APP (WAJIB UNTUK VERCEL)
// Vercel mencari export ini untuk menjalankan serverless function.
// =================================================================
export default app;

// =================================================================
// 5. LOCALHOST LISTENER (OPSIONAL)
// Kode ini hanya jalan jika file dijalankan secara langsung (node app.js)
// Vercel akan mengabaikan bagian ini karena dia pakai export di atas.
// =================================================================
if (require.main === module) {
    // Kita inisialisasi lagi untuk local dev agar log-nya enak dilihat
    if (!AppDataSource.isInitialized) {
        AppDataSource.initialize()
            .then(() => {
                console.log("🔥 Database Connected (Local)");
                app.listen(PORT, () => {
                    console.log(`🚀 Server running on http://localhost:${PORT}`);
                });
            })
            .catch((error) => console.log(error));
    } else {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
}