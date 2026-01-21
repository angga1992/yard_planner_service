"use strict";
// src/simulation/core/YardModel.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.YardModel = void 0;
// ==========================================
// 2. YARD MODEL CLASS (LOGIC)
// ==========================================
class YardModel {
    constructor(initialState) {
        // Deep copy untuk memastikan data aman
        this.state = JSON.parse(JSON.stringify(initialState));
    }
    getState() {
        return this.state;
    }
    // --- Helper: Cari Lokasi Container by ID ---
    findContainerLocation(id) {
        const slot = this.state.stacks.find(s => s.container_id === id);
        if (!slot)
            return null;
        return {
            yard: slot.yard, block: slot.block,
            bay: Number(slot.bay), row: Number(slot.row), tier: Number(slot.tier)
        };
    }
    // --- Helper: Deteksi Penghalang (Blockers) ---
    getBlockers(targetId) {
        const targetLoc = this.findContainerLocation(targetId);
        if (!targetLoc)
            return [];
        const blockers = this.state.stacks.filter(s => s.yard === targetLoc.yard &&
            s.block === targetLoc.block &&
            Number(s.bay) === targetLoc.bay &&
            Number(s.row) === targetLoc.row &&
            Number(s.tier) > targetLoc.tier &&
            s.container_id);
        blockers.sort((a, b) => Number(b.tier) - Number(a.tier));
        return blockers.map(b => ({
            id: b.container_id,
            location: {
                yard: b.yard, block: b.block,
                bay: Number(b.bay), row: Number(b.row), tier: Number(b.tier)
            }
        }));
    }
    // --- Helper: Pindahkan Container (Shifting) ---
    moveContainer(containerId, toLocation) {
        const oldSlot = this.state.stacks.find(s => s.container_id === containerId);
        if (oldSlot) {
            oldSlot.container_id = null;
            oldSlot.is_empty_space = 1;
        }
        const newSlot = this.state.stacks.find(s => s.yard === toLocation.yard &&
            s.block === toLocation.block &&
            Number(s.bay) === toLocation.bay &&
            Number(s.row) === toLocation.row &&
            Number(s.tier) === toLocation.tier);
        if (newSlot) {
            newSlot.container_id = containerId;
            newSlot.is_empty_space = 0;
            // Jika pindah ke slot yang ada reservasinya, kita timpa (force move)
            // Atau logic lain: reservasi batal. Disini kita clear reservasi.
            newSlot.reserved_for = null;
        }
    }
    // --- FITUR BARU: RESERVASI ---
    reserveSlot(containerId, location) {
        const slot = this.state.stacks.find(s => s.yard === location.yard &&
            s.block === location.block &&
            Number(s.bay) === location.bay &&
            Number(s.row) === location.row &&
            Number(s.tier) === location.tier);
        // Hanya bisa reserve jika slot kosong DAN belum di-reserve orang lain
        if (slot && !slot.container_id && !slot.reserved_for) {
            slot.reserved_for = containerId;
            return true;
        }
        return false;
    }
    getReservation(containerId) {
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
    placeContainer(container, location) {
        const slot = this.state.stacks.find(s => s.yard === location.yard &&
            s.block === location.block &&
            Number(s.bay) === location.bay &&
            Number(s.row) === location.row &&
            Number(s.tier) === location.tier);
        if (slot) {
            slot.container_id = container.id;
            slot.is_empty_space = 0; // Tandai terisi
            // PENTING: Jika slot ini tadinya di-reserve, sekarang clear karena barang sudah datang
            slot.reserved_for = null;
        }
    }
    // --- Main: Remove Container (Pick) ---
    removeContainer(containerId) {
        const slot = this.state.stacks.find(s => s.container_id === containerId);
        if (slot) {
            const loc = {
                yard: slot.yard, block: slot.block,
                bay: Number(slot.bay), row: Number(slot.row), tier: Number(slot.tier)
            };
            const isBlocked = this.state.stacks.some(s => s.yard === slot.yard &&
                s.block === slot.block &&
                s.bay === slot.bay &&
                s.row === slot.row &&
                Number(s.tier) > Number(slot.tier) &&
                (s.container_id && s.container_id !== ""));
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
exports.YardModel = YardModel;
