/* ============================================================
   NEXORA — Champagne Gold Stardust Wave Scene
   Immersive, elegant particle waves for a premium lifestyle storefront.
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return; // Only run on pages with the hero canvas

  /* ---------- core Three.js setup ---------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d0e10, 0.035); // Matches obsidian background

  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* ---------- champagne gold color ---------- */
  const GOLD = 0xc5a880;

  /* ---------- particle configurations ---------- */
  const PARTICLE_COUNT = 1500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const particleMeta = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute in a wide wave-like slab in 3D space
    const x = (Math.random() - 0.5) * 45;
    const y = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 18 - 2;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    particleMeta.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      speed: 0.15 + Math.random() * 0.4,
      waveAmp: 0.8 + Math.random() * 1.4,
      waveFreq: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Premium soft round particle styling
  const material = new THREE.PointsMaterial({
    color: GOLD,
    size: 0.11,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  /* ---------- mouse tracking ---------- */
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  document.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ---------- animation loop ---------- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse interpolation (smooth parallax)
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    const posAttr = points.geometry.attributes.position;
    const array = posAttr.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const meta = particleMeta[i];

      // 1. Organic Wave Movement (sine wave undulating)
      const waveShift = Math.sin(elapsed * meta.speed + meta.phase) * meta.waveAmp;
      
      // Calculate depth multiplier for parallax
      const depth = (meta.baseZ + 10) / 20; // 0..1 range

      // 2. Combine base positions + wave movement + mouse parallax shifts
      array[i * 3] = meta.baseX + (mouse.x * 2.5 * depth);
      array[i * 3 + 1] = meta.baseY + waveShift + (mouse.y * 1.2 * depth);
      array[i * 3 + 2] = meta.baseZ;
    }

    posAttr.needsUpdate = true;

    // Camera follow look
    camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  /* ---------- resize handler ---------- */
  function onResize() {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize);
  setTimeout(onResize, 100);
})();
