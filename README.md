# 🎮 Basket Ball Game 🏀
Este é um projeto desenvolvido para a disciplina de Computação Gráfica, utilizando tecnologias as Three.js, Canvas e dat.GUI. O objetivo do jogo é capturar bolinhas que caem do topo da tela usando uma cesta controlada pelo mouse. 🖱️

## 🚀 Como Executar o Projeto
Clone o repositório:
```bash
git clone https://github.com/levifrota/ball-basket-game.git
```

Navegue até a pasta do projeto:
```bash
cd ball-basket-game
```
Abra o arquivo index.html no seu navegador!

## 🚀 Funcionalidades
### Requisitos Básicos
- Cesta Controlada pelo Mouse 🧺:
  - A cesta é um modelo 3D criado com geometrias básicas (cubos e planos).
  - Movimenta-se horizontalmente conforme o movimento do mouse.

- Sistema de Partículas para as Bolinhas ⚪:
  - Bolinhas são geradas no topo da tela e caem com física simulada (gravidade e velocidade).
  - Diferentes tipos de bolinhas têm comportamentos e efeitos distintos.

- Colisões e Pontuação 🎯:
  - Detecção de colisão entre bolinhas e a cesta.
  - Pontuação baseada no tipo de bolinha capturada:
    - Bolinhas comuns: +1 ponto. ⚫
    - Bolinhas especiais (positivas): +5 pontos. 🟢
    - Bolinhas especiais (negativas): -5 pontos. 🔴
    - Bolinhas de borracha (amarelas): penalizam o jogador, reduzindo o tempo em 3 segundos. 🟡

### Requisitos Opcionais
- Painel de Controle (dat.GUI) 🎛️:
  - Ajuste em tempo real da gravidade e velocidade das bolinhas.
- HUD (Heads-Up Display) 📊:
  - Exibe pontuação, tempo restante e recorde.
- Efeitos Sonoros e Vibração 🔊📳:
  - Som de impacto ao capturar bolinhas.
- Cronômetro e Fim de Jogo ⏱️:
  - Duração de 60 segundos.
  - Recorde salvo no ```localStorage```.
- Botões de Controle 🕹️:
  - Botões interativos para iniciar, pausar e continuar o jogo.
## 🛠️ Tecnologias Utilizadas
  - Three.js: Renderização 3D e criação da cena.
  - Canvas: Criação de texturas dinâmicas (HUD e botões).
  - dat.GUI: Painel de controle ajustável.
## 🎯 Como Jogar
### 1. Iniciar o Jogo:
 Clique no botão "Iniciar Jogo" para começar.
### 2. Controlar a Cesta:
 Movimente o mouse para mover a cesta horizontalmente.
### 3. Capturar Bolinhas:
 Capture as bolinhas que caem do topo da tela.
 Cuidado com as bolinhas especiais! Elas podem aumentar ou diminuir sua pontuação.
### 4. Ajustar Configurações:
 Use o painel de controle (dat.GUI) para ajustar a gravidade e a velocidade das bolinhas.
### 5. Finalizar o Jogo:
 O jogo termina após 60 segundos. 

## 👥 Participantes 
- [Ailton Guarinho de Vasconcelos](https://github.com/AkowsS)
- [Francisco Antonio Paiva de Sousa](https://github.com/fcooantonio)
- [Gideão Levi de Oliveira Frota](https://www.github.com/levifrota)
- [Thiago Marques Sousa](https://github.com/thiagomars)