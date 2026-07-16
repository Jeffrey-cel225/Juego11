
window.iniciarJuego = function() {
    console.log("Juego iniciado");
    

  // ---- CONSTANTES ----
  const ANIMALES = [
    { emoji: '🐅', nombre: 'Jaguar',   puntos: 10, tipo: 'bueno' },
    { emoji: '🐬', nombre: 'Defin Rosa', puntos: 15, tipo: 'bueno' },
    { emoji: '🦦', nombre: 'Nutria Gigante',puntos: 20, tipo: 'bueno' },
    { emoji: '🐸', nombre: 'Rana Flecha Venenosa',    puntos: 8,  tipo: 'bueno' },
    { emoji: '🐒', nombre: 'Mono',   puntos: 12, tipo: 'bueno' },
    { emoji: '🦅', nombre: 'Aguila Harpia',      puntos: 18, tipo: 'bueno' },
    { emoji: '🦜', nombre: 'Guacamayos',    puntos: 10, tipo: 'bueno' },
    { emoji: '🐍', nombre: 'Serpiente',  puntos: 14, tipo: 'bueno' },
    { emoji: '🐢', nombre: 'Tortuga',     puntos: -15, tipo: 'malo' },
    { emoji: '🐋',  nombre: 'Ballena',    puntos: -10, tipo: 'malo' },
    { emoji: '🦀',  nombre: 'Cangrejo',   puntos: -20, tipo: 'malo' },
  ];

  const CANVAS_W = 700;
  const CANVAS_H = 380;
  const RED_W = 80;
  const RED_H = 28;
  const DURACION = 30;
  const VIDAS_INICIALES = 3;
  let canvas, ctx;
  let objetos = [];
  let redX = CANVAS_W / 2;
  let puntuacion = 0;
  let vidas = VIDAS_INICIALES;
  let tiempoRestante = DURACION;
  let jugando = false;
  let pausado = false;
  let frameId = null;
  let timerInterval = null;
  let spawnInterval = null;
  let ultimoFrame = 0;
  let particulas = [];
  let mensajes = [];
  let dificultad = 1;

  // ---- INIT ----
  function initJuego() {
    canvas = document.getElementById('canvas-juego');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Ajustar tamaño responsive
    ajustarCanvas();
    window.addEventListener('resize', ajustarCanvas);

    // Controles de ratón
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      redX = (e.clientX - rect.left) * scaleX;
    });

    // Controles táctiles
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      redX = (e.touches[0].clientX - rect.left) * scaleX;
    }, { passive: false });

    dibujarFondo();
  }

  function ajustarCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    const maxW = Math.min(container.clientWidth - 6, 700);
    canvas.style.width  = maxW + 'px';
    canvas.style.height = (maxW * CANVAS_H / CANVAS_W) + 'px';
  }

  // ---- CONTROL ----
  window.iniciarJuego = function() {
    document.getElementById('pantalla-inicio').style.display = 'none';
    document.getElementById('pantalla-fin').style.display = 'none';
    reiniciarEstado();
    jugando = true;
    pausado = false;
    startTimer();
    startSpawn();
    requestAnimationFrame(loop);
  };

  window.reiniciarJuego = function() {
    document.getElementById('pantalla-fin').style.display = 'none';
    reiniciarEstado();
    jugando = true;
    pausado = false;
    startTimer();
    startSpawn();
    requestAnimationFrame(loop);
  };

  window.pausarJuego = function() {
    if (!jugando) return;
    const btn = document.getElementById('btn-pausa');
    if (pausado) {
      pausado = false;
      btn.textContent = '⏸ Pausa';
      startTimer();
      startSpawn();
      requestAnimationFrame(loop);
    } else {
      pausado = true;
      btn.textContent = '▶ Continuar';
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      cancelAnimationFrame(frameId);
    }
  };

  function reiniciarEstado() {
    cancelAnimationFrame(frameId);
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    objetos = [];
    particulas = [];
    mensajes = [];
    puntuacion = 0;
    vidas = VIDAS_INICIALES;
    tiempoRestante = DURACION;
    dificultad = 1;
    redX = CANVAS_W / 2;
    actualizarHUDJuego();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (pausado || !jugando) return;
      tiempoRestante--;
      dificultad = 1 + (DURACION - tiempoRestante) / DURACION * 2;
      document.getElementById('j-tiempo').textContent = tiempoRestante;
      if (tiempoRestante <= 0) terminarJuego();
    }, 1000);
  }

  function startSpawn() {
    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
      if (!jugando || pausado) return;
      spawnObjeto();
      // Mayor dificultad = más objetos
      if (dificultad > 1.5 && Math.random() < 0.4) spawnObjeto();
    }, Math.max(500, 1100 - dificultad * 180));
  }

  function spawnObjeto() {
    // 70% animales buenos, 30% malos
    const pool = Math.random() < 0.70
      ? ANIMALES.filter(a => a.tipo === 'bueno')
      : ANIMALES.filter(a => a.tipo === 'malo');
    const def = pool[Math.floor(Math.random() * pool.length)];

    objetos.push({
      x: 30 + Math.random() * (CANVAS_W - 60),
      y: -40,
      vy: 1.5 + Math.random() * 1.5 * dificultad,
      emoji: def.emoji,
      nombre: def.nombre,
      puntos: def.puntos,
      tipo: def.tipo,
      size: 48,
      rotacion: (Math.random() - 0.5) * 0.4,
      angulo: 0,
    });
  }

  // ---- GAME LOOP ----
  function loop(ts) {
    if (!jugando || pausado) return;
    const dt = Math.min((ts - ultimoFrame) / 16, 3);
    ultimoFrame = ts;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    dibujarFondo();
    actualizarObjetos(dt);
    dibujarObjetos();
    actualizarParticulas(dt);
    dibujarParticulas();
    dibujarMensajes(dt);
    dibujarRed();

    frameId = requestAnimationFrame(loop);
  }

  // ---- FONDO ----
  function dibujarFondo() {
    // Cielo
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H * 0.6);
    sky.addColorStop(0, '#5DADE2');
    sky.addColorStop(1, '#85C1E9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.6);

    // Sol
    ctx.save();
    ctx.shadowColor = 'rgba(255,215,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(CANVAS_W - 80, 55, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Nubes
    dibujarNube(ctx, 80, 50, 0.9);
    dibujarNube(ctx, 300, 35, 0.7);
    dibujarNube(ctx, 520, 65, 1.0);

    // Mar
    const mar = ctx.createLinearGradient(0, CANVAS_H * 0.58, 0, CANVAS_H * 0.75);
    mar.addColorStop(0, '#1ABC9C');
    mar.addColorStop(1, '#148F77');
    ctx.fillStyle = mar;
    ctx.fillRect(0, CANVAS_H * 0.58, CANVAS_W, CANVAS_H * 0.17);

    // Olas
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(80 + i * 140, CANVAS_H * 0.6, 55, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arena
    const arena = ctx.createLinearGradient(0, CANVAS_H * 0.75, 0, CANVAS_H);
    arena.addColorStop(0, '#F9E44A');
    arena.addColorStop(1, '#D4AC0D');
    ctx.fillStyle = arena;
    ctx.fillRect(0, CANVAS_H * 0.75, CANVAS_W, CANVAS_H * 0.25);

    // Detalle arena
    ctx.fillStyle = 'rgba(180,140,0,0.2)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(50 + i * 90, CANVAS_H * 0.82, 30 + i % 3 * 15, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Palmeras
    dibujarPalmera(ctx, 30, CANVAS_H * 0.75);
    dibujarPalmera(ctx, CANVAS_W - 30, CANVAS_H * 0.75);
  }

  function dibujarNube(ctx, x, y, s) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 28 * s, y - 6 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 50 * s, y, 20 * s, 0, Math.PI * 2);
    ctx.arc(x + 25 * s, y + 8 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function dibujarPalmera(ctx, x, baseY) {
    ctx.save();
    ctx.strokeStyle = '#7D5A1E';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const dir = x < 100 ? 1 : -1;
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + dir * 15, baseY - 40, x + dir * 10, baseY - 80);
    ctx.stroke();

    ctx.fillStyle = '#27AE60';
    const hojas = 5;
    for (let i = 0; i < hojas; i++) {
      const ang = (i / hojas) * Math.PI * 2;
      ctx.save();
      ctx.translate(x + dir * 10, baseY - 80);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(18, 0, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- OBJETOS ----
  function actualizarObjetos(dt) {
    redX = Math.max(RED_W / 2, Math.min(CANVAS_W - RED_W / 2, redX));
    const redY = CANVAS_H - 45;

    for (let i = objetos.length - 1; i >= 0; i--) {
      const o = objetos[i];
      o.y += o.vy * dt;
      o.angulo += o.rotacion * dt;

      // Colisión con red
      const dx = Math.abs(o.x - redX);
      const dy = Math.abs(o.y - (redY + RED_H / 2));
      if (dx < RED_W / 2 + o.size / 3 && dy < RED_H + o.size / 3) {
        atrapar(o, i);
        continue;
      }

      // Fuera de pantalla
      if (o.y > CANVAS_H + 50) {
        if (o.tipo === 'bueno') {
          vidas = Math.max(0, vidas - 1);
          document.getElementById('j-vidas').textContent = vidas;
          spawnMensaje('💔 ¡Se escapó!', o.x, CANVAS_H - 30, '#E74C3C');
          if (vidas <= 0) { terminarJuego(); return; }
        }
        objetos.splice(i, 1);
      }
    }
  }

  function atrapar(o, idx) {
    objetos.splice(idx, 1);
    puntuacion = Math.max(0, puntuacion + o.puntos);
    actualizarHUDJuego();

    const color = o.tipo === 'bueno' ? '#27AE60' : '#E74C3C';
    const txt   = o.tipo === 'bueno' ? `+${o.puntos} ¡${o.nombre}!` : `${o.puntos} 💀`;
    spawnMensaje(txt, o.x, o.y, color);
    spawnExplosion(o.x, o.y, color, o.tipo === 'bueno' ? 12 : 8);

    if (o.tipo === 'malo') {
      vidas = Math.max(0, vidas - 1);
      document.getElementById('j-vidas').textContent = vidas;
      if (vidas <= 0) terminarJuego();
    }
  }

  function dibujarObjetos() {
    objetos.forEach(o => {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angulo);

      // Círculo blanco de fondo para que el emoji se vea nítido
      ctx.beginPath();
      ctx.arc(0, 0, o.size * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Borde verde o rojo según tipo
      ctx.strokeStyle = o.tipo === 'bueno' ? '#27AE60' : '#E74C3C';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Emoji grande y completamente opaco
      ctx.font = `${o.size * 1.1}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1;
      ctx.fillText(o.emoji, 0, 1);

      ctx.restore();
    });
  }

  // ---- RED ----
  function dibujarRed() {
    const rx = Math.max(RED_W / 2, Math.min(CANVAS_W - RED_W / 2, redX));
    const ry = CANVAS_H - 45;

    ctx.save();
    // Mango
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rx, ry - 12);
    ctx.lineTo(rx, ry - 40);
    ctx.stroke();

    // Aro
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(rx, ry, RED_W / 2, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Red
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const nx = rx - RED_W / 2 + t * RED_W;
      ctx.beginPath();
      ctx.moveTo(nx, ry);
      ctx.lineTo(nx + (t - 0.5) * 10, ry + RED_H);
      ctx.stroke();
    }
    for (let j = 1; j <= 3; j++) {
      const ny = ry + (j / 4) * RED_H;
      const spread = (j / 4) * 8;
      ctx.beginPath();
      ctx.moveTo(rx - RED_W / 2 + spread, ny - spread * 0.3);
      ctx.lineTo(rx + RED_W / 2 - spread, ny - spread * 0.3);
      ctx.stroke();
    }

    // Cursor personalizado
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤚', rx, ry - 45);
    ctx.restore();
  }

  // ---- PARTÍCULAS ----
  function spawnExplosion(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      particulas.push({
        x, y,
        vx: Math.cos(ang) * (2 + Math.random() * 3),
        vy: Math.sin(ang) * (2 + Math.random() * 3),
        vida: 1,
        color,
        r: 4 + Math.random() * 4,
      });
    }
  }

  function actualizarParticulas(dt) {
    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.1 * dt;
      p.vida -= 0.04 * dt;
      if (p.vida <= 0) particulas.splice(i, 1);
    }
  }

  function dibujarParticulas() {
    particulas.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.vida;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ---- MENSAJES FLOTANTES ----
  function spawnMensaje(txt, x, y, color) {
    mensajes.push({ txt, x, y, color, vida: 1.5, vy: -1.5 });
  }

  function dibujarMensajes(dt) {
    for (let i = mensajes.length - 1; i >= 0; i--) {
      const m = mensajes[i];
      m.y += m.vy * dt;
      m.vida -= 0.04 * dt;
      if (m.vida <= 0) { mensajes.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.min(m.vida, 1);
      ctx.font = 'bold 16px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 3;
      ctx.strokeText(m.txt, m.x, m.y);
      ctx.fillText(m.txt, m.x, m.y);
      ctx.restore();
    }
  }

  // ---- HUD ----
  function actualizarHUDJuego() {
    document.getElementById('j-puntos').textContent = puntuacion;
    document.getElementById('j-vidas').textContent = vidas;
  }

  // ---- FIN ----
  function terminarJuego() {
    jugando = false;
    cancelAnimationFrame(frameId);
    clearInterval(timerInterval);
    clearInterval(spawnInterval);

    const pantalla = document.getElementById('pantalla-fin');
    const titulo   = document.getElementById('fin-titulo');
    const sub      = document.getElementById('fin-sub');

    if (puntuacion >= 100) {
      titulo.textContent = '🏆 ¡Increíble Guardián!';
    } else if (puntuacion >= 50) {
      titulo.textContent = '🌟 ¡Buen trabajo!';
    } else {
      titulo.textContent = '🌊 ¡Sigue intentando!';
    }

    sub.textContent = `Rescataste animales y obtuviste ${puntuacion} puntos`;
    pantalla.style.display = 'flex';

    // Sumar puntos al juego principal
    if (typeof window.sumarPuntosJuego === 'function') {
      window.sumarPuntosJuego(Math.floor(puntuacion / 5));
    }
  }

  // Arrancar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJuego);
  } else {
    initJuego();
  }

};