/**
 * 真棒猫 (Awesome Cat) - 游戏核心逻辑（TypeScript版）
 */

// 注意：gsap 通过 CDN 注入，全局类型在 src/globals.d.ts 中声明

type GameState = 'IDLE' | 'THINKING' | 'ACTION' | 'CELEBRATE' | 'FLASHBACK' | 'ENDED';

type Domino = {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    active: boolean;
};

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    vRot: number;
    rotation: number;
    life: number;
    color: string;
};

type CatState = 'idle' | 'push' | 'shock' | 'jump';

type Cat = {
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

type Bounds = { width: number; height: number; centerX: number; centerY: number };

type Paths = { left: Domino[]; right: Domino[] };

type Config = {
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

// --- 核心配置 ---
const CONFIG: Config = {
    colors: {
        bg: '#2d3436',
        path: '#636e72',
        catMain: '#dfe6e9',
        catDark: '#b2bec3',
        domino: '#ffffff',
        radish: '#ff7675',
        tissue: '#74b9ff',
        gold: '#ffeaa7',
        awesome: '#55efc4'
    },
    grid: 8,
    catSize: 64,
    dominoCount: 8
};

// --- 全局上下文 ---
const canvas = document.getElementById( 'gameCanvas' ) as HTMLCanvasElement | null;
if ( !canvas ) throw new Error( 'Missing #gameCanvas' );
const ctx = canvas.getContext( '2d' );
if ( !ctx ) throw new Error( 'Missing 2d context' );

// 经过上面的运行时校验后，这里使用更窄的非空类型，避免全文件出现“可能为 null”的噪声
const CANVAS: HTMLCanvasElement = canvas;
const CTX: CanvasRenderingContext2D = ctx;

let bounds: Bounds = { width: 0, height: 0, centerX: 0, centerY: 0 };
let gameState: GameState = 'IDLE';
let animationFrameId: number | undefined;

// --- 游戏对象 ---
const cat: Cat = {
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

const paths: Paths = { left: [], right: [] };
const particles: Particle[] = [];

// --- 初始化与响应式 ---
function resize (): void
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

function resetGameObjects (): void
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

function createDominos ( dir: -1 | 1, length: number, startY: number ): Domino[]
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

// --- 渲染系统 ---
function draw (): void
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

    animationFrameId = window.requestAnimationFrame( draw );
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

function spawnParticles ( x: number, y: number, color?: string ): void
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

// --- 游戏逻辑与GSAP动画 ---
function triggerAction ( choice: 'left' | 'right' ): void
{
    if ( gameState !== 'IDLE' ) return;
    gameState = 'ACTION';

    // 玩家选择的“目标道具”
    const playerTargetItem: 'radish' | 'tissue' = choice === 'left' ? 'radish' : 'tissue';

    // Reverse psychology: cat chooses opposite
    const targetDir: -1 | 1 = choice === 'left' ? 1 : -1;
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
        gameState = 'CELEBRATE';
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
    tl.call( () => triggerFlashback( choice ) );
}

function triggerFlashback ( originalChoice: 'left' | 'right' ): void
{
    gameState = 'FLASHBACK';

    resetGameObjects();

    const targetDir: -1 | 1 = originalChoice === 'left' ? -1 : 1;
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

    tl.to( canvas, { x: 5, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x' } );

    tl.to( {}, { duration: 2 } );
    tl.call( () =>
    {
        gameState = 'ENDED';
    } );
}

function triggerFeedback (): void
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
            gameState = 'IDLE';
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
    draw();
}

window.addEventListener( 'DOMContentLoaded', start );
if ( document.readyState === 'complete' || document.readyState === 'interactive' )
{
    start();
}
