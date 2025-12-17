// python-runner.js - Python运行器
console.log('🐍 加载Python运行器...');

class PythonRunner {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            initialCode: `# Python代码练习
print("Hello, Python!")

# 尝试修改下面的代码
for i in range(3):
    print(f"数字: {i}")`,
            ...options
        };
        
        this.pyodide = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        this.render();
        await this.preloadPyodide();
    }
    
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`找不到容器: #${this.containerId}`);
            return;
        }
        
        container.innerHTML = `
            <div style="border:1px solid #ddd; border-radius:8px; margin:20px 0; background:white;">
                <div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #ddd;">
                    <strong>🐍 Python代码练习</strong>
                </div>
                <textarea 
                    id="${this.containerId}-code" 
                    style="width:100%; height:150px; padding:15px; border:none; font-family:monospace; font-size:14px;"
                    placeholder="# 输入Python代码..."
                >${this.options.initialCode}</textarea>
                <div style="padding:15px; background:#f8f9fa; text-align:right; border-top:1px solid #ddd;">
                    <button onclick="window.pythonRunner?.run('${this.containerId}')" 
                        style="padding:8px 20px; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;">
                        ▶ 运行代码
                    </button>
                </div>
                <div style="padding:15px;">
                    <div style="font-weight:bold; margin-bottom:5px;">运行结果：</div>
                    <pre id="${this.containerId}-output" 
                        style="background:#f5f5f5; padding:10px; min-height:50px; font-family:monospace; border-radius:4px;">
点击"运行代码"查看结果
                    </pre>
                </div>
            </div>
        `;
        
        // 注册到全局
        if (!window.pythonRunner) {
            window.pythonRunner = {};
        }
        window.pythonRunner[this.containerId] = this;
    }
    
    async preloadPyodide() {
        console.log('📦 预加载Pyodide...');
        
        // 延迟加载
        setTimeout(async () => {
            try {
                if (!window.loadPyodide) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                    script.async = true;
                    document.head.appendChild(script);
                    
                    await new Promise((resolve) => {
                        script.onload = resolve;
                    });
                }
                
                console.log('🚀 开始加载Python环境...');
                this.pyodide = await loadPyodide();
                this.isInitialized = true;
                
                console.log('✅ Python环境加载完成');
                
            } catch (error) {
                console.error('❌ Python环境加载失败:', error);
            }
        }, 2000);
    }
    
    async run() {
        if (!this.isInitialized) {
            const output = document.getElementById(`${this.containerId}-output`);
            output.textContent = 'Python环境加载中，请稍候...';
            
            if (!window.loadPyodide) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }
            
            this.pyodide = await loadPyodide();
            this.isInitialized = true;
        }
        
        const code = document.getElementById(`${this.containerId}-code`).value;
        const output = document.getElementById(`${this.containerId}-output`);
        
        if (!code.trim()) {
            output.textContent = '请输入Python代码！';
            return;
        }
        
        output.textContent = '运行中...';
        
        try {
            // 设置输出重定向
            await this.pyodide.runPythonAsync(`
import sys, io
output = io.StringIO()
sys.stdout = output
sys.stderr = output
            `);
            
            await this.pyodide.runPythonAsync(code);
            
            const result = await this.pyodide.runPythonAsync('output.getvalue()');
            output.textContent = result || '代码执行完成（无输出）';
            
        } catch (error) {
            output.textContent = '错误：' + error.message;
        }
    }
}

// 全局运行函数
window.runPythonCode = function(containerId) {
    const runner = window.pythonRunner?.[containerId];
    if (runner) {
        runner.run();
    }
};
