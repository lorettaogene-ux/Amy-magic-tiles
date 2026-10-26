// Amy Magic Tiles - Christmas Edition Engine

// Audio Synthesizer for Musical Christmas Notes
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Frequency table for Christmas melodies
const NOTE_FREQ = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

// Christmas Songs Note Sequences
const SONGS = {
    jingle: {
        title: "Jingle Bells",
        notes: [
            'E4','E4','E4', 'E4','E4','E4', 'E4','G4','C4','D4','E4',
            'F4','F4','F4','F4','F4','E4','E4','E4','E4','D4','D4','E4','D4','G4',
            'E4','E4','E4', 'E4','E4','E4', 'E4','G4','C4','D4','E4',
            'F4','F4','F4','F4','F4','E4','E4','E4','G4','G4','F4','D4','C4'
        ]
    },
    wish: {
        title: "We Wish You a Merry Christmas",
        notes: [
            'D4','G4','G4','A4','G4','F4','E4','E4',
            'E4','A4','A4','B4','A4','G4','F4','D4',
            'D4','B4','B4','C5','B4','A4','G4','E4',
            'D4','D4','E4','A4','F4','G4'
        ]
    },
    silent: {
        title: "Silent Night",
        notes: [
            'G4','A4','G4','E4', 'G4','A4','G4','E4',
            'D5','D5','B4', 'C5','C5','G4',
            'A4','A4','C5','B4','A4','G4','A4','G4','E4',
            'D5','D5','F5','D5','B4','C5','E5',
            'C5','G4','E4','G4','F4','D4','C4'
        ]
    }
};

let currentSongKey = "jingle";
let noteIndex = 0;
let score = 0;
let isPlaying = false;
let spawnTimer = null;
let activeTiles = [];
let tileSpeed = 4.2; // Speed of falling tiles

// Play synthesizer chime note for tapped tile
function playNoteSound(noteName) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const freq = NOTE_FREQ[noteName] || 440;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle'; // Sweet chime/bell sound
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

// Play incorrect sound on miss
function playMissSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// DOM Elements
const startOverlay = document.getElementById("start-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");
const songSelect = document.getElementById("song-select");
const scoreDisplay = document.getElementById("score-value");
const finalScoreDisplay = document.getElementById("final-score-value");
const songTitleDisplay = document.getElementById("song-title-display");
const lanes = document.querySelectorAll(".lane");

// Spawn new magic tile in a random lane
function spawnTile() {
    if (!isPlaying) return;

    const song = SONGS[currentSongKey];
    const currentNote = song.notes[noteIndex % song.notes.length];
    noteIndex++;

    const laneIdx = Math.floor(Math.random() * 4);
    const lane = lanes[laneIdx];

    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.note = currentNote;
    tile.dataset.y = -130;
    tile.style.top = `-130px`;

    // Tap Event
    const handleTap = (e) => {
        e.stopPropagation();
        if (!isPlaying || tile.classList.contains("tile-tap-glow")) return;

        // Visual Pink & White Neon Glow effect
        tile.classList.add("tile-tap-glow");
        
        // Play Chime Note
        playNoteSound(tile.dataset.note);

        // Increase Score & Speed up gradually
        score += 10;
        scoreDisplay.textContent = score;
        tileSpeed += 0.03;

        // Remove tile after burst
        setTimeout(() => {
            if (tile.parentNode) {
                tile.parentNode.removeChild(tile);
            }
            activeTiles = activeTiles.filter(t => t.el !== tile);
        }, 180);
    };

    tile.addEventListener("touchstart", handleTap, { passive: true });
    tile.addEventListener("mousedown", handleTap);

    lane.appendChild(tile);
    activeTiles.push({ el: tile, lane: laneIdx, y: -130 });
}

// Main Game Loop (Tile Physics & Hit Verification)
function gameLoop() {
    if (!isPlaying) return;

    const containerHeight = document.getElementById("lanes-container").clientHeight;

    for (let i = activeTiles.length - 1; i >= 0; i--) {
        const item = activeTiles[i];
        item.y += tileSpeed;
        item.el.style.top = `${item.y}px`;

        // Check if tile fell off the bottom screen (Missed)
        if (item.y > containerHeight - 100 && !item.el.classList.contains("tile-tap-glow")) {
            item.el.classList.add("tile-missed");
            triggerGameOver();
            return;
        }
    }

    requestAnimationFrame(gameLoop);
}

// Start Game
function startGame() {
    currentSongKey = songSelect.value;
    songTitleDisplay.textContent = SONGS[currentSongKey].title;
    
    score = 0;
    noteIndex = 0;
    tileSpeed = 4.0;
    scoreDisplay.textContent = "0";

    // Clear old tiles
    document.querySelectorAll(".tile").forEach(t => t.remove());
    activeTiles = [];

    isPlaying = true;
    startOverlay.classList.add("hidden");
    gameoverOverlay.classList.add("hidden");

    // Spawn tiles every interval
    clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnTile, 650);

    requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    isPlaying = false;
    clearInterval(spawnTimer);
    playMissSound();

    finalScoreDisplay.textContent = score;
    gameoverOverlay.classList.remove("hidden");
}

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
menuBtn.addEventListener("click", () => {
    gameoverOverlay.classList.add("hidden");
    startOverlay.classList.remove("hidden");
});
