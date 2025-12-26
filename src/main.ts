/**
 * 真棒猫 (Awesome Cat) - 入口
 */

import { CANVAS } from './canvas';
import { resetGameObjects } from './objects';
import { draw } from './render';
import { bounds, setAnimationFrameId, animationFrameId, cat, gameState, setGameState } from './state';
import { triggerAction, triggerFeedback } from './logic';

export function resize (): void
{
    const parent = CANVAS.parentElement as HTMLElement | null;
    if ( !parent ) return;

    CANVAS.width = parent.clientWidth;
    CANVAS.height = parent.clientHeight;

    bounds.width = CANVAS.width;
    bounds.height = CANVAS.height;
    bounds.centerX = CANVAS.width / 2;
    bounds.centerY = CANVAS.height / 2;

    resetGameObjects();
}

function initEvents (): void
{
    const leftBtn = document.getElementById( 'leftBtn' ) as HTMLButtonElement | null;
    const rightBtn = document.getElementById( 'rightBtn' ) as HTMLButtonElement | null;
    const feedbackBtn = document.getElementById( 'feedbackBtn' ) as HTMLButtonElement | null;

    leftBtn?.addEventListener( 'click', () => triggerAction( 'left' ) );
    rightBtn?.addEventListener( 'click', () => triggerAction( 'right' ) );

    // “真棒”按钮：默认隐藏，但依然提前绑定事件（显示后即可点击）
    feedbackBtn?.addEventListener( 'click', triggerFeedback );

    CANVAS.addEventListener( 'click', () =>
    {
        if ( gameState === 'ENDED' )
        {
            setGameState( 'IDLE' );
            resetGameObjects();
        }
    } );
}

// Idle Animations using GSAP ticker
// 由于直接通过 CDN 引入 GSAP，这里使用 any 声明，避免引入额外类型依赖
if ( typeof gsap !== 'undefined' && gsap?.ticker?.add )
{
    gsap.ticker.add( ( time: number ) =>
    {
        if ( gameState === 'IDLE' || gameState === 'THINKING' || gameState === 'CELEBRATE' )
        {
            cat.tailAngle = Math.sin( time * 2 ) * 0.2;
            cat.earAngle = Math.sin( time * 3 ) * 0.1;
        }
    } );
}

window.addEventListener( 'resize', resize );

function start (): void
{
    resize();
    resetGameObjects();
    initEvents();

    const controlsEl = document.getElementById( 'controls' ) as HTMLElement | null;
    const headerEl = document.querySelector( '.header-area' ) as HTMLElement | null;

    // 开局：显示标题与按钮/提示
    if ( controlsEl )
    {
        controlsEl.style.display = '';
        controlsEl.style.opacity = '1';
        controlsEl.style.pointerEvents = 'auto';
    }
    if ( headerEl ) headerEl.style.opacity = '1';

    if ( animationFrameId ) window.cancelAnimationFrame( animationFrameId );
    setAnimationFrameId( undefined );
    draw();
}

window.addEventListener( 'DOMContentLoaded', start );
if ( document.readyState === 'complete' || document.readyState === 'interactive' )
{
    start();
}
