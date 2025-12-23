// ==========================================
// 🎆 PIXEL ART COUNTDOWN NAAR NIEUWJAAR 🎆
// ==========================================

// Canvas setup
const canvas = document.getElementById('countdownCanvas');
const ctx = canvas.getContext('2d');
const fireworksCanvas = document.getElementById('fireworksCanvas');
const fireworksCtx = fireworksCanvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 1400);
    canvas.width = maxWidth;
    canvas.height = maxWidth * 0.35;
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
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

// Langzaam veranderende kleuren voor dagen, uren en colons
let slowColorHue = 0;
const SLOW_COLOR_SPEED = 0.001; // 20x langzamer

function getSlowChangingColorWithVariance() {
    slowColorHue = (slowColorHue + SLOW_COLOR_SPEED) % 360;
    const jitter = (Math.random() * 12) - 6; // per pixel kleine variatie
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
            // Simple scale-up arrival like before
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
            this.vy += 0.2 * dt; // Langzamer voor minder hoogte
            this.rotation += this.rotationSpeed * dt;
            
            // Stretch effect while launching
            this.scale = 1 + Math.abs(this.vy) * 0.08;

            // Explode when it slows down (reaches peak)
            if (this.vy > -2) { 
                this.explode();
            }
        } else if (this.state === 'exploding') {
            // Add trail
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha, size: this.size * this.scale });
            if (this.trail.length > 12) this.trail.shift();
            
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 0.22 * dt; // Gravity iets zachter
            this.vx *= Math.pow(0.985, dt); // Minder afremmen
            this.rotation += this.rotationSpeed * dt;
            this.alpha -= 0.01 * dt; // Langzamer vervagen voor langer zichtbaar effect
            this.scale *= Math.pow(0.985, dt);
        }
        
        // Update trail fade
        this.trail.forEach(t => t.alpha *= Math.pow(0.85, dt));
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
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 7; // Nog zachter
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 3;
        this.rotationSpeed = (Math.random() - 0.5) * 0.6;
        this.scale = 1.3; // Iets groter bij start
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
        } else {
            // Subtle pulse glow when stable
            const pulse = Math.sin(this.sparkleTimer) * 0.3 + 0.7;
            ctx.shadowBlur = 5 * pulse;
            ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        const s = this.size;
        ctx.fillRect(-s/2, -s/2, s, s);

        ctx.restore();
    }

    // Draw on fireworks canvas (for launching/exploding pixels)
    drawOnFireworks(ctx, offsetX, offsetY) {
        if (this.alpha <= 0) return;
        if (this.state !== 'launching' && this.state !== 'exploding') return;

        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        // Draw trail first
        this.trail.forEach((t, i) => {
            const trailX = t.x + offsetX;
            const trailY = t.y + offsetY;
            const trailAlpha = t.alpha * (i / this.trail.length) * 0.6;
            const trailSize = t.size * (i / this.trail.length);
            
            ctx.save();
            ctx.globalAlpha = trailAlpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            // Use squares for trail
            ctx.fillRect(trailX - trailSize/2, trailY - trailSize/2, trailSize, trailSize);
            ctx.restore();
        });

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        // Stretch vertically if launching
        if (this.state === 'launching') {
            ctx.scale(this.scale * 0.6, this.scale * 1.8);
        } else {
            ctx.scale(this.scale, this.scale);
        }
        
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        const s = this.size;
        ctx.fillRect(-s/2, -s/2, s, s);

        // Add sparkle/glow ring when exploding
        if (this.state === 'exploding' && this.alpha > 0.5) {
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    isAlive() {
        return this.alpha > 0;
    }
}

// ==========================================
// FIREWORK ROCKET CLASS (vuurpijl die omhoog gaat en explodeert)
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
    }

    update(dt = 1) {
        if (!this.exploded) {
            // Voeg trail toe
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 15) this.trail.shift();
            
            // Beweeg omhoog
            this.y -= this.speed * dt;
            
            // Explodeer als we target bereiken
            if (this.y <= this.targetY) {
                this.explode();
            }
        }
        
        // Update trail fade
        this.trail.forEach(t => t.alpha *= Math.pow(0.9, dt));
        this.trail = this.trail.filter(t => t.alpha > 0.05);
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.08 * dt;
            p.alpha -= 0.015 * dt;
            p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
            if (p.trail.length > 8) p.trail.shift();
            return p.alpha > 0;
        });
    }

    explode() {
        this.exploded = true;
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
        this.trail.forEach((t, i) => {
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.7;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            const size = 3 * (i / this.trail.length);
            ctx.fillRect(t.x - size/2, t.y - size/2, size, size * 3);
            ctx.restore();
        });

        // Draw rocket head als niet geexplodeerd
        if (!this.exploded) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw explosion particles
        this.particles.forEach(p => {
            // Trail
            p.trail.forEach((t, i) => {
                ctx.save();
                ctx.globalAlpha = t.alpha * (i / p.trail.length) * 0.5;
                ctx.fillStyle = p.color;
                ctx.fillRect(t.x - p.size/2, t.y - p.size/2, p.size, p.size);
                ctx.restore();
            });
            
            // Particle
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            ctx.restore();
        });
    }

    isAlive() {
        return !this.exploded || this.particles.length > 0;
    }
}

// ==========================================
// FIREWORK PARTICLE CLASS
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
    }

    update(dt = 1) {
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.05 * dt;
        this.vx *= Math.pow(0.985, dt);
        this.alpha -= 0.02 * dt;
    }

    draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = t.alpha * (i / this.trail.length) * 0.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            const trailSize = this.size * (i / this.trail.length);
            ctx.fillRect(t.x - trailSize/2, t.y - trailSize/2, trailSize, trailSize);
        }

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    isAlive() {
        return this.alpha > 0;
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
        
        this.topOffset = Math.max(10, canvas.height * 0.08);
        this.bottomMargin = Math.max(10, canvas.height * 0.10);
        // duw cijfers iets omlaag (1/3 van de oorspronkelijke ruimte tussen titel en labels)
        this.topOffset += canvas.height * 0.05;
        
        const heightAvailable = canvas.height - this.topOffset - this.bottomMargin;
        const maxPixelByHeight = Math.floor((heightAvailable - (rows - 1) * spacing) / rows);
        
        // Bereken breedte afhankelijk van displayMode
        let numChars = 11; // DD:HH:MM:SS
        if (this.displayMode === 'no-days') numChars = 8; // HH:MM:SS
        else if (this.displayMode === 'no-hours') numChars = 5; // MM:SS
        else if (this.displayMode === 'only-seconds') numChars = 2; // SS
        
        const availableWidth = canvas.width - 40;
        
        // Grotere pixels als er minder cijfers zijn
        let scaleFactor = 1;
        if (this.displayMode === 'no-days') scaleFactor = 1.3;
        else if (this.displayMode === 'no-hours') scaleFactor = 1.8;
        else if (this.displayMode === 'only-seconds') scaleFactor = 2.5;
        
        const basePixelSize = Math.floor((availableWidth - 55) / 81);
        const maxPixelByWidth = Math.max(6, basePixelSize * scaleFactor);
        
        this.pixelSize = Math.floor(Math.min(maxPixelByWidth, maxPixelByHeight * scaleFactor));
        this.pixelSize = Math.min(this.pixelSize, 35);
        this.pixelSize = Math.max(this.pixelSize, 6);

        this.spacing = spacing;
        this.digitSpacing = this.pixelSize * 2;
        this.sectionSpacing = this.pixelSize * 4;
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
        // Bepaal displayMode
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
        // Alleen de dubbele punten krijgen de langzame kleurwisseling
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
        
        // Herbereken sizes als displayMode verandert
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
            
            this.pixels.forEach(p => {
                if (p.state === 'stable' && !changedPositions.includes(p.charIndex)) {
                    mergedPixels.push(p);
                }
            });

            allNewPixels.forEach(p => {
                if (changedPositions.includes(p.charIndex) || this.currentTimeString === '') {
                    mergedPixels.push(p);
                }
            });
            
            if (this.currentTimeString === '') {
                this.pixels = allNewPixels;
                this.pixels.forEach(p => {
                    p.state = 'stable';
                    p.scale = 1;
                    p.arrivalProgress = 1;
                });
            } else {
                this.pixels = mergedPixels;
            }

            this.currentTimeString = newTimeString;

            // Voeg vuurpijl-raket toe die omhoog gaat en explodeert
            this.addFireworkRocket();
        }

        this.pixels.forEach(pixel => {
            pixel.update(dt);
            if (pixel.isSlowColor && pixel.state === 'stable') {
                pixel.color = getSlowChangingColorWithVariance();
            }
        });

        this.explodingPixels = this.explodingPixels.filter(pixel => {
            pixel.update(dt);
            return pixel.isAlive();
        });

        this.fireworks = this.fireworks.filter(particle => {
            particle.update(dt);
            return particle.isAlive();
        });

        this.rockets = this.rockets.filter(rocket => {
            rocket.update(dt);
            return rocket.isAlive();
        });
    }

    explodePixelsAtPositions(positions) {
        const canvasRect = canvas.getBoundingClientRect();
        const g = 0.33;

        const charMinY = {};
        const charRot = {};
        this.pixels.forEach(p => {
            if (!positions.includes(p.charIndex)) return;
            const screenY = p.y + canvasRect.top + window.scrollY;
            if (charMinY[p.charIndex] === undefined || screenY < charMinY[p.charIndex]) {
                charMinY[p.charIndex] = screenY;
            }
            if (charRot[p.charIndex] === undefined) {
                charRot[p.charIndex] = (Math.random() - 0.5) * 0.18;
            }
        });
        
        const remainingPixels = [];
        
        this.pixels.forEach(pixel => {
            if (positions.includes(pixel.charIndex)) {
                const minY = charMinY[pixel.charIndex] ?? (pixel.y + canvasRect.top + window.scrollY);
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
                
                const burstCount = Math.random() < 0.5 ? 0 : 2 + Math.floor(Math.random() * 2);
                const fxX = pixel.x + canvasRect.left;
                const fxY = pixel.y + canvasRect.top;
                for (let b = 0; b < burstCount; b++) {
                    this.fireworks.push(new FireworkParticle(fxX, fxY, pixel.color));
                }
            } else {
                remainingPixels.push(pixel);
            }
        });
        
        this.pixels = remainingPixels;
    }

    addFireworkRocket() {
        // Voeg een vuurpijl toe die omhoog gaat en explodeert
        const x = Math.random() * fireworksCanvas.width;
        const targetY = 50 + Math.random() * (fireworksCanvas.height * 0.4);
        const color = this.getRandomColor();
        this.rockets.push(new FireworkRocket(x, targetY, color));
    }

    createMassiveFireworks() {
        // Enorm vuurwerk voor nieuwjaar
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const x = Math.random() * fireworksCanvas.width;
                const targetY = 50 + Math.random() * (fireworksCanvas.height * 0.5);
                const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
                const color = scheme[Math.floor(Math.random() * scheme.length)];
                this.rockets.push(new FireworkRocket(x, targetY, color));
            }, i * 150);
        }
        
        // Extra explosies
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const x = Math.random() * fireworksCanvas.width;
                const y = Math.random() * fireworksCanvas.height * 0.5;
                const schemeIndex = Math.floor(Math.random() * COLOR_SCHEMES.length);
                const scheme = COLOR_SCHEMES[schemeIndex];

                for (let j = 0; j < 100; j++) {
                    const color = scheme[Math.floor(Math.random() * scheme.length)];
                    this.fireworks.push(new FireworkParticle(x, y, color));
                }
            }, i * 200);
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

        const canvasRect = canvas.getBoundingClientRect();
        const offsetX = canvasRect.left + window.scrollX;
        const offsetY = canvasRect.top + window.scrollY;

        this.pixels.forEach(pixel => pixel.draw(ctx));
        this.explodingPixels.forEach(pixel => pixel.drawOnFireworks(fireworksCtx, offsetX, offsetY));
        this.fireworks.forEach(particle => particle.draw(fireworksCtx));
        this.rockets.forEach(rocket => rocket.draw(fireworksCtx));
    }
}

// ==========================================
// ANIMATIE LOOP
// ==========================================
const countdown = new CountdownDisplay();
let lastTime = null;

function animate(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.max(0.5, Math.min(3, (timestamp - lastTime) / 16.67)); // clamp to avoid spikes
    lastTime = timestamp;

    countdown.update(dt);
    countdown.draw();
    requestAnimationFrame(animate);
}

// Start de animatie
requestAnimationFrame(animate);

// ==========================================
// EXTRA INTERACTIEVE FEATURES
// ==========================================

// Klik voor extra vuurwerk
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
    for (let i = 0; i < 50; i++) {
        const color = scheme[Math.floor(Math.random() * scheme.length)];
        countdown.fireworks.push(new FireworkParticle(x, y, color));
    }
});

// Achtergrond vuurwerk
fireworksCanvas.addEventListener('click', (e) => {
    const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
    for (let i = 0; i < 80; i++) {
        const color = scheme[Math.floor(Math.random() * scheme.length)];
        countdown.fireworks.push(new FireworkParticle(e.clientX, e.clientY, color));
    }
});

console.log('🎆 Countdown to New Year 2026 started! 🎆');
console.log('💡 Tip: Click anywhere on the screen for extra fireworks!');
