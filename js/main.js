// main.js - 主程序
console.log('🚀 主程序启动...');

// 应用程序状态
const App = {
    isInitialized: false
};

// 初始化应用程序
async function initApp() {
    if (App.isInitialized) {
        console.log('应用已初始化');
        return;
    }
    
    console.log('🚀 开始初始化应用...');
    
    try {
        // 1. 显示加载状态
        showLoading(true);
        
        // 2. 初始化认证
        if (window.Auth) {
            await window.Auth.init();
        }
        
        // 3. 初始化Python运行器
        initPythonRunners();
        
        // 4. 设置完成
        App.isInitialized = true;
        console.log('✅ 应用初始化完成');
        
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        showError('应用初始化失败: ' + error.message);
        
    } finally {
        showLoading(false);
    }
}

// 初始化Python运行器
function initPythonRunners() {
    console.log('🐍 初始化Python运行器...');
    
    // 检查是否有运行器容器
    const containers = ['python-runner-1', 'python-runner-2'];
    
    containers.forEach(containerId => {
        if (document.getElementById(containerId)) {
            if (window.PythonRunner) {
                new window.PythonRunner(containerId);
                console.log(`✅ 创建Python运行器: ${containerId}`);
            }
        }
    });
}

// 显示加载状态
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

// 显示错误
function showError(message) {
    console.error('显示错误:', message);
    // 可以在这里添加错误提示UI
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成');
    
    // 延迟初始化，确保所有脚本已加载
    setTimeout(() => {
        initApp();
    }, 500);
});

// 暴露初始化函数
window.initApp = initApp;
