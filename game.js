/**
 * physics-roll-game-020901/frontend/public/game.js
 * 真棒猫 (Awesome Cat) - 游戏核心逻辑
 * 实现了像素猫动画、多米诺骨牌物理模拟、反转心理学交互及GSAP动画编排
 */

// --- 核心配置 ---
const CONFIG = {
    colors: {
        bg: '#2d3436',
        path: '#636e72',
        catMain: '#dfe6e9',
        catDark: '#b2bec3',
        domino: '#ffffff',
        radish: '#ff7675',
        tissue: '#74b9ff',
        gold: '#ffeaa7',
        awesome: '#55efc4' // 新增：真棒颜色
    },
    grid: 8,
    catSize: 64, // 基础尺寸
    dominoCount: 8
};

// --- 全局上下文 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let bounds = { width: 0, height: 0, centerX: 0, centerY: 0 };
let gameState = 'IDLE'; // IDLE, THINKING, ACTION, CELEBRATE, FLASHBACK, ENDED
let animationFrameId;

// --- 游戏对象 ---
const cat = {
    x: 0,
    y: 0,
    baseY: 0, // 新增：记录基准Y坐标
    scale: 1,
    rotation: 0,
    tailAngle: 0,
    earAngle: 0,
    direction: 0, // -1: Left, 0: Center, 1: Right
    state: 'idle', // idle, push, shock, jump
    bubbleText: '',
    bubbleAlpha: 0,
    item: null // holding item
};

const paths = {
    left: [],
    right: []
};

const particles = [];

// --- 初始化与响应式 ---
function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // 适配移动端高分屏
    const dpr = window.devicePixelRatio || 1;
    // 逻辑尺寸
    bounds.width = canvas.width;
    bounds.height = canvas.height;
    bounds.centerX = canvas.width / 2;
    bounds.centerY = canvas.height / 2;
    
    // 重置位置
    resetGameObjects();
}

function resetGameObjects() {
    // 猫的位置：屏幕中心偏下
    cat.x = bounds.centerX;
    cat.baseY = bounds.centerY - 50; // 记录基准位置
    cat.y = cat.baseY;
    cat.direction = 0;
    cat.state = 'idle';
    cat.bubbleText = 'Hm...?';
    cat.bubbleAlpha = 1;
    cat.item = null;
    cat.scale = 1;

    // 构建骨牌路径
    const pathY = cat.y + 60;
    const pathLength = Math.min(bounds.width * 0.4, 200);
    
    paths.left = createDominos(-1, pathLength, pathY);
    paths.right = createDominos(1, pathLength, pathY);
}

function createDominos(dir, length, startY) {
    const dominos = [];
    const count = CONFIG.dominoCount;
    const spacing = length / count;
    
    for (let i = 0; i < count; i++) {
        dominos.push({
            x: bounds.centerX + (dir * 60) + (dir * i * spacing), // 从猫身边向外延伸
            y: startY + (i * 10), // 微微向下的透视感
            width: 12,
            height: 32,
            rotation: 0,
            color: dir === -1 ? CONFIG.colors.radish : CONFIG.colors.tissue,
            active: true
        });
    }
    return dominos;
}

// --- 渲染系统 ---
function draw() {
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    
    // 1. 绘制背景网格 (像素风格)
    drawGrid();

    // 2. 绘制终点图标
    drawTarget(paths.left[paths.left.length - 1], '🥕', 'Radish');
    drawTarget(paths.right[paths.right.length - 1], '🧻', 'Tissue');

    // 3. 绘制骨牌
    drawDominos(paths.left);
    drawDominos(paths.right);

    // 4. 绘制猫
    drawPixelCat();

    // 5. 绘制粒子
    drawParticles();

    // 6. 绘制气泡
    if (cat.bubbleAlpha > 0) {
        drawBubble();
    }
    
    // 7. 滤镜效果 (Flashback模式)
    if (gameState === 'FLASHBACK') {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(0, 0, bounds.width, bounds.height);
        
        // 扫描线效果
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for(let i=0; i<bounds.height; i+=4) {
            ctx.fillRect(0, i, bounds.width, 1);
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText("FAIL TIMELINE", bounds.centerX, 50);
    }
    
    // 8. 结尾标题
    if (gameState === 'ENDED') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, bounds.width, bounds.height);
        ctx.save();
        ctx.translate(bounds.centerX, bounds.centerY);
        ctx.rotate(-0.1);
        ctx.fillStyle = '#ff7675';
        ctx.font = 'bold 48px "Arial"';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText("AWESOME CAT!", 0, 0);
        ctx.font = '20px "Arial"';
        ctx.fillStyle = '#fff';
        ctx.fillText("Click to Play Again", 0, 40);
        ctx.restore();
    }

    animationFrameId = requestAnimationFrame(draw);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const size = 32;
    for (let x = 0; x < bounds.width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, bounds.height);
        ctx.stroke();
    }
    for (let y = 0; y < bounds.height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(bounds.width, y);
        ctx.stroke();
    }
}

function drawTarget(lastDomino, emoji, label) {
    if (!lastDomino) return;
    const x = lastDomino.x + (lastDomino.x < bounds.centerX ? -30 : 30);
    const y = lastDomino.y;
    
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
    
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(label, x, y + 25);
}

function drawDominos(list) {
    list.forEach(d => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-d.width/2 + 2, -d.height + 2, d.width, d.height);
        
        // 本体
        ctx.fillStyle = d.color;
        ctx.fillRect(-d.width/2, -d.height, d.width, d.height);
        
        // 高光
        if (gameState === 'IDLE' && Math.random() > 0.95) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(-d.width/2, -d.height, d.width, 2);
        }
        
        ctx.restore();
    });
}

function drawPixelCat() {
    ctx.save();
    ctx.translate(cat.x, cat.y);
    
    // 应用缩放（呼吸或动作）
    let scaleY = cat.scale;
    if (cat.state === 'idle') {
        scaleY *= (1 + Math.sin(Date.now() / 500) * 0.02);
    }
    ctx.scale(cat.scale, scaleY); // 应用垂直缩放
    
    // 转向
    ctx.scale(cat.direction === 0 ? 1 : (cat.direction === 1 ? -1 : 1), 1);
    
    const s = 4; // pixel size scale
    
    // Body
    ctx.fillStyle = CONFIG.colors.catMain;
    ctx.fillRect(-4*s, -6*s, 8*s, 6*s);
    
    // Head
    ctx.fillRect(-5*s, -10*s, 10*s, 6*s);
    
    // Ears
    ctx.fillStyle = CONFIG.colors.catDark;
    // Left Ear
    ctx.save();
    ctx.translate(-3*s, -10*s);
    ctx.rotate(cat.earAngle);
    ctx.fillRect(-1*s, -2*s, 2*s, 2*s);
    ctx.restore();
    
    // Right Ear
    ctx.save();
    ctx.translate(3*s, -10*s);
    ctx.rotate(-cat.earAngle);
    ctx.fillRect(-1*s, -2*s, 2*s, 2*s);
    ctx.restore();
    
    // Face (Eyes)
    ctx.fillStyle = '#000';
    if (cat.state === 'shock') {
        // Shocked eyes
        ctx.fillRect(-3*s, -8*s, 2*s, 2*s); // O
        ctx.fillRect(1*s, -8*s, 2*s, 2*s);  // O
    } else if (cat.state === 'jump') {
        // Happy eyes ^ ^
        ctx.fillRect(-3*s, -8*s, 2*s, 1*s);
        ctx.fillRect(-4*s, -7*s, 1*s, 1*s);
        
        ctx.fillRect(1*s, -8*s, 2*s, 1*s);
        ctx.fillRect(3*s, -7*s, 1*s, 1*s);
    } else {
        // Normal/Blink
        if (Math.sin(Date.now() / 200) > 0.98 && cat.state === 'idle') {
             ctx.fillRect(-3*s, -7*s, 2*s, 1);
             ctx.fillRect(1*s, -7*s, 2*s, 1);
        } else {
             ctx.fillRect(-3*s, -8*s, 1*s, 1*s);
             ctx.fillRect(1*s, -8*s, 1*s, 1*s);
        }
    }

    // Paws
    ctx.fillStyle = '#fff';
    if (cat.state === 'push') {
        ctx.fillRect(2*s, -4*s, 3*s, 2*s); // Extended paw
    } else if (cat.state === 'jump') {
         // Hands up
         ctx.fillRect(-5*s, -5*s, 2*s, 2*s);
         ctx.fillRect(3*s, -5*s, 2*s, 2*s);
    } else {
        ctx.fillRect(-2*s, 0, 2*s, 1*s);
        ctx.fillRect(0, 0, 2*s, 1*s);
    }
    
    // Tail
    ctx.save();
    ctx.translate(0, -1*s);
    ctx.rotate(cat.tailAngle);
    ctx.fillStyle = CONFIG.colors.catDark;
    ctx.fillRect(-1*s, 0, 2*s, 4*s);
    ctx.restore();

    // Reward Item
    if (cat.item) {
        ctx.font = '20px Arial';
        ctx.fillText(cat.item, 0, -12*s);
    }

    ctx.restore();
}

function drawBubble() {
    ctx.save();
    ctx.globalAlpha = cat.bubbleAlpha;
    const x = cat.x;
    const y = cat.y - 60;
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(x - 40, y - 20, 80, 30, 10);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x - 5, y + 15);
    ctx.lineTo(x + 5, y + 15);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.font = '14px "Helvetica Neue"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cat.bubbleText, x, y - 5);
    
    ctx.restore();
}

function drawParticles() {
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.rotation += p.vRot;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            return;
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
    });
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 5,
            vRot: (Math.random() - 0.5) * 0.5,
            rotation: 0,
            life: 1,
            color: color || `hsl(${Math.random()*360}, 80%, 60%)`
        });
    }
}

// --- 游戏逻辑与GSAP动画 ---

function triggerAction(choice) {
    if (gameState !== 'IDLE') return;
    gameState = 'ACTION';
    
    // Reverse psychology: Cat chooses opposite
    const targetDir = choice === 'left' ? 1 : -1; // 1 is Right, -1 is Left
    const targetPaths = targetDir === 1 ? paths.right : paths.left;
    
    const tl = gsap.timeline();
    
    // 1. Hide UI Bubble
    tl.to(cat, { bubbleAlpha: 0, duration: 0.2 });
    
    // 2. Cat turns and moves
    tl.to(cat, { 
        x: bounds.centerX + (targetDir * 40), 
        duration: 0.5, 
        ease: "power2.out",
        onStart: () => { 
            cat.direction = targetDir; // Face direction
            cat.state = 'idle';
        }
    });
    
    // 3. Cat Pushes
    tl.to(cat, {
        duration: 0.2,
        onStart: () => { cat.state = 'push'; },
        onComplete: () => { cat.state = 'idle'; }
    });
    
    // 4. Domino Effect
    targetPaths.forEach((d, i) => {
        tl.to(d, {
            rotation: targetDir * Math.PI / 2.5, // Fall direction
            duration: 0.4,
            ease: "bounce.out",
            onStart: () => {
                // optional sound effect here
            }
        }, "-=0.25");
    });
    
    // 5. Celebration
    tl.call(() => {
        const last = targetPaths[targetPaths.length-1];
        spawnParticles(last.x, last.y);
        spawnParticles(last.x, last.y - 50);
        gameState = 'CELEBRATE';
        cat.item = '🐟';
    });
    
    // 6. Cat Joy
    tl.to(cat, { y: cat.baseY - 20, duration: 0.2, yoyo: true, repeat: 3 });
    
    // 7. Flashback Easter Egg (After delay)
    tl.to({}, { duration: 1.5 }); // Wait
    tl.call(() => triggerFlashback(choice));
}

function triggerFlashback(originalChoice) {
    gameState = 'FLASHBACK';
    
    // Reset positions for flashback
    resetGameObjects();
    
    // Flashback: What if cat chose what you wanted? (The Fail Timeline)
    const targetDir = originalChoice === 'left' ? -1 : 1;
    const targetPaths = targetDir === -1 ? paths.left : paths.right;
    
    const tl = gsap.timeline();
    
    // Visual cue for flashback
    cat.bubbleText = 'If I chose...';
    cat.bubbleAlpha = 1;
    
    tl.to(cat, { x: bounds.centerX + (targetDir * 40), duration: 0.5, delay: 0.5 });
    
    // Push
    tl.call(() => { cat.state = 'push'; });
    
    // First domino falls
    tl.to(targetPaths[0], { rotation: targetDir * Math.PI / 2.5, duration: 0.3 });
    
    // Fail event: Rolling Obstacle
    tl.call(() => {
        cat.state = 'shock';
        cat.bubbleText = '???';
        spawnParticles(targetPaths[0].x, targetPaths[0].y, '#ff0000');
    });
    
    // Shake screen
    tl.to(canvas, { x: 5, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x' });
    
    // End Flashback
    tl.to({}, { duration: 2 });
    tl.call(() => {
        gameState = 'ENDED';
    });
}

// 新增：真棒按钮反馈逻辑
function triggerFeedback() {
    // 限制：在剧情动画中不要打断，但在 CELEBRATE, IDLE, ENDED 时可以互动
    if (gameState === 'ACTION' || gameState === 'FLASHBACK') return;
    
    // 如果已经结束，点击反馈可能作为彩蛋或单纯交互
    const tl = gsap.timeline();
    
    // 1. 设置状态
    cat.bubbleText = 'Meow! ❤️'; 
    cat.bubbleAlpha = 1;
    
    // 2. 物理动作：跳跃
    tl.to(cat, {
        y: cat.baseY - 60,
        scale: 1.2, // 配合 drawPixelCat 使用
        duration: 0.3,
        ease: "power2.out",
        onStart: () => { cat.state = 'jump'; }
    });
    
    tl.to(cat, {
        y: cat.baseY,
        scale: 1,
        duration: 0.4,
        ease: "bounce.out",
        onComplete: () => { 
             if (gameState !== 'ENDED') cat.state = 'idle'; 
        }
    });

    // 3. 粒子特效
    spawnParticles(cat.x, cat.y - 40, CONFIG.colors.awesome);
    
    // 4. 自动隐藏气泡
    gsap.to(cat, { bubbleAlpha: 0, delay: 1.5, duration: 0.5 });
}

// --- 事件监听 ---
// 初始化事件绑定，使用委托或直接绑定
function initEvents() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');

    if (leftBtn) leftBtn.addEventListener('click', () => triggerAction('left'));
    if (rightBtn) rightBtn.addEventListener('click', () => triggerAction('right'));
    if (feedbackBtn) feedbackBtn.addEventListener('click', triggerFeedback);

    // Canvas 点击 fallback (仅当没有按钮UI覆盖时)
    canvas.addEventListener('click', (e) => {
        // 如果游戏结束，点击屏幕重开
        if (gameState === 'ENDED') {
            gameState = 'IDLE';
            resetGameObjects();
            return;
        }
        
        // 简单的区域判断（如果在移动端按钮可能覆盖了canvas，但点击空白处依然有效）
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // 只有当没有UI层遮挡或者意图明确时触发（为了防止冲突，这里主要处理重开）
    });
}

// Idle Animations using GSAP ticker
gsap.ticker.add((time) => {
    if (gameState === 'IDLE' || gameState === 'THINKING' || gameState === 'CELEBRATE') {
        cat.tailAngle = Math.sin(time * 2) * 0.2;
        cat.earAngle = Math.sin(time * 3) * 0.1;
    }
});

// Start
window.addEventListener('resize', resize);
// 等待 DOM 加载完成以确保按钮存在
window.addEventListener('DOMContentLoaded', () => {
    resize();
    resetGameObjects();
    initEvents();
    draw();
});
// 立即执行一次以防脚本后置
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    resize();
    resetGameObjects();
    initEvents();
    draw();
}