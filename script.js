let scene, camera, renderer;
let basket;
let balls = [];
let score = 0;
let timer = 60;
let lastSpawnTime = 0;
const ballSpawnInterval = 1;
let gravity = 9.8;
let ballFallSpeed = 1.0;
let gui;
const params = {
  gravity: 9.8,
  ballSpeed: 1.0
};

let gameOver = false;
let paused = false;
let gameStarted = false;

let lastTime = 0;

let hudCanvas, hudTexture, hudSprite;

let startButtonSprite, pauseButtonSprite;
let clickableObjects = [];

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

const audio = new Audio('assets/MountainTrials.mp3');
audio.loop = true; 

audio.volume = 0.2;

function handleVisibilityChange() {
    if (document.hidden) {
        audio.pause();
    } else {
        audio.play();
    }
}
function startAudio() {
  audio.play().catch(error => {
      console.log("Erro ao tentar iniciar o áudio:", error);
  });
}

document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener('load', () => {
  audio.play();
});
document.body.addEventListener('click', startAudio);

// Som de impacto
const impactSound = new Audio('assets/cartoon-jump-6462.mp3');
const glassBreakSound = new Audio('assets/breaking-glass-88411.mp3');

// Inicializa a cena e inicia o loop de animação
init();
animate();

function clearLocalStorage() {
  localStorage.clear();
  alert("localStorage limpo!");
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);
  
  // Criação da cesta
  basket = new THREE.Group();
  const basketWidth = 3;
  const basketHeight = 0.5;
  const basketDepth = 3;
  
  // Base da cesta
  const bottomGeometry = new THREE.BoxGeometry(basketWidth, 0.2, basketDepth);
  const bottomMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
  const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
  bottomMesh.position.y = -basketHeight / 2;
  basket.add(bottomMesh);
  
  // Paredes laterais, frontal e traseira
  const wallThickness = 0.2;
  const wallHeight = basketHeight;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
  
  // Parede esquerda
  const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, basketDepth);
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
  leftWall.position.x = -basketWidth / 2 + wallThickness / 2;
  basket.add(leftWall);
  
  // Parede direita
  const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, basketDepth);
  const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
  rightWall.position.x = basketWidth / 2 - wallThickness / 2;
  basket.add(rightWall);
  
  // Parede frontal
  const frontWallGeometry = new THREE.BoxGeometry(basketWidth, wallHeight, wallThickness);
  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.z = basketDepth / 2 - wallThickness / 2;
  basket.add(frontWall);
  
  // Parede traseira
  const backWallGeometry = new THREE.BoxGeometry(basketWidth, wallHeight, wallThickness);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.z = -basketDepth / 2 + wallThickness / 2;
  basket.add(backWall);
  
  // Posiciona a cesta na parte inferior da cena
  basket.position.set(0, -3, 0);
  scene.add(basket);
  
  // Cria um “chão” para referência
  const floorGeometry = new THREE.PlaneGeometry(50, 50);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5;
  scene.add(floor);
  
  createHUD();
  
  createButtons();
  document.addEventListener('click', onDocumentClick, false);
  
  // Define lastTime para o controle de delta
  lastTime = performance.now() / 1000;
  
  // Atualiza a posição da cesta conforme o mouse
  document.addEventListener('mousemove', onMouseMove, false);
  
  // Painel dat.gui para ajustar gravidade e velocidade das bolinhas
  gui = new dat.GUI();
  gui.add(params, 'gravity', 0, 20).name('Gravidade').onChange(function(value) {
    gravity = value;
  });
  gui.add(params, 'ballSpeed', 0.1, 5).name('Velocidade').onChange(function(value) {
    ballFallSpeed = value;
  });
  gui.add({ clearLocalStorage }, 'clearLocalStorage').name('Limpar localStorage');
}

function createHUD() {
  hudCanvas = document.createElement('canvas');
  hudCanvas.width = 512;
  hudCanvas.height = 160;
  const ctx = hudCanvas.getContext('2d');
  ctx.font = "40px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText("Pontuação: " + score, 10, 50);
  ctx.fillText("Tempo: " + Math.floor(timer), 10, 100);
  // Recupera o highscore do localStorage (ou 0 se não existir)
  let highscore = Number(localStorage.getItem("highscore") || 0);
  ctx.fillText("Recorde: " + highscore, 10, 150);
  
  hudTexture = new THREE.CanvasTexture(hudCanvas);
  const hudMaterial = new THREE.SpriteMaterial({ map: hudTexture, transparent: true });
  hudSprite = new THREE.Sprite(hudMaterial);
  
  // Ajusta o tamanho e posiciona o HUD na cena
  hudSprite.scale.set(5, 1.56, 1);
  hudSprite.position.set(0, 4.5, 0);
  scene.add(hudSprite);
}

function updateHUD() {
  const ctx = hudCanvas.getContext('2d');
  ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  ctx.font = "40px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText("Pontuação: " + score, 10, 50);
  ctx.fillText("Tempo: " + Math.floor(timer), 10, 100);
  let highscore = Number(localStorage.getItem("highscore") || 0);
  ctx.fillText("Recorde: " + highscore, 10, 150);
  hudTexture.needsUpdate = true;
}

// Cria um botão como sprite usando canvas com escala baseada na razão largura/altura
function createButton(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);
  ctx.font = "bold 30px Arial";
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  
  sprite.userData = { callback: null, text: text, width: width, height: height, canvas: canvas };
  sprite.scale.set(width / 64, height / 64, 1);
  return sprite;
}

// Atualiza a textura do botão quando o texto for alterado
function updateButtonTexture(sprite, text) {
  const canvas = sprite.userData.canvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);
  ctx.font = "bold 30px Arial";
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  sprite.material.map.needsUpdate = true;
  sprite.userData.text = text;
}

function createButtons() {
  // Cria o botão "Iniciar Jogo"
  startButtonSprite = createButton("Iniciar Jogo", 256, 64);
  startButtonSprite.position.set(0, 2, 0);
  scene.add(startButtonSprite);
  clickableObjects.push(startButtonSprite);
  startButtonSprite.userData.callback = startGame;
  
  // Cria o botão "Pausar" (inicia oculto)
  pauseButtonSprite = createButton("Pausar", 256, 64);
  // Posiciona com z = 0.1 para ficar à frente
  pauseButtonSprite.position.set(0, 2, 0.1);
  pauseButtonSprite.visible = false;
  scene.add(pauseButtonSprite);
  clickableObjects.push(pauseButtonSprite);
  pauseButtonSprite.userData.callback = togglePause;
}

// Detecta cliques na cena usando raycasting e considera apenas objetos visíveis
function onDocumentClick(event) {
  event.preventDefault();
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  mouse.set(mouseX, mouseY);
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, false);
  if (intersects.length > 0) {
    // Considera o primeiro objeto que estiver visível
    const obj = intersects.find(i => i.object.visible)?.object;
    if (obj && obj.userData.callback) {
      obj.userData.callback();
    }
  }
}

function onMouseMove(event) {
  // Obtém a posição do mouse normalizada (-1 a 1)
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;

  // Define a largura do mundo 3D visível na cena
  const worldWidth = 20; // Ajuste conforme necessário

  // Mapeia a posição do mouse para a largura do mundo 3D
  basket.position.x = mouseX * (worldWidth / 2);

  // Limita a posição da cesta para evitar que ela saia da tela
  const basketHalfWidth = 1.5; // Metade da largura da cesta
  const maxX = (worldWidth / 2) - basketHalfWidth; // Limite máximo no eixo X
  const minX = -maxX; // Limite mínimo no eixo X
  basket.position.x = Math.max(minX, Math.min(maxX, basket.position.x));
}

function spawnBall() {
  const radius = 0.3;
  const ballGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('assets/metal.jpg');
  const glassTexture = textureLoader.load('assets/glass.png');

  let specialType = null;
  const r = Math.random();
  if (r < 0.1) {
    specialType = "negative";
  } else if (r < 0.2) {
    specialType = "positive";
  } else if (r < 0.3) {
    specialType = "rubber";  // Bola amarela (rubber)
  }

  let material;
  if (specialType === "positive") {
    material = new THREE.MeshStandardMaterial({ color: '#55B02E', metalness: 0.5, roughness: 0.7 });
  } else if (specialType === "negative") {
    material = new THREE.MeshStandardMaterial({ color: '#F00000', map: glassTexture, transparent: true, opacity: 0.8, metalness: 0.1, roughness: 0.2
    });
  } else if (specialType === "rubber") {
    material = new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 0.1, roughness: 0.9 });
  } else {
    material = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.5, roughness: 0.5 });
  }

  const ball = new THREE.Mesh(ballGeometry, material);
  ball.position.x = (Math.random() - 0.5) * 20;
  ball.position.y = 10;
  ball.userData = {
    velocity: new THREE.Vector3((Math.random() - 0.5) * 2, -ballFallSpeed, 0),
    specialType: specialType,
    bounces: 0,
    lifetime: 30
  };

  scene.add(ball);
  balls.push(ball);
}

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now() / 1000;
  let delta = now - lastTime;
  lastTime = now;

  if (paused) {
    delta = 0;
  }

  if (gameStarted && !paused && !gameOver) {
    timer -= delta;
    if (timer <= 0) {
      timer = 0;
      gameOver = true;
      let highscore = localStorage.getItem("highscore") || 0;
      highscore = Number(highscore);
      if (score > highscore) {
        localStorage.setItem("highscore", score);
        alert("Parabéns! Você atingiu um novo recorde! Pontuação: " + score);
      } else {
        alert("Fim de jogo! Pontuação: " + score);
      }
      endGame();
    }

    lastSpawnTime += delta;
    if (lastSpawnTime > ballSpawnInterval) {
      spawnBall();
      lastSpawnTime = 0;
    }

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      ball.userData.velocity.y -= gravity * delta;
      ball.position.addScaledVector(ball.userData.velocity, delta);
      ball.userData.lifetime -= delta;

      if (ball.position.y - 0.3 <= basket.position.y + 0.25 && ball.userData.velocity.y < 0) {
        const halfWidth = 1.5;
        if (ball.position.x >= basket.position.x - halfWidth &&
          ball.position.x <= basket.position.x + halfWidth) {
          // Verifica o tipo de bolinha e executa a lógica correspondente
          switch (ball.userData.specialType) {
            case "rubber":
              // Bola de borracha: penaliza o tempo e dá +1 ponto
              timer = Math.max(0, timer - 3); // Reduz o tempo em 3 segundos
              score += 1; // Adiciona +1 ponto
              score = Math.max(0, score); // Garante que a pontuação não seja negativa
              break;

            case "positive":
              // Bola positiva: aumenta a pontuação e o tempo
              score += 5;
              timer += 3;
              break;

            case "negative":
              // Bola de vidro: penaliza a pontuação e toca som de vidro quebrando
              score -= 5;
              score = Math.max(0, score); // Garante que a pontuação não seja negativa
              glassBreakSound.currentTime = 0;
              glassBreakSound.play();
              break;

            default:
              // Bolinha comum: aumenta a pontuação
              score += 1;
              break;
          }

          // Toca o som de captura para qualquer bolinha que não seja de vidro
          if (ball.userData.specialType !== "negative") {
            impactSound.currentTime = 0;
            impactSound.play();
          }

          // Vibração (se suportada)
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }

          // Remove a bolinha da cena e do array
          scene.remove(ball);
          balls.splice(i, 1);
          continue;
        }
      }

      if (ball.userData.specialType === "rubber" && ball.position.y < -4.8) {
        if (ball.userData.bounces < 3) {
          ball.userData.velocity.y = Math.sqrt(2 * gravity * 10);
          ball.userData.velocity.x += (Math.random() - 0.5) * 4;
          ball.userData.bounces++;
        } else if (ball.userData.lifetime <= 0) {
          scene.remove(ball);
          balls.splice(i, 1);
        }
      }

      if (ball.position.y < -5 && ball.userData.specialType !== "rubber") {
        if (ball.userData.specialType === "positive") {
          score -= 1;
          score = Math.max(0, score); // Garante que a pontuação não seja negativa
        }
        scene.remove(ball);
        balls.splice(i, 1);
      }
    }
  }

  updateHUD();
  renderer.render(scene, camera);
}



function startGame() {
  // Reinicia variáveis do jogo
  score = 0;
  timer = 60;
  gameOver = false;
  paused = false;
  gameStarted = true;
  
  // Remove bolinhas remanescentes de jogos anteriores
  balls.forEach(ball => scene.remove(ball));
  balls = [];
  
  // Define lastTime para evitar grande delta ao iniciar
  lastTime = performance.now() / 1000;
  
  // Exibe o botão de pausa e oculta o de iniciar
  startButtonSprite.visible = false;
  pauseButtonSprite.visible = true;
  updateButtonTexture(pauseButtonSprite, "Pausar");
  updateHUD();
}

function togglePause() {
  if (!gameStarted) return;
  paused = !paused;
  if (paused) {
    updateButtonTexture(pauseButtonSprite, "Continuar");
  } else {
    updateButtonTexture(pauseButtonSprite, "Pausar");
  }
}

function endGame() {
  gameStarted = false;
  paused = false;
  // Exibe novamente o botão de iniciar e oculta o de pausa
  startButtonSprite.visible = true;
  pauseButtonSprite.visible = false;
}

// Ajusta o renderer quando a janela é redimensionada
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
