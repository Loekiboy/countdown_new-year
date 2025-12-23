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
    const maxWidth = Math.min(window.innerWidth - 40, 1000);
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
    // Vuur kleuren
    ['#ff6b35', '#ff8c42', '#ffd166', '#ffee93'],
    // Neon kleuren
    ['#00ffff', '#00ff88', '#88ff00', '#ffff00'],
    // Paars/roze
    ['#ff006e', '#fb5607', '#ffbe0b', '#ff006e'],
    // Blauw/groen
    ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
    // Goud/rood
    ['#ffd700', '#ff6b6b', '#ff8e53', '#fee440'],
    // Rainbow
    ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff']
];

// ==========================================
// PIXEL SHAPES
// ==========================================
// Removed shapes to enforce pixel grid look

// ==========================================
// PIXEL CLASS
// ==========================================
class Pixel {
    constructor(x, y, targetX, targetY, color, size) {
        this.x = targetX; // Start at target position
        this.y = targetY; // Start at target position
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.size = size;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.scale = 0; // Start invisible/small
        this.alpha = 1;
        this.state = 'arriving'; // arriving, stable, exploding
        this.arrivalProgress = 0;
    }

    update() {
        if (this.state === 'arriving') {
            this.arrivalProgress += 0.1; // Faster arrival
            if (this.arrivalProgress >= 1) {
                this.arrivalProgress = 1;
                this.state = 'stable';
                this.scale = 1;
            } else {
                // Simple scale up effect for arrival
                this.scale = this.arrivalProgress;
            }
        } else if (this.state === 'stable') {
            this.x = this.targetX;
            this.y = this.targetY;
            this.scale = 1;
            this.rotation = 0;
        } else if (this.state === 'exploding') {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.5; // Heavier gravity
            this.vx *= 0.95;
            this.rotation += this.rotationSpeed;
            this.alpha -= 0.02;
            this.scale *= 0.95;
        }
    }

    explode() {
        this.state = 'exploding';
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8; // Random explosion speed
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    draw(ctx) {
        if (this.alpha <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Only rotate if exploding
        if (this.state === 'exploding') {
            ctx.rotate(this.rotation);
        }
        
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.alpha;

        // Sharp pixels, no shadow for the grid itself to keep it clean
        if (this.state === 'exploding') {
             ctx.shadowBlur = 10;
             ctx.shadowColor = this.color;
        } else {
             ctx.shadowBlur = 0;
        }

        ctx.fillStyle = this.color;

        // Always draw a square for the pixel look
        const s = this.size;
        // Draw from center
        ctx.fillRect(-s/2, -s/2, s, s);

        ctx.restore();
    }

    isAlive() {
        return this.alpha > 0;
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

    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > 10) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;
        this.vx *= 0.99;
        this.alpha -= 0.015;
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = t.alpha * (i / this.trail.length) * 0.5;
            ctx.fill();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
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
        this.currentTimeString = '';
        this.colorSchemeIndex = 0;
        this.lastSecond = -1;

        // Bereken pixel grootte gebaseerd op canvas
        this.calculateSizes();
    }

    calculateSizes() {
        // Elke tijd sectie: DD:HH:MM:SS = 8 cijfers + 3 dubbele punten
        // Elke cijfer is 5 breed, dubbele punt is 3 breed
        // Totale breedte: 8*5 + 3*3 + spacing = 40 + 9 + spacing
        const totalUnits = 11; // 8 digits + 3 colons
        const spacing = 1; // Tighter spacing for grid look
        const digitWidth = 5;
        const availableWidth = canvas.width - 40; // Less padding

        // Calculate size to fit width
        this.pixelSize = Math.floor(availableWidth / (totalUnits * digitWidth + totalUnits * spacing * 5)); // Approximate
        
        // Recalculate based on exact grid math
        // Total width = (8 digits * 5 cols) + (3 colons * 1 col) + spacings
        // Actually colons are 1 wide in my pattern? No, they are 5 wide in the pattern definition but only center has pixels.
        // Let's assume standard 5 width for all chars for simplicity in grid calculation
        
        const totalCols = (8 * 5) + (3 * 5) + (10 * 2); // Digits + Colons + Spacing between chars
        this.pixelSize = Math.floor(availableWidth / totalCols);
        
        this.pixelSize = Math.min(this.pixelSize, 14);
        this.pixelSize = Math.max(this.pixelSize, 4);

        this.spacing = 1; // 1px gap between pixels
        this.digitSpacing = this.pixelSize * 2;
        this.sectionSpacing = this.pixelSize * 4;
    }

    getTimeUntilNewYear() {
        const now = new Date();
        const newYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
        
        // Check if we're already past new year
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
        const d = String(time.days).padStart(2, '0');
        const h = String(time.hours).padStart(2, '0');
        const m = String(time.minutes).padStart(2, '0');
        const s = String(time.seconds).padStart(2, '0');
        return `${d}:${h}:${m}:${s}`;
    }

    getRandomColor() {
        const scheme = COLOR_SCHEMES[this.colorSchemeIndex];
        return scheme[Math.floor(Math.random() * scheme.length)];
    }

    createPixelsForString(timeString) {
        const newPixels = [];
        let xOffset = 20;

        for (let charIndex = 0; charIndex < timeString.length; charIndex++) {
            const char = timeString[charIndex];
            const pattern = DIGIT_PATTERNS[char];

            if (!pattern) continue;

            // Pick a random color scheme for this specific digit/character
            const charScheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];

            for (let row = 0; row < pattern.length; row++) {
                for (let col = 0; col < pattern[row].length; col++) {
                    if (pattern[row][col] === 1) {
                        const targetX = xOffset + col * (this.pixelSize + this.spacing);
                        const targetY = 50 + row * (this.pixelSize + this.spacing);

                        // Use color from the specific scheme
                        const color = charScheme[Math.floor(Math.random() * charScheme.length)];

                        const pixel = new Pixel(
                            targetX, // Start at target
                            targetY, // Start at target
                            targetX,
                            targetY,
                            color,
                            this.pixelSize
                        );

                        // Stagger arrival slightly for effect
                        pixel.arrivalProgress = -charIndex * 0.05 - (row + col) * 0.01;
                        
                        // Store which character index this pixel belongs to
                        pixel.charIndex = charIndex;

                        newPixels.push(pixel);
                    }
                }
            }

            // Update x offset
            if (char === ':') {
                xOffset += 3 * (this.pixelSize + this.spacing) + this.sectionSpacing;
            } else {
                xOffset += 5 * (this.pixelSize + this.spacing) + this.digitSpacing;
            }
        }

        return newPixels;
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

    update() {
        this.calculateSizes();

        const time = this.getTimeUntilNewYear();
        
        if (time.isNewYear) {
            document.getElementById('happyNewYear').style.display = 'block';
            this.createMassiveFireworks();
            return;
        }

        const currentSecond = time.seconds;
        const newTimeString = this.formatTime(time);

        // Check if time changed
        if (newTimeString !== this.currentTimeString) {
            const changedPositions = this.findChangedPositions(this.currentTimeString, newTimeString);

            // Wissel kleurenschema elke seconde
            if (currentSecond !== this.lastSecond) {
                this.colorSchemeIndex = (this.colorSchemeIndex + 1) % COLOR_SCHEMES.length;
                this.lastSecond = currentSecond;
            }

            // 1. Identify pixels that need to explode (belong to changed characters)
            if (this.currentTimeString && changedPositions.length > 0) {
                this.explodePixelsAtPositions(changedPositions);
            }

            // 2. Create ALL pixels for the new string
            const allNewPixels = this.createPixelsForString(newTimeString);
            
            // 3. Merge: Keep existing stable pixels for unchanged characters, use new pixels for changed characters
            const mergedPixels = [];
            
            // Add pixels for unchanged characters from current set (if they are stable)
            this.pixels.forEach(p => {
                if (p.state === 'stable' && !changedPositions.includes(p.charIndex)) {
                    // Update position in case of resize (re-calculate target based on current layout logic?)
                    // For simplicity, we'll just assume they are in the right place or will be replaced if we strictly follow the new generation.
                    // Actually, to be safe and handle resizes, it's better to regenerate everything but set state to 'stable' for unchanged ones.
                    // But we don't have easy mapping.
                    // Let's use the 'charIndex' property I added to Pixel.
                    mergedPixels.push(p);
                }
            });

            // Add new pixels for changed characters
            allNewPixels.forEach(p => {
                if (changedPositions.includes(p.charIndex) || this.currentTimeString === '') {
                    mergedPixels.push(p);
                }
            });
            
            // If it's the first run, just use all new pixels
            if (this.currentTimeString === '') {
                this.pixels = allNewPixels;
                // Forceer dat ze er direct staan bij de start zodat je het hele getal ziet
                this.pixels.forEach(p => {
                    p.state = 'stable';
                    p.scale = 1;
                    p.arrivalProgress = 1;
                });
            } else {
                this.pixels = mergedPixels;
            }

            this.currentTimeString = newTimeString;

            // Voeg vuurwerk toe bij elke seconde verandering
            this.addFireworks();
        }

        // Update alle pixels
        this.pixels.forEach(pixel => pixel.update());

        // Update exploding pixels
        this.explodingPixels = this.explodingPixels.filter(pixel => {
            pixel.update();
            return pixel.isAlive();
        });

        // Update fireworks
        this.fireworks = this.fireworks.filter(particle => {
            particle.update();
            return particle.isAlive();
        });
    }

    explodePixelsAtPositions(positions) {
        // Vind pixels die bij de gewijzigde posities horen
        // We filter them OUT of this.pixels and move them to this.explodingPixels
        
        const remainingPixels = [];
        
        this.pixels.forEach(pixel => {
            if (positions.includes(pixel.charIndex)) {
                pixel.explode();
                this.explodingPixels.push(pixel);
            } else {
                remainingPixels.push(pixel);
            }
        });
        
        this.pixels = remainingPixels;
    }

    addFireworks() {
        // Voeg random vuurwerk toe
        // Minder vuurwerk in de achtergrond
        const numFireworks = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numFireworks; i++) {
            const x = Math.random() * fireworksCanvas.width;
            const y = Math.random() * fireworksCanvas.height * 0.6;
            const color = this.getRandomColor();

            for (let j = 0; j < 30; j++) {
                this.fireworks.push(new FireworkParticle(x, y, color));
            }
        }
    }

    createMassiveFireworks() {
        // Mega vuurwerk voor nieuwjaar!
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
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

        // Draw exploding pixels
        this.explodingPixels.forEach(pixel => pixel.draw(ctx));

        // Draw stable pixels
        this.pixels.forEach(pixel => pixel.draw(ctx));

        // Draw fireworks
        this.fireworks.forEach(particle => particle.draw(fireworksCtx));
    }
}

// ==========================================
// ANIMATIE LOOP
// ==========================================
const countdown = new CountdownDisplay();

function animate() {
    countdown.update();
    countdown.draw();
    requestAnimationFrame(animate);
}

// Start de animatie
animate();

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
