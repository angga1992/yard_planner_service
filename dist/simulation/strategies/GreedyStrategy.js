"use strict";
// src/simulation/strategies/GreedyStrategy.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreedyStrategy = void 0;
class GreedyStrategy {
    constructor() {
        this.name = "SmartGreedy";
    }
    findSlot(yardModel, container, excludeLocation) {
        const state = yardModel.getState();
        if (!state.stacks)
            return null;
        // Sort: Block -> Bay -> Row -> Tier
        const sortedStacks = [...state.stacks].sort((a, b) => {
            if (a.block !== b.block)
                return a.block.localeCompare(b.block);
            if (a.bay !== b.bay)
                return a.bay - b.bay;
            if (a.row !== b.row)
                return a.row - b.row;
            return a.tier - b.tier;
        });
        for (const stack of sortedStacks) {
            // 1. EXCLUDE CHECK (Shifting)
            if (excludeLocation) {
                if (stack.yard === excludeLocation.yard &&
                    stack.block === excludeLocation.block &&
                    Number(stack.bay) === excludeLocation.bay &&
                    Number(stack.row) === excludeLocation.row) {
                    continue;
                }
            }
            // 2. EMPTY CHECK
            const isEmpty = (!stack.container_id || stack.container_id === "") || (stack.is_empty_space === 1);
            if (!isEmpty)
                continue;
            // --- 2.B RESERVATION CHECK (BARU) ---
            // Jika slot ini di-reserve oleh container LAIN, jangan diambil
            if (stack.reserved_for && stack.reserved_for !== container.id) {
                continue;
            }
            // ------------------------------------
            // 3. CONSTRAINT CHECKS
            if (container.type === 'REEFER') {
                if (!stack.is_reefer_compatible)
                    continue;
            }
            // 4. GRAVITY CHECK
            const currentTier = Number(stack.tier);
            let isSupported = false;
            if (currentTier === 1) {
                isSupported = true;
            }
            else {
                const slotBelow = state.stacks.find(s => s.yard === stack.yard &&
                    s.block === stack.block &&
                    Number(s.bay) === Number(stack.bay) &&
                    Number(s.row) === Number(stack.row) &&
                    Number(s.tier) === currentTier - 1);
                // UPDATE: Slot bawah valid jika ADA ISI atau ADA RESERVASI (Virtual Stacking)
                if (slotBelow && (slotBelow.container_id || slotBelow.reserved_for)) {
                    isSupported = true;
                }
            }
            // 5. FINAL DECISION
            if (isSupported) {
                return {
                    yard: stack.yard,
                    block: stack.block,
                    bay: Number(stack.bay),
                    row: Number(stack.row),
                    tier: Number(stack.tier)
                };
            }
        }
        return null;
    }
}
exports.GreedyStrategy = GreedyStrategy;
