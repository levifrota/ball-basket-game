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

// Elementos HUD (pontuação e tempo) na cena
let hudCanvas, hudTexture, hudSprite;

// Botões 3D (sprites) e lista de objetos clicáveis
let startButtonSprite, pauseButtonSprite;
let clickableObjects = [];

// Variáveis para raycasting
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Som de impacto (substitua a URL se desejar)
const impactSound = new Audio('assets/cartoon-jump-6462.mp3');

// Inicializa a cena e inicia o loop de animação
init();
animate();

function init() {
  // Configuração básica da cena e câmera
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
  
  // Luzes
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);
  
  // Criação da cesta (grupo composto por base e paredes)
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
  
  // Cria o HUD (pontuação e tempo) na cena
  createHUD();
  
  // Cria os botões 3D e os torna clicáveis
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
  gui.add(params, 'ballSpeed', 0.1, 5).name('Velocidade das Bolinhas').onChange(function(value) {
    ballFallSpeed = value;
  });
}

function createHUD() {
  // Cria um canvas para desenhar o HUD (pontuação e tempo)
  hudCanvas = document.createElement('canvas');
  hudCanvas.width = 512;
  hudCanvas.height = 128;
  const ctx = hudCanvas.getContext('2d');
  ctx.font = "40px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText("Pontuação: " + score, 10, 50);
  ctx.fillText("Tempo: " + Math.floor(timer), 10, 100);
  
  hudTexture = new THREE.CanvasTexture(hudCanvas);
  const hudMaterial = new THREE.SpriteMaterial({ map: hudTexture, transparent: true });
  hudSprite = new THREE.Sprite(hudMaterial);
  
  // Ajusta o tamanho e posiciona o HUD na cena
  hudSprite.scale.set(5, 1.25, 1);
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
  hudTexture.needsUpdate = true;
}

// Cria um botão como sprite usando canvas com escala baseada na razão largura/altura
function createButton(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Fundo do botão
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, width, height);
  // Borda
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);
  // Texto centralizado
  ctx.font = "bold 30px Arial";
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  
  sprite.userData = { callback: null, text: text, width: width, height: height, canvas: canvas };
  // Define a escala do sprite mantendo a proporção (fator base: 64)
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
  // Posiciona com z = 0
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
  // Atualiza a posição horizontal da cesta conforme o mouse
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  basket.position.x = mouseX * 10;
}

function spawnBall() {
  // Cria uma bolinha no topo com posição x aleatória
  const radius = 0.3;
  const ballGeometry = new THREE.SphereGeometry(radius, 32, 32);
  
  // Carrega uma textura para a bolinha (aparência metálica)
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('assets/metal.jpg');
  
  // Determina se a bolinha é “especial” (20% de chance)
  const isSpecial = Math.random() < 0.2;
  let material;
  if (isSpecial) {
    material = new THREE.MeshStandardMaterial({ color: '#55B02E', metalness: 0.5, roughness: 0.7 });
  } else {
    material = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.5, roughness: 0.5 });
  }
  
  const ball = new THREE.Mesh(ballGeometry, material);
  ball.position.x = (Math.random() - 0.5) * 20;
  ball.position.y = 10;
  ball.userData = {
    velocity: new THREE.Vector3(0, -ballFallSpeed, 0),
    special: isSpecial
  };
  scene.add(ball);
  balls.push(ball);
}

function animate() {
  requestAnimationFrame(animate);
  
  const now = performance.now() / 1000;
  let delta = now - lastTime;
  lastTime = now;
  
  // Se o jogo estiver pausado, força delta = 0 para não atualizar o estado
  if (paused) {
    delta = 0;
  }
  
  if (gameStarted && !paused && !gameOver) {
    timer -= delta;
    if (timer <= 0) {
      timer = 0;
      gameOver = true;
      alert('Fim de jogo! Pontuação: ' + score);
      endGame();
    }
    
    lastSpawnTime += delta;
    if (lastSpawnTime > ballSpawnInterval) {
      spawnBall();
      lastSpawnTime = 0;
    }
    
    // Atualiza cada bolinha
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      ball.userData.velocity.y -= gravity * delta;
      ball.position.addScaledVector(ball.userData.velocity, delta);
      
      // Checa colisão com a cesta (aproximação)
      if (ball.position.y - 0.3 <= basket.position.y + 0.25) {
        const halfWidth = 1.5;
        if (ball.position.x >= basket.position.x - halfWidth &&
            ball.position.x <= basket.position.x + halfWidth) {
          score += ball.userData.special ? 5 : 1;
          impactSound.currentTime = 0;
          impactSound.play();
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          scene.remove(ball);
          balls.splice(i, 1);
          continue;
        }
      }
      
      // Remove bolinhas que caem abaixo do chão e penaliza se for especial
      if (ball.position.y < -5) {
        if (ball.userData.special) {
          score -= 3;
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
  // Apenas alterna o estado de pausa sem reiniciar o jogo
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
