//KONSTANTE ZA VELICINE
const WIDTH = 900;
const HEIGHT = 700;

const PALICA_W = 90;
const PALICA_H = 15;
const PALICA_BRZINA = 6.5;

const LOPTICA_W = 10;
const LOPTICA_POCETNA_BRZINA = 4;
const MAX_BRZINA = 9;

const BROJ_CIGLI = 50;
const REDOVI = 5;
const STUPCI = 10;
const CIGLA_W = 58;
const CIGLA_H = 20;
const CIGLA_V_RAZMAK = 20;
const CIGLA_H_RAZMAK = 30;

const BOJE = [
  "rgb(153,51,0)", // smeđe
  "rgb(255,0,0)", // crveno
  "rgb(255,153,204)", // ružičasto
  "rgb(0,255,0)", // zeleno
  "rgb(255,255,153)", // žuto
];

let canvas = document.getElementById("igrica");
let context = canvas.getContext("2d");

//KORISTENE VARIJABLE I OBJEKTI U IGRI
let bricks = [];
let started = false;
let gameOver = false;
let score = 0;
let bestScore;

let palica = {
  X: 0,
  Y: 0,
};

let ball = {
  X: 0,
  Y: 0,
  VX: 0,
  VY: 0,
};

let LEFT = false;
let RIGHT = false;

let firstBrick = false;

const audioCtx = new window.AudioContext();

//POSTAVLJANJE VELICINE CANVASA, EVENT LISTENERA ZA TIPKE LIJEVO, DESNO I SPACE PRI UCITAVANJU STRANICE
(() => {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  document.addEventListener("keydown", (ev) => {
    if (ev.code === "Space") {
      if (!started) startGame();
      else if (gameOver) restartGame();
    }
    if (ev.code === "ArrowLeft") LEFT = true;
    if (ev.code === "ArrowRight") RIGHT = true;
  });

  document.addEventListener("keyup", (ev) => {
    if (ev.code === "ArrowLeft") LEFT = false;
    if (ev.code === "ArrowRight") RIGHT = false;
  });

  //UCITAVANJE NAJBOLJEG REZULTATA
  bestScore = localStorage.getItem("best");
  if (!bestScore) bestScore = 0;

  //SVAKIH 16MS AZURIRAJ PRIKAZ (16 JE OPTIMALNO, VEĆI ILI MANJI IZNOSI POREMETE FIZIKU, TREBA ONDA MIJENJATI OSTALE PARAMETRE)
  setInterval(updateGame, 16);
})();

function init() {
  //PRIKAZ POCETNOG ZASLONA
  context.save();
  context.fillStyle = "#fff";
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.font = "bold 36px Helvetica, Verdana";
  context.fillText("BREAKOUT", WIDTH / 2, HEIGHT / 2);
  context.font = "bold italic 18px Helvetica, Verdana";
  context.fillText("Press SPACE to begin", WIDTH / 2, HEIGHT / 2 + 28);
  context.restore();

  //POSTAVLJANJE PALICE, LOPTICE I CIGLA NA POCETKU, REZULTAT = 0
  palica.X = (WIDTH - PALICA_W) / 2;
  palica.Y = HEIGHT - 50;
  ball.X = palica.X + PALICA_W / 2 - LOPTICA_W / 2;
  ball.Y = palica.Y - LOPTICA_W - 2;
  score = 0;
  firstBrick = false;
  gameWon = false;
  addBricks();
}

//FUNKCIJA KOJA POSTAVLJA CIGLE PO GORE NAVEDENIM PARAMETRIMA
function addBricks() {
  bricks = [];
  let w = STUPCI * CIGLA_W + (STUPCI - 1) * CIGLA_H_RAZMAK;
  let pocX = (WIDTH - w) / 2;
  for (let i = 0; i < REDOVI; i++) {
    for (let j = 0; j < STUPCI; j++) {
      let x = pocX + j * (CIGLA_W + CIGLA_H_RAZMAK);
      let y = 60 + i * (CIGLA_H + CIGLA_V_RAZMAK);
      bricks.push([x, y, true, BOJE[i]]);
    }
  }
}

//FUNKCIJA KOJA ZAPOCINJE KRETANJE LOPTICE
function startGame() {
  started = true;
  if (Math.random() > 0.5) ball.VX = LOPTICA_POCETNA_BRZINA;
  else ball.VX = -LOPTICA_POCETNA_BRZINA;
  ball.VY = -LOPTICA_POCETNA_BRZINA;
}

//FUNKCIJA ZA RESTART IGRE
function restartGame() {
  gameOver = false;
  started = false;
  init();
}

//FUNKCIJA KOJA SE POZIVA ZA SVAKO AZURIRANJE, POZIVA NOVO ISCRTAVANJE ELEMENATA,
//  PROVJERAVA JE LI IGRA GOTOVA, I POZIVA ANIMACIJSKU FUNKCIJU
function updateGame() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  drawScores();
  drawBricks();
  draw3d(palica.X, palica.Y, PALICA_W, PALICA_H, "#ffffff");
  draw3d(ball.X, ball.Y, LOPTICA_W, LOPTICA_W, "#ffffff");

  if (!started && !gameOver) return init();
  //U SLUCAJU DA SU SVE CIGLE POGODENE PRIKAZUJE SE ISPIS POBJEDE
  if (started && score === BROJ_CIGLI) {
    localStorage.setItem("best", bestScore);
    gameOver = true;
    context.save();
    context.fillStyle = "green";
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.font = "bold 40px Helvetica, Verdana";
    context.fillText("YOU WON", WIDTH / 2, HEIGHT / 2);
    context.font = "bold italic 18px Helvetica, Verdana";
    context.fillText("Press SPACE to restart", WIDTH / 2, HEIGHT / 2 + 28);
    context.restore();
    return;
  }

  //AKO JE LOPTICA IZASLA S EKRANA GAME OVER ISPIS
  if (gameOver) {
    context.save();
    context.fillStyle = "yellow";
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.font = "bold 40px Helvetica, Verdana";
    context.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2);
    context.font = "bold italic 18px Helvetica, Verdana";
    context.fillText("Press SPACE to restart", WIDTH / 2, HEIGHT / 2 + 28);
    context.restore();
    return;
  }

  animation();
}

//FUNKCIJA U KOJOJ JE SVA FIZIKA KRETANJA I SUDARA
function animation() {
  //KRETANJE PALICE, ZABRANA PRELASKA RUBA
  if (LEFT) palica.X -= PALICA_BRZINA;
  if (RIGHT) palica.X += PALICA_BRZINA;
  palica.X = Math.max(0, Math.min(palica.X, WIDTH - PALICA_W));

  //KRETANJE LOPTE I ODBIJANJE OD ZID
  ball.X += ball.VX;
  ball.Y += ball.VY;
  if (ball.X <= 0 || ball.X + LOPTICA_W >= WIDTH) {
    ball.VX = -ball.VX;
    sound(300, 0.04);
  }
  if (ball.Y <= 0) {
    ball.VY = Math.abs(ball.VY);
    sound(300, 0.04);
  }
  if (ball.Y > HEIGHT) {
    gameOver = true;
    sound(150, 0.1);
    localStorage.setItem("best", bestScore);
    return;
  }

  //UDAR LOPTICE O PALICU
  if (
    ball.Y + LOPTICA_W >= palica.Y &&
    ball.X + LOPTICA_W >= palica.X &&
    ball.X <= palica.X + PALICA_W
  ) {
    //PROMJENA SMJERA LOPTICE OVISNO GDJE UDARI U PALICU
    const ballCenter = ball.X + LOPTICA_W / 2;
    const palicaCenter = palica.X + PALICA_W / 2;
    let hit = (ballCenter - palicaCenter) / (PALICA_W / 2);
    let speed = Math.sqrt(ball.VX * ball.VX + ball.VY * ball.VY);
    ball.VX = hit * speed;
    ball.VY = -Math.abs(speed);
    ball.Y = palica.Y - LOPTICA_W - 1;
    sound(500, 0.05);
    limitBallSpeed();
  }

  //UDAR LOPTICE OD CIGLU
  for (let i = 0; i < bricks.length; i++) {
    let [brickLeft, brickTop, alive] = bricks[i];
    if (!alive) continue;

    //POMOCNE VARIJABLE ZA ODREDIVANJE STRANA LOPTICE I CIGLI
    let ballLeft = ball.X;
    let ballRight = ball.X + LOPTICA_W;
    let ballTop = ball.Y;
    let ballBottom = ball.Y + LOPTICA_W;

    let brickRight = brickLeft + CIGLA_W;
    let brickBottom = brickTop + CIGLA_H;

    if (
      ballRight > brickLeft &&
      ballLeft < brickRight &&
      ballBottom > brickTop &&
      ballTop < brickBottom
    ) {
      //KORIGIRANJE REZULTATA, UKLANJANJE CIGLE AKO JE UDARENA
      bricks[i][2] = false;
      score++;
      if (score > bestScore) bestScore = score;

      //PROVJERA UDARA OD KUT CIGLE
      let preklapanjeX = Math.min(
        Math.abs(ballRight - brickLeft), //LOPTICA DESNO, CIGLA LIJEVO
        Math.abs(brickRight - ballLeft) //CIGLA DESNO, LOPTICA LIJEVO
      );

      let preklapanjeY = Math.min(
        Math.abs(ballBottom - brickTop), //VRH CIGLE, DNO LOPTICE
        Math.abs(brickBottom - ballTop) //DNO CIGLE, VRH LOPTICE
      );

      let kut = Math.abs(preklapanjeX - preklapanjeY) < 0.5;

      //PROVJERA JE LI PRVI SUDAR S CIGLOM ILI UDAR U KUT, AKO JE POVEĆANJE BRZINE LOPTICE
      if (!firstBrick || kut) {
        firstBrick = true;
        ball.VX = ball.VX * 1.15;
        ball.VY = ball.VY * 1.15;
      }
      //PROMJENA SMJERA OVISNO O UDARU U CIGLU
      if (preklapanjeX < preklapanjeY) ball.VX = -ball.VX;
      else ball.VY = -ball.VY;

      sound(650, 0.07);
      limitBallSpeed(); //OGRANICENJE MAKSIMALNE BRZINE
      break;
    }
  }
}

//FUNKCIJA ZA ISCRTAVANJE CIGLI, OVISNO JESU UDARENE
function drawBricks() {
  for (let [x, y, alive, color] of bricks)
    if (alive) draw3d(x, y, CIGLA_W, CIGLA_H, color);
}

//FUNKCIJA ZA ISPIS REZULTATA NA CANVASU
function drawScores() {
  context.save();
  context.fillStyle = "#fff";
  context.font = "16px Helvetica, Verdana";
  context.textBaseline = "top";
  context.textAlign = "left";
  context.fillText("Trenutni broj bodova: " + score, 20, 20);
  context.textAlign = "right";
  context.fillText("Maksimalni broj bodova: " + bestScore, WIDTH - 100, 20);
  context.restore();
}

//POMOCNA FUNKCIJA ZA CRTANJE 3D OBJEKATA SA SJENOM (CIGLE, LOPTICA, PALICA)
function draw3d(x, y, w, h, fill) {
  context.save();
  context.shadowBlur = 8;
  context.shadowColor = fill;
  context.fillStyle = fill;
  context.fillRect(x, y, w, h);
  context.restore();
}

//FUNKCIJA ZA STVARANJE ZVUKA PRI SUDARU LOPTICE OD CIGLU ILI ZID
function sound(f, d) {
  const o = audioCtx.createOscillator(),
    g = audioCtx.createGain(),
    t = audioCtx.currentTime + d;

  o.type = "square";
  o.frequency.value = f;
  o.connect(g).connect(audioCtx.destination);

  g.gain.exponentialRampToValueAtTime(0.0001, t);
  o.start();
  o.stop(t);
}

//FUNKCIJA ZA OGRANICAVANJE BRZINE LOPTICE
function limitBallSpeed() {
  let speed = Math.sqrt(ball.VX * ball.VX + ball.VY * ball.VY);
  if (speed > MAX_BRZINA) {
    ball.VX *= MAX_BRZINA / speed;
    ball.VY *= MAX_BRZINA / speed;
  }
}
