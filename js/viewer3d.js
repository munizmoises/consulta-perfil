// visualizador dos .stl - precisa do three.min.js antes
// ex: Viewer3D.montar(div, "assets/models/chroma/NYL-394.stl")
(function (global) {
  function lerSTL(buf) {
    var dv = new DataView(buf), n = dv.getUint32(80, true);
    if (84 + n * 50 !== buf.byteLength) throw new Error("STL inválido (use STL binário)");
    var pos = new Float32Array(n * 9), o = 84, k = 0;
    for (var i = 0; i < n; i++) {
      o += 12;
      for (var j = 0; j < 9; j++, o += 4) pos[k++] = dv.getFloat32(o, true);
      o += 2;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }

  function montar(container, url, opcoes) {
    opcoes = opcoes || {};
    var estado = { vivo: true };
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      container.textContent = "3D indisponível neste navegador";
      return estado;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var cv = renderer.domElement;
    cv.className = "viewer3d-canvas";
    container.appendChild(cv);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 1, 1000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8894a8, 1.1));
    var key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(40, 60, 50); scene.add(key);
    var back = new THREE.DirectionalLight(0xffffff, 0.6); back.position.set(-50, 20, -40); scene.add(back);

    var s = { theta: 0.75, phi: 1.1, r: 120 }, home = { theta: 0.75, phi: 1.1, r: 120 }, auto = true;
    var ptrs = {}, lastDist = 0;

    // cor da peça: a que veio nas opções, ou a que a pessoa escolher nas bolinhas de cor da ficha
    var corPadrao = opcoes.cor || "#25272b", corAtual = corPadrao, mat = null, linhas = null;
    function pintar(hex) {
      corAtual = hex || corPadrao;
      if (!mat) return;
      mat.color.set(corAtual);
      var c = mat.color, clara = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.35;
      linhas.color.set(clara ? 0x4a5361 : 0x8fa0b8);
    }
    function aoTrocarCor(e) { pintar(e.detail); }
    document.addEventListener("cor-3d", aoTrocarCor);

    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      var geo = lerSTL(buf);
      geo.computeBoundingBox();
      var bb = geo.boundingBox, c = new THREE.Vector3(); bb.getCenter(c);
      var size = bb.getSize(new THREE.Vector3()).length();
      mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-c.x, -c.y, -c.z); scene.add(mesh);
      linhas = new THREE.LineBasicMaterial();
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), linhas);
      edges.position.copy(mesh.position); scene.add(edges);
      pintar(corAtual);
      s.r = home.r = size * 2.0;
    }).catch(function (e) {
      container.dispatchEvent(new CustomEvent("viewer3d-erro", { detail: e }));
    });

    function posicionar() {
      s.phi = Math.max(0.1, Math.min(Math.PI - 0.1, s.phi));
      s.r = Math.max(home.r * 0.4, Math.min(home.r * 2.5, s.r));
      camera.position.set(s.r * Math.sin(s.phi) * Math.sin(s.theta), s.r * Math.cos(s.phi), s.r * Math.sin(s.phi) * Math.cos(s.theta));
      camera.lookAt(0, 0, 0);
    }
    cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; auto = false; });
    cv.addEventListener("pointermove", function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var ids = Object.keys(ptrs);
      if (ids.length === 2) {
        ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDist) s.r *= lastDist / d; lastDist = d; return;
      }
      s.theta -= (e.clientX - p.x) * 0.01; s.phi -= (e.clientY - p.y) * 0.01;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    });
    function soltar(e) { delete ptrs[e.pointerId]; lastDist = 0; }
    cv.addEventListener("pointerup", soltar); cv.addEventListener("pointercancel", soltar);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); s.r *= (e.deltaY > 0 ? 1.08 : 0.92); auto = false; }, { passive: false });
    if (opcoes.duploCliqueReinicia !== false) {
      cv.addEventListener("dblclick", function () { s.theta = home.theta; s.phi = home.phi; s.r = home.r; auto = true; });
    }

    function ajustar() {
      var w = container.clientWidth || 200, h = container.clientHeight || 130;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    var ro = new ResizeObserver(ajustar); ro.observe(container); ajustar();

    // o card entra na página depois, então espera ele aparecer; se sumir (trocou de ficha) para tudo
    var jaAnexado = false, espera = 0;
    // o navegador só aguenta uns 16 contextos WebGL; solta o deste quando a ficha fecha
    function encerrar() { estado.vivo = false; ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); document.removeEventListener("cor-3d", aoTrocarCor); }
    (function loop() {
      if (!estado.vivo) { encerrar(); return; }
      if (container.isConnected) {
        if (!jaAnexado) { jaAnexado = true; ajustar(); }
      } else if (jaAnexado || ++espera > 600) { encerrar(); return; }
      requestAnimationFrame(loop);
      if (!jaAnexado) return;
      if (auto) s.theta += 0.005;
      posicionar(); renderer.render(scene, camera);
    })();
    return estado;
  }

  global.Viewer3D = { montar: montar };
})(window);
