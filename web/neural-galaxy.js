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
let particleMetadata = []; // 各パーティクルのメタデータ
let departmentNebulas = []; // 部署星雲群
let departmentLabels = []; // 部署ラベル群
let trailHistory = []; // 各パーティクルの軌跡履歴
let trailLines = []; // トレイル描画用の線群
let coiqParticles = []; // 協働指数の微粒子群
const sphereRadius = 8; // 球体の境界半径
const maxVelocity = 0.01; // パーティクルの最大速度（ゆっくり）
const maxTrailLength = 50; // 最大トレイル長さ

// 部署データ（球面座標で配置）
const departments = [
    {
        id: 'consumer',
        name: 'コンシューマー統括',
        color: 0x2196F3, // Blue
        theta: 0,
        phi: Math.PI / 3,
        memberCount: 45,
        avgRate: 92,
        topProject: '顧客分析AI',
        // AI活用詳細データ
        aiUsageRate: 85,
        activeAgents: 128,
        valueIndex: 18,
        coIQ: 0.72,
        diversityScore: 0.65,
        summaryParams: {
            area: '顧客分析',
            improvement: 22,
            metric: '分析時間'
        }
    },
    {
        id: 'corporate',
        name: '法人統括',
        color: 0xFFC107, // Yellow
        theta: (Math.PI * 2) / 5,
        phi: Math.PI / 2.5,
        memberCount: 68,
        avgRate: 88,
        topProject: '自動テストシステム',
        // AI活用詳細データ
        aiUsageRate: 82,
        activeAgents: 145,
        valueIndex: 23,
        coIQ: 0.74,
        diversityScore: 0.68,
        summaryParams: {
            area: '営業提案',
            improvement: 27,
            metric: '提案時間'
        }
    },
    {
        id: 'technology',
        name: 'テクノロジーユニット統括',
        color: 0x4CAF50, // Green
        theta: (Math.PI * 2 * 2) / 5,
        phi: Math.PI / 2,
        memberCount: 32,
        avgRate: 85,
        topProject: 'コンテンツ生成AI',
        // AI活用詳細データ
        aiUsageRate: 91,
        activeAgents: 98,
        valueIndex: 31,
        coIQ: 0.81,
        diversityScore: 0.79,
        summaryParams: {
            area: 'コンテンツ生成',
            improvement: 35,
            metric: '制作時間'
        }
    },
    {
        id: 'it',
        name: 'IT統括',
        color: 0xE91E63, // Pink
        theta: (Math.PI * 2 * 3) / 5,
        phi: Math.PI / 1.8,
        memberCount: 28,
        avgRate: 78,
        topProject: '採用支援AI',
        // AI活用詳細データ
        aiUsageRate: 76,
        activeAgents: 87,
        valueIndex: 15,
        coIQ: 0.68,
        diversityScore: 0.61,
        summaryParams: {
            area: '採用プロセス',
            improvement: 19,
            metric: '選考時間'
        }
    },
    {
        id: 'finance',
        name: '財務統括',
        color: 0x9C27B0, // Purple
        theta: (Math.PI * 2 * 4) / 5,
        phi: Math.PI / 3,
        memberCount: 24,
        avgRate: 95,
        topProject: '経営分析ダッシュボード',
        // AI活用詳細データ
        aiUsageRate: 94,
        activeAgents: 112,
        valueIndex: 28,
        coIQ: 0.79,
        diversityScore: 0.73,
        summaryParams: {
            area: '経営分析',
            improvement: 31,
            metric: 'レポート作成時間'
        }
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
    renderer.setClearColor(0x000000, 0); // 完全透明にしてCSSの背景を表示
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
        opacity: 0.25,
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
            opacity: 0.2,
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
            opacity: 0.2,
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
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false
    });
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    spiral.userData.type = 'spiral';
    spiral.renderOrder = 4;
    galaxyGroup.add(spiral);
    
    // 外側の大きなグロー球体（アウターオーラ）は削除
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
    
    // パーティクルの位置、色の配列を準備
    const particlePositions = new Float32Array(totalParticles * 3);
    const particleColors = new Float32Array(totalParticles * 3);
    
    let particleIndex = 0;
    
    // 各部署ごとにパーティクルを生成
    departments.forEach((dept, deptIndex) => {
        const deptColor = new THREE.Color(dept.color);
        
        // 部署の中心位置を計算（霧の中心と同じ位置）
        const centerX = sphereRadius * Math.sin(dept.phi) * Math.cos(dept.theta);
        const centerY = sphereRadius * Math.sin(dept.phi) * Math.sin(dept.theta);
        const centerZ = sphereRadius * Math.cos(dept.phi);
        const center = new THREE.Vector3(centerX, centerY, centerZ);
        
        for (let i = 0; i < dept.memberCount; i++) {
            // 中心から球体表面に向かって展開するように配置
            // 中心に近い位置からスタート（ランダムな半径）
            const innerRadius = sphereRadius * (0.7 + Math.random() * 0.25); // 中心に近い位置
            const outerRadius = sphereRadius * (0.95 + Math.random() * 0.05); // 最終的な位置（球体表面）
            
            // 中心からの方向をランダムに決定（均等分布）
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.acos(2 * Math.random() - 1); // 球面分布
            
            // 中心からの方向ベクトル
            const direction = new THREE.Vector3(
                Math.sin(angle2) * Math.cos(angle1),
                Math.sin(angle2) * Math.sin(angle1),
                Math.cos(angle2)
            );
            
            // 中心位置 + 方向 * 半径で初期位置を決定
            const startRadius = innerRadius + (outerRadius - innerRadius) * Math.random();
            const pos = center.clone().add(direction.clone().multiplyScalar(startRadius));
            
            particlePositions[particleIndex * 3] = pos.x;
            particlePositions[particleIndex * 3 + 1] = pos.y;
            particlePositions[particleIndex * 3 + 2] = pos.z;
            
            // ノードは白色に統一
            particleColors[particleIndex * 3] = 1.0;
            particleColors[particleIndex * 3 + 1] = 1.0;
            particleColors[particleIndex * 3 + 2] = 1.0;
            
            // 速度ベクトルを初期化（中心から外側に向かう方向にバイアス）
            const outwardDirection = pos.clone().sub(center).normalize();
            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            const velocityDirection = outwardDirection.clone().add(randomOffset).normalize();
            
            particleVelocity[particleIndex] = velocityDirection.clone().multiplyScalar(maxVelocity);
            
            // メリットデータを追加
            const aiUseRate = 0.5 + Math.random() * 0.5; // AI活用度: 0.5～1.0
            particleMetadata[particleIndex] = {
                name: generateName(),
                department: dept,
                aiUseRate: aiUseRate,
                valueGenerated: Math.floor(Math.random() * 500), // 生成価値: 0～500
                coIQ: Math.floor(Math.random() * 20)       // 協働指数: 0～20
            };
            
            particleIndex++;
        }
    });
    
    // パーティクルのジオメトリとマテリアルを作成
    const particles = new THREE.BufferGeometry();
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
    particles.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    // サイズ属性は使用しない（カスタムシェーダーのエラーを回避）
    
    const pointMaterial = new THREE.PointsMaterial({
        size: 0.15, // 統一サイズ
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
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
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        linewidth: 2,
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
    
    // トレイル履歴を初期化（無効化）
    // for (let i = 0; i < totalParticles; i++) {
    //     trailHistory[i] = [];
    // }
    
    // 部署星雲（Nebula）を生成
    createDepartmentNebulas();
    
    // トレイルシステムを初期化（一旦無効化）
    // createTrailSystem(totalParticles);
    
    // CoIQ微粒子システムを初期化（一旦無効化）
    // createCoIQParticleSystem(totalParticles);
}

// トレイルシステムの初期化
function createTrailSystem(totalParticles) {
    // 各パーティクルのトレイル用の線を作成
    for (let i = 0; i < totalParticles; i++) {
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(maxTrailLength * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false
        });
        
        const trailLine = new THREE.Line(trailGeometry, trailMaterial);
        trailLine.renderOrder = 500; // パーティクルより後ろ、星雲より前
        trailLine.visible = false; // 初期は非表示
        galaxyGroup.add(trailLine);
        trailLines.push(trailLine);
    }
    
    console.log('Trail system created:', trailLines.length);
}

// CoIQ微粒子システムの初期化
function createCoIQParticleSystem(totalParticles) {
    // 各パーティクルの周囲に協働指数に応じた微粒子を配置
    for (let i = 0; i < totalParticles; i++) {
        const metadata = particleMetadata[i];
        const coiqCount = Math.floor(metadata.coIQ * 2); // CoIQ × 2個の微粒子
        
        if (coiqCount > 0) {
            const positions = [];
            const colors = [];
            
            for (let j = 0; j < coiqCount; j++) {
                // ランダムな角度と距離
                const angle1 = Math.random() * Math.PI * 2;
                const angle2 = Math.random() * Math.PI * 2;
                const radius = 0.15 + Math.random() * 0.1;
                
                const x = Math.cos(angle1) * Math.sin(angle2) * radius;
                const y = Math.sin(angle1) * Math.sin(angle2) * radius;
                const z = Math.cos(angle2) * radius;
                
                positions.push(x, y, z);
                colors.push(1.0, 1.0, 1.0); // 白色
            }
            
            const coiqGeometry = new THREE.BufferGeometry();
            coiqGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            coiqGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            const coiqMaterial = new THREE.PointsMaterial({
                size: 0.03,
                vertexColors: true,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true,
                depthTest: true,
                depthWrite: false
            });
            
            const coiqCloud = new THREE.Points(coiqGeometry, coiqMaterial);
            coiqCloud.userData = { particleIndex: i };
            coiqCloud.renderOrder = 800; // パーティクルの後ろ
            galaxyGroup.add(coiqCloud);
            coiqParticles.push(coiqCloud);
        } else {
            coiqParticles.push(null); // CoIQがない場合はnull
        }
    }
    
    console.log('CoIQ particle system created');
}

// 部署星雲（霧状パーティクル）を生成
function createDepartmentNebulas() {
    departments.forEach((dept, deptIndex) => {
        // 部署の定義されたtheta/phi座標から均一な中心位置を計算
        const center = new THREE.Vector3();
        center.x = sphereRadius * Math.sin(dept.phi) * Math.cos(dept.theta);
        center.y = sphereRadius * Math.sin(dept.phi) * Math.sin(dept.theta);
        center.z = sphereRadius * Math.cos(dept.phi);
        
        // 星雲パーティクルを生成
        const nebulaParticleCount = 1200; // 霧状パーティクルの数（大幅に増加）
        const nebulaPositions = [];
        const nebulaColors = [];
        const color = new THREE.Color(dept.color);
        
        for (let i = 0; i < nebulaParticleCount; i++) {
            // 中心周辺にランダム配置（範囲を大幅に広く）
            const spread = 10.0; // 広がり範囲を大幅に拡大（7.0 → 10.0）
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            const distance = Math.random() * spread;
            
            const offset = new THREE.Vector3(
                Math.cos(angle1) * Math.sin(angle2) * distance,
                Math.sin(angle1) * Math.sin(angle2) * distance,
                Math.cos(angle2) * distance
            );
            
            const pos = center.clone().add(offset);
            // 球体表面に投影（大幅に広い範囲）
            pos.normalize().multiplyScalar(sphereRadius * (0.85 + Math.random() * 0.18));
            
            nebulaPositions.push(pos.x, pos.y, pos.z);
            // 色の強度を上げる（より濃く）
            nebulaColors.push(
                Math.min(color.r * 1.5, 1.0),
                Math.min(color.g * 1.5, 1.0),
                Math.min(color.b * 1.5, 1.0)
            );
        }
        
        // 星雲のジオメトリとマテリアルを作成
        const nebulaGeometry = new THREE.BufferGeometry();
        nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaPositions, 3));
        nebulaGeometry.setAttribute('color', new THREE.Float32BufferAttribute(nebulaColors, 3));
        
        // コンシューマーと財務統括の霧を薄くする
        const nebulaOpacity = (dept.id === 'consumer' || dept.id === 'finance') ? 0.02 : 0.25;
        const nebulaSize = (dept.id === 'consumer' || dept.id === 'finance') ? 0.25 : 0.4;
        
        const nebulaMaterial = new THREE.PointsMaterial({
            size: nebulaSize, // コンシューマーと財務統括はサイズも小さく
            vertexColors: true,
            transparent: true,
            opacity: nebulaOpacity, // 透明度を上げて色を濃く（0.15 → 0.25）、コンシューマーと財務統括は0.02
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthTest: true,
            depthWrite: false
        });
        
        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        nebula.userData = {
            type: 'nebula',
            department: dept,
            pulseSpeed: dept.avgRate / 50 // 平均スコアで脈動速度を決定
        };
        nebula.renderOrder = 100; // パーティクルより後ろに配置
        
        galaxyGroup.add(nebula);
        departmentNebulas.push(nebula);
        
        // ラベルを作成
        createDepartmentLabel(dept, center);
    });
    
    console.log('Department nebulas created:', departmentNebulas.length);
}

// 部署ラベルを作成
function createDepartmentLabel(dept, centerPosition) {
    const label = document.createElement('div');
    label.className = `hologram-label ${dept.id}`;
    label.textContent = dept.name;
    label.style.position = 'fixed'; // fixed位置指定で確実に表示
    
    // マウスイベントを追加
    label.addEventListener('mouseenter', (e) => {
        const rect = label.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        showTooltip(dept, centerX, centerY);
    });
    
    label.addEventListener('mousemove', (e) => {
        // ラベル上でマウスが動いた場合も位置を更新
        if (hoveredDepartment === dept) {
            updateTooltipPosition(e.clientX, e.clientY);
        }
    });
    
    label.addEventListener('mouseleave', () => {
        hideTooltip();
    });
    
    document.body.appendChild(label);
    
    console.log('Label created for:', dept.name, 'at position:', centerPosition);
    
    departmentLabels.push({
        element: label,
        department: dept,
        position: centerPosition.clone()
    });
}

// ラベルの位置を更新（3D座標を2Dスクリーン座標に変換）
function updateDepartmentLabels() {
    if (!renderer || !camera || !galaxyGroup) return;
    
    departmentLabels.forEach(labelData => {
        const { element, department, position } = labelData;
        
        // 銀河グループのローカル座標をワールド座標に変換
        const worldPosition = position.clone();
        worldPosition.applyMatrix4(galaxyGroup.matrixWorld);
        
        // 3D座標をスクリーン座標に変換
        const vector = worldPosition.clone();
        vector.project(camera);
        
        // キャンバスコンテナの位置を考慮
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) return;
        
        const rect = canvasContainer.getBoundingClientRect();
        
        // スクリーン座標を計算（0.5を中心として正規化された座標を画面座標に変換）
        const screenX = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
        const screenY = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
        
        // カメラの後ろにある場合は非表示（画面外チェックは緩和）
        if (vector.z > 1) {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
            // fixed位置指定なので、直接left/topを設定
            element.style.left = screenX + 'px';
            element.style.top = screenY + 'px';
            element.style.opacity = '1';
            // transformはアニメーションで制御されるので、ここでは設定しない
        }
    });
}

// 部署メンバーの重心を計算（球体表面上）
function calculateCentroid(memberPositions, startIndex, endIndex) {
    const center = new THREE.Vector3(0, 0, 0);
    
    // パーティクルの位置から直接計算
    if (pointCloud && pointCloud.geometry) {
        const positions = pointCloud.geometry.attributes.position.array;
        for (let i = startIndex; i < endIndex; i++) {
            center.x += positions[i * 3];
            center.y += positions[i * 3 + 1];
            center.z += positions[i * 3 + 2];
        }
        center.divideScalar(endIndex - startIndex);
    }
    
    // 球体表面に投影
    if (center.length() > 0) {
        center.normalize().multiplyScalar(sphereRadius);
    }
    
    return center;
}

// シナプスパーティクルの更新処理
function updateSynapseParticles() {
    if (!pointCloud || !lineMesh) return;
    
    const particlePositions = pointCloud.geometry.attributes.position.array;
    const linePositions = lineMesh.geometry.attributes.position.array;
    const particleNum = particlePositions.length / 3;
    const connectionDistance = 2.0; // 接続する最大距離
    
    let vertexpos = 0;
    
    // パーティクルの位置を更新（球体表面に沿って移動）
    for (let i = 0; i < particleNum; i++) {
        // 速度を位置に加算
        particlePositions[i * 3] += particleVelocity[i].x;
        particlePositions[i * 3 + 1] += particleVelocity[i].y;
        particlePositions[i * 3 + 2] += particleVelocity[i].z;
        
        // 現在の位置ベクトルの長さを計算
        const x = particlePositions[i * 3];
        const y = particlePositions[i * 3 + 1];
        const z = particlePositions[i * 3 + 2];
        const currentRadius = Math.sqrt(x * x + y * y + z * z);
        
        // 球体表面に正規化（半径をsphereRadiusに保つ）
        if (currentRadius > 0) {
            const targetRadius = sphereRadius;
            const scale = targetRadius / currentRadius;
            particlePositions[i * 3] *= scale;
            particlePositions[i * 3 + 1] *= scale;
            particlePositions[i * 3 + 2] *= scale;
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
    
    // トレイルを更新（無効化）
    // updateTrails(particlePositions, particleNum);
}

// トレイルの更新処理
function updateTrails(particlePositions, particleNum) {
    for (let i = 0; i < particleNum; i++) {
        // 現在の位置を取得
        const currentPos = new THREE.Vector3(
            particlePositions[i * 3],
            particlePositions[i * 3 + 1],
            particlePositions[i * 3 + 2]
        );
        
        // 履歴に追加
        trailHistory[i].unshift(currentPos.clone());
        
        // 生成価値に応じてトレイル長さを決定
        const metadata = particleMetadata[i];
        const trailLength = Math.floor((metadata.valueGenerated / 500) * maxTrailLength);
        
        // 長さを制限
        if (trailHistory[i].length > trailLength) {
            trailHistory[i].length = trailLength;
        }
        
        // トレイルラインを更新
        if (trailLines[i] && trailHistory[i].length > 1) {
            const trailPositions = trailLines[i].geometry.attributes.position.array;
            
            for (let j = 0; j < maxTrailLength; j++) {
                if (j < trailHistory[i].length) {
                    const pos = trailHistory[i][j];
                    trailPositions[j * 3] = pos.x;
                    trailPositions[j * 3 + 1] = pos.y;
                    trailPositions[j * 3 + 2] = pos.z;
                } else {
                    // 履歴がない部分は原点に
                    trailPositions[j * 3] = currentPos.x;
                    trailPositions[j * 3 + 1] = currentPos.y;
                    trailPositions[j * 3 + 2] = currentPos.z;
                }
            }
            
            trailLines[i].geometry.attributes.position.needsUpdate = true;
            trailLines[i].visible = trailHistory[i].length > 1;
            
            // 透明度をグラデーションで調整
            trailLines[i].material.opacity = 0.2 + (metadata.valueGenerated / 500) * 0.3;
        }
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
    time += 0.005;
    
    // シナプスパーティクルの更新
    updateSynapseParticles();
    
    // 銀河全体のゆっくりした回転
    galaxyGroup.rotation.y += 0.0001;
    
    // 球体フレームのパルス効果（穏やかに）
    galaxyGroup.children.forEach(child => {
        if (child.userData.type === 'sphereFrame') {
            // ワイヤーフレームの明滅（穏やか）
            child.material.opacity = 0.2 + Math.sin(time * 0.5) * 0.08;
        } else if (child.userData.type === 'glowSphere') {
            // グロー球体のパルス（穏やか）
            const pulse = Math.sin(time * 0.8) * 0.015 + 1;
            child.scale.setScalar(pulse);
        } else if (child.userData.type === 'gridLine') {
            // グリッド線の明滅（穏やか）
            child.material.opacity = 0.15 + Math.sin(time * 0.6 + child.id) * 0.06;
        } else if (child.userData.type === 'spiral') {
            // 螺旋の回転（ゆっくり）
            child.rotation.y += 0.0005;
            child.material.opacity = 0.12 + Math.sin(time * 0.7) * 0.05;
        } else if (child.userData.type === 'outerGlow') {
            // 外側グローのパルス（穏やか）
            const pulse = Math.sin(time * 0.5) * 0.02 + 1;
            child.scale.setScalar(pulse);
        }
    });
    
    // 部署星雲の脈動アニメーション
    departmentNebulas.forEach((nebula, index) => {
        if (nebula.userData.pulseSpeed) {
            const pulse = Math.sin(time * nebula.userData.pulseSpeed) * 0.05 + 1;
            // コンシューマーと財務統括は薄く、他は従来通り
            const dept = nebula.userData.department;
            const baseOpacity = (dept.id === 'consumer' || dept.id === 'finance') ? 0.02 : 0.1;
            const pulseAmount = (dept.id === 'consumer' || dept.id === 'finance') ? 0.01 : 0.04;
            nebula.material.opacity = baseOpacity + Math.sin(time * nebula.userData.pulseSpeed) * pulseAmount;
            nebula.scale.setScalar(0.98 + pulse * 0.02);
        }
    });
    
    // CoIQ微粒子をパーティクルに追従させる（無効化）
    // if (pointCloud && pointCloud.geometry) {
    //     const positions = pointCloud.geometry.attributes.position.array;
    //     coiqParticles.forEach((coiqCloud, index) => {
    //         if (coiqCloud) {
    //             const particlePos = new THREE.Vector3(
    //                 positions[index * 3],
    //                 positions[index * 3 + 1],
    //                 positions[index * 3 + 2]
    //             );
    //             coiqCloud.position.copy(particlePos);
    //             
    //             // 微粒子をゆっくり回転
    //             coiqCloud.rotation.y += 0.01;
    //             coiqCloud.rotation.x += 0.005;
    //         }
    //     });
    // }
    
    // 部署ラベルの位置を更新
    updateDepartmentLabels();
    
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
    const menuItems = document.querySelectorAll('.menu-item');
    
    let isOpen = true; // デフォルトで開いた状態
    
    // 初期状態を設定
    toggleBtn.classList.add('active');
    // canvas-containerは初期状態で左:280pxなので、shiftedは不要
    
    // トグルボタンのクリック
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        
        const dashboardContainer = document.getElementById('dashboard-container');
        const settingsContainer = document.getElementById('settings-container');
        
        if (isOpen) {
            sidebar.classList.remove('collapsed');
            toggleBtn.classList.add('active');
            canvasContainer.classList.remove('collapsed');
            if (dashboardContainer) {
                dashboardContainer.classList.remove('collapsed');
            }
            if (settingsContainer) {
                settingsContainer.classList.remove('collapsed');
            }
        } else {
            sidebar.classList.add('collapsed');
            toggleBtn.classList.remove('active');
            canvasContainer.classList.add('collapsed');
            if (dashboardContainer) {
                dashboardContainer.classList.add('collapsed');
            }
            if (settingsContainer) {
                settingsContainer.classList.add('collapsed');
            }
        }
        
        // カメラのアスペクト比を調整
        setTimeout(() => {
            onWindowResize();
            // ダッシュボードのリサイズ処理
            if (typeof window.Dashboard !== 'undefined' && window.Dashboard.onDashboardResize) {
                window.Dashboard.onDashboardResize();
            }
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
    
    const canvasContainer = document.getElementById('canvas-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const settingsContainer = document.getElementById('settings-container');
    const sidebar = document.getElementById('sidebar');
    const isSidebarOpen = !sidebar.classList.contains('collapsed');
    
    // すべてのコンテナを非表示
    if (canvasContainer) canvasContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    if (settingsContainer) settingsContainer.style.display = 'none';
    
    switch(page) {
        case 'home':
            // ホーム表示（3D銀河ビュー）
            if (canvasContainer) {
                canvasContainer.style.display = 'block';
            }
            break;
            
        case 'dashboard':
            // ダッシュボード表示
            if (dashboardContainer) {
                dashboardContainer.style.display = 'block';
                // サイドバーの状態に応じてクラスを設定
                if (!isSidebarOpen) {
                    dashboardContainer.classList.add('collapsed');
                } else {
                    dashboardContainer.classList.remove('collapsed');
                }
                
                // ダッシュボードを初期化（初回のみ）
                if (typeof window.Dashboard !== 'undefined' && window.Dashboard.initDashboard) {
                    window.Dashboard.initDashboard();
                }
            }
            break;
            
        case 'settings':
            // 設定画面表示
            if (settingsContainer) {
                settingsContainer.style.display = 'block';
                // サイドバーの状態に応じてクラスを設定
                if (!isSidebarOpen) {
                    settingsContainer.classList.add('collapsed');
                } else {
                    settingsContainer.classList.remove('collapsed');
                }
                
                // 設定を初期化
                if (typeof window.Settings !== 'undefined' && window.Settings.initSettings) {
                    window.Settings.initSettings();
                }
            }
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
    
    // ダッシュボードのリサイズ処理
    if (typeof window.Dashboard !== 'undefined' && window.Dashboard.onDashboardResize) {
        window.Dashboard.onDashboardResize();
    }
}

// クリックイベント
function onClick(event) {
    // クリック時は何もしない（ホバーで表示するため）
    // 必要に応じて、固定表示などの機能を追加可能
}

// ホバー中の部署を追跡
let hoveredDepartment = null;
let tooltipTimer = null;
let l2Timer = null;
let l3Timer = null;

// ホバー効果を更新
function updateHoverEffects(event) {
    // マウス位置を正規化座標に変換
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // 各部署ラベルの位置をチェック
    let foundDept = null;
    departmentLabels.forEach(labelData => {
        const { element, department } = labelData;
        if (element.style.display === 'none') return;
        
        const labelRect = element.getBoundingClientRect();
        // ラベルの領域内かチェック（マージンを追加）
        const margin = 30;
        if (mouseX >= labelRect.left - margin &&
            mouseX <= labelRect.right + margin &&
            mouseY >= labelRect.top - margin &&
            mouseY <= labelRect.bottom + margin) {
            foundDept = department;
        }
    });
    
    // ホバー中の部署が変わった場合
    if (foundDept !== hoveredDepartment) {
        // 前のツールチップを非表示
        if (hoveredDepartment) {
            hideTooltip();
        }
        
        hoveredDepartment = foundDept;
        
        // 新しい部署をホバーしている場合
        if (hoveredDepartment) {
            showTooltip(hoveredDepartment, mouseX, mouseY);
        }
    } else if (hoveredDepartment) {
        // 同じ部署をホバーし続けている場合、位置を更新
        updateTooltipPosition(mouseX, mouseY);
    }
}

// ツールチップを表示
function showTooltip(dept, mouseX, mouseY) {
    const tooltip = document.getElementById('hologram-tooltip');
    if (!tooltip) return;
    
    // タイマーをクリア
    clearAllTimers();
    
    // 部署の色に合わせてクラスを設定
    tooltip.className = `hologram-tooltip ${dept.id}`;
    
    // L1層のデータを設定（即時表示）
    const deptNameEl = tooltip.querySelector('.dept-name');
    const aiUsageRateEl = tooltip.querySelector('.ai-usage-rate');
    const activeAgentsEl = tooltip.querySelector('.active-agents');
    
    if (deptNameEl) deptNameEl.textContent = dept.name;
    if (aiUsageRateEl) aiUsageRateEl.textContent = `${dept.aiUsageRate}%`;
    if (activeAgentsEl) activeAgentsEl.textContent = dept.activeAgents;
    
    // L1層を即座に表示
    const l1Layer = tooltip.querySelector('.l1-layer');
    if (l1Layer) {
        l1Layer.classList.add('visible');
    }
    
    // L2層のタイマー（0.3秒後）
    l2Timer = setTimeout(() => {
        showL2Layer(dept);
    }, 300);
    
    // L3層のタイマー（0.6秒後）
    l3Timer = setTimeout(() => {
        showL3Layer(dept);
    }, 600);
    
    // ツールチップを表示（一度表示してサイズを取得するため）
    tooltip.style.display = 'block';
    
    // サイズを取得するために少し待つ
    setTimeout(() => {
        updateTooltipPosition(mouseX, mouseY);
    }, 0);
}

// L2層を表示
function showL2Layer(dept) {
    const tooltip = document.getElementById('hologram-tooltip');
    if (!tooltip) return;
    
    const l2Layer = tooltip.querySelector('.l2-layer');
    if (l2Layer) {
        l2Layer.classList.add('visible');
        
        // リングメーターの値を設定
        const valueIndexRing = tooltip.querySelector('.value-index-ring');
        const valueIndexValue = tooltip.querySelector('.value-index-value');
        const coiqRing = tooltip.querySelector('.coiq-ring');
        const coiqValue = tooltip.querySelector('.coiq-value');
        const diversityRing = tooltip.querySelector('.diversity-ring');
        const diversityValue = tooltip.querySelector('.diversity-value');
        
        // Value Index（0-100%の範囲に正規化、最大40とする）
        const valueIndexPercent = Math.min((dept.valueIndex / 40) * 100, 100);
        const valueIndexOffset = 251.2 * (1 - valueIndexPercent / 100);
        if (valueIndexRing) {
            valueIndexRing.style.strokeDashoffset = valueIndexOffset;
        }
        if (valueIndexValue) {
            valueIndexValue.textContent = `+${dept.valueIndex}%`;
        }
        
        // CoIQ（0-1の範囲を0-100%に変換）
        const coiqPercent = dept.coIQ * 100;
        const coiqOffset = 251.2 * (1 - coiqPercent / 100);
        if (coiqRing) {
            coiqRing.style.strokeDashoffset = coiqOffset;
        }
        if (coiqValue) {
            coiqValue.textContent = dept.coIQ.toFixed(2);
        }
        
        // Diversity（0-1の範囲を0-100%に変換）
        const diversityPercent = dept.diversityScore * 100;
        const diversityOffset = 251.2 * (1 - diversityPercent / 100);
        if (diversityRing) {
            diversityRing.style.strokeDashoffset = diversityOffset;
        }
        if (diversityValue) {
            diversityValue.textContent = dept.diversityScore.toFixed(2);
        }
    }
}

// L3層を表示
function showL3Layer(dept) {
    const tooltip = document.getElementById('hologram-tooltip');
    if (!tooltip) return;
    
    const l3Layer = tooltip.querySelector('.l3-layer');
    if (l3Layer) {
        l3Layer.classList.add('visible');
        
        // トップ3エージェントを生成
        const agentsList = tooltip.querySelector('.agents-list');
        if (agentsList) {
            agentsList.innerHTML = '';
            const topAgents = generateTopAgents(3);
            topAgents.forEach((agent, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="agent-name">${index + 1}. ${agent.name}</span>
                    <span class="agent-metric">${agent.metricLabel} ${agent.metricValue}%</span>
                `;
                agentsList.appendChild(li);
            });
        }
        
        // AI貢献サマリーを生成
        const summaryText = tooltip.querySelector('.summary-text');
        if (summaryText) {
            summaryText.textContent = generateAISummary(dept);
        }
    }
}

// トップエージェントを生成
function generateTopAgents(count) {
    const agents = [];
    const metrics = [
        { label: '生成貢献', value: () => 85 + Math.floor(Math.random() * 15) },
        { label: '協働指数', value: () => 88 + Math.floor(Math.random() * 12) },
        { label: 'AI応答精度', value: () => 90 + Math.floor(Math.random() * 10) }
    ];
    
    for (let i = 0; i < count; i++) {
        const metric = metrics[i % metrics.length];
        agents.push({
            name: generateName(),
            metricLabel: metric.label,
            metricValue: metric.value()
        });
    }
    
    return agents;
}

// AI貢献サマリーを動的生成
function generateAISummary(dept) {
    const params = dept.summaryParams;
    
    // 部署ごとの具体的な効果と指標を定義
    const summaryTemplates = {
        consumer: {
            effects: [
                { area: '顧客分析', benefit: '提案精度', metric: '顧客満足度', improvement: 22 },
                { area: '行動予測', benefit: 'マーケティング効率', metric: '反応率', improvement: 18 }
            ],
            cultural: 'AIを活用した意思決定支援により、提案品質が安定化し、チーム間の判断スピードが月次で上昇。'
        },
        corporate: {
            effects: [
                { area: '営業提案', benefit: '提案品質', metric: '判断スピード', improvement: 27 },
                { area: '商談分析', benefit: '成約率', metric: '営業効率', improvement: 19 }
            ],
            cultural: 'AIを活用した意思決定支援により、提案品質が安定化し、チーム間の判断スピードが月次で上昇。'
        },
        technology: {
            effects: [
                { area: 'コンテンツ生成', benefit: '制作効率', metric: '品質評価', improvement: 35 },
                { area: '開発支援', benefit: 'コード品質', metric: '開発速度', improvement: 28 }
            ],
            cultural: 'AIを活用した意思決定支援により、提案品質が安定化し、チーム間の判断スピードが月次で上昇。'
        },
        it: {
            effects: [
                { area: '採用プロセス', benefit: '選考効率', metric: 'マッチング精度', improvement: 19 },
                { area: 'システム運用', benefit: '障害対応速度', metric: '稼働率', improvement: 15 }
            ],
            cultural: 'AIを活用した意思決定支援により、提案品質が安定化し、チーム間の判断スピードが月次で上昇。'
        },
        finance: {
            effects: [
                { area: '経営分析', benefit: 'レポート作成', metric: '分析精度', improvement: 31 },
                { area: '財務予測', benefit: '予測精度', metric: '意思決定速度', improvement: 24 }
            ],
            cultural: 'AIを活用した意思決定支援により、提案品質が安定化し、チーム間の判断スピードが月次で上昇。'
        }
    };
    
    const template = summaryTemplates[dept.id] || summaryTemplates.corporate;
    const effect = template.effects[Math.floor(Math.random() * template.effects.length)];
    
    // 部署ごとの改善率を計算（元のパラメータに基づく）
    const speedImprovement = Math.floor(10 + (dept.valueIndex / 40) * 15); // 10-25%の範囲
    
    // 2文構成のサマリーを生成
    const firstSentence = `AIを活用した意思決定支援により、${effect.benefit}が安定化し、チーム間の判断スピードが月次で${speedImprovement}％上昇。`;
    const secondSentence = `部署全体で"AIを伴う判断文化"が定着しつつあります。`;
    
    return `${firstSentence}\n\n${secondSentence}`;
}

// ツールチップの位置を更新
function updateTooltipPosition(mouseX, mouseY) {
    const tooltip = document.getElementById('hologram-tooltip');
    if (!tooltip) return;
    
    // 実際のツールチップのサイズを取得
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 480; // 実際の幅、なければデフォルト値
    const tooltipHeight = tooltipRect.height || 400; // 実際の高さ、なければデフォルト値
    
    const offsetX = 20;
    const offsetY = 20;
    const margin = 20; // 画面端からのマージン
    
    // 初期位置（マウス位置の右下）
    let x = mouseX + offsetX;
    let y = mouseY + offsetY;
    
    // 右端を超える場合は左側に表示
    if (x + tooltipWidth + margin > window.innerWidth) {
        x = mouseX - tooltipWidth - offsetX;
    }
    
    // 左端を超える場合は右側に表示（元の位置に戻す）
    if (x < margin) {
        x = margin;
    }
    
    // 下端を超える場合は上側に表示
    if (y + tooltipHeight + margin > window.innerHeight) {
        y = mouseY - tooltipHeight - offsetY;
    }
    
    // 上端を超える場合は下側に表示（元の位置に戻す）
    if (y < margin) {
        y = margin;
    }
    
    // 右端の最終チェック（ツールチップが画面からはみ出さないように）
    if (x + tooltipWidth > window.innerWidth - margin) {
        x = window.innerWidth - tooltipWidth - margin;
    }
    
    // 下端の最終チェック（ツールチップが画面からはみ出さないように）
    if (y + tooltipHeight > window.innerHeight - margin) {
        y = window.innerHeight - tooltipHeight - margin;
    }
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

// ツールチップを非表示にする
function hideTooltip() {
    const tooltip = document.getElementById('hologram-tooltip');
    if (!tooltip) return;
    
    clearAllTimers();
    
    // 各レイヤーを非表示
    const layers = tooltip.querySelectorAll('.tooltip-layer');
    layers.forEach(layer => {
        layer.classList.remove('visible');
    });
    
    // ツールチップを非表示
    tooltip.style.display = 'none';
    hoveredDepartment = null;
}

// すべてのタイマーをクリア
function clearAllTimers() {
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
    }
    if (l2Timer) {
        clearTimeout(l2Timer);
        l2Timer = null;
    }
    if (l3Timer) {
        clearTimeout(l3Timer);
        l3Timer = null;
    }
}

// クラスタパネル表示（無効化）
function showClusterPanel(dept, event) {
    // パネル表示を無効化
    return;
}

// エージェント詳細表示（無効化）
function showAgentDetail(agent, event) {
    // パネル表示を無効化
    return;
}

// パネルを閉じる（無効化）
function closeAgentDetail() {
    // 何もしない
}

function hideAllPanels() {
    // 何もしない
}

// 初期化実行
init();

