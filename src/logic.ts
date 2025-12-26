/**
 * 真棒猫 (Awesome Cat) - 游戏逻辑与GSAP动画
 */

import { CONFIG } from './config';
import { CANVAS } from './canvas';
import { resetGameObjects } from './objects';
import { spawnParticles } from './particles';
import { bounds, cat, gameState, paths, setGameState } from './state';

export function triggerAction ( choice: 'left' | 'right' ): void
{
    if ( gameState !== 'IDLE' ) return;
    setGameState( 'ACTION' );

    // 玩家选择的“目标道具”
    const playerTargetItem: 'radish' | 'tissue' = choice === 'left' ? 'radish' : 'tissue';

    // 随机：猫随机选择左右
    const targetDir: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    const targetPaths = targetDir === 1 ? paths.right : paths.left;

    // 猫最终到达的终点道具（左=萝卜，右=纸巾）
    const catEndItem: 'radish' | 'tissue' = targetDir === -1 ? 'radish' : 'tissue';

    const tl = gsap.timeline();

    tl.to( cat, { bubbleAlpha: 0, duration: 0.2 } );

    tl.to( cat, {
        x: bounds.centerX + targetDir * 40,
        duration: 0.5,
        ease: 'power2.out',
        onStart: () =>
        {
            cat.direction = targetDir;
            cat.state = 'idle';
        }
    } );

    tl.to( cat, {
        duration: 0.2,
        onStart: () =>
        {
            cat.state = 'push';
        },
        onComplete: () =>
        {
            cat.state = 'idle';
        }
    } );

    targetPaths.forEach( ( d ) =>
    {
        tl.to(
            d,
            {
                rotation: ( targetDir * Math.PI ) / 2.5,
                duration: 0.4,
                ease: 'bounce.out'
            },
            '-=0.25'
        );
    } );

    tl.call( () =>
    {
        const last = targetPaths[ targetPaths.length - 1 ];
        spawnParticles( last.x, last.y );
        spawnParticles( last.x, last.y - 50 );
        setGameState( 'CELEBRATE' );
        cat.item = '🐟';

        // 只有“玩家选择”与“猫推到的终点道具”一致才算对，才出现“真棒”
        const isCorrect = playerTargetItem === catEndItem;
        if ( isCorrect )
        {
            const feedbackBtn = document.getElementById( 'feedbackBtn' ) as HTMLButtonElement | null;
            if ( feedbackBtn )
            {
                feedbackBtn.classList.remove( 'hidden' );
                feedbackBtn.removeAttribute( 'aria-hidden' );
                if ( typeof gsap !== 'undefined' )
                {
                    gsap.fromTo( feedbackBtn, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' } );
                }
                else
                {
                    feedbackBtn.style.opacity = '1';
                }
            }
        }
    } );

    tl.to( cat, { y: cat.baseY - 20, duration: 0.2, yoyo: true, repeat: 3 } );

    tl.to( {}, { duration: 1.5 } );
    // flashback 也使用这次行动的随机方向（而不是玩家原始选择）
    tl.call( () => triggerFlashback( targetDir ) );
}

export function triggerFlashback ( targetDir: -1 | 1 ): void
{
    setGameState( 'FLASHBACK' );

    resetGameObjects();

    const targetPaths = targetDir === -1 ? paths.left : paths.right;

    const tl = gsap.timeline();

    cat.bubbleText = 'If I chose...';
    cat.bubbleAlpha = 1;

    tl.to( cat, { x: bounds.centerX + targetDir * 40, duration: 0.5, delay: 0.5 } );

    tl.call( () =>
    {
        cat.state = 'push';
    } );

    tl.to( targetPaths[ 0 ], { rotation: ( targetDir * Math.PI ) / 2.5, duration: 0.3 } );

    tl.call( () =>
    {
        cat.state = 'shock';
        cat.bubbleText = '???';
        spawnParticles( targetPaths[ 0 ].x, targetPaths[ 0 ].y, '#ff0000' );
    } );

    tl.to( CANVAS, { x: 5, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x' } );

    tl.to( {}, { duration: 2 } );
    tl.call( () =>
    {
        setGameState( 'ENDED' );
    } );
}

export function triggerFeedback (): void
{
    if ( gameState === 'ACTION' || gameState === 'FLASHBACK' ) return;

    const tl = gsap.timeline();

    cat.bubbleText = 'Meow! ❤️';
    cat.bubbleAlpha = 1;

    tl.to( cat, {
        y: cat.baseY - 60,
        scale: 1.2,
        duration: 0.3,
        ease: 'power2.out',
        onStart: () =>
        {
            cat.state = 'jump';
        }
    } );

    tl.to( cat, {
        y: cat.baseY,
        scale: 1,
        duration: 0.4,
        ease: 'bounce.out',
        onComplete: () =>
        {
            if ( gameState !== 'ENDED' ) cat.state = 'idle';
        }
    } );

    spawnParticles( cat.x, cat.y - 40, CONFIG.colors.awesome );

    gsap.to( cat, { bubbleAlpha: 0, delay: 1.5, duration: 0.5 } );
}
