// ==========================================
// Agent Analytics Dashboard - メインロジック
// ==========================================

let dashboardData = null;
let currentSortMode = 'contribution';

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

