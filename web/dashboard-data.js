// ==========================================
// Agent Analytics Dashboard - モックデータ生成
// ==========================================

// AIエージェント名のリスト
const agentNames = [
    'Cristal', 'GPT-4', 'Claude', 'Gemini', 'Copilot',
    'Notion AI', 'Perplexity', 'Midjourney', 'DALL-E', 'Stable Diffusion',
    'Jasper', 'Copy.ai', 'ChatGPT', 'Bard', 'Bing Chat',
    'Character.AI', 'Poe', 'You.com', 'Anthropic', 'Cohere',
    'DeepL Write', 'Grammarly', 'QuillBot', 'Wordtune', 'Rytr',
    'Synthesia', 'Descript', 'Runway', 'Tome', 'Beautiful.ai',
    'Fireflies', 'Otter.ai', 'Sembly', 'Tactiq', 'Fathom',
    'Zapier AI', 'Make', 'n8n', 'Airtable AI', 'Notion Automations',
    'GitHub Copilot', 'Tabnine', 'Cursor', 'Replit Ghostwriter', 'Amazon CodeWhisperer',
    'DataRobot', 'H2O.ai', 'MonkeyLearn', 'Akkio', 'Obviously AI'
];

// AIタイプ
const agentTypes = ['生成', '要約', '分析', '自動化'];

// タイプごとの分布率（合計100%になるように調整）
const typeDistribution = {
    '生成': 0.43,
    '要約': 0.28,
    '分析': 0.18,
    '自動化': 0.11
};

// 部署IDリスト（既存のdepartmentsから）
const departmentIds = ['consumer', 'corporate', 'technology', 'it', 'finance'];

// モックAIエージェントデータを生成
function generateMockAgents(count = 40) {
    const agents = [];
    const usedNames = new Set();
    
    // タイプ別に生成数を決定
    const typeCounts = {
        '生成': Math.floor(count * typeDistribution['生成']),
        '要約': Math.floor(count * typeDistribution['要約']),
        '分析': Math.floor(count * typeDistribution['分析']),
        '自動化': Math.floor(count * typeDistribution['自動化'])
    };
    
    // 端数調整
    const totalAssigned = Object.values(typeCounts).reduce((a, b) => a + b, 0);
    if (totalAssigned < count) {
        typeCounts['生成'] += (count - totalAssigned);
    }
    
    let id = 1;
    
    // タイプごとにエージェントを生成
    Object.keys(typeCounts).forEach(type => {
        for (let i = 0; i < typeCounts[type]; i++) {
            // 使用されていない名前を選択
            let name;
            do {
                name = agentNames[Math.floor(Math.random() * agentNames.length)];
            } while (usedNames.has(name) && usedNames.size < agentNames.length);
            
            if (usedNames.size >= agentNames.length) {
                name = `AI Agent ${id}`;
            }
            usedNames.add(name);
            
            // 使用回数（月間）
            const usageCount = Math.floor(50 + Math.random() * 1500);
            
            // 使用時間（時間）
            const usageTime = Math.floor(10 + Math.random() * 300);
            
            // 成果貢献度（0-100）
            const contributionScore = Math.floor(40 + Math.random() * 60);
            
            // 使用している部署（1-3部署）
            const deptCount = Math.floor(1 + Math.random() * 3);
            const departments = [];
            const shuffledDepts = [...departmentIds].sort(() => Math.random() - 0.5);
            for (let j = 0; j < deptCount; j++) {
                departments.push(shuffledDepts[j]);
            }
            
            // ユーザー数
            const userCount = Math.floor(5 + Math.random() * 50);
            
            agents.push({
                id: `agent-${id}`,
                name,
                type,
                usageCount,
                usageTime,
                contributionScore,
                departments,
                userCount,
                // 部署別使用率（後で計算）
                departmentUsageRates: {}
            });
            
            id++;
        }
    });
    
    // 部署別使用率を計算
    departmentIds.forEach(deptId => {
        const deptAgents = agents.filter(a => a.departments.includes(deptId));
        const totalUsage = deptAgents.reduce((sum, a) => sum + a.usageCount, 0);
        
        deptAgents.forEach(agent => {
            agent.departmentUsageRates[deptId] = totalUsage > 0 
                ? Math.round((agent.usageCount / totalUsage) * 100) 
                : 0;
        });
    });
    
    return agents;
}

// 部署別利用データを生成
function generateDepartmentUsage(agents) {
    const usage = {};
    
    departmentIds.forEach(deptId => {
        // 週次利用時間（12週分）
        const weeklyUsage = [];
        const baseUsage = 80 + Math.random() * 100; // 基準値
        
        for (let week = 0; week < 12; week++) {
            // トレンド + ランダム変動
            const trend = week * 2; // 週ごとに微増
            const variation = (Math.random() - 0.5) * 30;
            const value = Math.max(30, baseUsage + trend + variation);
            weeklyUsage.push(Math.round(value));
        }
        
        // その部署で使われているエージェント
        const deptAgents = agents.filter(a => a.departments.includes(deptId));
        
        // トップ3エージェントを抽出
        const topAgents = deptAgents
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 3)
            .map(a => ({
                id: a.id,
                name: a.name,
                usageCount: a.usageCount
            }));
        
        // AI活用率（70-95%）
        const aiUtilizationRate = Math.floor(70 + Math.random() * 25);
        
        // Value Index（10-40%）
        const valueIndex = Math.floor(10 + Math.random() * 30);
        
        // CoIQ（0.5-0.9）
        const coIQ = Math.round((0.5 + Math.random() * 0.4) * 100) / 100;
        
        // Diversity Score（0.4-0.8）
        const diversityScore = Math.round((0.4 + Math.random() * 0.4) * 100) / 100;
        
        usage[deptId] = {
            departmentId: deptId,
            weeklyUsage,
            topAgents,
            aiUtilizationRate,
            valueIndex,
            coIQ,
            diversityScore,
            totalUsageTime: weeklyUsage.reduce((a, b) => a + b, 0),
            averageWeeklyUsage: Math.round(weeklyUsage.reduce((a, b) => a + b, 0) / weeklyUsage.length)
        };
    });
    
    return usage;
}

// エージェント間のコラボレーションデータを生成
function generateCollaborations(agents) {
    const collaborations = [];
    const collaborationCount = Math.floor(agents.length * 1.5); // エージェント数×1.5の連携
    
    for (let i = 0; i < collaborationCount; i++) {
        // ランダムに2つのエージェントを選択
        const agent1 = agents[Math.floor(Math.random() * agents.length)];
        let agent2;
        do {
            agent2 = agents[Math.floor(Math.random() * agents.length)];
        } while (agent2.id === agent1.id);
        
        // 共通の部署があるほど連携強度が高い
        const commonDepts = agent1.departments.filter(d => agent2.departments.includes(d));
        const baseStrength = commonDepts.length > 0 ? 50 : 10;
        
        // 共利用回数
        const coUsageCount = Math.floor(baseStrength + Math.random() * 100);
        
        // 共有セッション数
        const sharedSessions = Math.floor(coUsageCount * 0.6);
        
        // 連携強度（0-1）
        const connectionStrength = Math.min(1, coUsageCount / 150);
        
        // 共通ユーザー数
        const commonUsers = Math.floor(Math.min(agent1.userCount, agent2.userCount) * 0.4);
        
        collaborations.push({
            agent1Id: agent1.id,
            agent2Id: agent2.id,
            agent1Name: agent1.name,
            agent2Name: agent2.name,
            coUsageCount,
            sharedSessions,
            connectionStrength,
            commonUsers,
            commonDepartments: commonDepts
        });
    }
    
    return collaborations;
}

// AIレポート（洞察）を生成
function generateInsights(agents, departmentUsage) {
    const insights = [];
    
    // 全体統計
    const totalUsageCount = agents.reduce((sum, a) => sum + a.usageCount, 0);
    const totalUsageTime = agents.reduce((sum, a) => sum + a.usageTime, 0);
    const avgContribution = Math.round(agents.reduce((sum, a) => sum + a.contributionScore, 0) / agents.length);
    
    // タイプ別統計
    const typeStats = {};
    agentTypes.forEach(type => {
        const typeAgents = agents.filter(a => a.type === type);
        typeStats[type] = {
            count: typeAgents.length,
            percentage: Math.round((typeAgents.length / agents.length) * 100),
            avgUsage: typeAgents.length > 0 
                ? Math.round(typeAgents.reduce((sum, a) => sum + a.usageCount, 0) / typeAgents.length)
                : 0
        };
    });
    
    // トップエージェント
    const topAgents = [...agents]
        .sort((a, b) => b.contributionScore - a.contributionScore)
        .slice(0, 5);
    
    // 部署別トレンド
    const deptTrends = {};
    Object.entries(departmentUsage).forEach(([deptId, data]) => {
        const recent3Weeks = data.weeklyUsage.slice(-3);
        const previous3Weeks = data.weeklyUsage.slice(-6, -3);
        const recentAvg = recent3Weeks.reduce((a, b) => a + b, 0) / 3;
        const previousAvg = previous3Weeks.reduce((a, b) => a + b, 0) / 3;
        const growthRate = previousAvg > 0 
            ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100)
            : 0;
        
        deptTrends[deptId] = {
            trend: growthRate > 5 ? '上昇' : growthRate < -5 ? '下降' : '安定',
            growthRate
        };
    });
    
    // インサイトコメント生成
    insights.push({
        type: 'summary',
        title: '全体サマリー',
        content: `組織全体で${agents.length}種類のAIエージェントが活用されており、月間${totalUsageCount.toLocaleString()}回の利用実績があります。平均成果貢献度は${avgContribution}%で、AI活用が組織の生産性向上に大きく寄与しています。`
    });
    
    insights.push({
        type: 'type-distribution',
        title: 'AIタイプ分析',
        content: `生成系AI（${typeStats['生成'].percentage}%）が最も多く活用されており、次いで要約系（${typeStats['要約'].percentage}%）、分析系（${typeStats['分析'].percentage}%）と続きます。特に生成系AIの平均利用回数は${typeStats['生成'].avgUsage}回/月と高く、コンテンツ制作の中核を担っています。`
    });
    
    insights.push({
        type: 'top-performers',
        title: 'トップパフォーマー',
        content: `最も成果貢献度が高いのは「${topAgents[0].name}」（貢献度${topAgents[0].contributionScore}%）で、${topAgents[0].departments.length}部署で活用されています。次いで「${topAgents[1].name}」（${topAgents[1].contributionScore}%）、「${topAgents[2].name}」（${topAgents[2].contributionScore}%）が高評価を得ています。`
    });
    
    // 成長部署の特定
    const growingDepts = Object.entries(deptTrends)
        .filter(([_, trend]) => trend.trend === '上昇')
        .sort((a, b) => b[1].growthRate - a[1].growthRate);
    
    if (growingDepts.length > 0) {
        const topGrowingDept = growingDepts[0];
        const deptName = getDepartmentName(topGrowingDept[0]);
        insights.push({
            type: 'growth-trend',
            title: '成長トレンド',
            content: `${deptName}のAI利用が直近3週間で${topGrowingDept[1].growthRate}%増加しており、組織全体をリードしています。この傾向は、積極的なAI導入施策と社内教育の成果と考えられます。`
        });
    }
    
    // 改善提案
    const improvements = [];
    
    // 低活用部署の特定
    const lowUtilizationDepts = Object.entries(departmentUsage)
        .filter(([_, data]) => data.aiUtilizationRate < 75)
        .map(([deptId, _]) => getDepartmentName(deptId));
    
    if (lowUtilizationDepts.length > 0) {
        improvements.push(`${lowUtilizationDepts.join('、')}のAI活用率が75%未満です。研修プログラムの実施や成功事例の共有を推奨します。`);
    }
    
    // タイプ多様性の提案
    const lowDiversityDepts = Object.entries(departmentUsage)
        .filter(([_, data]) => data.diversityScore < 0.5)
        .map(([deptId, _]) => getDepartmentName(deptId));
    
    if (lowDiversityDepts.length > 0) {
        improvements.push(`${lowDiversityDepts.join('、')}ではAIの多様性スコアが低い傾向にあります。様々なタイプのAIツールの導入を検討してください。`);
    }
    
    // 協働促進の提案
    const lowCoIQDepts = Object.entries(departmentUsage)
        .filter(([_, data]) => data.coIQ < 0.6)
        .map(([deptId, _]) => getDepartmentName(deptId));
    
    if (lowCoIQDepts.length > 0) {
        improvements.push(`${lowCoIQDepts.join('、')}では部署間AI協働が不足しています。クロスファンクショナルなプロジェクトの促進を推奨します。`);
    }
    
    if (improvements.length > 0) {
        insights.push({
            type: 'recommendations',
            title: '改善提案',
            content: improvements.join('\n\n')
        });
    }
    
    return insights;
}

// 部署名を取得
function getDepartmentName(deptId) {
    const names = {
        'consumer': 'コンシューマー統括',
        'corporate': '法人統括',
        'technology': 'テクノロジーユニット統括',
        'it': 'IT統括',
        'finance': '財務統括'
    };
    return names[deptId] || deptId;
}

// 全データを生成して返す
function generateAllMockData() {
    const agents = generateMockAgents(40);
    const departmentUsage = generateDepartmentUsage(agents);
    const collaborations = generateCollaborations(agents);
    const insights = generateInsights(agents, departmentUsage);
    
    // 全体統計を計算
    const totalAICount = agents.length;
    const activeDepartments = departmentIds.length;
    const avgUtilizationRate = Math.round(
        Object.values(departmentUsage).reduce((sum, d) => sum + d.aiUtilizationRate, 0) / activeDepartments
    );
    
    return {
        agents,
        departmentUsage,
        collaborations,
        insights,
        summary: {
            totalAICount,
            activeDepartments,
            avgUtilizationRate,
            totalUsageCount: agents.reduce((sum, a) => sum + a.usageCount, 0),
            totalUsageTime: agents.reduce((sum, a) => sum + a.usageTime, 0)
        }
    };
}

// データをエクスポート（グローバル変数として）
if (typeof window !== 'undefined') {
    window.DashboardData = {
        generateAllMockData,
        generateMockAgents,
        generateDepartmentUsage,
        generateCollaborations,
        generateInsights,
        getDepartmentName
    };
}

