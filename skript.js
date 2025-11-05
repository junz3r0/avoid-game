const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const timerDisplay = document.getElementById('timer');
const finalTimeDisplay = document.getElementById('final-time');

// ----------------------------------------------------
// 1. 게임 변수 설정
// ----------------------------------------------------
let isPlaying = false;
let startTime;
let animationFrameId;

// 플레이어 설정
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50, // 이미지 크기 설정
    height: 50,
    speed: 5,
    dx: 0, // x 이동량
    dy: 0  // y 이동량
};

// 장애물 배열 및 속도 설정
let obstacles = [];
let obstacleSpeed = 2;
let obstacleSpawnRate = 120; // 프레임당 생성 빈도 (낮을수록 자주 생성)

// ❗️❗️❗️ 키티 벌 이미지 로드: 파일명 cat.png로 설정 완료! ❗️❗️❗️
const playerImage = new Image();
playerImage.src = 'cat.png'; 

// ----------------------------------------------------
// 2. 게임 함수
// ----------------------------------------------------

// 게임 시작/초기화
function startGame() {
    isPlaying = true;
    startTime = Date.now();
    obstacles = [];
    gameOverScreen.classList.add('hidden');
    
    // 캐릭터 초기 위치 설정
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.dx = 0;
    player.dy = 0;

    obstacleSpeed = 2; // 난이도 초기화
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

// 플레이어 그리기
function drawPlayer() {
    // 이미지가 로드되었는지 확인 후 그립니다.
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    } else {
        // 이미지 로드 실패 시 디버깅을 위해 임시 빨간 사각형을 그립니다.
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    }
}

// 장애물 생성 (무작위 도형)
function spawnObstacle() {
    // 5초마다 장애물 속도를 조금씩 증가시켜 난이도 높이기
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    obstacleSpeed = 2 + Math.floor(elapsedSeconds / 5) * 0.5;

    if (Math.random() < 1 / obstacleSpawnRate) {
        const size = Math.random() * 20 + 15; // 크기 랜덤
        const x = Math.random() * canvas.width; // x 위치 랜덤
        const color = ['#FF4D4D', '#4D94FF', '#4DFF4D', '#FFFF4D'][Math.floor(Math.random() * 4)]; // 예쁜 색상

        // 떨어지는 장애물 (캔버스 상단에서 시작)
        obstacles.push({
            x: x,
            y: -size,
            size: size,
            color: color
        });
    }
}

// 장애물 이동 및 그리기
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obstacleSpeed; 
        
        // 도형 그리기 (원형 장애물)
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
        ctx.fill();

        // 화면 밖으로 나가면 제거
        if (obs.y > canvas.height + obs.size) {
            obstacles.splice(i, 1);
        }
    }
}

// 충돌 감지 (원과 원의 충돌)
function checkCollision() {
    for (const obs of obstacles) {
        // 플레이어와 장애물 중심 사이의 거리의 제곱
        const distSq = (player.x - obs.x) ** 2 + (player.y - obs.y) ** 2;
        // 충돌 반경 제곱 (플레이어는 대략 원으로 간주)
        const collisionDistSq = (player.width / 2 + obs.size) ** 2; 

        if (distSq < collisionDistSq) {
            endGame();
            return true;
        }
    }
    return false;
}

// 게임 종료
function endGame() {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    finalTimeDisplay.textContent = finalTime;
    gameOverScreen.classList.remove('hidden');
}

// 플레이어 위치 업데이트 (캔버스 경계 제한)
function updatePlayer() {
    player.x += player.dx;
    player.y += player.dy;

    // 경계 처리
    if (player.x < player.width / 2) player.x = player.width / 2;
    if (player.x > canvas.width - player.width / 2) player.x = canvas.width - player.width / 2;
    if (player.y < player.height / 2) player.y = player.height / 2;
    if (player.y > canvas.height - player.height / 2) player.y = canvas.height - player.height / 2;
}

// 타이머 업데이트
function updateTimer() {
    if (isPlaying) {
        const currentTime = ((Date.now() - startTime) / 1000).toFixed(2);
        timerDisplay.textContent = `시간: ${currentTime}초`;
    }
}

// 메인 게임 루프
function gameLoop() {
    if (!isPlaying) return;

    // 1. 화면 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 업데이트
    updatePlayer();
    spawnObstacle();
    updateObstacles();
    updateTimer();
    
    // 3. 충돌 검사
    if (checkCollision()) return;

    // 4. 그리기
    drawPlayer();

    // 5. 다음 프레임 요청
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ----------------------------------------------------
// 3. 이벤트 리스너 (키보드 및 버튼)
// ----------------------------------------------------

// 키 입력 처리
const keyMap = {}; // 현재 눌린 키를 저장

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

    // WASD 또는 화살표 키로 이동
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
    // 대각선 이동 시 속도 보정 (옵션)
    if (player.dx !== 0 && player.dy !== 0) {
        player.dx *= 0.707;
        player.dy *= 0.707;
    }
}

// 다시 시작 버튼 클릭 이벤트
restartButton.addEventListener('click', startGame);

// 게임 시작 (페이지 로드 후)
window.onload = () => {
    // 키티 이미지 로드 확인 후 시작
    playerImage.onload = () => {
        startGame();
    };
    // 이미 로드되었을 경우 바로 시작
    if (playerImage.complete) {
        startGame();
    }
}
