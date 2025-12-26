/**
 * 真棒猫 (Awesome Cat) - 类型定义
 */

export type GameState = 'IDLE' | 'THINKING' | 'ACTION' | 'CELEBRATE' | 'FLASHBACK' | 'ENDED';

export type Domino = {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    active: boolean;
};

export type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    vRot: number;
    rotation: number;
    life: number;
    color: string;
};

export type CatState = 'idle' | 'push' | 'shock' | 'jump';

export type Cat = {
    x: number;
    y: number;
    baseY: number;
    scale: number;
    rotation: number;
    tailAngle: number;
    earAngle: number;
    direction: -1 | 0 | 1;
    state: CatState;
    bubbleText: string;
    bubbleAlpha: number;
    item: string | null;
};

export type Bounds = { width: number; height: number; centerX: number; centerY: number };

export type Paths = { left: Domino[]; right: Domino[] };

export type Config = {
    colors: {
        bg: string;
        path: string;
        catMain: string;
        catDark: string;
        domino: string;
        radish: string;
        tissue: string;
        gold: string;
        awesome: string;
    };
    grid: number;
    catSize: number;
    dominoCount: number;
};
