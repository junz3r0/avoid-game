const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const timerDisplay = document.getElementById('timer');
const finalTimeDisplay = document.getElementById('final-time');

// ----------------------------------------------------
// 1. 게임 변수 설정 및 이미지 로드
// ----------------------------------------------------
let isPlaying = false;
let startTime;
let animationFrameId;

// 플레이어 (키티) 설정
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    speed: 6, 
    dx: 0,
    dy: 0,
    // ⭐️⭐️⭐️ 키티의 실제 충돌 판정 영역 (이미지보다 작게) ⭐️⭐️⭐️
    hitboxWidth: 40, 
    hitboxHeight: 40
};

// 장애물 (shit.png) 설정
let obstacles = [];
let obstacleSpeed = 3.5; 
// ⭐️⭐️⭐️ 생성 빈도 감소 (60 -> 120, 약 절반 수준으로 감소) ⭐️⭐️⭐️
let obstacleSpawnRate = 120; 

// 한 번에 생성되는 개수는 1개 ~ 최대 3개로 유지
const MAX_SPAWN_COUNT = 3; 
// ⭐️⭐️⭐️ 똥 이미지의 실제 충돌 판정 영역 (이미지보다 작게) ⭐️⭐️⭐️
const OBSTACLE_HITBOX_SIZE = 20; // 이미지 크기 30x30인데 판정은 20x20

// 키티 벌 이미지 로드
const playerImage = new Image();
playerImage.src = 'cat.png'; 

// 💩 shit.png 이미지 로드
const obstacleImage = new Image();
obstacleImage.src = 'shit.png'; 

// ----------------------------------------------------
// 2. 게임 함수
// ----------------------------------------------------

function startGame() {
    isPlaying = true;
    startTime = Date.now();
    obstacles = [];
    gameOverScreen.classList.add('hidden');
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.dx = 0;
    player.dy = 0;

    obstacleSpeed = 3.5; 
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function drawPlayer() {
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    } else {
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    }
    // ❗️ 디버깅용: 플레이어 히트박스 시각화 (게임 완성 후 삭제)
    // ctx.strokeStyle = 'lime';
    // ctx.strokeRect(player.x - player.hitboxWidth / 2, player.y - player.hitboxHeight / 2, player.hitboxWidth, player.hitboxHeight);
}

// 장애물 생성
function spawnObstacle() {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    obstacleSpeed = 3.5 + Math.floor(elapsedSeconds / 3) * 0.8; 

    if (Math.random() < 1 / obstacleSpawnRate) {
        const spawnCount = Math.floor(Math.random() * MAX_SPAWN_COUNT) + 1; 
        
        for (let i = 0; i < spawnCount; i++) {
            const size = 30; // 이미지 크기 고정
            
            const x = Math.random() * canvas.width; 
            
            obstacles.push({
                x: x,
                y: -size,
                size: size, // 이미지 그릴 때 사용
                width: 30, 
                height: 30,
                // ⭐️⭐️⭐️ 똥의 실제 충돌 판정 크기 ⭐️⭐️⭐️
                hitboxSize: OBSTACLE_HITBOX_SIZE
            });
        }
    }
}

// 장애물 이동 및 그리기
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obstacleSpeed; 
        
        if (obstacleImage.complete) {
            ctx.drawImage(obstacleImage, obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
        }

        // ❗️ 디버깅용: 장애물 히트박스 시각화 (게임 완성 후 삭제)
        // ctx.strokeStyle = 'yellow';
        // ctx.strokeRect(obs.x - obs.hitboxSize / 2, obs.y - obs.hitboxSize / 2, obs.hitboxSize, obs.hitboxSize);


        if (obs.y > canvas.height + obs.height) {
            obstacles.splice(i, 1);
        }
    }
}

// 충돌 감지 (사각형 충돌 - 히트박스 사용)
function checkCollision() {
    for (const obs of obstacles) {
        // ⭐️⭐️⭐️ 히트박스 영역을 계산 ⭐️⭐️⭐️
        const playerHitboxLeft = player.x - player.hitboxWidth / 2;
        const playerHitboxRight = player.x + player.hitboxWidth / 2;
        const playerHitboxTop = player.y - player.hitboxHeight / 2;
        const playerHitboxBottom = player.y + player.hitboxHeight / 2;

        const obstacleHitboxLeft = obs.x - obs.hitboxSize / 2;
        const obstacleHitboxRight = obs.x + obs.hitboxSize / 2;
        const obstacleHitboxTop = obs.y - obs.hitboxSize / 2;
        const obstacleHitboxBottom = obs.y + obs.hitboxSize / 2;

        // AABB 충돌 감지
        if (
            playerHitboxLeft < obstacleHitboxRight &&
            playerHitboxRight > obstacleHitboxLeft &&
            playerHitboxTop < obstacleHitboxBottom &&
            playerHitboxBottom > obstacleHitboxTop
        ) {
            endGame();
            return true;
        }
    }
    return false;
}

function endGame() {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    finalTimeDisplay.textContent = finalTime;
    gameOverScreen.classList.remove('hidden');
}

function updatePlayer() {
    player.x += player.dx;
    player.y += player.dy;

    // 경계 처리 (히트박스 기준으로)
    if (player.x < player.hitboxWidth / 2) player.x = player.hitboxWidth / 2;
    if (player.x > canvas.width - player.hitboxWidth / 2) player.x = canvas.width - player.hitboxWidth / 2;
    if (player.y < player.hitboxHeight / 2) player.y = player.hitboxHeight / 2;
    if (player.y > canvas.height - player.hitboxHeight / 2) player.y = canvas.height - player.hitboxHeight / 2;
}

function updateTimer() {
    if (isPlaying) {
        const currentTime = ((Date.now() - startTime) / 1000).toFixed(2);
        timerDisplay.textContent = `시간: ${currentTime}초`;
    }
}

function gameLoop() {
    if (!isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    spawnObstacle();
    updateObstacles();
    updateTimer();
    
    if (checkCollision()) return;

    drawPlayer();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// ----------------------------------------------------
// 3. 이벤트 리스너 (키보드 및 버튼)
// ----------------------------------------------------
const keyMap = {}; 

document.addEventListener('keydown', (e) => {
    keyMap[e.key] = true;
    updateMovement();
});

document.addEventListener('keyup', (e) => {
    keyMap[e.key] = false;
    updateMovement();
});

function updateMovement() {
    player.dx = 0;
    player.dy = 0;

    if (keyMap['ArrowLeft'] || keyMap['a']) {
        player.dx = -player.speed;
    }
    if (keyMap['ArrowRight'] || keyMap['d']) {
        player.dx = player.speed;
    }
    if (keyMap['ArrowUp'] || keyMap['w']) {
        player.dy = -player.speed;
    }
    if (keyMap['ArrowDown'] || keyMap['s']) {
        player.dy = player.speed;
    }
    if (player.dx !== 0 && player.dy !== 0) {
        player.dx *= 0.707;
        player.dy *= 0.707;
    }
}

restartButton.addEventListener('click', startGame);

window.onload = () => {
    let imagesLoaded = 0;
    const totalImages = 2;
    
    const imageLoadHandler = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            startGame();
        }
    };
    
    playerImage.onload = imageLoadHandler;
    obstacleImage.onload = imageLoadHandler;

    if (playerImage.complete) imageLoadHandler();
    if (obstacleImage.complete) imageLoadHandler();
}
