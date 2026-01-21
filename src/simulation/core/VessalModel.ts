export interface Container {
    id: string;
    size: number;     // 20 atau 40
    weight: number;   // kg
    is_import: boolean;
    type?: string;    // 'REEFER', 'DRY', 'HAZARD'
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

interface VesselSlot {
  vesselId: string;
  bay: number;        // contoh: 12
  row: number;        // contoh: 4
  tier: number;       // contoh: 82
  position: 'HOLD' | 'DECK';
  size: '20' | '40' | '45';
  isoCode?: string;   // 22G1, 45R1, dll
  isReefer: boolean;
  isOccupied: boolean;
  containerNo?: string;
  weightLimit?: number;
}

export interface YardState {
    stacks: VesselSlot[];
    cranes: any[]; 
}

export class YardModel {
    private state: YardState;

    constructor(initialState: any) {
        this.state = JSON.parse(JSON.stringify(initialState));
    }

    public getState(): YardState {
        return this.state;
    }

    public placeContainer(container: Container, location: Location): void {
        const slot = this.state.stacks.find(s => 
            Number(s.bay) === location.bay &&
            Number(s.row) === location.row &&
            Number(s.tier) === location.tier
        );

        if (slot) {
            slot.containerNo = container.id;
            slot.isOccupied = true;
        }
    }
}