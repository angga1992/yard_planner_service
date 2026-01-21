// src/simulation/strategies/ReservationStrategy.ts

import { IStrategy } from "./IStrategy";
import { YardModel, Container, Location } from "../core/YardModel";
import { GreedyStrategy } from "./GreedyStrategy";

export class ReservationStrategy implements IStrategy {
    public name = "ReservationBased";
    private fallbackStrategy = new GreedyStrategy();

    findSlot(yardModel: YardModel, container: Container, excludeLocation?: Location): Location | null {
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