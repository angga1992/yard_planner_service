// src/simulation/Simulator.ts
import { YardModel, Container, Location } from "./core/YardModel";
import { IStrategy } from "./strategies/IStrategy";
import { performance } from 'perf_hooks';

export class Simulator {
    private yardModel: YardModel;

    constructor(initialState: any) {
        this.yardModel = new YardModel(initialState);
    }

    public getYardState(): any {
        return this.yardModel.getState();
    }

    async processEvent(event: any, strategy: IStrategy) {
        const logs: string[] = [];
        let success = false;
        let actionTaken: any = null;
        let executionTime = 0; // ms

        const actionType = event.action_type || 'DROP';

        try {
            // ==========================================
            // LOGIC: DROP
            // ==========================================
            if (actionType === 'DROP') {
                const container: Container = {
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
                } else {
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
                        const blockerCont: Container = { 
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
                        } else {
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

        } catch (err: any) {
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
    }
}