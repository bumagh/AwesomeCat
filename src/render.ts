/**
 * 真棒猫 (Awesome Cat) - 渲染系统
 */

import { CONFIG } from './config';
import { CTX } from './canvas';
import type { Domino } from './types';
import { bounds, cat, gameState, particles, paths, setAnimationFrameId } from './state';

export function draw (): void
{
    CTX.clearRect( 0, 0, bounds.width, bounds.height );

    // 根据游戏状态控制 UI 显示：结束后不显示按钮与互动提示；重开后再显示
    const controlsEl = document.getElementById( 'controls' ) as HTMLElement | null;
    if ( controlsEl )
    {
        if ( gameState === 'ENDED' )
        {
            controlsEl.style.display = 'none';
            controlsEl.style.pointerEvents = 'none';
        }
        else
        {
            controlsEl.style.display = '';
            controlsEl.style.pointerEvents = 'auto';
        }
    }

    drawGrid();
    //根据
    drawTarget( paths.left[ paths.left.length - 1 ], '🥕', 'Radish' );
    drawTarget( paths.right[ paths.right.length - 1 ], '🧻', 'Tissue' );

    drawDominos( paths.left );
    drawDominos( paths.right );

    drawPixelCat();
    drawParticles();

    if ( cat.bubbleAlpha > 0 ) drawBubble();

    if ( gameState === 'FLASHBACK' )
    {
        CTX.fillStyle = 'rgba(100, 100, 100, 0.3)';
        CTX.fillRect( 0, 0, bounds.width, bounds.height );

        CTX.fillStyle = 'rgba(0,0,0,0.1)';
        for ( let i = 0; i < bounds.height; i += 4 )
        {
            CTX.fillRect( 0, i, bounds.width, 1 );
        }

        CTX.fillStyle = '#fff';
        CTX.font = '20px "Courier New"';
        CTX.textAlign = 'center';
        CTX.fillText( 'FAIL TIMELINE', bounds.centerX, 50 );
    }

    if ( gameState === 'ENDED' )
    {
        CTX.fillStyle = 'rgba(0,0,0,0.7)';
        CTX.fillRect( 0, 0, bounds.width, bounds.height );
        CTX.save();
        CTX.translate( bounds.centerX, bounds.centerY );
        CTX.rotate( -0.1 );
        CTX.fillStyle = '#ff7675';
        CTX.font = 'bold 48px "Arial"';
        CTX.textAlign = 'center';
        CTX.shadowColor = '#000';
        CTX.shadowBlur = 10;
        CTX.fillText( 'AWESOME CAT!', 0, 0 );
        CTX.font = '20px "Arial"';
        CTX.fillStyle = '#fff';
        CTX.fillText( 'Click to Play Again', 0, 40 );
        CTX.restore();
    }

    setAnimationFrameId( window.requestAnimationFrame( draw ) );
}

function drawGrid (): void
{
    CTX.strokeStyle = 'rgba(255,255,255,0.05)';
    CTX.lineWidth = 1;
    const size = 32;
    for ( let x = 0; x < bounds.width; x += size )
    {
        CTX.beginPath();
        CTX.moveTo( x, 0 );
        CTX.lineTo( x, bounds.height );
        CTX.stroke();
    }
    for ( let y = 0; y < bounds.height; y += size )
    {
        CTX.beginPath();
        CTX.moveTo( 0, y );
        CTX.lineTo( bounds.width, y );
        CTX.stroke();
    }
}

function drawTarget ( lastDomino: Domino | undefined, emoji: string, label: string ): void
{
    if ( !lastDomino ) return;

    // 终点图标避免跑到画布外（尤其在小屏/路径较长时）
    const margin = 24;
    const rawX = lastDomino.x + ( lastDomino.x < bounds.centerX ? -30 : 30 );
    const rawY = lastDomino.y;
    const x = Math.max( margin, Math.min( bounds.width - margin, rawX ) );
    const y = Math.max( margin, Math.min( bounds.height - margin, rawY ) );

    CTX.font = '32px Arial';
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillStyle = '#fff';
    CTX.fillText( emoji, x, y );

    CTX.font = '10px monospace';
    CTX.fillStyle = 'rgba(255,255,255,0.5)';
    CTX.fillText( label, x, y + 25 );
}

function drawDominos ( list: Domino[] ): void
{
    list.forEach( ( d ) =>
    {
        CTX.save();
        CTX.translate( d.x, d.y );
        CTX.rotate( d.rotation );

        CTX.fillStyle = 'rgba(0,0,0,0.3)';
        CTX.fillRect( -d.width / 2 + 2, -d.height + 2, d.width, d.height );

        CTX.fillStyle = d.color;
        CTX.fillRect( -d.width / 2, -d.height, d.width, d.height );

        if ( gameState === 'IDLE' && Math.random() > 0.95 )
        {
            CTX.fillStyle = 'rgba(255,255,255,0.8)';
            CTX.fillRect( -d.width / 2, -d.height, d.width, 2 );
        }

        CTX.restore();
    } );
}

function drawPixelCat (): void
{
    CTX.save();
    CTX.translate( cat.x, cat.y );

    let scaleY = cat.scale;
    if ( cat.state === 'idle' )
    {
        scaleY *= 1 + Math.sin( Date.now() / 500 ) * 0.02;
    }
    CTX.scale( cat.scale, scaleY );

    CTX.scale( cat.direction === 0 ? 1 : cat.direction === 1 ? -1 : 1, 1 );

    const s = 4;

    CTX.fillStyle = CONFIG.colors.catMain;
    CTX.fillRect( -4 * s, -6 * s, 8 * s, 6 * s );

    CTX.fillRect( -5 * s, -10 * s, 10 * s, 6 * s );

    CTX.fillStyle = CONFIG.colors.catDark;

    CTX.save();
    CTX.translate( -3 * s, -10 * s );
    CTX.rotate( cat.earAngle );
    CTX.fillRect( -1 * s, -2 * s, 2 * s, 2 * s );
    CTX.restore();

    CTX.save();
    CTX.translate( 3 * s, -10 * s );
    CTX.rotate( -cat.earAngle );
    CTX.fillRect( -1 * s, -2 * s, 2 * s, 2 * s );
    CTX.restore();

    CTX.fillStyle = '#000';
    if ( cat.state === 'shock' )
    {
        CTX.fillRect( -3 * s, -8 * s, 2 * s, 2 * s );
        CTX.fillRect( 1 * s, -8 * s, 2 * s, 2 * s );
    } else if ( cat.state === 'jump' )
    {
        CTX.fillRect( -3 * s, -8 * s, 2 * s, 1 * s );
        CTX.fillRect( -4 * s, -7 * s, 1 * s, 1 * s );

        CTX.fillRect( 1 * s, -8 * s, 2 * s, 1 * s );
        CTX.fillRect( 3 * s, -7 * s, 1 * s, 1 * s );
    } else
    {
        if ( Math.sin( Date.now() / 200 ) > 0.98 && cat.state === 'idle' )
        {
            CTX.fillRect( -3 * s, -7 * s, 2 * s, 1 );
            CTX.fillRect( 1 * s, -7 * s, 2 * s, 1 );
        } else
        {
            CTX.fillRect( -3 * s, -8 * s, 1 * s, 1 * s );
            CTX.fillRect( 1 * s, -8 * s, 1 * s, 1 * s );
        }
    }

    CTX.fillStyle = '#fff';
    if ( cat.state === 'push' )
    {
        CTX.fillRect( 2 * s, -4 * s, 3 * s, 2 * s );
    } else if ( cat.state === 'jump' )
    {
        CTX.fillRect( -5 * s, -5 * s, 2 * s, 2 * s );
        CTX.fillRect( 3 * s, -5 * s, 2 * s, 2 * s );
    } else
    {
        CTX.fillRect( -2 * s, 0, 2 * s, 1 * s );
        CTX.fillRect( 0, 0, 2 * s, 1 * s );
    }

    CTX.save();
    CTX.translate( 0, -1 * s );
    CTX.rotate( cat.tailAngle );
    CTX.fillStyle = CONFIG.colors.catDark;
    CTX.fillRect( -1 * s, 0, 2 * s, 4 * s );
    CTX.restore();

    if ( cat.item )
    {
        CTX.font = '20px Arial';
        CTX.fillStyle = '#fff';
        CTX.fillText( cat.item, 0, -12 * s );
    }

    CTX.restore();
}

function drawBubble (): void
{
    CTX.save();
    CTX.globalAlpha = cat.bubbleAlpha;
    const x = cat.x;
    const y = cat.y - 60;

    CTX.fillStyle = '#fff';
    CTX.beginPath();
    ( CTX as any ).roundRect( x - 40, y - 20, 80, 30, 10 );
    CTX.fill();

    CTX.beginPath();
    CTX.moveTo( x, y + 10 );
    CTX.lineTo( x - 5, y + 15 );
    CTX.lineTo( x + 5, y + 15 );
    CTX.fill();

    CTX.fillStyle = '#000';
    CTX.font = '14px "Helvetica Neue"';
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText( cat.bubbleText, x, y - 5 );

    CTX.restore();
}

function drawParticles (): void
{
    for ( let i = particles.length - 1; i >= 0; i-- )
    {
        const p = particles[ i ];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.rotation += p.vRot;
        p.life -= 0.02;

        if ( p.life <= 0 )
        {
            particles.splice( i, 1 );
            continue;
        }

        CTX.save();
        CTX.translate( p.x, p.y );
        CTX.rotate( p.rotation );
        CTX.fillStyle = p.color;
        CTX.globalAlpha = p.life;
        CTX.fillRect( -3, -3, 6, 6 );
        CTX.restore();
    }
}
