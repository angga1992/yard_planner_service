"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata"); // Penting untuk TypeORM
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const data_source_1 = require("./config/data-source");
const simulationRoutes_1 = __importDefault(require("./routes/simulationRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 1. CORS & JSON Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// =================================================================
// 2. MIDDLEWARE DATABASE (SOLUSI VERCEL)
// Di serverless, kita cek koneksi DB setiap kali ada request masuk.
// Jika belum connect, baru kita connect.
// =================================================================
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!data_source_1.AppDataSource.isInitialized) {
        try {
            yield data_source_1.AppDataSource.initialize();
            console.log("🔥 Database Connected (Lazy Load)");
        }
        catch (error) {
            console.error("Database Connection Error:", error);
            return res.status(500).json({ message: "Database Connection Failed", error });
        }
    }
    next();
}));
// 3. Routes
app.get("/", (req, res) => {
    res.send("Yard Planner Backend is Running!");
});
app.use("/api/simulation", simulationRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
// =================================================================
// 4. EXPORT APP (WAJIB UNTUK VERCEL)
// Vercel mencari export ini untuk menjalankan serverless function.
// =================================================================
exports.default = app;
// =================================================================
// 5. LOCALHOST LISTENER (OPSIONAL)
// Kode ini hanya jalan jika file dijalankan secara langsung (node app.js)
// Vercel akan mengabaikan bagian ini karena dia pakai export di atas.
// =================================================================
if (require.main === module) {
    // Kita inisialisasi lagi untuk local dev agar log-nya enak dilihat
    if (!data_source_1.AppDataSource.isInitialized) {
        data_source_1.AppDataSource.initialize()
            .then(() => {
            console.log("🔥 Database Connected (Local)");
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        })
            .catch((error) => console.log(error));
    }
    else {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
}
