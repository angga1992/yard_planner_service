"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationSession = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Scenario_1 = require("./Scenario");
let SimulationSession = class SimulationSession {
};
exports.SimulationSession = SimulationSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SimulationSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SimulationSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", User_1.User)
], SimulationSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SimulationSession.prototype, "scenarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Scenario_1.Scenario),
    (0, typeorm_1.JoinColumn)({ name: "scenarioId" }),
    __metadata("design:type", Scenario_1.Scenario)
], SimulationSession.prototype, "scenario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb" }),
    __metadata("design:type", Object)
], SimulationSession.prototype, "current_yard_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "RUNNING" }),
    __metadata("design:type", String)
], SimulationSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SimulationSession.prototype, "startedAt", void 0);
exports.SimulationSession = SimulationSession = __decorate([
    (0, typeorm_1.Entity)("simulation_sessions")
], SimulationSession);
