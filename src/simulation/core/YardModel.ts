// src/simulation/core/YardModel.ts

// ==========================================
// 1. DEFINISI TIPE DATA (INTERFACES)
// ==========================================

export interface Container {
    id: string;
    size: number;     // 20 atau 40
    weight: number;   // kg
    is_import: boolean;
    type?: string;    // 'REEFER', 'DRY', 'HAZARD'
    
    // Opsional properti lain
    is_reefer?: boolean;
    is_hazard?: boolean;
}

export interface Location {
    yard: string;
    block: string;
    bay: number;
    row: number;
    tier: number;
}

export interface YardSlot {
    yard: string;
    block: string;
    bay: number;
    row: number;
    tier: number;
    
    // Status Slot
    container_id: string | null; 
    is_empty_space: number | boolean; 
    
    // Constraint Slot
    size_ft: number; 
    max_weight?: number;
    is_reefer_compatible?: boolean; 
    is_hazard_compatible?: boolean; 

    // RESERVATION PROPERTY (BARU)
    reserved_for: string | null; // Container ID yang membooking slot ini
}

export interface YardState {
    stacks: YardSlot[];
    cranes: any[]; 
}

// ==========================================
// 2. YARD MODEL CLASS (LOGIC)
// ==========================================

export class YardModel {
    private state: YardState;

    constructor(initialState: any) {
        // Deep copy untuk memastikan data aman
        this.state = JSON.parse(JSON.stringify(initialState));
    }

    public getState(): YardState {
        return this.state;
    }

    // --- Helper: Cari Lokasi Container by ID ---
    public findContainerLocation(id: string): Location | null {
        const slot = this.state.stacks.find(s => s.container_id === id);
        if (!slot) return null;
        return {
            yard: slot.yard, block: slot.block,
            bay: Number(slot.bay), row: Number(slot.row), tier: Number(slot.tier)
        };
    }

    // --- Helper: Deteksi Penghalang (Blockers) ---
    public getBlockers(targetId: string): Array<{ id: string, location: Location }> {
        const targetLoc = this.findContainerLocation(targetId);
        if (!targetLoc) return [];

        const blockers = this.state.stacks.filter(s => 
            s.yard === targetLoc.yard &&
            s.block === targetLoc.block &&
            Number(s.bay) === targetLoc.bay &&
            Number(s.row) === targetLoc.row &&
            Number(s.tier) > targetLoc.tier && 
            s.container_id 
        );

        blockers.sort((a, b) => Number(b.tier) - Number(a.tier));

        return blockers.map(b => ({
            id: b.container_id!,
            location: {
                yard: b.yard, block: b.block,
                bay: Number(b.bay), row: Number(b.row), tier: Number(b.tier)
            }
        }));
    }

    // --- Helper: Pindahkan Container (Shifting) ---
    public moveContainer(containerId: string, toLocation: Location): void {
        const oldSlot = this.state.stacks.find(s => s.container_id === containerId);
        if (oldSlot) {
            oldSlot.container_id = null;
            oldSlot.is_empty_space = 1;
        }

        const newSlot = this.state.stacks.find(s => 
            s.yard === toLocation.yard &&
            s.block === toLocation.block &&
            Number(s.bay) === toLocation.bay &&
            Number(s.row) === toLocation.row &&
            Number(s.tier) === toLocation.tier
        );

        if (newSlot) {
            newSlot.container_id = containerId;
            newSlot.is_empty_space = 0;
            // Jika pindah ke slot yang ada reservasinya, kita timpa (force move)
            // Atau logic lain: reservasi batal. Disini kita clear reservasi.
            newSlot.reserved_for = null; 
        }
    }

    // --- FITUR BARU: RESERVASI ---
    public reserveSlot(containerId: string, location: Location): boolean {
        const slot = this.state.stacks.find(s => 
            s.yard === location.yard &&
            s.block === location.block &&
            Number(s.bay) === location.bay &&
            Number(s.row) === location.row &&
            Number(s.tier) === location.tier
        );

        // Hanya bisa reserve jika slot kosong DAN belum di-reserve orang lain
        if (slot && !slot.container_id && !slot.reserved_for) {
            slot.reserved_for = containerId;
            return true;
        }
        return false;
    }

    public getReservation(containerId: string): Location | null {
        const slot = this.state.stacks.find(s => s.reserved_for === containerId);
        if (slot) {
            return {
                yard: slot.yard, block: slot.block,
                bay: Number(slot.bay), row: Number(slot.row), tier: Number(slot.tier)
            };
        }
        return null;
    }

    // --- Main: Place Container ---
    public placeContainer(container: Container, location: Location): void {
        const slot = this.state.stacks.find(s => 
            s.yard === location.yard &&
            s.block === location.block &&
            Number(s.bay) === location.bay &&
            Number(s.row) === location.row &&
            Number(s.tier) === location.tier
        );

        if (slot) {
            slot.container_id = container.id;
            slot.is_empty_space = 0; // Tandai terisi
            
            // PENTING: Jika slot ini tadinya di-reserve, sekarang clear karena barang sudah datang
            slot.reserved_for = null; 
        }
    }

    // --- Main: Remove Container (Pick) ---
    public removeContainer(containerId: string): Location | null {
        const slot = this.state.stacks.find(s => s.container_id === containerId);
        if (slot) {
            const loc = {
                yard: slot.yard, block: slot.block, 
                bay: Number(slot.bay), row: Number(slot.row), tier: Number(slot.tier)
            };
            
            const isBlocked = this.state.stacks.some(s => 
                s.yard === slot.yard && 
                s.block === slot.block && 
                s.bay === slot.bay && 
                s.row === slot.row && 
                Number(s.tier) > Number(slot.tier) && 
                (s.container_id && s.container_id !== "")
            );

            if (isBlocked) {
                console.warn(`[PICK FAIL] Container ${containerId} tertumpuk.`);
                return null; 
            }

            slot.container_id = null;
            slot.is_empty_space = 1; 
            return loc;
        }
        return null; 
    }
}