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
        opacity: 0.3,
        linewidth: 1
    });
    const sphereFrame = new THREE.LineSegments(sphereEdges, sphereMaterial);
    sphereFrame.userData.type = 'sphereFrame';
    galaxyGroup.add(sphereFrame);
    
    // グロー効果のための半透明球体（外側）
    const glowGeometry1 = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const glowMaterial1 = new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const glowSphere1 = new THREE.Mesh(glowGeometry1, glowMaterial1);
    glowSphere1.userData.type = 'glowSphere';
    galaxyGroup.add(glowSphere1);
    
    // 内側のグロー球体
    const glowGeometry2 = new THREE.SphereGeometry(sphereRadius * 0.98, 32, 32);
    const glowMaterial2 = new THREE.MeshBasicMaterial({
        color: 0x00bbff,
        transparent: true,
        opacity: 0.08,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending
    });
    const glowSphere2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
    glowSphere2.userData.type = 'glowSphere';
    galaxyGroup.add(glowSphere2);
    
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
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(geometry, material);
        line.userData.type = 'gridLine';
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
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(geometry, material);
        line.userData.type = 'gridLine';
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
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    spiral.userData.type = 'spiral';
    galaxyGroup.add(spiral);
    
    // 外側の大きなグロー球体（アウターオーラ）
    const outerGlowGeometry = new THREE.SphereGeometry(sphereRadius * 1.15, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.03,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.userData.type = 'outerGlow';
    galaxyGroup.add(outerGlow);
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
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// 組織の銀河を生成
function createOrganizationGalaxy() {
    const sphereRadius = 7.5; // 外枠の球体半径に合わせる
    
    departments.forEach((dept, deptIndex) => {
        const clusterGroup = new THREE.Group();
        clusterGroup.userData = { 
            type: 'cluster',
            department: dept
        };
        
        // 球面座標から直交座標に変換（球体表面に配置）
        const x = sphereRadius * Math.sin(dept.phi) * Math.cos(dept.theta);
        const y = sphereRadius * Math.cos(dept.phi);
        const z = sphereRadius * Math.sin(dept.phi) * Math.sin(dept.theta);
        
        clusterGroup.position.set(x, y, z);
        
        // 部署内のエージェント（社員）を生成
        const memberCount = dept.memberCount;
        
        for (let i = 0; i < memberCount; i++) {
            const agent = createAgent(dept, i, memberCount, sphereRadius);
            clusterGroup.add(agent);
            agents.push(agent);
        }
        
        // クラスタのオーラ（星雲効果）を球面に沿って配置
        createClusterAura(clusterGroup, dept, sphereRadius);
        
        galaxyGroup.add(clusterGroup);
        clusterGroups.push(clusterGroup);
    });
    
    // 部署間の連携線を生成
    createConnections();
}

// 個人エージェント（星）を生成 - 球面に沿って配置
function createAgent(dept, index, total, sphereRadius) {
    // クラスタ内での位置（球面表面に分散）
    const spread = 0.8; // 部署の広がり
    const angle = (index / total) * Math.PI * 2 + Math.random() * 0.3;
    const distance = 0.3 + Math.random() * 0.5;
    
    // 球面に沿った位置計算
    const localTheta = dept.theta + Math.cos(angle) * distance * spread;
    const localPhi = dept.phi + Math.sin(angle) * distance * spread;
    
    // 球面座標から直交座標へ（球体表面より少し内側）
    const radius = sphereRadius * (0.95 + Math.random() * 0.1); // 球面付近に配置
    const x = radius * Math.sin(localPhi) * Math.cos(localTheta);
    const y = radius * Math.cos(localPhi);
    const z = radius * Math.sin(localPhi) * Math.sin(localTheta);
    
    // クラスタ中心からの相対位置
    const clusterX = sphereRadius * Math.sin(dept.phi) * Math.cos(dept.theta);
    const clusterY = sphereRadius * Math.cos(dept.phi);
    const clusterZ = sphereRadius * Math.sin(dept.phi) * Math.sin(dept.theta);
    
    const relativeX = x - clusterX;
    const relativeY = y - clusterY;
    const relativeZ = z - clusterZ;
    
    // 星のジオメトリ
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    
    // 活動度に応じたサイズと明るさ
    const activity = 0.5 + Math.random() * 0.5;
    const scale = 0.7 + activity * 0.6;
    
    // マテリアル
    const material = new THREE.MeshBasicMaterial({
        color: dept.color,
        transparent: true,
        opacity: 0.8
    });
    
    const agent = new THREE.Mesh(geometry, material);
    agent.position.set(relativeX, relativeY, relativeZ);
    agent.scale.setScalar(scale);
    
    // グロー効果
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: dept.color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    agent.add(glow);
    
    // メタデータ
    agent.userData = {
        type: 'agent',
        department: dept,
        activity: activity,
        name: generateName(),
        rate: Math.floor(70 + activity * 30),
        output: Math.floor(activity * 500),
        collaborations: Math.floor(Math.random() * 15)
    };
    
    return agent;
}

// クラスタのオーラ（星雲効果）- 球面に沿って配置
function createClusterAura(clusterGroup, dept, sphereRadius) {
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    
    const color = new THREE.Color(dept.color);
    
    // クラスタの中心位置
    const centerX = sphereRadius * Math.sin(dept.phi) * Math.cos(dept.theta);
    const centerY = sphereRadius * Math.cos(dept.phi);
    const centerZ = sphereRadius * Math.sin(dept.phi) * Math.sin(dept.theta);
    
    for (let i = 0; i < particleCount; i++) {
        const spread = 1.2;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spread;
        
        // 球面に沿った位置
        const localTheta = dept.theta + Math.cos(angle) * distance;
        const localPhi = dept.phi + Math.sin(angle) * distance;
        const radius = sphereRadius * (0.92 + Math.random() * 0.15);
        
        const x = radius * Math.sin(localPhi) * Math.cos(localTheta);
        const y = radius * Math.cos(localPhi);
        const z = radius * Math.sin(localPhi) * Math.sin(localTheta);
        
        // クラスタ中心からの相対位置
        positions.push(x - centerX, y - centerY, z - centerZ);
        colors.push(color.r, color.g, color.b);
        sizes.push(Math.random() * 0.4 + 0.1);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const aura = new THREE.Points(geometry, material);
    aura.userData.type = 'aura';
    clusterGroup.add(aura);
}

// 部署間連携線
function createConnections() {
    const connectionCount = 30;
    
    for (let i = 0; i < connectionCount; i++) {
        const agent1 = agents[Math.floor(Math.random() * agents.length)];
        const agent2 = agents[Math.floor(Math.random() * agents.length)];
        
        if (agent1 === agent2) continue;
        
        // 異なる部署間の連携を優先
        if (agent1.userData.department.id === agent2.userData.department.id && Math.random() > 0.3) {
            continue;
        }
        
        const points = [];
        const pos1 = new THREE.Vector3();
        const pos2 = new THREE.Vector3();
        agent1.getWorldPosition(pos1);
        agent2.getWorldPosition(pos2);
        
        // ベジェ曲線で接続
        const mid = new THREE.Vector3().lerpVectors(pos1, pos2, 0.5);
        mid.y += Math.random() * 2 - 1;
        
        const curve = new THREE.QuadraticBezierCurve3(pos1, mid, pos2);
        points.push(...curve.getPoints(20));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = {
            type: 'connection',
            agent1: agent1,
            agent2: agent2,
            strength: Math.random()
        };
        
        galaxyGroup.add(line);
        connections.push(line);
    }
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
    time += 0.01;
    
    // 銀河全体の回転
    galaxyGroup.rotation.y += 0.0005;
    
    // 球体フレームのパルス効果
    galaxyGroup.children.forEach(child => {
        if (child.userData.type === 'sphereFrame') {
            // ワイヤーフレームの明滅
            child.material.opacity = 0.25 + Math.sin(time * 2) * 0.1;
        } else if (child.userData.type === 'glowSphere') {
            // グロー球体のパルス
            const pulse = Math.sin(time * 1.5) * 0.03 + 1;
            child.scale.setScalar(pulse);
        } else if (child.userData.type === 'gridLine') {
            // グリッド線の明滅
            child.material.opacity = 0.2 + Math.sin(time * 2 + child.id) * 0.08;
        } else if (child.userData.type === 'spiral') {
            // 螺旋の回転
            child.rotation.y += 0.002;
            child.material.opacity = 0.15 + Math.sin(time * 3) * 0.05;
        } else if (child.userData.type === 'outerGlow') {
            // 外側グローのパルス
            const pulse = Math.sin(time * 1.2) * 0.05 + 1;
            child.scale.setScalar(pulse);
        }
    });
    
    // クラスタの呼吸（膨張収縮）
    clusterGroups.forEach((cluster, index) => {
        const breathe = Math.sin(time + index) * 0.03 + 1;
        cluster.scale.setScalar(breathe);
        
        // クラスタの微回転
        cluster.rotation.y += 0.001;
        cluster.rotation.x += 0.0005;
    });
    
    // エージェントの明滅
    agents.forEach((agent, index) => {
        const flicker = Math.sin(time * 3 + index) * 0.2 + 0.8;
        agent.material.opacity = flicker * agent.userData.activity;
        
        // グロー効果のパルス
        if (agent.children[0]) {
            const pulse = Math.sin(time * 2 + index) * 0.2 + 0.3;
            agent.children[0].material.opacity = pulse;
        }
    });
    
    // 接続線のアニメーション
    connections.forEach((conn, index) => {
        const flow = Math.sin(time * 2 + index) * 0.1 + 0.15;
        conn.material.opacity = flow * conn.userData.strength;
    });
    
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
    
    // 球体フレーム関連のオブジェクトを除外
    const clickableObjects = [];
    galaxyGroup.children.forEach(child => {
        if (child.userData.type !== 'sphereFrame' && 
            child.userData.type !== 'glowSphere' && 
            child.userData.type !== 'gridLine' && 
            child.userData.type !== 'spiral' &&
            child.userData.type !== 'outerGlow') {
            clickableObjects.push(child);
        }
    });
    
    const intersects = raycaster.intersectObjects(clickableObjects, true);
    
    const tooltip = document.getElementById('tooltip');
    
    if (intersects.length > 0) {
        let object = intersects[0].object;
        
        // エージェントまたはクラスタを探す
        let agent = null;
        let cluster = null;
        let currentObj = object;
        
        while (currentObj) {
            if (currentObj.userData.type === 'agent') {
                agent = currentObj;
                break;
            } else if (currentObj.userData.type === 'cluster') {
                cluster = currentObj;
                break;
            }
            currentObj = currentObj.parent;
        }
        
        // エージェントが見つかった場合
        if (agent) {
            // ツールチップを非表示
            hideTooltip();
            
            // エージェント詳細パネルをカーソルの横に表示
            showAgentDetail(agent, event);
            return;
        }
        
        // クラスタが見つかった場合
        if (cluster && cluster.userData.department) {
            hideTooltip();
            showClusterPanel(cluster.userData.department, event);
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
    
    // トップ3のエージェントを表示（実際はデータから取得）
    const topAgents = agents
        .filter(a => a.userData.department.id === dept.id)
        .sort((a, b) => b.userData.rate - a.userData.rate)
        .slice(0, 3);
    
    const cards = document.querySelectorAll('.agent-card');
    topAgents.forEach((agent, i) => {
        if (cards[i]) {
            cards[i].querySelector('.name').textContent = agent.userData.name;
            cards[i].querySelector('.score').textContent = agent.userData.rate + '%';
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

