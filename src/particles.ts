/**
 * 真棒猫 (Awesome Cat) - 粒子系统
 */

import { particles } from './state';

export function spawnParticles ( x: number, y: number, color?: string ): void
{
    for ( let i = 0; i < 20; i++ )
    {
        particles.push( {
            x,
            y,
            vx: ( Math.random() - 0.5 ) * 10,
            vy: ( Math.random() - 0.5 ) * 10 - 5,
            vRot: ( Math.random() - 0.5 ) * 0.5,
            rotation: 0,
            life: 1,
            color: color ?? `hsl(${ Math.random() * 360 }, 80%, 60%)`
        } );
    }
}
