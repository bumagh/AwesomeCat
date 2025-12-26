/**
 * 真棒猫 (Awesome Cat) - 对象初始化/重置
 */

import { CONFIG } from './config';
import type { Domino } from './types';
import { bounds, cat, paths } from './state';

export function createDominos ( dir: -1 | 1, length: number, startY: number ): Domino[]
{
    const dominos: Domino[] = [];
    const count = CONFIG.dominoCount;
    const spacing = length / count;

    for ( let i = 0; i < count; i++ )
    {
        dominos.push( {
            x: bounds.centerX + dir * 60 + dir * i * spacing,
            y: startY + i * 10,
            width: 12,
            height: 32,
            rotation: 0,
            color: dir === -1 ? CONFIG.colors.radish : CONFIG.colors.tissue,
            active: true
        } );
    }
    return dominos;
}

export function resetGameObjects (): void
{
    cat.x = bounds.centerX;
    cat.baseY = bounds.centerY - 50;
    cat.y = cat.baseY;
    cat.direction = 0;
    cat.state = 'idle';
    cat.bubbleText = 'Hm...?';
    cat.bubbleAlpha = 1;
    cat.item = null;
    cat.scale = 1;

    const pathY = cat.y + 60;
    const pathLength = Math.min( bounds.width * 0.4, 200 );

    paths.left = createDominos( -1, pathLength, pathY );
    paths.right = createDominos( 1, pathLength, pathY );

    // 每局开始前：左右终点随机为“萝卜/纸巾”（终点绘制依赖最后 1 个 domino 的位置）
    if ( Math.random() < 0.5 )
    {
        // 左边：纸巾；右边：萝卜
        const leftLast = paths.left[ paths.left.length - 1 ];
        leftLast.color = CONFIG.colors.tissue;
        const rightLast = paths.right[ paths.right.length - 1 ];
        rightLast.color = CONFIG.colors.radish;

    }
    else
    {
        // 左边：萝卜；右边：纸巾
        const leftLast = paths.left[ paths.left.length - 1 ];
        leftLast.color = CONFIG.colors.radish;
        const rightLast = paths.right[ paths.right.length - 1 ];
        rightLast.color = CONFIG.colors.tissue;
    }
    // 左边：萝卜；右边：纸巾

    // 每次重置都隐藏“真棒”按钮（需要玩家选对才显示）
    const feedbackBtn = document.getElementById( 'feedbackBtn' ) as HTMLButtonElement | null;
    if ( feedbackBtn )
    {
        feedbackBtn.classList.add( 'hidden' );
        feedbackBtn.setAttribute( 'aria-hidden', 'true' );
    }
}
