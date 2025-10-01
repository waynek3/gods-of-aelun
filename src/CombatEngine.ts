// src/CombatEngine.ts

import { Unit } from './Unit';

const CENTER_LINE = 12;

export class CombatEngine {
    public updateTrial(units: Unit[]): Unit[] {
        // --- Main Update Loop ---
        for (const unit of units) {
            // 1. Handle Cooldowns
            if (unit.rangedCooldown > 0) {
                unit.rangedCooldown--;
            }

            // 2. Handle Movement
            const isAtCenter = unit.team === 'player' ? unit.y <= CENTER_LINE + 1 : unit.y >= CENTER_LINE - 1;
            if (!isAtCenter) {
                unit.y += (unit.team === 'player' ? -1 : 1);
                continue; // Don't attack while moving
            }

            // 3. Handle Attacking
            if (unit.rangedCooldown === 0) {
                // Find the closest enemy unit
                const target = this.findTarget(unit, units);

                if (target) {
                    // Attack the target!
                    target.takeDamage(unit.rangedStrength);
                    // Reset cooldown based on this unit's attack speed
                    unit.rangedCooldown = unit.rangedSpeed;
                }
            }
        }

        // --- Cleanup Phase ---
        // After all units have acted, return a new array with only the survivors
        return units.filter(unit => unit.hp > 0);
    }

    private findTarget(attacker: Unit, allUnits: Unit[]): Unit | null {
        let closestTarget: Unit | null = null;
        let minDistance = Infinity;
        for (const potentialTarget of allUnits) {
            if (attacker.team !== potentialTarget.team) {
                const distance = Math.abs(attacker.y - potentialTarget.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestTarget = potentialTarget;
                }
            }
        }
        return closestTarget;
    }
}