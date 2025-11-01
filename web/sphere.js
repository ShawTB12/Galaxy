// Three.jsのシーン設定
let scene, camera, renderer, stars, controls;
let rotationSpeed = 0.005;

// パラメータ
let params = {
    starCount: 8000,
    radius: 5,
    starSize: 0.1,
    rotationSpeed: 0.5
};

function init() {
    // シーンの作成
    scene = new THREE.Scene();
    
    // カメラの設定
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 12;
    
    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // 球体の星を生成
    createSphere();
    
    // 環境光を追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // イベントリスナー
    window.addEventListener('resize', onWindowResize);
    setupControls();
    
    // マウスドラッグで回転
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            rotation.y += deltaX * 0.005;
            rotation.x += deltaY * 0.005;
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    // アニメーション開始
    animate(rotation);
}

function createSphere() {
    // 既存の球体があれば削除
    if (stars) {
        scene.remove(stars);
        stars.geometry.dispose();
        stars.material.dispose();
    }
    
    // ジオメトリの作成
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // 球面上にランダムに点を配置（フィボナッチ球面分布）
    for (let i = 0; i < params.starCount; i++) {
        // フィボナッチ球面分布
        const y = 1 - (i / (params.starCount - 1)) * 2; // -1 から 1
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = ((1 + Math.sqrt(5)) / 2) * i * Math.PI * 2; // 黄金角
        
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        
        // 球の半径を適用
        positions.push(x * params.radius, y * params.radius, z * params.radius);
        
        // カラフルな色を生成
        const hue = Math.random();
        const saturation = 0.8 + Math.random() * 0.2;
        const lightness = 0.6 + Math.random() * 0.3;
        
        const color = new THREE.Color();
        color.setHSL(hue, saturation, lightness);
        
        colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // マテリアルの作成
    const material = new THREE.PointsMaterial({
        size: params.starSize,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    // 点群オブジェクトの作成
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function animate(rotation) {
    requestAnimationFrame(() => animate(rotation));
    
    // 自動回転
    if (params.rotationSpeed > 0) {
        stars.rotation.y += params.rotationSpeed * 0.001;
        stars.rotation.x += params.rotationSpeed * 0.0005;
    }
    
    // マウスドラッグによる回転を適用
    stars.rotation.x = rotation.x;
    stars.rotation.y += rotation.y * 0.1;
    rotation.y *= 0.95; // 減衰
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupControls() {
    // 星の数
    const starCountSlider = document.getElementById('starCount');
    const starCountValue = document.getElementById('countValue');
    starCountSlider.addEventListener('input', (e) => {
        params.starCount = parseInt(e.target.value);
        starCountValue.textContent = params.starCount;
    });
    
    // 半径
    const radiusSlider = document.getElementById('radius');
    const radiusValue = document.getElementById('radiusValue');
    radiusSlider.addEventListener('input', (e) => {
        params.radius = parseFloat(e.target.value);
        radiusValue.textContent = params.radius.toFixed(1);
    });
    
    // 星のサイズ
    const sizeSlider = document.getElementById('starSize');
    const sizeValue = document.getElementById('sizeValue');
    sizeSlider.addEventListener('input', (e) => {
        params.starSize = parseFloat(e.target.value);
        sizeValue.textContent = params.starSize.toFixed(2);
        if (stars) {
            stars.material.size = params.starSize;
        }
    });
    
    // 回転速度
    const speedSlider = document.getElementById('rotationSpeed');
    const speedValue = document.getElementById('speedValue');
    speedSlider.addEventListener('input', (e) => {
        params.rotationSpeed = parseFloat(e.target.value);
        speedValue.textContent = params.rotationSpeed.toFixed(1);
    });
    
    // 再生成ボタン
    const regenerateButton = document.getElementById('regenerate');
    regenerateButton.addEventListener('click', () => {
        createSphere();
    });
}

// 初期化
init();

