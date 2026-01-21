"use strict";
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
exports.UserController = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const crypto = __importStar(require("crypto"));
class UserController {
    // REGISTER USER BARU
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ message: "Username wajib diisi!" });
            }
            try {
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                // 1. Cek apakah username sudah ada
                const existingUser = yield userRepo.findOneBy({ username });
                if (existingUser) {
                    return res.status(400).json({
                        message: "Username sudah terdaftar.",
                        apiKey: existingUser.apiKey
                    });
                }
                const newApiKey = crypto.randomBytes(16).toString('hex');
                // 3. Simpan ke Database
                const user = new User_1.User();
                user.username = username;
                user.apiKey = newApiKey; // Simpan key hasil generate
                yield userRepo.save(user);
                // 4. Kembalikan ke User
                return res.status(201).json({
                    message: "User berhasil dibuat!",
                    user: {
                        id: user.id,
                        username: user.username,
                        apiKey: user.apiKey // <-- INI YANG AKAN DIPAKAI USER
                    }
                });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Gagal register user" });
            }
        });
    }
}
exports.UserController = UserController;
