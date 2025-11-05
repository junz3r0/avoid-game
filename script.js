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
    dy: 0  
};

// 장애물 (shit.jpeg) 설정
let obstacles = [];
let obstacleSpeed = 6; 
let obstacleSpawnRate = 100; // 생성 빈도는 유지
const MAX_SPAWN_COUNT = 7; // ⬅️ **핵심 변경: 한 번에 최대 5개까지 생성!**

// 키티 벌 이미지 로드
const playerImage = new Image();
playerImage.src = 'cat.png'; 

// 💩 shit.jpeg 이미지 로드
const obstacleImage = new Image();
obstacleImage.src = 'shit.jpeg'; 

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

    obstacleSpeed = 6; 
    
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
}

// 장애물 생성 (똥 이미지 우르르 생성 로직)
function spawnObstacle() {
    // 3초마다 속도 증가 (난이도 급상승)
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    obstacleSpeed = 6 + Math.floor(elapsedSeconds / 3) * 0.8; 

    if (Math.random() < 1 / obstacleSpawnRate) {
        // ⭐️⭐️⭐️ 이 부분이 중요합니다: 네다섯 개를 한 번에 생성합니다. ⭐️⭐️⭐️
        const spawnCount = Math.floor(Math.random() * (MAX_SPAWN_COUNT - 3 + 1)) + 3; // 3개 ~ 5개 사이 랜덤
        
        for (let i = 0; i < spawnCount; i++) {
            const size = 30; // 크기 고정
            
            // x 위치는 캔버스 전체에서 무작위로 생성
            const x = Math.random() * canvas.width; 
            
            obstacles.push({
                x: x,
                y: -size,
                size: size,
                width: 30, 
                height: 30
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

        if (obs.y > canvas.height + obs.height) {
            obstacles.splice(i, 1);
        }
    }
}

// 충돌 감지 (사각형 충돌)
function checkCollision() {
    for (const obs of obstacles) {
        if (
            player.x - player.width / 2 < obs.x + obs.width / 2 &&
            player.x + player.width / 2 > obs.x - obs.width / 2 &&
            player.y - player.height / 2 < obs.y + obs.height / 2 &&
            player.y + player.height / 2 > obs.y - obs.height / 2
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

    if (player.x < player.width / 2) player.x = player.width / 2;
    if (player.x > canvas.width - player.width / 2) player.x = canvas.width - player.width / 2;
    if (player.y < player.height / 2) player.y = player.height / 2;
    if (player.y > canvas.height - player.height / 2) player.y = canvas.height - player.height / 2;
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
    // 키티 이미지와 장애물 이미지 모두 로드되었을 때 시작
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
