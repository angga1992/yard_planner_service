import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import * as crypto from "crypto";

export class UserController {

    // REGISTER USER BARU
    static async register(req: Request, res: Response): Promise<any> {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username wajib diisi!" });
        }

        try {
            const userRepo = AppDataSource.getRepository(User);

            // 1. Cek apakah username sudah ada
            const existingUser = await userRepo.findOneBy({ username });
            if (existingUser) {
                return res.status(400).json({ 
                    message: "Username sudah terdaftar.",
                    apiKey: existingUser.apiKey 
                });
            }

            const newApiKey = crypto.randomBytes(16).toString('hex');

            // 3. Simpan ke Database
            const user = new User();
            user.username = username;
            user.apiKey = newApiKey; // Simpan key hasil generate
            
            await userRepo.save(user);

            // 4. Kembalikan ke User
            return res.status(201).json({
                message: "User berhasil dibuat!",
                user: {
                    id: user.id,
                    username: user.username,
                    apiKey: user.apiKey // <-- INI YANG AKAN DIPAKAI USER
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Gagal register user" });
        }
    }
}