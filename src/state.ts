/**
 * 真棒猫 (Awesome Cat) - 运行时状态（单例）
 */

import type { Bounds, Cat, GameState, Particle, Paths } from './types';

export const bounds: Bounds = { width: 0, height: 0, centerX: 0, centerY: 0 };
export let gameState: GameState = 'IDLE';
export let animationFrameId: number | undefined;

export const cat: Cat = {
    x: 0,
    y: 0,
    baseY: 0,
    scale: 1,
    rotation: 0,
    tailAngle: 0,
    earAngle: 0,
    direction: 0,
    state: 'idle',
    bubbleText: '',
    bubbleAlpha: 0,
    item: null
};

export const paths: Paths = { left: [], right: [] };
export const particles: Particle[] = [];

export function setGameState ( next: GameState ): void
{
    gameState = next;
}

export function setAnimationFrameId ( id: number | undefined ): void
{
    animationFrameId = id;
}
