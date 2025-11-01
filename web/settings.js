// ==========================================
// Settings - 設定管理
// ==========================================

let settingsInitialized = false;
let currentSettings = {
    theme: 'dark',
    updateFrequency: 'realtime',
    datasource: {
        type: 'mock',
        url: '',
        apiKey: '',
        status: 'disconnected'
    }
};

// 設定を初期化
function initSettings() {
    if (settingsInitialized) {
        console.log('Settings already initialized');
        return;
    }
    
    console.log('Initializing Settings...');
    
    // 保存済み設定を読み込み
    loadSettings();
    
    // UIを更新
    updateSettingsUI();
    
    // イベントリスナーを設定
    setupSettingsEventListeners();
    
    settingsInitialized = true;
}

// 設定を読み込み
function loadSettings() {
    try {
        const saved = localStorage.getItem('galaxy-settings');
        if (saved) {
            currentSettings = JSON.parse(saved);
            console.log('Settings loaded:', currentSettings);
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

// 設定を保存
function saveSettings() {
    try {
        localStorage.setItem('galaxy-settings', JSON.stringify(currentSettings));
        console.log('Settings saved:', currentSettings);
        
        // 視覚的フィードバック
        showNotification('設定を保存しました', 'success');
        
        // 設定を適用
        applySettings();
    } catch (e) {
        console.error('Failed to save settings:', e);
        showNotification('設定の保存に失敗しました', 'error');
    }
}

// UIを更新
function updateSettingsUI() {
    // テーマトグル
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = currentSettings.theme === 'dark';
        updateThemeLabels(currentSettings.theme);
    }
    
    // 更新頻度ラジオボタン
    const frequencyRadios = document.querySelectorAll('input[name="update-frequency"]');
    frequencyRadios.forEach(radio => {
        radio.checked = radio.value === currentSettings.updateFrequency;
    });
    
    // データソース
    const datasourceType = document.getElementById('datasource-type');
    const datasourceUrl = document.getElementById('datasource-url');
    const datasourceKey = document.getElementById('datasource-key');
    
    if (datasourceType) datasourceType.value = currentSettings.datasource.type;
    if (datasourceUrl) datasourceUrl.value = currentSettings.datasource.url;
    if (datasourceKey) datasourceKey.value = currentSettings.datasource.apiKey;
    
    updateDatasourceStatus(currentSettings.datasource.status);
}

// イベントリスナーを設定
function setupSettingsEventListeners() {
    // テーマトグル
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            currentSettings.theme = e.target.checked ? 'dark' : 'light';
            updateThemeLabels(currentSettings.theme);
            applyTheme(currentSettings.theme);
        });
    }
    
    // 更新頻度ラジオボタン
    const frequencyRadios = document.querySelectorAll('input[name="update-frequency"]');
    frequencyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentSettings.updateFrequency = e.target.value;
                console.log('Update frequency changed:', currentSettings.updateFrequency);
            }
        });
    });
    
    // データソースフィールド
    const datasourceType = document.getElementById('datasource-type');
    const datasourceUrl = document.getElementById('datasource-url');
    const datasourceKey = document.getElementById('datasource-key');
    
    if (datasourceType) {
        datasourceType.addEventListener('change', (e) => {
            currentSettings.datasource.type = e.target.value;
            
            // モックデータの場合は接続フィールドを無効化
            if (e.target.value === 'mock') {
                if (datasourceUrl) datasourceUrl.disabled = true;
                if (datasourceKey) datasourceKey.disabled = true;
            } else {
                if (datasourceUrl) datasourceUrl.disabled = false;
                if (datasourceKey) datasourceKey.disabled = false;
            }
        });
    }
    
    if (datasourceUrl) {
        datasourceUrl.addEventListener('input', (e) => {
            currentSettings.datasource.url = e.target.value;
        });
    }
    
    if (datasourceKey) {
        datasourceKey.addEventListener('input', (e) => {
            currentSettings.datasource.apiKey = e.target.value;
        });
    }
    
    // 接続テストボタン
    const connectBtn = document.getElementById('datasource-connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', testDatasourceConnection);
    }
    
    // 保存ボタン
    const saveBtn = document.getElementById('settings-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // リセットボタン
    const resetBtn = document.getElementById('settings-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
}

// テーマラベルを更新
function updateThemeLabels(theme) {
    const labels = document.querySelectorAll('.toggle-label');
    labels.forEach((label, index) => {
        if (theme === 'light' && index === 0) {
            label.classList.add('active');
        } else if (theme === 'dark' && index === 1) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });
}

// テーマを適用
function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'light') {
        body.style.background = `
            radial-gradient(ellipse at 20% 30%, rgba(150, 180, 250, 0.25) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 20%, rgba(180, 200, 250, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(200, 170, 250, 0.18) 0%, transparent 45%),
            linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 30%, #dce2ea 50%, #d1d8e3 70%, #e0e6ef 100%)
        `;
        
        showNotification('ライトモードに切り替えました', 'info');
    } else {
        body.style.background = `
            radial-gradient(ellipse at 20% 30%, rgba(80, 30, 150, 0.25) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 20%, rgba(30, 60, 180, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(150, 70, 200, 0.18) 0%, transparent 45%),
            radial-gradient(ellipse at 70% 70%, rgba(60, 100, 180, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(40, 30, 100, 0.12) 0%, transparent 60%),
            linear-gradient(135deg, #000208 0%, #000615 30%, #000a25 50%, #000f35 70%, #000820 100%)
        `;
        
        showNotification('ダークモードに切り替えました', 'info');
    }
}

// データソース接続をテスト
async function testDatasourceConnection() {
    const statusElement = document.getElementById('datasource-status');
    const connectBtn = document.getElementById('datasource-connect-btn');
    
    if (currentSettings.datasource.type === 'mock') {
        updateDatasourceStatus('connected');
        showNotification('モックデータに接続しました', 'success');
        return;
    }
    
    // 接続テスト中
    updateDatasourceStatus('connecting');
    if (connectBtn) connectBtn.disabled = true;
    if (connectBtn) connectBtn.textContent = '接続中...';
    
    try {
        // 実際の接続テスト（シミュレーション）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ランダムに成功/失敗を決定（デモ用）
        const success = Math.random() > 0.3;
        
        if (success) {
            currentSettings.datasource.status = 'connected';
            updateDatasourceStatus('connected');
            showNotification('データソースに接続しました', 'success');
        } else {
            throw new Error('接続に失敗しました');
        }
    } catch (error) {
        currentSettings.datasource.status = 'error';
        updateDatasourceStatus('error');
        showNotification('接続に失敗しました: ' + error.message, 'error');
    } finally {
        if (connectBtn) connectBtn.disabled = false;
        if (connectBtn) connectBtn.textContent = '接続テスト';
    }
}

// データソース状態を更新
function updateDatasourceStatus(status) {
    const statusElement = document.getElementById('datasource-status');
    if (!statusElement) return;
    
    // クラスをリセット
    statusElement.className = 'status-indicator';
    
    const statusText = statusElement.querySelector('.status-text');
    
    switch (status) {
        case 'connected':
            statusElement.classList.add('connected');
            if (statusText) statusText.textContent = '接続済み';
            break;
        case 'connecting':
            if (statusText) statusText.textContent = '接続中...';
            break;
        case 'error':
            statusElement.classList.add('error');
            if (statusText) statusText.textContent = '接続エラー';
            break;
        default:
            if (statusText) statusText.textContent = '接続待機中';
    }
}

// 設定をリセット
function resetSettings() {
    if (!confirm('設定をデフォルトに戻しますか？')) {
        return;
    }
    
    currentSettings = {
        theme: 'dark',
        updateFrequency: 'realtime',
        datasource: {
            type: 'mock',
            url: '',
            apiKey: '',
            status: 'disconnected'
        }
    };
    
    updateSettingsUI();
    applySettings();
    saveSettings();
    
    showNotification('設定をリセットしました', 'info');
}

// 設定を適用
function applySettings() {
    // テーマを適用
    applyTheme(currentSettings.theme);
    
    // 更新頻度を適用（実装は今後）
    console.log('Update frequency set to:', currentSettings.updateFrequency);
    
    // データソース設定を適用（実装は今後）
    console.log('Datasource settings:', currentSettings.datasource);
}

// 通知を表示
function showNotification(message, type = 'info') {
    // 既存の通知を削除
    const existing = document.getElementById('settings-notification');
    if (existing) {
        existing.remove();
    }
    
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.id = 'settings-notification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 30px;
        padding: 15px 25px;
        background: rgba(10, 20, 40, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid ${type === 'error' ? '#e91e63' : type === 'success' ? '#00ffc8' : '#4fc3f7'};
        border-radius: 8px;
        color: #ffffff;
        font-size: 14px;
        box-shadow: 0 0 20px ${type === 'error' ? 'rgba(233, 30, 99, 0.3)' : type === 'success' ? 'rgba(0, 255, 200, 0.3)' : 'rgba(79, 195, 247, 0.3)'};
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒後に削除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// スタイルをドキュメントに追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// エクスポート
if (typeof window !== 'undefined') {
    window.Settings = {
        initSettings,
        saveSettings,
        resetSettings,
        applySettings,
        getCurrentSettings: () => currentSettings
    };
}

