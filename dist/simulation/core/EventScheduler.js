"use strict";
// src/simulation/core/EventScheduler.ts
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
exports.EventScheduler = void 0;
class EventScheduler {
    constructor() {
        this.currentTime = 0;
        this.events = [];
    }
    // Mengambil waktu simulasi saat ini
    now() {
        return this.currentTime;
    }
    // Menjadwalkan tugas di masa depan
    schedule(delaySeconds, task, description = "") {
        const executeTime = this.currentTime + delaySeconds;
        this.events.push({ time: executeTime, task, description });
        // Priority Queue: Urutkan agar waktu terkecil dieksekusi duluan
        this.events.sort((a, b) => a.time - b.time);
    }
    // Jalankan semua event sampai habis
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.events.length > 0) {
                const nextEvent = this.events.shift(); // Ambil antrean terdepan
                if (!nextEvent)
                    break;
                this.currentTime = nextEvent.time;
                // console.log(`[Time: ${this.currentTime.toFixed(2)}] Executing: ${nextEvent.description}`);
                yield nextEvent.task();
            }
        });
    }
}
exports.EventScheduler = EventScheduler;
