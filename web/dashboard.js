// ==========================================
// Agent Analytics Dashboard - メインロジック
// ==========================================

let dashboardData = null;
let currentSortMode = 'contribution';
let collabMapCanvas = null;
let collabMapContext = null;
let collabMapNodes = [];
let collabMapEdges = [];
let collabMapHoveredNode = null;

// ダッシュボード初期化
function initDashboard() {
    console.log('Initializing Agent Analytics Dashboard...');
    
    // モックデータを生成
    dashboardData = window.DashboardData.generateAllMockData();
    console.log('Dashboard data generated:', dashboardData);
    
    // サマリー情報を更新
    updateSummary();
    
    // 各モジュールを初期化
    initTopAgentsModule();
    initTypeDistributionModule();
    initCollaborationMapModule();
    initUsageTrackerModule();
    initScorecards();
    initInsights();
    
    // イベントリスナーを設定
    setupDashboardEventListeners();
}

// サマリー情報を更新
function updateSummary() {
    const { summary } = dashboardData;
    
    document.getElementById('total-ai-count').textContent = summary.totalAICount;
    document.getElementById('active-departments').textContent = summary.activeDepartments;
    document.getElementById('avg-utilization-rate').textContent = `${summary.avgUtilizationRate}%`;
}

// Top Agentsモジュールを初期化
function initTopAgentsModule() {
    renderTopAgents(currentSortMode);
}

function renderTopAgents(sortMode) {
    const { agents } = dashboardData;
    const container = document.getElementById('top-agents-content');
    
    // ソート
    let sortedAgents = [...agents];
    switch (sortMode) {
        case 'contribution':
            sortedAgents.sort((a, b) => b.contributionScore - a.contributionScore);
            break;
        case 'usage':
            sortedAgents.sort((a, b) => b.usageCount - a.usageCount);
            break;
        case 'time':
            sortedAgents.sort((a, b) => b.usageTime - a.usageTime);
            break;
    }
    
    // トップ5を表示
    const topAgents = sortedAgents.slice(0, 5);
    
    container.innerHTML = '';
    topAgents.forEach((agent, index) => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        const percentage = sortMode === 'contribution' 
            ? agent.contributionScore
            : sortMode === 'usage'
            ? Math.round((agent.usageCount / sortedAgents[0].usageCount) * 100)
            : Math.round((agent.usageTime / sortedAgents[0].usageTime) * 100);
        
        card.innerHTML = `
            <div class="agent-rank">${index + 1}</div>
            <div class="agent-info">
                <div class="agent-name">${agent.name}</div>
                <span class="agent-type">${agent.type}</span>
                <div class="agent-stats">
                    <span>使用回数: ${agent.usageCount.toLocaleString()}回</span>
                    <span>使用時間: ${agent.usageTime}h</span>
                    <span>貢献度: ${agent.contributionScore}%</span>
                </div>
            </div>
            <div class="agent-meter">
                <div id="agent-meter-${index}"></div>
            </div>
        `;
        
        container.appendChild(card);
        
        // プログレスリングを追加
        setTimeout(() => {
            const meterContainer = document.getElementById(`agent-meter-${index}`);
            if (meterContainer) {
                const ring = window.DashboardCharts.createProgressRing(percentage, {
                    size: 60,
                    strokeWidth: 6,
                    color: index === 0 ? '#00ffc8' : '#4fc3f7',
                    showPercentage: true
                });
                meterContainer.appendChild(ring);
            }
        }, 100);
    });
}

// Type Distributionモジュールを初期化
function initTypeDistributionModule() {
    const { agents } = dashboardData;
    const canvas = document.getElementById('type-distribution-chart');
    if (!canvas) return;
    
    // タイプ別集計
    const typeCounts = {};
    agents.forEach(agent => {
        typeCounts[agent.type] = (typeCounts[agent.type] || 0) + 1;
    });
    
    const chartData = Object.entries(typeCounts).map(([type, count]) => ({
        label: type,
        value: count
    }));
    
    const colors = ['#4fc3f7', '#00ffc8', '#ffc107', '#e91e63'];
    
    // ドーナツグラフを描画
    const chart = window.DashboardCharts.drawDonutChart(canvas, chartData, {
        colors,
        showLabels: true,
        glowEffect: true,
        centerText: `${agents.length}`
    });
    
    // レジェンドを作成
    const legendContainer = document.getElementById('type-distribution-legend');
    legendContainer.innerHTML = '';
    chartData.forEach((item, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item-new';
        const percentage = Math.round((item.value / agents.length) * 100);
        legendItem.innerHTML = `
            <div class="legend-color-box" style="background-color: ${colors[index % colors.length]}; color: ${colors[index % colors.length]};"></div>
            <span>${item.label}: ${percentage}%</span>
        `;
        legendContainer.appendChild(legendItem);
    });
    
    // ホバーツールチップ
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const segment = chart.getSegmentAtPoint(x, y);
        if (segment) {
            const typeAgents = agents.filter(a => a.type === segment.data.label);
            const topAgent = typeAgents.sort((a, b) => b.usageCount - a.usageCount)[0];
            const content = `
                <strong>${segment.data.label}</strong><br>
                AI数: ${segment.data.value}<br>
                主要AI: ${topAgent.name}<br>
                利用率: ${Math.round((segment.data.value / agents.length) * 100)}%
            `;
            window.DashboardCharts.showChartTooltip(e.clientX, e.clientY, content);
        } else {
            window.DashboardCharts.hideChartTooltip();
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        window.DashboardCharts.hideChartTooltip();
    });
}

// Collaboration Mapモジュールを初期化
function initCollaborationMapModule() {
    const canvas = document.getElementById('collaboration-map-canvas');
    if (!canvas) return;
    
    collabMapCanvas = canvas;
    collabMapContext = canvas.getContext('2d');
    
    // キャンバスサイズを設定
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 320;
    
    // ノードとエッジを生成
    generateCollaborationGraph();
    
    // 初回描画
    drawCollaborationMap();
    
    // アニメーションループ
    requestAnimationFrame(animateCollaborationMap);
    
    // イベントリスナー
    canvas.addEventListener('mousemove', handleCollabMapMouseMove);
    canvas.addEventListener('click', handleCollabMapClick);
    
    document.getElementById('collab-map-reset').addEventListener('click', () => {
        generateCollaborationGraph();
        drawCollaborationMap();
    });
}

function generateCollaborationGraph() {
    const { agents, collaborations } = dashboardData;
    
    // ノードを生成（上位20エージェント）
    const topAgents = [...agents]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 20);
    
    collabMapNodes = topAgents.map((agent, index) => {
        const angle = (index / topAgents.length) * Math.PI * 2;
        const radius = Math.min(collabMapCanvas.width, collabMapCanvas.height) / 2 - 60;
        
        return {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            x: collabMapCanvas.width / 2 + Math.cos(angle) * radius,
            y: collabMapCanvas.height / 2 + Math.sin(angle) * radius,
            targetX: collabMapCanvas.width / 2 + Math.cos(angle) * radius,
            targetY: collabMapCanvas.height / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            radius: 5 + (agent.usageCount / 1500) * 10,
            fixed: false,
            usageCount: agent.usageCount
        };
    });
    
    // エッジを生成
    const nodeIds = new Set(collabMapNodes.map(n => n.id));
    collabMapEdges = collaborations
        .filter(c => nodeIds.has(c.agent1Id) && nodeIds.has(c.agent2Id))
        .map(c => ({
            source: collabMapNodes.find(n => n.id === c.agent1Id),
            target: collabMapNodes.find(n => n.id === c.agent2Id),
            strength: c.connectionStrength,
            coUsageCount: c.coUsageCount
        }))
        .filter(e => e.source && e.target);
}

function drawCollaborationMap() {
    const ctx = collabMapContext;
    
    // 背景をクリア
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, collabMapCanvas.width, collabMapCanvas.height);
    
    // エッジを描画
    collabMapEdges.forEach(edge => {
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = `rgba(79, 195, 247, ${edge.strength * 0.5})`;
        ctx.lineWidth = 1 + edge.strength * 2;
        ctx.stroke();
    });
    
    // ノードを描画
    collabMapNodes.forEach(node => {
        const isHovered = collabMapHoveredNode === node;
        
        // ノード本体
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#00ffc8' : '#4fc3f7';
        ctx.fill();
        
        // グロー効果
        if (isHovered) {
            ctx.shadowColor = '#00ffc8';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#00ffc8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // 名前ラベル（ホバー時のみ）
        if (isHovered) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.name, node.x, node.y - node.radius - 10);
        }
    });
}

function animateCollaborationMap() {
    // 簡易的な力学シミュレーション
    collabMapNodes.forEach(node => {
        if (node.fixed) return;
        
        // 中心への引力
        const centerX = collabMapCanvas.width / 2;
        const centerY = collabMapCanvas.height / 2;
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            node.vx += (dx / distance) * 0.01;
            node.vy += (dy / distance) * 0.01;
        }
        
        // ターゲット位置への引力
        node.vx += (node.targetX - node.x) * 0.1;
        node.vy += (node.targetY - node.y) * 0.1;
        
        // 摩擦
        node.vx *= 0.9;
        node.vy *= 0.9;
        
        // 位置更新
        node.x += node.vx;
        node.y += node.vy;
    });
    
    drawCollaborationMap();
    requestAnimationFrame(animateCollaborationMap);
}

function handleCollabMapMouseMove(e) {
    const rect = collabMapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let found = null;
    collabMapNodes.forEach(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < node.radius + 5) {
            found = node;
        }
    });
    
    if (found !== collabMapHoveredNode) {
        collabMapHoveredNode = found;
        
        if (found) {
            // 接続数を計算
            const connections = collabMapEdges.filter(e => 
                e.source === found || e.target === found
            );
            
            const content = `
                <strong>${found.name}</strong><br>
                タイプ: ${found.type}<br>
                使用回数: ${found.usageCount.toLocaleString()}<br>
                連携数: ${connections.length}
            `;
            window.DashboardCharts.showChartTooltip(e.clientX, e.clientY, content);
        } else {
            window.DashboardCharts.hideChartTooltip();
        }
    }
}

function handleCollabMapClick(e) {
    if (collabMapHoveredNode) {
        collabMapHoveredNode.fixed = !collabMapHoveredNode.fixed;
    }
}

// Usage Trackerモジュールを初期化
function initUsageTrackerModule() {
    const { departmentUsage } = dashboardData;
    const container = document.getElementById('usage-tracker-content');
    
    container.innerHTML = '';
    
    Object.entries(departmentUsage).forEach(([deptId, data]) => {
        const row = document.createElement('div');
        row.className = 'dept-usage-row';
        
        const deptName = window.DashboardData.getDepartmentName(deptId);
        
        row.innerHTML = `
            <div class="dept-usage-header">
                <span class="dept-usage-name">${deptName}</span>
                <span class="dept-usage-value">平均: ${data.averageWeeklyUsage}h/週</span>
            </div>
            <canvas class="dept-usage-canvas" data-dept-id="${deptId}"></canvas>
            <div class="dept-sparkline" id="sparkline-${deptId}">
                <canvas id="sparkline-canvas-${deptId}" width="600" height="120"></canvas>
            </div>
        `;
        
        container.appendChild(row);
        
        // ヒートバーを描画
        const canvas = row.querySelector('.dept-usage-canvas');
        canvas.width = canvas.offsetWidth;
        canvas.height = 60;
        
        const heatBar = window.DashboardCharts.drawHeatBar(canvas, data.weeklyUsage, {
            colorScale: {
                min: '#1a237e',
                mid: '#4fc3f7',
                max: '#00ffc8'
            },
            glowEffect: true
        });
        
        // クリックでSparkline展開
        canvas.addEventListener('click', () => {
            const sparklineDiv = document.getElementById(`sparkline-${deptId}`);
            const isActive = sparklineDiv.classList.contains('active');
            
            // すべてのSparklineを閉じる
            document.querySelectorAll('.dept-sparkline').forEach(div => {
                div.classList.remove('active');
            });
            
            // クリックされたものをトグル
            if (!isActive) {
                sparklineDiv.classList.add('active');
                
                // Sparklineを描画
                const sparklineCanvas = document.getElementById(`sparkline-canvas-${deptId}`);
                sparklineCanvas.width = sparklineCanvas.offsetWidth;
                
                window.DashboardCharts.drawSparkline(sparklineCanvas, data.weeklyUsage, {
                    lineColor: '#4fc3f7',
                    fillColor: 'rgba(79, 195, 247, 0.2)',
                    pointColor: '#00ffc8',
                    showPoints: true,
                    showGrid: true,
                    glowEffect: true
                });
            }
        });
        
        // ホバーツールチップ
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cell = heatBar.getCellAtPoint(x, y);
            if (cell) {
                const content = `
                    <strong>Week ${cell.index + 1}</strong><br>
                    利用時間: ${cell.value}時間
                `;
                window.DashboardCharts.showChartTooltip(e.clientX, e.clientY, content);
            } else {
                window.DashboardCharts.hideChartTooltip();
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            window.DashboardCharts.hideChartTooltip();
        });
    });
}

// スコアカードを初期化
function initScorecards() {
    const { departmentUsage } = dashboardData;
    const container = document.getElementById('department-scorecards');
    
    container.innerHTML = '';
    
    Object.entries(departmentUsage).forEach(([deptId, data]) => {
        const deptName = window.DashboardData.getDepartmentName(deptId);
        
        const card = document.createElement('div');
        card.className = 'dept-scorecard';
        
        card.innerHTML = `
            <div class="scorecard-header">
                <div class="scorecard-dept-name">${deptName}</div>
            </div>
            <div class="scorecard-metrics">
                <div class="scorecard-metric">
                    <div class="scorecard-metric-label">AI活用率</div>
                    <div class="scorecard-metric-value">${data.aiUtilizationRate}%</div>
                </div>
                <div class="scorecard-metric">
                    <div class="scorecard-metric-label">Value Index</div>
                    <div class="scorecard-metric-value">+${data.valueIndex}%</div>
                </div>
            </div>
            <div class="scorecard-metrics">
                <div class="scorecard-metric">
                    <div class="scorecard-metric-label">CoIQ</div>
                    <div class="scorecard-metric-value">${data.coIQ.toFixed(2)}</div>
                </div>
                <div class="scorecard-metric">
                    <div class="scorecard-metric-label">多様性スコア</div>
                    <div class="scorecard-metric-value">${data.diversityScore.toFixed(2)}</div>
                </div>
            </div>
            <div class="scorecard-agents">
                <div class="scorecard-agents-title">トップエージェント</div>
                ${data.topAgents.map((agent, index) => `
                    <div class="scorecard-agent-item">
                        <span>${index + 1}. ${agent.name}</span>
                        <span>${agent.usageCount}回</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// インサイトを初期化
function initInsights() {
    const { insights } = dashboardData;
    const container = document.getElementById('insights-content');
    
    container.innerHTML = '';
    
    insights.forEach(insight => {
        const item = document.createElement('div');
        item.className = 'insight-item';
        
        item.innerHTML = `
            <div class="insight-title">${insight.title}</div>
            <div class="insight-content">${insight.content}</div>
        `;
        
        container.appendChild(item);
    });
}

// イベントリスナーを設定
function setupDashboardEventListeners() {
    // Top Agentsのソート
    document.getElementById('top-agents-sort').addEventListener('change', (e) => {
        currentSortMode = e.target.value;
        renderTopAgents(currentSortMode);
    });
    
    // レポート生成ボタン
    document.getElementById('generate-report-btn').addEventListener('click', generateReport);
}

// レポートを生成
function generateReport() {
    const { insights, summary } = dashboardData;
    
    let reportText = 'Agent Analytics Report\n';
    reportText += '='.repeat(50) + '\n\n';
    reportText += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    reportText += `【サマリー】\n`;
    reportText += `AI利用総数: ${summary.totalAICount}\n`;
    reportText += `アクティブ部署数: ${summary.activeDepartments}\n`;
    reportText += `平均活用率: ${summary.avgUtilizationRate}%\n\n`;
    
    insights.forEach(insight => {
        reportText += `【${insight.title}】\n`;
        reportText += `${insight.content}\n\n`;
    });
    
    // ダウンロード
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-analytics-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('レポートが生成されました！');
}

// ウィンドウリサイズ時の処理
function onDashboardResize() {
    // Collaboration Mapのリサイズ
    if (collabMapCanvas && collabMapCanvas.parentElement) {
        const container = collabMapCanvas.parentElement;
        collabMapCanvas.width = container.clientWidth;
        collabMapCanvas.height = 320;
        
        // ノード位置を再計算
        collabMapNodes.forEach((node, index) => {
            const angle = (index / collabMapNodes.length) * Math.PI * 2;
            const radius = Math.min(collabMapCanvas.width, collabMapCanvas.height) / 2 - 60;
            node.targetX = collabMapCanvas.width / 2 + Math.cos(angle) * radius;
            node.targetY = collabMapCanvas.height / 2 + Math.sin(angle) * radius;
        });
    }
    
    // Type Distribution Chartの再描画
    if (dashboardData) {
        initTypeDistributionModule();
    }
}

// エクスポート
if (typeof window !== 'undefined') {
    window.Dashboard = {
        initDashboard,
        onDashboardResize
    };
}

