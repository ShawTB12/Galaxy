// ==========================================
// Agent Analytics Dashboard - チャート描画ライブラリ
// ==========================================

// ドーナツグラフを描画
function drawDonutChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) * 0.8;
    const innerRadius = outerRadius * 0.6;
    
    const {
        colors = ['#4fc3f7', '#00ffc8', '#ffc107', '#e91e63'],
        showLabels = true,
        glowEffect = true,
        centerText = ''
    } = options;
    
    // 合計値を計算
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // 各セグメントを描画
    let currentAngle = -Math.PI / 2; // 12時の位置から開始
    
    data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * Math.PI * 2;
        const color = colors[index % colors.length];
        
        // セグメント描画
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        
        // グラデーション効果
        const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '88'); // 半透明
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 発光エフェクト
        if (glowEffect) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // ラベル描画（オプション）
        if (showLabels && item.label) {
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelRadius = outerRadius + 30;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, labelX, labelY);
            
            // パーセンテージ
            const percentage = Math.round((item.value / total) * 100);
            ctx.font = '12px "Orbitron", sans-serif';
            ctx.fillStyle = '#90caf9';
            ctx.fillText(`${percentage}%`, labelX, labelY + 18);
        }
        
        currentAngle += sliceAngle;
    });
    
    // 中央のテキスト
    if (centerText) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(centerText, centerX, centerY);
    }
    
    return {
        getSegmentAtPoint: (x, y) => {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < innerRadius || distance > outerRadius) {
                return null;
            }
            
            let angle = Math.atan2(dy, dx) + Math.PI / 2;
            if (angle < 0) angle += Math.PI * 2;
            
            let currentAngle = 0;
            for (let i = 0; i < data.length; i++) {
                const sliceAngle = (data[i].value / total) * Math.PI * 2;
                if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
                    return { index: i, data: data[i] };
                }
                currentAngle += sliceAngle;
            }
            return null;
        }
    };
}

// ヒートバーを描画（週次データ）
function drawHeatBar(canvas, weeklyData, options = {}) {
    const ctx = canvas.getContext('2d');
    const padding = 40;
    const barHeight = 30;
    const barY = (canvas.height - barHeight) / 2;
    const barWidth = canvas.width - padding * 2;
    const cellWidth = barWidth / weeklyData.length;
    
    const {
        colorScale = {
            min: '#1a237e',
            mid: '#4fc3f7',
            max: '#00ffc8'
        },
        showValues = false,
        glowEffect = true
    } = options;
    
    // 最小値と最大値を取得
    const min = Math.min(...weeklyData);
    const max = Math.max(...weeklyData);
    
    // 各セルを描画
    weeklyData.forEach((value, index) => {
        const x = padding + index * cellWidth;
        
        // 値を0-1に正規化
        const normalized = max > min ? (value - min) / (max - min) : 0.5;
        
        // 色を計算
        let color;
        if (normalized < 0.5) {
            const t = normalized * 2;
            color = interpolateColor(colorScale.min, colorScale.mid, t);
        } else {
            const t = (normalized - 0.5) * 2;
            color = interpolateColor(colorScale.mid, colorScale.max, t);
        }
        
        // セル描画
        ctx.fillStyle = color;
        ctx.fillRect(x, barY, cellWidth - 2, barHeight);
        
        // 発光エフェクト
        if (glowEffect) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = color + 'aa';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, barY, cellWidth - 2, barHeight);
            ctx.shadowBlur = 0;
        }
        
        // 値を表示（オプション）
        if (showValues) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), x + cellWidth / 2, barY + barHeight / 2);
        }
    });
    
    // 週数ラベル
    ctx.fillStyle = '#90caf9';
    ctx.font = '11px "Orbitron", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Week 1', padding, barY - 10);
    ctx.textAlign = 'right';
    ctx.fillText(`Week ${weeklyData.length}`, canvas.width - padding, barY - 10);
    
    return {
        getCellAtPoint: (x, y) => {
            if (y < barY || y > barY + barHeight) return null;
            if (x < padding || x > canvas.width - padding) return null;
            
            const index = Math.floor((x - padding) / cellWidth);
            if (index >= 0 && index < weeklyData.length) {
                return { index, value: weeklyData[index] };
            }
            return null;
        }
    };
}

// Sparkline（週次推移線グラフ）を描画
function drawSparkline(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const padding = 20;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    const {
        lineColor = '#4fc3f7',
        fillColor = 'rgba(79, 195, 247, 0.2)',
        pointColor = '#00ffc8',
        showPoints = true,
        showGrid = true,
        glowEffect = true
    } = options;
    
    // データの最小値と最大値
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // グリッド線を描画
    if (showGrid) {
        ctx.strokeStyle = 'rgba(144, 202, 249, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }
    }
    
    // ポイント座標を計算
    const points = data.map((value, index) => {
        const x = padding + (width / (data.length - 1)) * index;
        const y = padding + height - ((value - min) / range) * height;
        return { x, y, value };
    });
    
    // 塗りつぶし領域
    if (fillColor) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, canvas.height - padding);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, canvas.height - padding);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    
    // 線を描画
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    
    if (glowEffect) {
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 8;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // ポイントを描画
    if (showPoints) {
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = pointColor;
            ctx.fill();
            
            if (glowEffect) {
                ctx.shadowColor = pointColor;
                ctx.shadowBlur = 6;
                ctx.strokeStyle = pointColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
    }
    
    // 値ラベル（最小・最大）
    ctx.fillStyle = '#90caf9';
    ctx.font = '11px "Orbitron", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(max.toFixed(0), padding - 5, padding);
    ctx.fillText(min.toFixed(0), padding - 5, canvas.height - padding);
    
    return {
        getPointAtX: (x) => {
            if (x < padding || x > canvas.width - padding) return null;
            
            const index = Math.round(((x - padding) / width) * (data.length - 1));
            if (index >= 0 && index < data.length) {
                return { index, value: data[index], point: points[index] };
            }
            return null;
        }
    };
}

// 円形プログレスリングをSVGで作成
function createProgressRing(percentage, options = {}) {
    const {
        size = 100,
        strokeWidth = 8,
        color = '#4fc3f7',
        backgroundColor = 'rgba(255, 255, 255, 0.1)',
        showPercentage = true,
        glowEffect = true
    } = options;
    
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * Math.PI * 2;
    const offset = circumference - (percentage / 100) * circumference;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    
    // 背景円
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', size / 2);
    bgCircle.setAttribute('cy', size / 2);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', backgroundColor);
    bgCircle.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(bgCircle);
    
    // プログレス円
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', size / 2);
    progressCircle.setAttribute('cy', size / 2);
    progressCircle.setAttribute('r', radius);
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke', color);
    progressCircle.setAttribute('stroke-width', strokeWidth);
    progressCircle.setAttribute('stroke-dasharray', circumference);
    progressCircle.setAttribute('stroke-dashoffset', offset);
    progressCircle.setAttribute('stroke-linecap', 'round');
    progressCircle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    progressCircle.style.transition = 'stroke-dashoffset 1s ease';
    
    if (glowEffect) {
        progressCircle.setAttribute('filter', 'url(#glow)');
        
        // グローフィルター
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'glow');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '3');
        feGaussianBlur.setAttribute('result', 'coloredBlur');
        
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
        svg.appendChild(defs);
    }
    
    svg.appendChild(progressCircle);
    
    // パーセンテージテキスト
    if (showPercentage) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '50%');
        text.setAttribute('y', '50%');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-family', '"Orbitron", sans-serif');
        text.setAttribute('font-size', size / 4);
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${Math.round(percentage)}%`;
        svg.appendChild(text);
    }
    
    return svg;
}

// 色補間ヘルパー関数
function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// ツールチップを表示するヘルパー関数
function showChartTooltip(x, y, content) {
    let tooltip = document.getElementById('chart-tooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.background = 'rgba(10, 20, 40, 0.95)';
        tooltip.style.backdropFilter = 'blur(10px)';
        tooltip.style.border = '1px solid rgba(79, 195, 247, 0.5)';
        tooltip.style.borderRadius = '8px';
        tooltip.style.padding = '8px 12px';
        tooltip.style.fontSize = '12px';
        tooltip.style.color = '#ffffff';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.boxShadow = '0 0 20px rgba(79, 195, 247, 0.3)';
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y + 15}px`;
}

function hideChartTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// エクスポート
if (typeof window !== 'undefined') {
    window.DashboardCharts = {
        drawDonutChart,
        drawHeatBar,
        drawSparkline,
        createProgressRing,
        showChartTooltip,
        hideChartTooltip,
        interpolateColor,
        hexToRgb
    };
}

