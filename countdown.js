// ==========================================
// 🎆 PIXEL ART COUNTDOWN TO NEW YEAR 🎆
// ==========================================

// ==========================================
// QUALITY SYSTEM (5 levels)
// ==========================================
let qualityMode = 'auto'; // 'auto' or 'manual'
let currentQuality = 3; // Current quality level 1-5
let fpsHistory = [];
let lastFpsCheck = performance.now();

// FPS monitoring
let frameCount = 0;
let fpsStartTime = performance.now();
let currentFPS = 60;
let maxRefreshRate = 60; // Default to 60Hz

// Detect screen refresh rate
function detectRefreshRate() {
    let lastTime = performance.now();
    let framesSampled = 0;
    let refreshRates = [];
    
    function measure(currentTime) {
        const delta = currentTime - lastTime;
        if (delta > 0) {
            const rate = Math.round(1000 / delta);
            if (rate >= 24 && rate <= 240) { // Reasonable range
                refreshRates.push(rate);
            }
        }
        lastTime = currentTime;
        framesSampled++;
        
        if (framesSampled < 60) {
            requestAnimationFrame(measure);
        } else {
            // Calculate median refresh rate
            refreshRates.sort((a, b) => a - b);
            maxRefreshRate = refreshRates[Math.floor(refreshRates.length / 2)] || 60;
            console.log(`Detected screen refresh rate: ${maxRefreshRate}Hz`);
        }
    }
    
    requestAnimationFrame(measure);
}

// Start detecting refresh rate
detectRefreshRate();

function updateFPS(timestamp) {
    frameCount++;
    const elapsed = timestamp - fpsStartTime;
    if (elapsed >= 1000) {
        currentFPS = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        fpsStartTime = timestamp;
    }
}

function checkQualityAdjustment(timestamp) {
    if (timestamp - lastFpsCheck >= 5000) {
        fpsHistory.push(currentFPS);
        if (fpsHistory.length > 6) fpsHistory.shift();
        
        if (qualityMode === 'auto' && fpsHistory.length >= 2) {
            const avgFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
            
            // Calculate thresholds based on screen refresh rate
            const excellent = maxRefreshRate * 0.92;  // 92% of max
            const good = maxRefreshRate * 0.75;       // 75% of max
            const medium = maxRefreshRate * 0.58;     // 58% of max
            const low = maxRefreshRate * 0.42;        // 42% of max
            
            // Determine quality based on FPS relative to screen refresh rate
            if (avgFPS >= excellent) currentQuality = 5;
            else if (avgFPS >= good) currentQuality = 4;
            else if (avgFPS >= medium) currentQuality = 3;
            else if (avgFPS >= low) currentQuality = 2;
            else currentQuality = 1;
            
            // Update star animation when quality changes
            updateStarAnimation();
        }
        
        lastFpsCheck = timestamp;
    }
}

// Quality system constants
const MAX_PARTICLES = 400;
const MAX_ROCKETS = 8;
const MAX_EXPLODING_PIXELS = 300;
const TRAIL_LENGTH = 12;

// Canvas setup
const canvas = document.getElementById('countdownCanvas');
const ctx = canvas.getContext('2d');
const fireworksCanvas = document.getElementById('fireworksCanvas');
const fireworksCtx = fireworksCanvas.getContext('2d');

// Supabase tracking (publishable key, safe to expose)
const SUPABASE_URL = 'https://wpszminjlmadhebonayc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OI2A4i1_5RIFnuXxZ3wXdQ_1UlL8Ohm';
const SUPABASE_TABLE = 'view_time';
let supabaseClient = null;
let supabaseSessionId = null;
let supabaseViewSeconds = 0;
let supabaseInterval = null;
const COST_PER_SHOT = 5; // euro per firework (estimated)
let fireworkShots = 0;

// Responsive canvas sizing
function resizeCanvas() {
    // On mobile, ensure we use almost full width but keep content horizontal
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 10 : 40;
    const maxWidth = Math.min(window.innerWidth - padding, 1400);
    
    canvas.width = maxWidth;
    // Adjust height ratio for mobile to prevent overflow
    canvas.height = isMobile ? maxWidth * 0.30 : maxWidth * 0.35;
    
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
    
    // Force recalculation of pixel sizes when resizing
    if (window.countdown) {
        countdown.calculateSizes();
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==========================================
// PIXEL ART CIJFER DEFINITIES (5x7 grid)
// ==========================================
const DIGIT_PATTERNS = {
    '0': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,1,1],
        [1,0,1,0,1],
        [1,1,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '1': [
        [0,0,1,0,0],
        [0,1,1,0,0],
        [1,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1]
    ],
    '2': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [0,0,0,0,1],
        [0,0,1,1,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]
    ],
    '3': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [0,0,0,0,1],
        [0,0,1,1,0],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '4': [
        [0,0,0,1,0],
        [0,0,1,1,0],
        [0,1,0,1,0],
        [1,0,0,1,0],
        [1,1,1,1,1],
        [0,0,0,1,0],
        [0,0,0,1,0]
    ],
    '5': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '6': [
        [0,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '7': [
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0]
    ],
    '8': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0]
    ],
    '9': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,1,1,1,0]
    ],
    ':': [
        [0,0,0,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,0,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,0,0,0]
    ]
};

// ==========================================
// KLEURENSCHEMA'S
// ==========================================
const COLOR_SCHEMES = [
    ['#ff6b35', '#ff8c42', '#ffd166', '#ffee93'],
    ['#00ffff', '#00ff88', '#88ff00', '#ffff00'],
    ['#ff006e', '#fb5607', '#ffbe0b', '#ff006e'],
    ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
    ['#ffd700', '#ff6b6b', '#ff8e53', '#fee440'],
    ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff']
];

// Slow changing colors for colons
let slowColorHue = 0;
const SLOW_COLOR_SPEED = 0.001; 

function getSlowChangingColorWithVariance() {
    slowColorHue = (slowColorHue + SLOW_COLOR_SPEED) % 360;
    const jitter = (Math.random() * 12) - 6; // small variation per pixel
    return `hsl(${(slowColorHue + jitter + 360) % 360}, 80%, 65%)`;
}

// ==========================================
// PIXEL CLASS
// ==========================================
class Pixel {
    constructor(x, y, targetX, targetY, color, size) {
        this.x = targetX; 
        this.y = targetY; 
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.size = size;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.scale = 0; 
        this.alpha = 1;
        this.state = 'arriving'; // arriving, stable, launching, exploding
        this.arrivalProgress = 0;
        this.trail = []; // Trail for launching/exploding
        this.sparkleTimer = 0;
        this.canvasOffset = { x: 0, y: 0 }; // For converting to fireworks canvas coords
    }

    update(dt = 1) {
        if (this.state === 'arriving') {
            // Simple scale-up arrival
            this.arrivalProgress += 0.1 * dt; 
            if (this.arrivalProgress >= 1) {
                this.arrivalProgress = 1;
                this.state = 'stable';
                this.scale = 1;
            } else {
                this.scale = this.arrivalProgress;
            }
        } else if (this.state === 'stable') {
            this.x = this.targetX;
            this.y = this.targetY;
            this.scale = 1;
            this.rotation = 0;
            // Subtle pulse
            this.sparkleTimer += 0.1 * dt;
        } else if (this.state === 'launching') {
            // Move the whole digit block up together
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 0.2 * dt; // Slower for less height
            this.rotation += this.rotationSpeed * dt;
            
            // Stretch effect while launching
            this.scale = 1 + Math.abs(this.vy) * 0.08;

            // Explode when it slows down (reaches peak)
            if (this.vy > -2) { 
                this.explode();
            }
        } else if (this.state === 'exploding') {
            // Add trail only if quality >= 3
            if (currentQuality >= 3) {
                if (this.trail.length < TRAIL_LENGTH) {
                    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha, size: this.size * this.scale });
                } else {
                    this.trail.shift();
                    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha, size: this.size * this.scale });
                }
            }
            
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 0.22 * dt; // Gravity slightly softer
            this.vx *= Math.pow(0.985, dt); // Less deceleration
            this.rotation += this.rotationSpeed * dt;
            this.alpha -= 0.012 * dt; // Slower fade for longer visible effect
            this.scale *= Math.pow(0.985, dt);
        }
        
        // Update trail fade
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].alpha *= Math.pow(0.85, dt);
        }
    }

    launch() {
        this.state = 'launching';
        this.trail = [];
        // vx and vy are already set by explodePixelsAtPositions
        // Just start the launching state
    }

    explode() {
        this.state = 'exploding';
        this.trail = [];
        // NOTE: Do NOT count fireworkShots here - pixels are digit explosions, not actual firework shots
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 7;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 3;
        this.rotationSpeed = (Math.random() - 0.5) * 0.6;
        this.scale = 1.3; // Slightly bigger at start
    }

    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0
          ? 0
          : x === 1
          ? 1
          : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    // Draw on main canvas (for stable/arriving pixels)
    draw(ctx) {
        if (this.alpha <= 0) return;
        if (this.state === 'launching' || this.state === 'exploding') return; // These are drawn on fireworks canvas

        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.state !== 'stable') {
            ctx.rotate(this.rotation);
        }
        
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.alpha;

        // Glow for arriving pixels
        if (this.state === 'arriving') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        const s = this.size;
        ctx.fillRect(-s/2, -s/2, s, s);

        ctx.restore();
    }

    // Draw on fireworks canvas (for launching/exploding pixels)
    drawOnFireworks(ctx, offsetX, offsetY, scaleX, scaleY) {
        if (this.alpha <= 0) return;
        if (this.state !== 'launching' && this.state !== 'exploding') return;

        // Scale pixel position from canvas to screen coordinates
        const screenX = this.x * scaleX + offsetX;
        const screenY = this.y * scaleY + offsetY;

        // Draw trail first (if quality >= 3)
        if (currentQuality >= 3) {
            const trailLen = this.trail.length;
            for (let i = 0; i < trailLen; i++) {
                const t = this.trail[i];
                const trailX = t.x * scaleX + offsetX;
                const trailY = t.y * scaleY + offsetY;
                const trailAlpha = t.alpha * (i / trailLen) * 0.6;
                if (trailAlpha < 0.02) continue; // Skip nearly invisible trails
                const trailSize = t.size * (i / trailLen) * scaleX;
                
                ctx.save();
                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = this.color;
                ctx.fillRect(trailX - trailSize/2, trailY - trailSize/2, trailSize, trailSize);
                ctx.restore();
            }
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        // Stretch vertically if launching
        if (this.state === 'launching') {
            ctx.scale(this.scale * 0.6 * scaleX, this.scale * 1.8 * scaleY);
        } else {
            ctx.scale(this.scale * scaleX, this.scale * scaleY);
        }
        
        ctx.globalAlpha = this.alpha;
        // Glow for flying digits (quality >= 4)
        if (currentQuality >= 4) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        ctx.fillStyle = this.color;

        const s = this.size;
        ctx.fillRect(-s/2, -s/2, s, s);

        // Add sparkle/glow ring when exploding (quality >= 4)
        if (currentQuality >= 4 && this.state === 'exploding' && this.alpha > 0.5 && Math.random() < 0.3) {
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = this.alpha * 0.3;
            ctx.stroke();
        }

        ctx.restore();
    }

    isAlive() {
        return this.alpha > 0;
    }
}

// ==========================================
// FIREWORK ROCKET CLASS (rocket that goes up and explodes)
// ==========================================
class FireworkRocket {
    constructor(x, targetY, color) {
        this.x = x;
        this.y = fireworksCanvas.height + 20;
        this.targetY = targetY;
        this.color = color;
        this.speed = 4 + Math.random() * 3;
        this.trail = [];
        this.exploded = false;
        this.particles = [];
        // Count this rocket as a firework shot when created
        fireworkShots += 1;
    }

    update(dt = 1) {
        if (!this.exploded) {
            // Add trail (always for rockets going up)
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 15) this.trail.shift();
            
            // Move up
            this.y -= this.speed * dt;
            
            // Explode when reaching target
            if (this.y <= this.targetY) {
                this.explode();
            }
        }
        
        // Update trail fade
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha *= Math.pow(0.9, dt);
            if (this.trail[i].alpha < 0.05) {
                this.trail.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.08 * dt;
            p.alpha -= 0.015 * dt;
            
            // Add trail for explosion particles (quality >= 5)
            if (currentQuality >= 5) {
                if (p.alpha > 0.1 && p.trail.length < 8) {
                    p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
                } else if (p.trail.length >= 8) {
                    p.trail.shift();
                    p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
                }
            }
            
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        this.exploded = true;
        // NOTE: Shot already counted in constructor, don't count again here
        const numParticles = 40 + Math.floor(Math.random() * 30);
        const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i + Math.random() * 0.3;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: scheme[Math.floor(Math.random() * scheme.length)],
                alpha: 1,
                size: 2 + Math.random() * 2,
                trail: []
            });
        }
    }

    draw(ctx) {
        // Draw trail
        const trailLen = this.trail.length;
        for (let i = 0; i < trailLen; i++) {
            const t = this.trail[i];
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.7;
            ctx.fillStyle = this.color;
            if (currentQuality >= 4) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
            }
            const size = 3 * (i / trailLen);
            ctx.fillRect(t.x - size/2, t.y - size/2, size, size * 3);
            ctx.restore();
        }

        // Draw rocket head if not exploded
        if (!this.exploded) {
            ctx.save();
            ctx.fillStyle = '#fff';
            if (currentQuality >= 4) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw explosion particles
        for (let j = 0; j < this.particles.length; j++) {
            const p = this.particles[j];
            // Trail (quality >= 5)
            if (currentQuality >= 5) {
                for (let i = 0; i < p.trail.length; i++) {
                    const t = p.trail[i];
                    ctx.save();
                    ctx.globalAlpha = t.alpha * (i / p.trail.length) * 0.5;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(t.x - p.size/2, t.y - p.size/2, p.size, p.size);
                    ctx.restore();
                }
            }
            
            // Particle
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            if (currentQuality >= 4) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
            }
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            ctx.restore();
        }
    }

    isAlive() {
        return !this.exploded || this.particles.length > 0;
    }
}

// ==========================================
// FIREWORK PARTICLE CLASS (click fireworks)
// ==========================================
class FireworkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.size = 2 + Math.random() * 3;
        this.trail = [];
        this.decay = 0.015 + Math.random() * 0.015;
    }

    update(dt = 1) {
        if (this.trail.length < 8) {
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        } else {
            this.trail.shift();
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.05 * dt;
        this.vx *= Math.pow(0.985, dt);
        this.alpha -= this.decay * dt;
    }

    draw(ctx) {
        // Trail (quality dependent)
        if (currentQuality >= 3) {
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                ctx.fillStyle = this.color;
                ctx.globalAlpha = t.alpha * (i / this.trail.length) * 0.5;
                const trailSize = this.size * (i / this.trail.length);
                ctx.fillRect(t.x - trailSize/2, t.y - trailSize/2, trailSize, trailSize);
            }
        }

        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        if (currentQuality >= 4) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    isAlive() {
        return this.alpha > 0;
    }
}

// ==========================================
// AMBULANCE CLASS 
// ==========================================
// Preload ambulance image
const ambulanceImage = new Image();
ambulanceImage.src = 'images/ambulance.png';
let ambulanceImageLoaded = false;
ambulanceImage.onload = () => {
    ambulanceImageLoaded = true;
    console.log('Ambulance image loaded!');
};
ambulanceImage.onerror = () => {
    console.error('Failed to load ambulance image!');
};

class Ambulance {
    constructor() {
        this.x = -window.innerWidth; // Start in center of screen
        this.y = window.innerHeight + 25; // Middle of screen
        console.log('window innerHeight:', window.innerHeight);
        this.speed = 3 + Math.random() * 2; // Speed
        this.size = 80; // Size of ambulance
        this.lightTimer = 0;
        this.lightState = 0; // 0: red, 1: blue
    }

    update(dt = 1) {
        this.x += this.speed * dt;
        this.lightTimer += dt;
        if (this.lightTimer > 6) { // Flash every 6 frames
            this.lightTimer = 0;
            this.lightState = 1 - this.lightState;
        }
    }

    draw(ctx) {
        if (!ambulanceImageLoaded) return;
        
        ctx.save();
        
        // Calculate dimensions
        const width = this.size;
        const height = (ambulanceImage.height / ambulanceImage.width) * this.size;
        const drawY = this.y - height;
        
        // Draw ambulance image
        ctx.drawImage(ambulanceImage, this.x, drawY, width, height);
        
        // Draw flashing lights
        const lightRadius = 6;
        
        // Left light
        const leftLightX = this.x + width * 0.35;
        const leftLightY = drawY + height * 0.15 + 2;
        const leftColor = this.lightState === 0 ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 100, 255, 0.9)';
        
        // Right light
        const rightLightX = this.x + width * 0.65 - 4;
        const rightLightY = drawY + height * 0.15 + 2;
        const rightColor = this.lightState === 1 ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 100, 255, 0.9)';
        
        // Draw glow for left light
        ctx.shadowBlur = 20;
        ctx.shadowColor = leftColor;
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.arc(leftLightX, leftLightY, lightRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glow for right light
        ctx.shadowColor = rightColor;
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.arc(rightLightX, rightLightY, lightRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bright centers
        ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(leftLightX, leftLightY, lightRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightLightX, rightLightY, lightRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    isAlive() {
        return this.x < window.innerWidth + 150;
    }
}

// ==========================================
// MAIN COUNTDOWN CLASS
// ==========================================
class CountdownDisplay {
    constructor() {
        this.pixels = [];
        this.explodingPixels = [];
        this.fireworks = [];
        this.rockets = [];
        this.ambulances = [];
        this.currentTimeString = '';
        this.colorSchemeIndex = 0;
        this.lastSecond = -1;
        this.displayMode = 'full'; // 'full', 'no-days', 'no-hours', 'only-seconds'
        this.lastDisplayMode = 'full';

        this.calculateSizes();
        this.topOffset = 60;
        this.bottomMargin = 50;
    }

    calculateSizes() {
        const rows = 7;
        const spacing = 1;
        const isMobile = window.innerWidth < 768;
        
        this.topOffset = Math.max(10, canvas.height * 0.08);
        this.bottomMargin = Math.max(10, canvas.height * 0.10);
        // Push digits down slightly
        this.topOffset += canvas.height * 0.05;
        
        const heightAvailable = canvas.height - this.topOffset - this.bottomMargin;
        const maxPixelByHeight = Math.floor((heightAvailable - (rows - 1) * spacing) / rows);
        
        // Calculate width based on displayMode
        let numChars = 11; // DD:HH:MM:SS
        if (this.displayMode === 'no-days') numChars = 8; // HH:MM:SS
        else if (this.displayMode === 'no-hours') numChars = 5; // MM:SS
        else if (this.displayMode === 'only-seconds') numChars = 2; // SS
        
        const padding = isMobile ? 6 : 40;
        const availableWidth = canvas.width - padding;
        
        // Bigger pixels when fewer digits
        let scaleFactor = 1;
        if (this.displayMode === 'no-days') scaleFactor = 1.3;
        else if (this.displayMode === 'no-hours') scaleFactor = 1.8;
        else if (this.displayMode === 'only-seconds') scaleFactor = 2.5;
        
        // Mobile gets more aggressive scaling
        const baseWidth = isMobile ? (availableWidth - 10) : (availableWidth - 55);
        const basePixelSize = Math.floor(baseWidth / 81);
        const maxPixelByWidth = Math.max(isMobile ? 1 : 6, basePixelSize * scaleFactor);
        
        this.pixelSize = Math.floor(Math.min(maxPixelByWidth, maxPixelByHeight * scaleFactor));
        this.pixelSize = Math.min(this.pixelSize, 35);
        this.pixelSize = Math.max(this.pixelSize, isMobile ? 1 : 6);

        this.spacing = spacing;
        this.digitSpacing = this.pixelSize * (isMobile ? 1.2 : 2);
        this.sectionSpacing = this.pixelSize * (isMobile ? 2.5 : 4);
    }

    getTimeUntilNewYear() {
        const now = new Date();
        const newYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
        
        if (now >= newYear) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isNewYear: true };
        }

        const diff = newYear - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isNewYear: false };
    }

    formatTime(time) {
        // Determine displayMode
        if (time.days === 0 && time.hours === 0 && time.minutes === 0) {
            this.displayMode = 'only-seconds';
        } else if (time.days === 0 && time.hours === 0) {
            this.displayMode = 'no-hours';
        } else if (time.days === 0) {
            this.displayMode = 'no-days';
        } else {
            this.displayMode = 'full';
        }
        
        const h = String(time.hours).padStart(2, '0');
        const m = String(time.minutes).padStart(2, '0');
        const s = String(time.seconds).padStart(2, '0');
        
        if (this.displayMode === 'only-seconds') return s;
        if (this.displayMode === 'no-hours') return `${m}:${s}`;
        if (this.displayMode === 'no-days') return `${h}:${m}:${s}`;
        
        const d = String(time.days).padStart(2, '0');
        return `${d}:${h}:${m}:${s}`;
    }

    updateLabels() {
        const labelDays = document.getElementById('label-days');
        const labelHours = document.getElementById('label-hours');
        const labelMinutes = document.getElementById('label-minutes');
        const labelSeconds = document.getElementById('label-seconds');
        
        if (this.displayMode === 'only-seconds') {
            labelDays.style.display = 'none';
            labelHours.style.display = 'none';
            labelMinutes.style.display = 'none';
            labelSeconds.style.display = 'block';
        } else if (this.displayMode === 'no-hours') {
            labelDays.style.display = 'none';
            labelHours.style.display = 'none';
            labelMinutes.style.display = 'block';
            labelSeconds.style.display = 'block';
        } else if (this.displayMode === 'no-days') {
            labelDays.style.display = 'none';
            labelHours.style.display = 'block';
            labelMinutes.style.display = 'block';
            labelSeconds.style.display = 'block';
        } else {
            labelDays.style.display = 'block';
            labelHours.style.display = 'block';
            labelMinutes.style.display = 'block';
            labelSeconds.style.display = 'block';
        }
    }

    getRandomColor() {
        const scheme = COLOR_SCHEMES[this.colorSchemeIndex];
        return scheme[Math.floor(Math.random() * scheme.length)];
    }

    createPixelsForString(timeString) {
        const newPixels = [];
        
        let totalWidth = 0;
        for (let charIndex = 0; charIndex < timeString.length; charIndex++) {
            const char = timeString[charIndex];
            if (char === ':') {
                totalWidth += 5 * (this.pixelSize + this.spacing) + this.sectionSpacing;
            } else {
                totalWidth += 5 * (this.pixelSize + this.spacing) + this.digitSpacing;
            }
        }
        totalWidth -= this.digitSpacing;
        
        let xOffset = Math.max(10, (canvas.width - totalWidth) / 2);

        for (let charIndex = 0; charIndex < timeString.length; charIndex++) {
            const char = timeString[charIndex];
            const pattern = DIGIT_PATTERNS[char];

            if (!pattern) continue;

            // Bepaal of dit een langzaam kleurveranderende sectie is
            const isSlowColor = this.shouldUseSlowColor(charIndex);
            const charScheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];

            for (let row = 0; row < pattern.length; row++) {
                for (let col = 0; col < pattern[row].length; col++) {
                    if (pattern[row][col] === 1) {
                        const targetX = xOffset + col * (this.pixelSize + this.spacing);
                        const targetY = this.topOffset + row * (this.pixelSize + this.spacing);

                        let color;
                        if (isSlowColor) {
                            color = getSlowChangingColorWithVariance();
                        } else {
                            color = charScheme[Math.floor(Math.random() * charScheme.length)];
                        }

                        const pixel = new Pixel(
                            targetX,
                            targetY,
                            targetX,
                            targetY,
                            color,
                            this.pixelSize
                        );

                        pixel.arrivalProgress = -charIndex * 0.05 - (row + col) * 0.01;
                        pixel.charIndex = charIndex;
                        pixel.isSlowColor = isSlowColor;

                        newPixels.push(pixel);
                    }
                }
            }

            if (char === ':') {
                xOffset += 5 * (this.pixelSize + this.spacing) + this.sectionSpacing;
            } else {
                xOffset += 5 * (this.pixelSize + this.spacing) + this.digitSpacing;
            }
        }

        return newPixels;
    }

    shouldUseSlowColor(char) {
        // Only colons get the slow color change
        return char === ':';
    }

    findChangedPositions(oldString, newString) {
        const changed = [];
        for (let i = 0; i < Math.max(oldString.length, newString.length); i++) {
            if (oldString[i] !== newString[i]) {
                changed.push(i);
            }
        }
        return changed;
    }

    update(dt = 1) {
        const time = this.getTimeUntilNewYear();
        
        if (time.isNewYear) {
            document.getElementById('happyNewYear').style.display = 'block';
            this.createMassiveFireworks();
            return;
        }

        const oldDisplayMode = this.displayMode;
        const newTimeString = this.formatTime(time);
        
        // Recalculate sizes when displayMode changes
        if (oldDisplayMode !== this.displayMode || this.lastDisplayMode !== this.displayMode) {
            this.calculateSizes();
            this.updateLabels();
            this.lastDisplayMode = this.displayMode;
            // Force complete rebuild
            this.currentTimeString = '';
        }

        const currentSecond = time.seconds;

        if (newTimeString !== this.currentTimeString) {
            const changedPositions = this.findChangedPositions(this.currentTimeString, newTimeString);

            if (currentSecond !== this.lastSecond) {
                this.colorSchemeIndex = (this.colorSchemeIndex + 1) % COLOR_SCHEMES.length;
                this.lastSecond = currentSecond;
            }

            if (this.currentTimeString && changedPositions.length > 0) {
                this.explodePixelsAtPositions(changedPositions);
            }

            const allNewPixels = this.createPixelsForString(newTimeString);
            
            const mergedPixels = [];
            
            for (let i = 0; i < this.pixels.length; i++) {
                const p = this.pixels[i];
                if (p.state === 'stable' && !changedPositions.includes(p.charIndex)) {
                    mergedPixels.push(p);
                }
            }

            for (let i = 0; i < allNewPixels.length; i++) {
                const p = allNewPixels[i];
                if (changedPositions.includes(p.charIndex) || this.currentTimeString === '') {
                    mergedPixels.push(p);
                }
            }
            
            if (this.currentTimeString === '') {
                this.pixels = allNewPixels;
                for (let i = 0; i < this.pixels.length; i++) {
                    this.pixels[i].state = 'stable';
                    this.pixels[i].scale = 1;
                    this.pixels[i].arrivalProgress = 1;
                }
            } else {
                this.pixels = mergedPixels;
            }

            this.currentTimeString = newTimeString;

            // Add firework rocket only if quality >= 2
            if (currentQuality >= 2 && this.rockets.length < MAX_ROCKETS) {
                this.addFireworkRocket();
            }
        }

        // Update pixels
        for (let i = 0; i < this.pixels.length; i++) {
            const pixel = this.pixels[i];
            pixel.update(dt);
            if (pixel.isSlowColor && pixel.state === 'stable') {
                pixel.color = getSlowChangingColorWithVariance();
            }
        }

        // Update exploding pixels (limit count for performance)
        for (let i = this.explodingPixels.length - 1; i >= 0; i--) {
            this.explodingPixels[i].update(dt);
            if (!this.explodingPixels[i].isAlive()) {
                this.explodingPixels.splice(i, 1);
            }
        }
        // Trim excess exploding pixels
        while (this.explodingPixels.length > MAX_EXPLODING_PIXELS) {
            this.explodingPixels.shift();
        }

        // Update firework particles (limit count)
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            this.fireworks[i].update(dt);
            if (!this.fireworks[i].isAlive()) {
                this.fireworks.splice(i, 1);
            }
        }
        while (this.fireworks.length > MAX_PARTICLES) {
            this.fireworks.shift();
        }

        // Update rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            this.rockets[i].update(dt);
            if (!this.rockets[i].isAlive()) {
                this.rockets.splice(i, 1);
            }
        }

        // Update ambulances
        for (let i = this.ambulances.length - 1; i >= 0; i--) {
            this.ambulances[i].update(dt);
            if (!this.ambulances[i].isAlive()) {
                this.ambulances.splice(i, 1);
            }
        }

        // Occasionally spawn ambulance
        if (this.ambulances.length === 0 && Math.random() < 0.005 * dt) { // Every ~2.5 seconds
            this.addAmbulance();
        }
    }

    explodePixelsAtPositions(positions) {
        const canvasRect = canvas.getBoundingClientRect();
        const scaleY = canvasRect.height / canvas.height;
        const g = 0.33;

        const charMinY = {};
        const charRot = {};
        for (let i = 0; i < this.pixels.length; i++) {
            const p = this.pixels[i];
            if (!positions.includes(p.charIndex)) continue;
            // Calculate screen Y position with scaling
            const screenY = p.y * scaleY + canvasRect.top;
            if (charMinY[p.charIndex] === undefined || screenY < charMinY[p.charIndex]) {
                charMinY[p.charIndex] = screenY;
            }
            if (charRot[p.charIndex] === undefined) {
                charRot[p.charIndex] = (Math.random() - 0.5) * 0.18;
            }
        }
        
        const remainingPixels = [];
        const scaleX = canvasRect.width / canvas.width;
        
        for (let i = 0; i < this.pixels.length; i++) {
            const pixel = this.pixels[i];
            if (positions.includes(pixel.charIndex)) {
                const minY = charMinY[pixel.charIndex] ?? (pixel.y * scaleY + canvasRect.top);
                const availableUp = Math.max(30, minY - 10);
                let maxVy = -Math.sqrt(2 * g * availableUp);
                maxVy *= 0.7;

                const vy = maxVy;
                const vx = 0;
                const rot = charRot[pixel.charIndex] ?? 0;

                pixel.vy = vy;
                pixel.vx = vx;
                pixel.rotationSpeed = rot;
                pixel.launch();
                this.explodingPixels.push(pixel);
                
                // Add burst particles (quality dependent)
                const burstCount = currentQuality >= 3 ? (Math.random() < 0.5 ? 0 : 2 + Math.floor(Math.random() * 2)) : 0;
                // Convert pixel position (relative to countdown canvas) to fireworks canvas coords
                const fxX = pixel.x * scaleX + canvasRect.left;
                const fxY = pixel.y * scaleY + canvasRect.top;
                for (let b = 0; b < burstCount; b++) {
                    this.fireworks.push(new FireworkParticle(fxX, fxY, pixel.color));
                }
            } else {
                remainingPixels.push(pixel);
            }
        }
        
        this.pixels = remainingPixels;
    }

    addFireworkRocket() {
        // Add a firework rocket that goes up and explodes
        const x = Math.random() * fireworksCanvas.width;
        const targetY = 50 + Math.random() * (fireworksCanvas.height * 0.4);
        const color = this.getRandomColor();
        this.rockets.push(new FireworkRocket(x, targetY, color));
    }

    addAmbulance() {
        // Add an ambulance at the bottom of the screen
        this.ambulances.push(new Ambulance());
        console.log('Ambulance spawned!');
    }

    createMassiveFireworks() {
        // Massive fireworks for New Year (quality-based)
        const rocketCount = currentQuality <= 2 ? 15 : 30;
        for (let i = 0; i < rocketCount; i++) {
            setTimeout(() => {
                const x = Math.random() * fireworksCanvas.width;
                const targetY = 50 + Math.random() * (fireworksCanvas.height * 0.5);
                const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
                const color = scheme[Math.floor(Math.random() * scheme.length)];
                this.rockets.push(new FireworkRocket(x, targetY, color));
            }, i * 150);
        }
        
        // Extra explosions
        const explosionCount = currentQuality <= 2 ? 10 : 20;
        for (let i = 0; i < explosionCount; i++) {
            setTimeout(() => {
                const x = Math.random() * fireworksCanvas.width;
                const y = Math.random() * fireworksCanvas.height * 0.5;
                const schemeIndex = Math.floor(Math.random() * COLOR_SCHEMES.length);
                const scheme = COLOR_SCHEMES[schemeIndex];

                const particleCount = currentQuality <= 2 ? 50 : 100;
                for (let j = 0; j < particleCount; j++) {
                    const color = scheme[Math.floor(Math.random() * scheme.length)];
                    this.fireworks.push(new FireworkParticle(x, y, color));
                }
            }, i * 200);
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
        
        // Use lighter composite on quality >= 3
        if (currentQuality >= 3) {
            fireworksCtx.globalCompositeOperation = 'lighter';
        }

        // Calculate scale ratio between CSS size and canvas internal size
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / canvas.width;
        const scaleY = canvasRect.height / canvas.height;
        
        // Offset is countdown canvas position on screen
        const offsetX = canvasRect.left;
        const offsetY = canvasRect.top;

        // Draw stable pixels
        for (let i = 0; i < this.pixels.length; i++) {
            this.pixels[i].draw(ctx);
        }
        
        // Draw exploding pixels on fireworks canvas
        for (let i = 0; i < this.explodingPixels.length; i++) {
            this.explodingPixels[i].drawOnFireworks(fireworksCtx, offsetX, offsetY, scaleX, scaleY);
        }
        
        // Draw firework particles
        for (let i = 0; i < this.fireworks.length; i++) {
            this.fireworks[i].draw(fireworksCtx);
        }
        
        // Draw rockets
        for (let i = 0; i < this.rockets.length; i++) {
            this.rockets[i].draw(fireworksCtx);
        }

        // Draw ambulances on fireworks canvas (fullscreen)
        for (let i = 0; i < this.ambulances.length; i++) {
            this.ambulances[i].draw(fireworksCtx);
        }
        
        // Reset composite operation
        fireworksCtx.globalCompositeOperation = 'source-over';
    }
}

// ==========================================
// SUPABASE VIEW TIME TRACKING
// Requires table `view_time` with columns:
// id (text, PK), seconds (int), started_at (timestamptz, default now), updated_at (timestamptz), user_agent (text)
// ==========================================
async function initSupabaseTracking() {
    try {
        if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await startSupabaseSession();
        if (supabaseInterval) clearInterval(supabaseInterval);
        // Update every 2 seconds for faster sync
        supabaseInterval = setInterval(() => updateSupabaseSession(false), 2000);
        window.addEventListener('beforeunload', () => {
            if (supabaseInterval) clearInterval(supabaseInterval);
            updateSupabaseSession(true);
        });
    } catch (err) {
        console.warn('Supabase init failed:', err);
    }
}

async function startSupabaseSession() {
    if (!supabaseClient) return;
    // Use persistent localStorage ID (or create new)
    let storedId = localStorage.getItem('countdown_user_id');
    if (!storedId) {
        const rand = Math.floor(Math.random() * 1000);
        storedId = String(Date.now() * 1000 + rand);
        localStorage.setItem('countdown_user_id', storedId);
    }
    supabaseSessionId = parseInt(storedId, 10);
    
    // Get existing data for this user
    const { data: existing } = await supabaseClient
        .from(SUPABASE_TABLE)
        .select('seconds, shots')
        .eq('id', supabaseSessionId)
        .single();
    
    supabaseViewSeconds = existing?.seconds || 0;
    fireworkShots = existing?.shots || 0;
    const now = new Date().toISOString();
    const { error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .upsert({
            id: supabaseSessionId,
            seconds: supabaseViewSeconds,
            shots: fireworkShots,
            started_at: now,
            updated_at: now,
            user_agent: navigator.userAgent
        });
    if (error) console.warn('Supabase start error:', error.message);
}

async function updateSupabaseSession(isFinal = false) {
    if (!supabaseClient || !supabaseSessionId) return;
    if (!isFinal) {
        supabaseViewSeconds += 2; // Update every 2 seconds
    }
    const now = new Date().toISOString();
    const { error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .upsert({
            id: supabaseSessionId,
            seconds: supabaseViewSeconds,
            shots: fireworkShots,
            updated_at: now
        });
    if (error) console.warn('Supabase update error:', error.message);
}

// ==========================================
// ANIMATION LOOP
// ==========================================
const countdown = new CountdownDisplay();
let lastTime = null;

function animate(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.max(0.5, Math.min(3, (timestamp - lastTime) / 16.67)); // clamp to avoid spikes
    lastTime = timestamp;

    // Update FPS and check quality
    updateFPS(timestamp);
    checkQualityAdjustment(timestamp);

    countdown.update(dt);
    countdown.draw();
    requestAnimationFrame(animate);
}

// Start animation
requestAnimationFrame(animate);

// Start Supabase tracking when page loads
window.addEventListener('load', initSupabaseTracking);

// ==========================================
// STATS PANEL (totals from all users)
// ==========================================
const statTimeEl = document.getElementById('stat-time');
const statShotsEl = document.getElementById('stat-shots');
const statCostEl = document.getElementById('stat-cost');
const statVisitorsEl = document.getElementById('stat-visitors');
const statsToggleBtn = document.getElementById('statsToggle');
const qualityToggleBtn = document.getElementById('qualityToggle');
const statsPanel = document.getElementById('statsPanel');
const statsContent = document.getElementById('statsContent');
const qualityContent = document.getElementById('qualityContent');

function formatSecondsToHMS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${ss}`;
}

async function fetchAggregateStats() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_TABLE)
            .select('seconds, shots');
        
        if (error) {
            console.warn('Fetch stats error:', error.message);
            return;
        }
        
        const totalSeconds = data.reduce((sum, row) => sum + (row.seconds || 0), 0);
        const totalShots = data.reduce((sum, row) => sum + (row.shots || 0), 0);
        const totalVisitors = data.length;
        
        const timeString = formatSecondsToHMS(totalSeconds);
        if (statTimeEl) statTimeEl.textContent = timeString;
        
        // Update mini time display in header
        updateMiniTime();
        
        if (statShotsEl) statShotsEl.textContent = totalShots;
        if (statCostEl) statCostEl.textContent = (totalShots * COST_PER_SHOT).toFixed(2);
        if (statVisitorsEl) statVisitorsEl.textContent = totalVisitors;
    } catch (err) {
        console.warn('Aggregate stats error:', err);
    }
}

// Update mini time display with current local time
function updateMiniTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const miniTimeEl = document.getElementById('stat-mini-time');
    if (miniTimeEl) miniTimeEl.textContent = `${hours}:${minutes}:${seconds}`;
}

// Update mini time every second
setInterval(updateMiniTime, 1000);
updateMiniTime();

// Toggle stats panel collapsed/expanded
if (statsToggleBtn && statsPanel) {
    statsToggleBtn.addEventListener('click', () => {
        const wasCollapsed = statsPanel.classList.contains('collapsed');
        statsPanel.classList.toggle('collapsed');
        
        // Hide quality content when opening stats
        if (!wasCollapsed) {
            qualityContent.style.display = 'none';
            statsContent.style.display = 'flex';
        } else {
            fetchAggregateStats();
        }
    });
}

// Toggle quality settings
if (qualityToggleBtn && qualityContent) {
    qualityToggleBtn.addEventListener('click', () => {
        const isQualityVisible = qualityContent.style.display !== 'none';
        
        if (isQualityVisible) {
            qualityContent.style.display = 'none';
            statsContent.style.display = 'flex';
        } else {
            statsPanel.classList.remove('collapsed');
            statsContent.style.display = 'none';
            qualityContent.style.display = 'flex';
        }
    });
}

// Quality mode radio buttons
const qualityModeRadios = document.querySelectorAll('input[name="quality-mode"]');
const qualityLevelRadios = document.querySelectorAll('input[name="quality-level"]');
const qualityLevelsDiv = document.getElementById('quality-levels');

qualityModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'manual') {
            qualityLevelsDiv.style.display = 'block';
            qualityMode = 'manual';
            // Set to current quality level
            qualityLevelRadios.forEach(radio => {
                if (parseInt(radio.value) === currentQuality) {
                    radio.checked = true;
                }
            });
        } else {
            qualityLevelsDiv.style.display = 'none';
            qualityMode = 'auto';
        }
    });
});

qualityLevelRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (qualityMode === 'manual') {
            currentQuality = parseInt(e.target.value);
            updateQualityDisplay();
            updateStarAnimation();
        }
    });
});

// Update quality display
function updateQualityDisplay() {
    const currentQualityEl = document.getElementById('current-quality');
    if (currentQualityEl) currentQualityEl.textContent = currentQuality;
    
    const currentFpsEl = document.getElementById('current-fps');
    if (currentFpsEl) currentFpsEl.textContent = currentFPS;
}

// Update every second instead of 100ms
setInterval(updateQualityDisplay, 1000);

// Star animation control based on quality
function updateStarAnimation() {
    if (currentQuality === 1) {
        // Mode 1: Stars static
        document.body.classList.add('stars-static');
    } else {
        // Mode 2+: Stars moving
        document.body.classList.remove('stars-static');
    }
}

// Auto-refresh stats every 5 seconds when panel is open
setInterval(() => {
    if (statsPanel && !statsPanel.classList.contains('collapsed') && statsContent.style.display !== 'none') {
        fetchAggregateStats();
    }
}, 5000);

// First load after 2 seconds
setTimeout(fetchAggregateStats, 2000);

// ==========================================
// EXTRA INTERACTIVE FEATURES
// ==========================================

// Click for extra fireworks (count as shot)
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    fireworkShots += 1; // Count user click as a shot
    const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const color = scheme[Math.floor(Math.random() * scheme.length)];
        countdown.fireworks.push(new FireworkParticle(x, y, color));
    }
});

// Background fireworks (count as shot)
fireworksCanvas.addEventListener('click', (e) => {
    fireworkShots += 1; // Count user click as a shot
    const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
        const color = scheme[Math.floor(Math.random() * scheme.length)];
        countdown.fireworks.push(new FireworkParticle(e.clientX, e.clientY, color));
    }
});

// Initialize star animation on page load
updateStarAnimation();

console.log('🎆 Countdown to New Year 2026 started! 🎆');
console.log('💡 Tip: Click anywhere on the screen for extra fireworks!');
