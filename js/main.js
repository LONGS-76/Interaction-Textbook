// main.js - 主程序入口
console.log('🚀 加载主程序...');

// 应用程序状态
const App = {
    isInitialized: false,
    isLoading: false
};

// 初始化应用程序
async function initApp() {
    if (App.isInitialized || App.isLoading) {
        console.log('应用程序已经在初始化或已初始化');
        return;
    }
    
    App.isLoading = true;
    console.log('🚀 开始初始化应用程序...');
    
    try {
        showLoading(true);
        
        // 1. 等待配置加载
        await waitForConfig();
        
        // 2. 初始化认证
        if (window.Auth) {
            await window.Auth.init();
        }
        
        // 3. 初始化Python运行器
        initPythonRunners();
        
        // 4. 完成初始化
        App.isInitialized = true;
        console.log('🎉 应用程序初始化完成！');
        
    } catch (error) {
        console.error('❌ 应用程序初始化失败:', error);
        showError('应用初始化失败: ' + error.message);
        
    } finally {
        App.isLoading = false;
        showLoading(false);
    }
}

// 等待配置加载
async function waitForConfig() {
    return new Promise((resolve) => {
        const checkConfig = () => {
            if (window.APP_CONFIG) {
                console.log('✅ 配置加载完成');
                resolve();
            } else {
                console.log('⏳ 等待配置加载...');
                setTimeout(checkConfig, 100);
            }
        };
        checkConfig();
    });
}

// 初始化Python运行器
function initPythonRunners() {
    console.log('🐍 初始化Python运行器...');
    
    const containers = [
        'python-runner-1',
        'python-runner-2', 
        'python-runner-3',
        'python-runner-4'
    ];
    
    containers.forEach(containerId => {
        if (document.getElementById(containerId)) {
            try {
                const runner = new PythonRunner(containerId);
                console.log(`✅ 创建Python运行器: ${containerId}`);
            } catch (error) {
                console.error(`❌ 创建Python运行器失败 ${containerId}:`, error);
            }
        }
    });
}

// 显示加载动画
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'flex' : 'none';
    }
}

// 显示错误
function showError(message) {
    console.error('显示错误:', message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 400px;
    `;
    errorDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">❌ 错误</div>
        <div style="font-size: 14px;">${message}</div>
        <button onclick="this.parentElement.remove()" 
                style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">
            ×
        </button>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成，开始初始化应用...');
    
    // 设置超时
    const initTimeout = setTimeout(() => {
        if (!App.isInitialized && !App.isLoading) {
            console.warn('⚠️ 应用程序初始化超时，强制初始化');
            initApp();
        }
    }, 5000);
    
    // 主初始化
    initApp().then(() => {
        clearTimeout(initTimeout);
    }).catch(error => {
        clearTimeout(initTimeout);
        console.error('应用程序初始化异常:', error);
    });
});

// 暴露初始化函数
window.initApp = initApp;

console.log('✅ 主程序模块加载完成');
