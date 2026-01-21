"use strict";
// src/simulation/strategies/ReservationStrategy.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationStrategy = void 0;
const GreedyStrategy_1 = require("./GreedyStrategy");
class ReservationStrategy {
    constructor() {
        this.name = "ReservationBased";
        this.fallbackStrategy = new GreedyStrategy_1.GreedyStrategy();
    }
    findSlot(yardModel, container, excludeLocation) {
        // 1. Cek Apakah Container ini punya reservasi?
        const reservedLoc = yardModel.getReservation(container.id);
        if (reservedLoc) {
            console.log(`[STRATEGY] Found reservation for ${container.id} at ${reservedLoc.block}-${reservedLoc.bay}`);
            return reservedLoc;
        }
        // 2. Jika tidak ada (Go-Show), gunakan Greedy biasa
        return this.fallbackStrategy.findSlot(yardModel, container, excludeLocation);
    }
}
exports.ReservationStrategy = ReservationStrategy;
