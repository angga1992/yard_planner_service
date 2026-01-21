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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulator = void 0;
// src/simulation/Simulator.ts
const YardModel_1 = require("./core/YardModel");
class Simulator {
    constructor(initialState) {
        this.yardModel = new YardModel_1.YardModel(initialState);
    }
    getYardState() {
        return this.yardModel.getState();
    }
    processEvent(event, strategy) {
        return __awaiter(this, void 0, void 0, function* () {
            const logs = [];
            let success = false;
            let actionTaken = null;
            let executionTime = 0; // ms
            const actionType = event.action_type || 'DROP';
            try {
                // ==========================================
                // LOGIC: DROP
                // ==========================================
                if (actionType === 'DROP') {
                    const container = {
                        id: event.container_id,
                        size: event.size_ft,
                        weight: event.weight_kg,
                        type: event.is_reefer ? 'REEFER' : 'DRY',
                        is_import: event.is_import === 1
                    };
                    const location = strategy.findSlot(this.yardModel, container);
                    if (location) {
                        this.yardModel.placeContainer(container, location);
                        success = true;
                        actionTaken = location;
                        executionTime += 120; // Simulasi waktu main move
                    }
                    else {
                        throw new Error(`No Valid Slot Found for DROP ${container.id}`);
                    }
                }
                // ==========================================
                // LOGIC: PICK (WITH AUTO-SHIFTING)
                // ==========================================
                else if (actionType === 'PICK') {
                    const targetId = event.container_id;
                    // 1. Cek Lokasi Target
                    const targetLoc = this.yardModel.findContainerLocation(targetId);
                    if (!targetLoc) {
                        throw new Error(`Container ${targetId} not found in yard.`);
                    }
                    // 2. Cek Penghalang (Blockers)
                    const blockers = this.yardModel.getBlockers(targetId);
                    if (blockers.length > 0) {
                        logs.push(`⚠️ Rehandling required: ${blockers.length} containers blocking ${targetId}.`);
                        // 3. Loop Pindahkan Penghalang (Reshuffling)
                        for (const blocker of blockers) {
                            // Buat object container dummy untuk blocker
                            const blockerCont = {
                                id: blocker.id, size: 40, weight: 0, is_import: false
                            };
                            // Cari slot baru (KECUALI di stack yang sama)
                            const newSlot = strategy.findSlot(this.yardModel, blockerCont, targetLoc);
                            if (newSlot) {
                                // Pindahkan blocker
                                this.yardModel.moveContainer(blocker.id, newSlot);
                                logs.push(`↪️ Shifted blocker ${blocker.id} from Tier ${blocker.location.tier} to Block ${newSlot.block}-${newSlot.bay}`);
                                // Tambah penalti waktu untuk setiap shifting
                                executionTime += 180; // Shifting butuh waktu lebih lama (Pick + Drop)
                            }
                            else {
                                throw new Error(`Yard FULL! Cannot shift blocker ${blocker.id}.`);
                            }
                        }
                    }
                    // 4. Ambil Target (Setelah bersih)
                    const finalLoc = this.yardModel.removeContainer(targetId);
                    if (finalLoc) {
                        success = true;
                        actionTaken = finalLoc;
                        executionTime += 120; // Waktu pick utama
                        logs.push(`✅ Picked up ${targetId} from Block ${finalLoc.block}-${finalLoc.bay}`);
                    }
                }
            }
            catch (err) {
                logs.push(`Error: ${err.message}`);
                // Jangan throw error agar batch tidak berhenti total, tapi return success: false
                success = false;
            }
            // Tambah random noise sedikit biar variatif
            executionTime += Math.floor(Math.random() * 50);
            return {
                success,
                actionTaken,
                logs,
                totalTime: executionTime
            };
        });
    }
}
exports.Simulator = Simulator;
