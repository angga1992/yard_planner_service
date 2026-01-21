// src/simulation/core/EventScheduler.ts

export type Task = () => void | Promise<void>;

interface SimulationEvent {
    time: number;      // Waktu eksekusi (detik)
    task: Task;        // Fungsi yang dijalankan
    description: string;
}

export class EventScheduler {
    private currentTime: number = 0;
    private events: SimulationEvent[] = [];

    // Mengambil waktu simulasi saat ini
    now(): number {
        return this.currentTime;
    }

    // Menjadwalkan tugas di masa depan
    schedule(delaySeconds: number, task: Task, description: string = "") {
        const executeTime = this.currentTime + delaySeconds;
        this.events.push({ time: executeTime, task, description });
        
        // Priority Queue: Urutkan agar waktu terkecil dieksekusi duluan
        this.events.sort((a, b) => a.time - b.time);
    }

    // Jalankan semua event sampai habis
    async run() {
        while (this.events.length > 0) {
            const nextEvent = this.events.shift(); // Ambil antrean terdepan
            
            if (!nextEvent) break;

            
            this.currentTime = nextEvent.time;
            
            // console.log(`[Time: ${this.currentTime.toFixed(2)}] Executing: ${nextEvent.description}`);
            await nextEvent.task();
        }
    }
}