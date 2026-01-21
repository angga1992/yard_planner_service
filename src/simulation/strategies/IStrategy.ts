// src/simulation/strategies/IStrategy.ts
import { YardModel, Container, Location } from "../core/YardModel";

export interface IStrategy {
    /**
     * @param excludeLocation (Optional) Jangan pilih stack ini (untuk shifting)
     */
    findSlot(yardModel: YardModel, container: Container, excludeLocation?: Location): Location | null;
    
    name: string;
}