interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const CONFETTI_COLORS = [
  '#6b8266', // Forest green
  '#a47f63', // Cappuccino brown
  '#c88061', // Orange accent
  '#5b84b1', // Blue accent
  '#918579', // Mocha header
  '#bbaea1'  // Tan highlight
];

export function triggerConfetti(): void {
  // Check if canvas already exists, or create a new one
  let canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size matching window
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: ConfettiParticle[] = [];
  const particleCount = 120;

  // Create particles erupting from the center-bottom and corners
  for (let i = 0; i < particleCount; i++) {
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? window.innerWidth * 0.1 : window.innerWidth * 0.9;
    const startY = window.innerHeight * 0.9;

    const angle = fromLeft
      ? (Math.random() * 45 - 60) * (Math.PI / 180)  // Shoot up-right
      : (Math.random() * 45 - 120) * (Math.PI / 180); // Shoot up-left

    const speed = Math.random() * 15 + 10;

    particles.push({
      x: startX,
      y: startY,
      size: Math.random() * 8 + 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  const gravity = 0.45;
  const friction = 0.985;
  let frameCount = 0;

  function updateAndDraw(): void {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    particles.forEach(p => {
      if (p.opacity <= 0 || p.y > canvas.height) return;

      activeParticles++;

      // Update positions
      p.speedX *= friction;
      p.speedY += gravity; // Gravity pull
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      
      // Slowly fade out after a second
      if (frameCount > 60) {
        p.opacity -= 0.015;
      }

      // Draw particle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * (Math.PI / 180));
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.opacity);
      
      // Draw rectangular confetti piece
      ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.5);
      ctx.restore();
    });

    frameCount++;

    // Loop animation while active particles exist and opacity is above 0
    if (activeParticles > 0 && frameCount < 180) {
      requestAnimationFrame(updateAndDraw);
    } else {
      // Clean up DOM canvas element once finished
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  // Handle screen resize during animation
  const resizeHandler = () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  window.addEventListener('resize', resizeHandler);

  // Start loop
  updateAndDraw();

  // Remove resize handler on close
  setTimeout(() => {
    window.removeEventListener('resize', resizeHandler);
  }, 4000);
}
