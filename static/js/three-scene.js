/* ============================================================
   NEXORA — Three.js Hero Scene
   Floating wireframe particles + central torusknot centerpiece
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return; // Only run on pages with the hero canvas

  /* ---------- core Three.js setup ---------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.045);

  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a1a, 1);

  /* ---------- colours ---------- */
  const CYAN = 0x00f0ff;
  const VIOLET = 0xa855f7;

  /* ---------- lighting (subtle, for MeshBasicMaterial we don't need much) ---------- */
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  /* ---------- particle pool ---------- */
  const PARTICLE_COUNT = 50;
  const particles = [];

  function createParticle() {
    const isIco = Math.random() > 0.5;
    const size = 0.15 + Math.random() * 0.35;
    const geometry = isIco
      ? new THREE.IcosahedronGeometry(size, 0)
      : new THREE.OctahedronGeometry(size, 0);

    const color = Math.random() > 0.5 ? CYAN : VIOLET;
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.4 + Math.random() * 0.4,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Spread particles in a wide volume
    mesh.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 14 - 2
    );

    // Random rotation speeds
    mesh.userData = {
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01,
      },
      driftSpeed: 0.003 + Math.random() * 0.008,
      sineAmp: 0.3 + Math.random() * 0.6,
      sineFreq: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
    };

    scene.add(mesh);
    particles.push(mesh);
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    createParticle();
  }

  /* ---------- central hero piece — TorusKnot ---------- */
  const heroGeometry = new THREE.TorusKnotGeometry(2.8, 0.7, 120, 16, 2, 3);
  const heroMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  const heroMesh = new THREE.Mesh(heroGeometry, heroMaterial);
  scene.add(heroMesh);

  // Second layer — slightly larger, violet
  const heroGeometry2 = new THREE.TorusKnotGeometry(3.0, 0.75, 100, 14, 2, 3);
  const heroMaterial2 = new THREE.MeshBasicMaterial({
    color: VIOLET,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });
  const heroMesh2 = new THREE.Mesh(heroGeometry2, heroMaterial2);
  scene.add(heroMesh2);

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

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Animate particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const d = p.userData;

      // Rotate
      p.rotation.x += d.rotSpeed.x;
      p.rotation.y += d.rotSpeed.y;
      p.rotation.z += d.rotSpeed.z;

      // Drift upward, reset when too high
      p.position.y += d.driftSpeed;
      if (p.position.y > 12) {
        p.position.y = -12;
        p.position.x = (Math.random() - 0.5) * 30;
        d.baseX = p.position.x;
      }

      // Sine-wave horizontal oscillation
      p.position.x =
        d.baseX + Math.sin(elapsed * d.sineFreq + d.phase) * d.sineAmp;

      // Mouse parallax — particles shift based on depth
      const depth = (p.position.z + 10) / 20; // 0..1 normalised depth
      p.position.x += mouse.x * 1.5 * depth;
      p.position.y += mouse.y * 0.8 * depth;
    }

    // Rotate hero centerpiece
    heroMesh.rotation.x = elapsed * 0.08;
    heroMesh.rotation.y = elapsed * 0.12;
    heroMesh2.rotation.x = -elapsed * 0.06;
    heroMesh2.rotation.y = -elapsed * 0.1;

    // Subtle camera shift based on mouse
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 0.8 - camera.position.y) * 0.02;
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

  // Initial size sync (in case CSS hasn't settled yet)
  setTimeout(onResize, 100);
})();
