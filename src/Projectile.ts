// src/Projectile.ts

export class Projectile {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number;
    char: string;
    godName: string;

    constructor(
        startX: number, startY: number, targetX: number, targetY: number,
        speed: number, char: string, godName: string
    ) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.char = char;
        this.godName = godName;
    }

    /**
     * Moves the projectile towards its target.
     * @returns {boolean} - True if the target has been reached, false otherwise.
     */
    update(): boolean {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If the remaining distance is less than one step, snap to target
        if (distance < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            return true; // Reached destination
        }

        // Move towards the target
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        
        return false; // Still in transit
    }
}