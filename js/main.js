/**
 * 应用程序主入口
 * 协调各个模块的初始化顺序
 */

// 应用程序状态
const App = {
    isInitialized: false,
    isLoading: false,
    modules: {
        config: false,
        supabase: false,
        auth: false,
        python: false
    }
};

// 初始化应用程序
async function initializeApp() {
    if (App.isInitialized || App.isLoading) {
        console.log('应用程序已经在初始化或已初始化');
        return;
    }
    
    App.isLoading = true;
    console.log('🚀 开始初始化应用程序...');
    
    try {
        // 显示加载状态
        showLoading(true);
        
        // 步骤1: 验证配置
        await initializeConfig();
        
        // 步骤2: 初始化Supabase客户端
        await initializeSupabase();
        
        // 步骤3: 初始化认证系统
        await initializeAuth();
        
        // 步骤4: 初始化Python运行器
        await initializePythonRunners();
        
        // 步骤5: 设置完成后的处理
        onAppInitialized();
        
        App.isInitialized = true;
        console.log('🎉 应用程序初始化完成！');
        
    } catch (error) {
        console.error('❌ 应用程序初始化失败:', error);
        showError('应用程序初始化失败: ' + error.message);
        
    } finally {
        App.isLoading = false;
        showLoading(false);
    }
}

// 1. 初始化配置
async function initializeConfig() {
    console.log('1. 验证配置...');
    
    if (!window.APP_CONFIG) {
        throw new Error('应用程序配置未加载');
    }
    
    if (!window.APP_CONFIG.supabase?.url || !window.APP_CONFIG.supabase?.anonKey) {
        throw new Error('Supabase配置不完整，请检查config.js文件');
    }
    
    App.modules.config = true;
    console.log('✅ 配置验证通过');
}

// 2. 初始化Supabase
async function initializeSupabase() {
    console.log('2. 初始化Supabase客户端...');
    
    if (!window.Supabase) {
        throw new Error('Supabase客户端模块未加载');
    }
    
    try {
        // 获取Supabase客户端（会自动初始化）
        const client = await window.Supabase.getClient();
        
        if (!client) {
            throw new Error('Supabase客户端初始化失败');
        }
        
        App.modules.supabase = true;
        console.log('✅ Supabase客户端初始化成功');
        
    } catch (error) {
        console.error('Supabase初始化失败:', error);
        throw new Error('Supabase连接失败: ' + error.message);
    }
}

// 3. 初始化认证
async function initializeAuth() {
    console.log('3. 初始化认证系统...');
    
    if (!window.Auth) {
        throw new Error('认证模块未加载');
    }
    
    try {
        await window.Auth.init();
        
        App.modules.auth = true;
        console.log('✅ 认证系统初始化成功');
        
    } catch (error) {
        console.error('认证系统初始化失败:', error);
        // 认证失败不阻止应用启动
        App.modules.auth = false;
    }
}

// 4. 初始化Python运行器
async function initializePythonRunners() {
    console.log('4. 初始化Python运行器...');
    
    if (!window.PythonRunner) {
        console.warn('Python运行器模块未加载，跳过初始化');
        return;
    }
    
    try {
        // 预加载Pyodide
        window.PythonRunner.manager.preloadPyodide();
        
        // 创建示例Python运行器
        createExampleRunners();
        
        App.modules.python = true;
        console.log('✅ Python运行器初始化成功');
        
    } catch (error) {
        console.error('Python运行器初始化失败:', error);
        // Python运行器失败不阻止应用启动
        App.modules.python = false;
    }
}

// 创建示例Python运行器
function createExampleRunners() {
    // 第一个运行器
    if (document.getElementById('python-runner-1')) {
        const runner1 = window.PythonRunner.create('python-runner-1', {
            initialCode: `# 第一个Python程序
print("Hello, Python!")

# 尝试修改下面的代码
for i in range(5):
    print(f"第{i+1}次循环")

# 添加你的代码：
`,
            showExamples: true
        });
        
        console.log('✅ 创建Python运行器 1');
    }
    
    // 第二个运行器
    if (document.getElementById('python-runner-2')) {
        const runner2 = window.PythonRunner.create('python-runner-2', {
            initialCode: `# 变量练习
# 定义变量
name = "小明"
age = 18
score = 95.5
is_student = True

# 打印变量
print(f"姓名: {name}")
print(f"年龄: {age}")
print(f"分数: {score}")
print(f"是学生吗? {is_student}")

# 修改变量
age = age + 1
print(f"明年年龄: {age}")`,
            showExamples: true
        });
        
        console.log('✅ 创建Python运行器 2');
    }
}

// 应用程序初始化完成
function onAppInitialized() {
    console.log('🎯 应用程序初始化完成');
    
    // 更新页面标题
    document.title = '交互教材 - Python学习平台';
    
    // 检查认证状态
    if (window.Auth) {
        const isLoggedIn = window.Auth.isLoggedIn();
        console.log('当前登录状态:', isLoggedIn ? '已登录' : '未登录');
    }
    
    // 添加一些有用的全局函数
    addGlobalHelpers();
    
    // 显示应用状态
    showAppStatus();
}

// 显示/隐藏加载状态
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
        loadingEl.innerHTML = show ? `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px; margin-bottom: 20px;">🚀 正在加载...</div>
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 20px; color: #666; font-size: 14px;">初始化应用程序模块</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        ` : '';
    }
}

// 显示错误
function showError(message) {
    const errorHtml = `
        <div style="position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 15px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999; max-width: 400px;">
            <div style="font-weight: bold; margin-bottom: 5px;">❌ 错误</div>
            <div style="font-size: 14px;">${message}</div>
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
        </div>
    `;
    
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = errorHtml;
    document.body.appendChild(errorDiv);
    
    // 5秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 显示应用状态
function showAppStatus() {
    if (!window.APP_CONFIG?.app?.debug) return;
    
    const status = {
        配置: App.modules.config ? '✅' : '❌',
        Supabase: App.modules.supabase ? '✅' : '❌',
        认证: App.modules.auth ? '✅' : '❌',
        Python: App.modules.python ? '✅' : '❌'
    };
    
    console.log('📊 应用模块状态:', status);
}

// 添加全局辅助函数
function addGlobalHelpers() {
    // 重新加载应用
    window.reloadApp = function() {
        if (confirm('确定要重新加载应用程序吗？')) {
            location.reload();
        }
    };
    
    // 检查应用状态
    window.checkAppStatus = function() {
        const status = {
            isInitialized: App.isInitialized,
            isLoading: App.isLoading,
            modules: App.modules
        };
        console.log('🔍 应用状态检查:', status);
        return status;
    };
    
    // 测试Python运行
    window.testPython = async function(runnerId = 'python-runner-1') {
        const runner = window.PythonRunner.get(runnerId);
        if (runner) {
            console.log('🧪 测试Python运行器:', runnerId);
            await runner.run();
        } else {
            console.error('Python运行器不存在:', runnerId);
        }
    };
    
    // 完成课程快捷函数
    window.completeLesson = function(chapterId, lessonId) {
        if (window.AuthManager && window.AuthManager.completeLesson) {
            window.AuthManager.completeLesson(chapterId, lessonId);
        } else {
            console.warn('AuthManager.completeLesson 函数不存在');
        }
    };
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成，开始初始化应用...');
    
    // 设置一个超时，防止某些资源加载过慢
    const initTimeout = setTimeout(() => {
        if (!App.isInitialized && !App.isLoading) {
            console.warn('⚠️ 应用程序初始化超时，强制初始化');
            initializeApp();
        }
    }, 5000);
    
    // 主初始化
    initializeApp().then(() => {
        clearTimeout(initTimeout);
    }).catch(error => {
        clearTimeout(initTimeout);
        console.error('应用程序初始化异常:', error);
    });
});

// 暴露初始化函数
window.initializeApp = initializeApp;