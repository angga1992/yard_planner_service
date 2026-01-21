"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YardModel = void 0;
class YardModel {
    constructor(initialState) {
        this.state = JSON.parse(JSON.stringify(initialState));
    }
    getState() {
        return this.state;
    }
    placeContainer(container, location) {
        const slot = this.state.stacks.find(s => Number(s.bay) === location.bay &&
            Number(s.row) === location.row &&
            Number(s.tier) === location.tier);
        if (slot) {
            slot.containerNo = container.id;
            slot.isOccupied = true;
        }
    }
}
exports.YardModel = YardModel;
