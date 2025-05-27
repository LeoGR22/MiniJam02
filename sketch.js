let objects = [];
let explosions = [];
let score = 0;
let gameOver = false;

let bg1, bg2, bg3, bolhaImg, explosionSheet, heartSheet;
let popSounds = [];
let bgMusic;

const WIDTH = 576;
const HEIGHT = 324;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const SCALE = 2;

let heartPulse;

function preload() {
  bg1 = loadImage("assets/image/bg1.png");
  bg2 = loadImage("assets/image/bg2.png");
  bg3 = loadImage("assets/image/bg3.png");
  bolhaImg = loadImage("assets/image/bolha.png");
  explosionSheet = loadImage("assets/image/bolha_estouro-Sheet.png");
  heartSheet = loadImage("assets/image/heart-pulse.png");

  for (let i = 1; i <= 5; i++) {
    popSounds.push(loadSound(`assets/sound/pop${i === 1 ? "" : i}.mp3`));
  }
  bgMusic = loadSound("assets/sound/music.mp3");
}

function setup() {
  createCanvas(WIDTH * SCALE, HEIGHT * SCALE);
  textSize(20);
  noCursor();
  pixelDensity(1);
  noSmooth();
  bgMusic.loop();
  bgMusic.setVolume(0.3);

  heartPulse = new HeartPulse(CENTER_X, CENTER_Y);
}

function draw() {
  scale(SCALE);

  if (gameOver) {
    if (bgMusic.isPlaying()) bgMusic.stop();
    background(0, 0, 0, 200);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("GAME OVER", CENTER_X, CENTER_Y - 20);
    textSize(20);
    text("Final Score: " + score, CENTER_X, CENTER_Y + 20);
    return;
  }

  drawDistortedBackground(bg1);
  drawCenteredImage(bg2);
  drawDistortedBackground(bg3);

  if (frameCount % 60 === 0) objects.push(FallingObject.spawnFromEdge());

  objects = objects.filter(o => {
    o.update();
    o.draw();
    if (dist(o.x0, o.y0, CENTER_X, CENTER_Y) < 30) {
      gameOver = true;
      return false;
    }
    return !(o.x0 < -100 || o.x0 > WIDTH + 100 || o.y0 < -100 || o.y0 > HEIGHT + 100);
  });

  explosions = explosions.filter(e => {
    e.update();
    e.draw();
    return !e.done;
  });

  heartPulse.update();
  heartPulse.draw();

  drawCrosshair(mouseX / SCALE, mouseY / SCALE);

  fill(255);
  textAlign(LEFT, TOP);
  text("Score: " + score, 10, 10);
}

function mousePressed() {
  if (gameOver) return;
  let mx = mouseX / SCALE;
  let my = mouseY / SCALE;

  for (let i = objects.length - 1; i >= 0; i--) {
    let o = objects[i];
    let x = o.x0 + sin(frameCount * o.freq + o.offset) * o.amp;
    let y = o.y0;
    if (dist(mx, my, x, y) < o.size / 2) {
      score++;
      explosions.push(new Explosion(x, y));
      playRandomPopSound();
      objects.splice(i, 1);
      break;
    }
  }
}

function playRandomPopSound() {
  let sound = random(popSounds);
  if (sound.isPlaying()) sound.stop();
  sound.play();
}

function drawCrosshair(x, y) {
  stroke(255, 0, 0);
  strokeWeight(2);
  line(x - 10, y, x + 10, y);
  line(x, y - 10, x, y + 10);
  noFill();
  ellipse(x, y, 20, 20);
  fill(255, 0, 0);
  noStroke();
  ellipse(x + 15, y, 5, 5);
  ellipse(x - 15, y, 5, 5);
  ellipse(x, y + 15, 5, 5);
  ellipse(x, y - 15, 5, 5);
}

function drawDistortedBackground(img) {
  const scaleFactor = 640 / WIDTH;
  const newW = img.width * scaleFactor;
  const newH = img.height * scaleFactor;
  const xOffset = (WIDTH - newW) / 2;

  for (let y = 0; y < newH; y++) {
    const offset = int(sin(frameCount * 0.05 + y * 0.05) * 2);
    copy(img, 0, int(y / scaleFactor), img.width, 1, int(xOffset) + offset, y, int(newW), 1);
  }
}

function drawCenteredImage(img) {
  const scaleFactor = 640 / WIDTH;
  const newW = img.width * scaleFactor;
  const newH = img.height * scaleFactor;
  const x = (WIDTH - newW) / 2;
  const y = (HEIGHT - newH) / 2;
  image(img, x, y, newW, newH);
}

class FallingObject {
  constructor(x, y, targetX, targetY) {
    this.x0 = x;
    this.y0 = y;
    this.size = 64;
    this.offset = random(TWO_PI);
    this.amp = random(10, 30);
    this.freq = random(0.02, 0.05);
    let dir = createVector(targetX - x, targetY - y).setMag(random(1, 2));
    this.vel = dir;
  }

  static spawnFromEdge() {
    let edge = floor(random(4));
    let x, y;
    if (edge === 0) {
      x = random(WIDTH);
      y = -40;
    } else if (edge === 1) {
      x = random(WIDTH);
      y = HEIGHT + 40;
    } else if (edge === 2) {
      x = -40;
      y = random(HEIGHT);
    } else {
      x = WIDTH + 40;
      y = random(HEIGHT);
    }
    return new FallingObject(x, y, CENTER_X, CENTER_Y);
  }

  update() {
    this.x0 += this.vel.x;
    this.y0 += this.vel.y;
  }

  draw() {
    const x = this.x0 + sin(frameCount * this.freq + this.offset) * this.amp;
    const y = this.y0;
    image(bolhaImg, x - this.size / 2, y - this.size / 2, this.size, this.size);
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.totalFrames = 60;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.scale = 2;
    this.done = false;
  }

  update() {
    this.frame++;
    if (this.frame >= this.totalFrames) this.done = true;
  }

  draw() {
    if (this.done) return;
    const sx = this.frame * this.frameWidth;
    const drawW = this.frameWidth * this.scale;
    const drawH = this.frameHeight * this.scale;
    image(
      explosionSheet,
      this.x - drawW / 2,
      this.y - drawH / 2,
      drawW,
      drawH,
      sx,
      0,
      this.frameWidth,
      this.frameHeight
    );
  }
}

class HeartPulse {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.totalFrames = 6;
    this.frameWidth = 15;
    this.frameHeight = 15;
    this.scale = 4;
    this.frameDelay = 5;
    this.frameDelayCounter = 0;
  }

  update() {
    this.frameDelayCounter++;
    if (this.frameDelayCounter >= this.frameDelay) {
      this.frame = (this.frame + 1) % this.totalFrames;
      this.frameDelayCounter = 0;
    }
  }

  draw() {
    const sx = this.frame * this.frameWidth;
    const drawW = this.frameWidth * this.scale;
    const drawH = this.frameHeight * this.scale;
    image(
      heartSheet,
      this.x - drawW / 2,
      this.y - drawH / 2,
      drawW,
      drawH,
      sx,
      0,
      this.frameWidth,
      this.frameHeight
    );
  }
}
