// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 900;
const PLAYER_SPEED = 7;
const LASER_SPEED = 10;
const INITIAL_ENEMY_SPEED = 2;
const ENEMY_SPAWN_RATE = 1000;// ms


class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playShoot() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playGameOver() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }
}

// Game Entities
class Player {
    constructor(canvas, image) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.image = image;
        this.width = 60;
        this.height = 60;
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CANVAS_HEIGHT - 100;
        this.speed = PLAYER_SPEED;
        this.invincible = false;
        this.isBigLaser = false;
        this.movingLeft = false;
        this.movingRight = false;
    }

    draw() {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        if (this.invincible) {
            this.ctx.strokeStyle = '#00f2ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 40, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    move(direction) {
        if (direction === 'left' && this.x > 0) {
            this.x -= this.speed;
        } else if (direction === 'right' && this.x < CANVAS_WIDTH - this.width) {
            this.x += this.speed;
        }
    }
}

class Enemy {
    constructor(canvas, images, speed) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        const imgKeys = Object.keys(images);
        this.image = images[imgKeys[Math.floor(Math.random() * imgKeys.length)]];
        this.width = 50;
        this.height = 50;
        this.x = Math.random() * (CANVAS_WIDTH - this.width);
        this.y = -this.height;
        this.speed = speed;
    }

    draw() {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
    }
}

class Laser {
    constructor(canvas, x, y, isBig = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = isBig ? 10 : 4;
        this.height = isBig ? 30 : 20;
        this.x = x - this.width / 2;
        this.y = y;
        this.speed = LASER_SPEED;
        this.isBig = isBig;
    }

    draw() {
        this.ctx.fillStyle = this.isBig ? '#ff00ea' : '#00f2ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        this.ctx.shadowBlur = 0;
    }

    update() {
        this.y -= this.speed;
    }
}

class Particle {
    constructor(canvas, x, y, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    draw() {
        this.ctx.globalAlpha = this.life;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.95;
    }
}

class Star {
    constructor() {
        this.x = Math.random() * CANVAS_WIDTH;
        this.y = Math.random() * CANVAS_HEIGHT;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 3 + 1;
    }

    update() {
        this.y += this.speed;
        if (this.y > CANVAS_HEIGHT) {
            this.y = 0;
            this.x = Math.random() * CANVAS_WIDTH;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game Manager
class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.score = 0;
        this.gameActive = false;
        this.enemySpeed = INITIAL_ENEMY_SPEED;
        this.enemySpawnTimer = 0;
        this.difficultyTimer = 0;
        this.slowmo = false;

        this.entities = {
            player: null,
            enemies: [],
            lasers: [],
            particles: [],
            stars: []
        };

        this.images = {
            player: new Image(),
            enemies: {
                red: new Image(),
                green: new Image()
            }
        };

        this.audio = new AudioSystem();
        this.cheatInput = "";
        this.init();
    }

    async init() {
        this.images.player.onload = () => console.log("Player ship loaded");
        this.images.enemies.red.onload = () => console.log("Red enemy loaded");
        this.images.enemies.green.onload = () => console.log("Green enemy loaded");

        this.images.player.src = "assets/player_ship.png";
        this.images.enemies.red.src = "assets/enemy_ship_red.png";
        this.images.enemies.green.src = "assets/enemy_ship_green.png";

        // Create stars
        for (let i = 0; i < 100; i++) {
            this.entities.stars.push(new Star());
        }

        this.setupEventListeners();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        startBtn.onclick = () => this.startGame();
        restartBtn.onclick = () => this.startGame();

        window.onkeydown = (e) => {
            if (!this.gameActive) return;
            
            if (e.code === 'ArrowLeft') this.entities.player.movingLeft = true;
            if (e.code === 'ArrowRight') this.entities.player.movingRight = true;
            if (e.code === 'Space') this.shoot();

            // Cheat Codes
            this.cheatInput += e.key.toUpperCase();
            this.checkCheats();
        };

        window.onkeyup = (e) => {
            if (e.code === 'ArrowLeft') this.entities.player.movingLeft = false;
            if (e.code === 'ArrowRight') this.entities.player.movingRight = false;
        };
    }

    checkCheats() {
        const cheats = {
            "GODMODE": () => {
                this.entities.player.invincible = true;
                this.showCheatMessage("GOD MODE ACTIVATED");
            },
            "BIGLASER": () => {
                this.entities.player.isBigLaser = true;
                this.showCheatMessage("BIG LASERS ACTIVATED");
            },
            "SLOWMO": () => {
                this.slowmo = true;
                this.showCheatMessage("SLOW MOTION ACTIVATED");
            }
        };

        for (const code in cheats) {
            if (this.cheatInput.includes(code)) {
                cheats[code]();
                this.cheatInput = "";
            }
        }
        if (this.cheatInput.length > 20) this.cheatInput = this.cheatInput.slice(-20);
    }

    showCheatMessage(msg) {
        const indicator = document.getElementById('cheat-indicator');
        indicator.textContent = msg;
        setTimeout(() => indicator.textContent = "", 3000);
    }

    startGame() {
        this.audio.ctx.resume();
        this.score = 0;
        this.enemySpeed = INITIAL_ENEMY_SPEED;
        this.gameActive = true;
        this.slowmo = false;
        this.entities.player = new Player(this.canvas, this.images.player);
        this.entities.enemies = [];
        this.entities.lasers = [];
        this.entities.particles = [];
        
        document.getElementById('ui-overlay').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('score').textContent = '0';
    }

    gameOver() {
        this.gameActive = false;
        this.audio.playGameOver();
        document.getElementById('ui-overlay').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
    }

    shoot() {
        const p = this.entities.player;
        this.entities.lasers.push(new Laser(this.canvas, p.x + p.width / 2, p.y, p.isBigLaser));
        this.audio.playShoot();
    }

    update(dt) {
        if (!this.gameActive) {
            this.entities.stars.forEach(s => s.update());
            return;
        }

        // Difficulty scaling
        this.difficultyTimer += dt;
        if (this.difficultyTimer > 5000) {
            this.enemySpeed += 0.2;
            this.difficultyTimer = 0;
        }

        // Spawn enemies
        this.enemySpawnTimer += dt;
        if (this.enemySpawnTimer > ENEMY_SPAWN_RATE) {
            this.entities.enemies.push(new Enemy(this.canvas, this.images.enemies, this.enemySpeed));
            this.enemySpawnTimer = 0;
        }

        // Player movement
        if (this.entities.player.movingLeft) this.entities.player.move('left');
        if (this.entities.player.movingRight) this.entities.player.move('right');

        // Update stars
        this.entities.stars.forEach(s => s.update());

        // Update enemies
        const currentEnemySpeed = this.slowmo ? this.enemySpeed * 0.5 : this.enemySpeed;
        this.entities.enemies.forEach((e, index) => {
            e.y += currentEnemySpeed;
            if (e.y > CANVAS_HEIGHT) {
                this.entities.enemies.splice(index, 1);
            }

            // Collision with player
            if (!this.entities.player.invincible && this.checkCollision(this.entities.player, e)) {
                this.gameOver();
            }
        });

        // Update lasers
        this.entities.lasers.forEach((l, lIndex) => {
            l.update();
            if (l.y < 0) this.entities.lasers.splice(lIndex, 1);

            // Collision with enemies
            this.entities.enemies.forEach((e, eIndex) => {
                if (this.checkCollision(l, e)) {
                    this.entities.lasers.splice(lIndex, 1);
                    this.entities.enemies.splice(eIndex, 1);
                    this.createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                    this.score += 10;
                    document.getElementById('score').textContent = this.score;
                    this.audio.playExplosion();
                }
            });
        });

        // Update particles
        this.entities.particles.forEach((p, index) => {
            p.update();
            if (p.life <= 0) this.entities.particles.splice(index, 1);
        });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.entities.particles.push(new Particle(this.canvas, x, y, '#ff8000'));
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw stars
        this.entities.stars.forEach(s => s.draw(this.ctx));

        if (this.gameActive) {
            this.entities.player.draw();
            this.entities.enemies.forEach(e => e.draw());
            this.entities.lasers.forEach(l => l.draw());
            this.entities.particles.forEach(p => p.draw());
        }
    }

    gameLoop(timestamp) {
        const dt = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Initialize Game
window.onload = () => {
    new GameManager();
};
