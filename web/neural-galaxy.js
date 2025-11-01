// ==========================================
// 組織の神経宇宙 - Neural Organization Galaxy
// ==========================================

// Three.js基本設定
let scene, camera, renderer, raycaster, mouse;
let galaxyGroup, clusterGroups = [];
let agents = [], connections = [];
let selectedCluster = null, selectedAgent = null;
let time = 0;
let currentTheme = 'neural';

// シナプスパーティクルシステム用
let pointCloud;
let lineMesh;
let particleVelocity = [];
const sphereRadius = 8; // 球体の境界半径
const maxVelocity = 0.01; // パーティクルの最大速度（ゆっくり）

// 部署データ（球面座標で配置）
const departments = [
    {
        id: 'sales',
        name: '営業部門',
        color: 0x2196F3, // Blue
        theta: 0,
        phi: Math.PI / 3,
        memberCount: 45,
        avgRate: 92,
        topProject: '顧客分析AI'
    },
    {
        id: 'tech',
        name: '技術部門',
        color: 0xFFC107, // Yellow
        theta: (Math.PI * 2) / 5,
        phi: Math.PI / 2.5,
        memberCount: 68,
        avgRate: 88,
        topProject: '自動テストシステム'
    },
    {
        id: 'marketing',
        name: 'マーケティング',
        color: 0x4CAF50, // Green
        theta: (Math.PI * 2 * 2) / 5,
        phi: Math.PI / 2,
        memberCount: 32,
        avgRate: 85,
        topProject: 'コンテンツ生成AI'
    },
    {
        id: 'hr',
        name: '人事部門',
        color: 0xE91E63, // Pink
        theta: (Math.PI * 2 * 3) / 5,
        phi: Math.PI / 1.8,
        memberCount: 28,
        avgRate: 78,
        topProject: '採用支援AI'
    },
    {
        id: 'strategy',
        name: '経営企画',
        color: 0x9C27B0, // Purple
        theta: (Math.PI * 2 * 4) / 5,
        phi: Math.PI / 3,
        memberCount: 24,
        avgRate: 95,
        topProject: '経営分析ダッシュボード'
    }
];

// カラーテーマ
const themes = {
    neural: {
        bg: 0x000510,
        fog: 0x001020,
        ambient: 0x2040ff,
        stars: 0xffffff
    },
    solar: {
        bg: 0x0a0500,
        fog: 0x201000,
        ambient: 0xff8020,
        stars: 0xffaa44
    },
    cognitive: {
        bg: 0x000000,
        fog: 0x0a0a0a,
        ambient: 0x00ffff,
        stars: 0x00ff88
    },
    living: {
        bg: 0x001010,
        fog: 0x002020,
        ambient: 0x00ff88,
        stars: 0x88ffaa
    }
};

// 初期化
function init() {
    // シーン作成
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(themes[currentTheme].fog, 0.015);
    
    // カメラ設定（サイドバーが開いている状態のアスペクト比）
    const containerWidth = window.innerWidth - 280;
    camera = new THREE.PerspectiveCamera(
        60,
        containerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);
    
    // レンダラー設定
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    
    // 初期サイズ設定（サイドバーが開いている状態）
    renderer.setSize(containerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(themes[currentTheme].bg);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // ライト
    const ambientLight = new THREE.AmbientLight(themes[currentTheme].ambient, 0.4);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    
    // 銀河グループ
    galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);
    
    // ブルーネオン球体フレームを作成
    createNeonSphereFrame();
    
    // 背景の星空
    createBackgroundStars();
    
    // 組織構造を生成
    createOrganizationGalaxy();
    
    // Raycaster（クリック検出用）
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // イベントリスナー
    setupEventListeners();
    
    // サイドバー機能をセットアップ
    setupSidebar();
    
    // ローディング非表示
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
    }, 1000);
    
    // アニメーション開始
    animate();
}

// ブルーネオン球体フレームを作成
function createNeonSphereFrame() {
    // メインの球体ワイヤーフレーム（外側）
    const sphereRadius = 8;
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const sphereEdges = new THREE.EdgesGeometry(sphereGeometry);
    const sphereMaterial = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.15,
        linewidth: 1,
        depthTest: true,
        depthWrite: false
    });
    const sphereFrame = new THREE.LineSegments(sphereEdges, sphereMaterial);
    sphereFrame.userData.type = 'sphereFrame';
    sphereFrame.renderOrder = 0; // 最背面に表示
    galaxyGroup.add(sphereFrame);
    
    // グロー効果を削除してシンプルに
    // const glowGeometry1 = new THREE.SphereGeometry(sphereRadius, 32, 32);
    // const glowMaterial1 = new THREE.MeshBasicMaterial({
    //     color: 0x0088ff,
    //     transparent: true,
    //     opacity: 0.02,
    //     side: THREE.BackSide,
    //     blending: THREE.AdditiveBlending,
    //     depthTest: true,
    //     depthWrite: false
    // });
    // const glowSphere1 = new THREE.Mesh(glowGeometry1, glowMaterial1);
    // glowSphere1.userData.type = 'glowSphere';
    // glowSphere1.renderOrder = 1;
    // galaxyGroup.add(glowSphere1);
    
    // 内側のグロー球体も削除
    // const glowGeometry2 = new THREE.SphereGeometry(sphereRadius * 0.98, 32, 32);
    // const glowMaterial2 = new THREE.MeshBasicMaterial({
    //     color: 0x00bbff,
    //     transparent: true,
    //     opacity: 0.03,
    //     side: THREE.FrontSide,
    //     blending: THREE.AdditiveBlending,
    //     depthTest: true,
    //     depthWrite: false
    // });
    // const glowSphere2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
    // glowSphere2.userData.type = 'glowSphere';
    // glowSphere2.renderOrder = 2;
    // galaxyGroup.add(glowSphere2);
    
    // 経度線、緯度線、螺旋は削除してシンプルに
    /*
    // 経度線（縦の円）
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const curve = new THREE.EllipseCurve(
            0, 0,
            sphereRadius, sphereRadius,
            0, 2 * Math.PI,
            false,
            0
        );
        const points = curve.getPoints(64);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // 3Dにするためにz座標を追加
        const positions = geometry.attributes.position.array;
        for (let j = 0; j < positions.length; j += 3) {
            const x = positions[j];
            const y = positions[j + 1];
            const rotatedX = x * Math.cos(angle);
            const rotatedZ = x * Math.sin(angle);
            positions[j] = rotatedX;
            positions[j + 2] = rotatedZ;
        }
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false
        });
        const line = new THREE.Line(geometry, material);
        line.userData.type = 'gridLine';
        line.renderOrder = 3;
        galaxyGroup.add(line);
    }
    
    // 緯度線（横の円）
    for (let i = 1; i < 8; i++) {
        const lat = (i / 8) * Math.PI - Math.PI / 2;
        const radius = sphereRadius * Math.cos(lat);
        const y = sphereRadius * Math.sin(lat);
        
        const curve = new THREE.EllipseCurve(
            0, 0,
            radius, radius,
            0, 2 * Math.PI,
            false,
            0
        );
        const points = curve.getPoints(64);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Y座標を設定
        const positions = geometry.attributes.position.array;
        for (let j = 0; j < positions.length; j += 3) {
            const temp = positions[j + 1];
            positions[j + 1] = y;
            positions[j + 2] = temp;
        }
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false
        });
        const line = new THREE.Line(geometry, material);
        line.userData.type = 'gridLine';
        line.renderOrder = 3;
        galaxyGroup.add(line);
    }
    
    // 螺旋軌道線（装飾）
    const spiralPoints = [];
    for (let i = 0; i < 200; i++) {
        const t = (i / 200) * Math.PI * 4;
        const radius = sphereRadius * 0.95;
        const x = radius * Math.sin(t) * Math.cos(t * 3);
        const y = radius * Math.cos(t);
        const z = radius * Math.sin(t) * Math.sin(t * 3);
        spiralPoints.push(new THREE.Vector3(x, y, z));
    }
    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false
    });
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    spiral.userData.type = 'spiral';
    spiral.renderOrder = 4;
    galaxyGroup.add(spiral);
    
    // 外側の大きなグロー球体（アウターオーラ）
    const outerGlowGeometry = new THREE.SphereGeometry(sphereRadius * 1.15, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.01,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.userData.type = 'outerGlow';
    outerGlow.renderOrder = 5;
    galaxyGroup.add(outerGlow);
    */
}

// 背景の星空
function createBackgroundStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    
    for (let i = 0; i < 2000; i++) {
        const radius = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        starPositions.push(x, y, z);
        
        const brightness = 0.5 + Math.random() * 0.5;
        starColors.push(brightness, brightness, brightness);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.3
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// 組織の銀河を生成（シナプス表現）
function createOrganizationGalaxy() {
    // 全パーティクル数を計算
    let totalParticles = 0;
    departments.forEach(dept => {
        totalParticles += dept.memberCount;
    });
    
    // パーティクルの位置と色の配列を準備
    const particlePositions = new Float32Array(totalParticles * 3);
    const particleColors = new Float32Array(totalParticles * 3);
    
    let particleIndex = 0;
    
    // 各部署ごとにパーティクルを生成
    departments.forEach((dept, deptIndex) => {
        const color = new THREE.Color(dept.color);
        
        for (let i = 0; i < dept.memberCount; i++) {
            // 球体内のランダムな位置に配置
            const r = (sphereRadius - 1) * Math.random();
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            particlePositions[particleIndex * 3] = r * Math.sin(phi) * Math.cos(theta);
            particlePositions[particleIndex * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            particlePositions[particleIndex * 3 + 2] = r * Math.cos(phi);
            
            // 色を設定
            particleColors[particleIndex * 3] = color.r;
            particleColors[particleIndex * 3 + 1] = color.g;
            particleColors[particleIndex * 3 + 2] = color.b;
            
            // 速度ベクトルを初期化
            particleVelocity[particleIndex] = new THREE.Vector3();
            particleVelocity[particleIndex].x = -1 + Math.random() * 2.0;
            particleVelocity[particleIndex].y = -1 + Math.random() * 2.0;
            particleVelocity[particleIndex].z = -1 + Math.random() * 2.0;
            particleVelocity[particleIndex].multiplyScalar(maxVelocity / Math.sqrt(3.0));
            
            particleIndex++;
        }
    });
    
    // パーティクルのジオメトリとマテリアルを作成
    const particles = new THREE.BufferGeometry();
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
    particles.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const pointMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthTest: true,
        depthWrite: false
    });
    
    pointCloud = new THREE.Points(particles, pointMaterial);
    pointCloud.renderOrder = 999; // 最前面に表示
    galaxyGroup.add(pointCloud);
    console.log('PointCloud added to scene:', pointCloud);
    
    // 線の頂点数を設定（近くのパーティクル間のみ接続）
    const maxConnections = totalParticles * 10; // 各パーティクルから最大10本の線
    const linePositions = new Float32Array(maxConnections * 6); // 線1本につき2頂点x3座標
    
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.15,
        linewidth: 1,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false
    });
    
    // LineSegmentsで線を生成
    lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    lineMesh.renderOrder = 998; // パーティクルの後ろに表示
    galaxyGroup.add(lineMesh);
    
    console.log('Particles created:', totalParticles);
    console.log('LineMesh added to scene:', lineMesh);
    console.log('Particle positions sample:', particlePositions.slice(0, 9));
}

// シナプスパーティクルの更新処理
function updateSynapseParticles() {
    if (!pointCloud || !lineMesh) return;
    
    const particlePositions = pointCloud.geometry.attributes.position.array;
    const linePositions = lineMesh.geometry.attributes.position.array;
    const particleNum = particlePositions.length / 3;
    const rHalf = sphereRadius / 2.0;
    const connectionDistance = 2.5; // 接続する最大距離（短めに）
    
    let vertexpos = 0;
    
    // パーティクルの位置を更新
    for (let i = 0; i < particleNum; i++) {
        // 速度を位置に加算
        particlePositions[i * 3] += particleVelocity[i].x;
        particlePositions[i * 3 + 1] += particleVelocity[i].y;
        particlePositions[i * 3 + 2] += particleVelocity[i].z;
        
        // 境界での反射処理
        if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf) {
            particleVelocity[i].x *= -1;
        }
        if (particlePositions[i * 3 + 1] < -rHalf || particlePositions[i * 3 + 1] > rHalf) {
            particleVelocity[i].y *= -1;
        }
        if (particlePositions[i * 3 + 2] < -rHalf || particlePositions[i * 3 + 2] > rHalf) {
            particleVelocity[i].z *= -1;
        }
    }
    
    // 線の頂点座標を更新（近くのパーティクル間のみ接続）
    for (let i = 0; i < particleNum; i++) {
        for (let j = i + 1; j < particleNum; j++) {
            const dx = particlePositions[i * 3] - particlePositions[j * 3];
            const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
            const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // 一定距離以内のパーティクル間に線を引く
            if (distance < connectionDistance) {
                if (vertexpos < linePositions.length) {
                    linePositions[vertexpos++] = particlePositions[i * 3];
                    linePositions[vertexpos++] = particlePositions[i * 3 + 1];
                    linePositions[vertexpos++] = particlePositions[i * 3 + 2];
                    
                    linePositions[vertexpos++] = particlePositions[j * 3];
                    linePositions[vertexpos++] = particlePositions[j * 3 + 1];
                    linePositions[vertexpos++] = particlePositions[j * 3 + 2];
                }
            }
        }
    }
    
    // 残りの線を原点に設定（見えなくする）
    while (vertexpos < linePositions.length) {
        linePositions[vertexpos++] = 0;
    }
    
    // 更新を通知するフラグ
    pointCloud.geometry.attributes.position.needsUpdate = true;
    lineMesh.geometry.attributes.position.needsUpdate = true;
}

// 名前生成（ダミー）
function generateName() {
    const firstNames = ['田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤'];
    const lastNames = ['太郎', '花子', '一郎', '美咲', '健太', 'さくら', '翔太', '優子', '大輔', '真理'];
    return firstNames[Math.floor(Math.random() * firstNames.length)] + 
           lastNames[Math.floor(Math.random() * lastNames.length)];
}

// アニメーション
function animate() {
    requestAnimationFrame(animate);
    time += 0.005;
    
    // シナプスパーティクルの更新
    updateSynapseParticles();
    
    // 銀河全体のゆっくりした回転
    galaxyGroup.rotation.y += 0.0001;
    
    // 球体フレームのパルス効果（穏やかに）
    galaxyGroup.children.forEach(child => {
        if (child.userData.type === 'sphereFrame') {
            // ワイヤーフレームの明滅（穏やか）
            child.material.opacity = 0.1 + Math.sin(time * 0.5) * 0.03;
        } else if (child.userData.type === 'glowSphere') {
            // グロー球体のパルス（穏やか）
            const pulse = Math.sin(time * 0.8) * 0.015 + 1;
            child.scale.setScalar(pulse);
        } else if (child.userData.type === 'gridLine') {
            // グリッド線の明滅（穏やか）
            child.material.opacity = 0.08 + Math.sin(time * 0.6 + child.id) * 0.02;
        } else if (child.userData.type === 'spiral') {
            // 螺旋の回転（ゆっくり）
            child.rotation.y += 0.0005;
            child.material.opacity = 0.05 + Math.sin(time * 0.7) * 0.02;
        } else if (child.userData.type === 'outerGlow') {
            // 外側グローのパルス（穏やか）
            const pulse = Math.sin(time * 0.5) * 0.02 + 1;
            child.scale.setScalar(pulse);
        }
    });
    
    // パーティクルクラウドのパルス効果（一旦無効化）
    // if (pointCloud) {
    //     pointCloud.material.opacity = 0.8 + Math.sin(time * 2) * 0.15;
    // }
    
    // 線のパルス効果（一旦無効化）
    // if (lineMesh) {
    //     lineMesh.material.opacity = 0.15 + Math.sin(time * 1.5) * 0.1;
    // }
    
    renderer.render(scene, camera);
}

// イベントリスナー設定
function setupEventListeners() {
    // ウィンドウリサイズ
    window.addEventListener('resize', onWindowResize);
    
    // マウス操作
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        // マウス位置更新（クリック検出用）
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            galaxyGroup.rotation.y += deltaX * 0.005;
            galaxyGroup.rotation.x += deltaY * 0.005;
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // ドラッグ中はすべてのUIを非表示
            hideTooltip();
            hideAllPanels();
        } else {
            // ホバー効果（ツールチップとパネルの表示）
            updateHoverEffects(e);
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // マウスがキャンバスから離れた時にすべてのUIを非表示
    renderer.domElement.addEventListener('mouseleave', () => {
        hideTooltip();
        hideAllPanels();
    });
    
    renderer.domElement.addEventListener('click', onClick);
    
    // ズーム
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * 0.01;
        camera.position.z += delta;
        camera.position.z = Math.max(10, Math.min(40, camera.position.z));
    });
}

// サイドバー機能のセットアップ
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const canvasContainer = document.getElementById('canvas-container');
    const legend = document.getElementById('legend');
    const menuItems = document.querySelectorAll('.menu-item');
    
    let isOpen = true; // デフォルトで開いた状態
    
    // 初期状態を設定
    toggleBtn.classList.add('active');
    legend.classList.add('shifted');
    // canvas-containerは初期状態で左:280pxなので、shiftedは不要
    
    // トグルボタンのクリック
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        const clusterPanel = document.getElementById('cluster-panel');
        
        if (isOpen) {
            sidebar.classList.remove('collapsed');
            toggleBtn.classList.add('active');
            canvasContainer.classList.remove('collapsed');
            legend.classList.add('shifted');
            clusterPanel.classList.remove('collapsed');
        } else {
            sidebar.classList.add('collapsed');
            toggleBtn.classList.remove('active');
            canvasContainer.classList.add('collapsed');
            legend.classList.remove('shifted');
            clusterPanel.classList.add('collapsed');
        }
        
        // カメラのアスペクト比を調整
        setTimeout(() => {
            onWindowResize();
        }, 400);
    });
    
    // メニューアイテムのクリック
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // アクティブ状態を切り替え
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            const page = item.dataset.page;
            handlePageChange(page);
        });
    });
}

// ページ切り替え処理
function handlePageChange(page) {
    console.log(`Navigating to: ${page}`);
    
    switch(page) {
        case 'home':
            // ホーム表示（現在の3D表示）
            document.getElementById('cluster-panel').style.display = 'none';
            document.getElementById('agent-detail').style.display = 'none';
            break;
            
        case 'dashboard':
            // ダッシュボード表示（将来の拡張用）
            alert('Dashboard機能は今後実装予定です');
            break;
            
        case 'settings':
            // 設定画面表示（将来の拡張用）
            alert('Settings機能は今後実装予定です');
            break;
    }
}

// ウィンドウリサイズ
function onWindowResize() {
    // サイドバーの状態を確認
    const sidebar = document.getElementById('sidebar');
    const isSidebarOpen = !sidebar.classList.contains('collapsed');
    
    // サイドバーが開いている場合は幅を調整
    const containerWidth = isSidebarOpen ? window.innerWidth - 280 : window.innerWidth;
    
    camera.aspect = containerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, window.innerHeight);
}

// クリックイベント
function onClick(event) {
    // クリック時は何もしない（ホバーで表示するため）
    // 必要に応じて、固定表示などの機能を追加可能
}

// ホバー効果を更新（ツールチップとパネル）
function updateHoverEffects(event) {
    raycaster.setFromCamera(mouse, camera);
    
    // ポイントクラウドとの交差判定
    if (pointCloud) {
        raycaster.params.Points.threshold = 0.5; // パーティクル検出の閾値
        const intersects = raycaster.intersectObject(pointCloud);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const index = intersect.index;
            
            // パーティクルのインデックスから部署情報を取得
            const particlePositions = pointCloud.geometry.attributes.position.array;
            const particleNum = particlePositions.length / 3;
            
            // パーティクルインデックスから部署を特定
            let currentIndex = 0;
            let deptInfo = null;
            
            for (let d = 0; d < departments.length; d++) {
                if (index >= currentIndex && index < currentIndex + departments[d].memberCount) {
                    deptInfo = departments[d];
                    break;
                }
                currentIndex += departments[d].memberCount;
            }
            
            if (deptInfo) {
                // ツールチップ表示
                const tooltip = document.getElementById('tooltip');
                tooltip.style.display = 'block';
                tooltip.style.left = event.clientX + 15 + 'px';
                tooltip.style.top = event.clientY + 15 + 'px';
                tooltip.textContent = deptInfo.name + ' - ' + generateName();
            }
            return;
        }
    }
    
    // 何も見つからない場合はすべて非表示
    hideTooltip();
    hideAllPanels();
}

// ツールチップを非表示にする
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// クラスタパネル表示
function showClusterPanel(dept, event) {
    const panel = document.getElementById('cluster-panel');
    const sidebar = document.getElementById('sidebar');
    const isSidebarOpen = !sidebar.classList.contains('collapsed');
    
    // サイドバーの状態に応じて位置を調整
    if (isSidebarOpen) {
        panel.classList.remove('collapsed');
    } else {
        panel.classList.add('collapsed');
    }
    
    panel.style.display = 'block';
    
    document.getElementById('cluster-name').textContent = dept.name;
    document.getElementById('cluster-rate').textContent = dept.avgRate + '%';
    document.getElementById('cluster-members').textContent = dept.memberCount + '人';
    document.getElementById('cluster-project').textContent = dept.topProject;
    
    // トップ3のエージェントを表示（ダミーデータ）
    const topNames = [
        { name: generateName(), rate: 95 + Math.floor(Math.random() * 5) },
        { name: generateName(), rate: 90 + Math.floor(Math.random() * 5) },
        { name: generateName(), rate: 85 + Math.floor(Math.random() * 5) }
    ];
    
    const cards = document.querySelectorAll('.agent-card');
    topNames.forEach((data, i) => {
        if (cards[i]) {
            cards[i].querySelector('.name').textContent = data.name;
            cards[i].querySelector('.score').textContent = data.rate + '%';
        }
    });
}

// エージェント詳細表示
function showAgentDetail(agent, event) {
    const detail = document.getElementById('agent-detail');
    
    // カーソルの横に配置（画面外に出ないように調整）
    const offsetX = 20;
    const offsetY = -50;
    let left = event.clientX + offsetX;
    let top = event.clientY + offsetY;
    
    // 画面の右端を超えないように調整
    if (left + 350 > window.innerWidth) {
        left = event.clientX - 370; // 左側に表示
    }
    
    // 画面の下端を超えないように調整
    if (top + 300 > window.innerHeight) {
        top = window.innerHeight - 320;
    }
    
    // 画面の上端を超えないように調整
    if (top < 10) {
        top = 10;
    }
    
    detail.style.left = left + 'px';
    detail.style.top = top + 'px';
    detail.style.display = 'block';
    
    document.getElementById('agent-name').textContent = agent.userData.name;
    document.getElementById('agent-dept').textContent = agent.userData.department.name;
    document.getElementById('agent-rate').textContent = agent.userData.rate + '%';
    document.getElementById('agent-output').textContent = agent.userData.output + '件';
    document.getElementById('agent-collab').textContent = agent.userData.collaborations + '部署';
    document.getElementById('agent-activity').textContent = '提案書生成、分析レポート';
}

// パネルを閉じる
function closeAgentDetail() {
    document.getElementById('agent-detail').style.display = 'none';
}

function hideAllPanels() {
    document.getElementById('cluster-panel').style.display = 'none';
    document.getElementById('agent-detail').style.display = 'none';
}

// 初期化実行
init();

