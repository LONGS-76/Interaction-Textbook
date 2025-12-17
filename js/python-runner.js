/**
 * Python代码运行器
 * 基于Pyodide的在线Python执行环境
 */

// Python运行器管理类
class PythonRunnerManager {
    constructor() {
        this.runners = new Map();
        this.pyodide = null;
        this.isPyodideLoaded = false;
        this.isLoadingPyodide = false;
        
        console.log('🐍 Python运行器管理器初始化');
    }
    
    // 创建Python运行器
    createRunner(containerId, options = {}) {
        // 检查容器是否存在
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`容器 #${containerId} 不存在`);
            return null;
        }
        
        // 如果运行器已存在，返回现有的
        if (this.runners.has(containerId)) {
            console.log(`运行器 ${containerId} 已存在`);
            return this.runners.get(containerId);
        }
        
        // 创建新运行器
        const runner = new PythonRunner(containerId, options);
        this.runners.set(containerId, runner);
        
        // 预加载Pyodide
        this.preloadPyodide();
        
        return runner;
    }
    
    // 获取运行器
    getRunner(containerId) {
        return this.runners.get(containerId);
    }
    
    // 移除运行器
    removeRunner(containerId) {
        const runner = this.runners.get(containerId);
        if (runner) {
            runner.destroy();
            this.runners.delete(containerId);
        }
    }
    
    // 预加载Pyodide
    async preloadPyodide() {
        if (this.isPyodideLoaded || this.isLoadingPyodide) {
            return;
        }
        
        this.isLoadingPyodide = true;
        console.log('📦 预加载Pyodide...');
        
        try {
            // 延迟加载，避免阻塞页面
            setTimeout(async () => {
                await this.loadPyodide();
            }, 2000);
            
        } catch (error) {
            console.error('预加载Pyodide失败:', error);
            this.isLoadingPyodide = false;
        }
    }
    
    // 加载Pyodide
    async loadPyodide() {
        if (this.isPyodideLoaded) {
            return this.pyodide;
        }
        
        console.log('🚀 加载Pyodide...');
        
        try {
            // 加载Pyodide库
            if (!window.loadPyodide) {
                await this.loadPyodideScript();
            }
            
            // 初始化Pyodide
            this.pyodide = await loadPyodide();
            this.isPyodideLoaded = true;
            this.isLoadingPyodide = false;
            
            console.log('✅ Pyodide加载成功');
            return this.pyodide;
            
        } catch (error) {
            console.error('❌ Pyodide加载失败:', error);
            this.isLoadingPyodide = false;
            throw error;
        }
    }
    
    // 加载Pyodide脚本
    loadPyodideScript() {
        return new Promise((resolve, reject) => {
            if (window.loadPyodide) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            script.async = true;
            
            script.onload = resolve;
            script.onerror = () => reject(new Error('无法加载Pyodide库'));
            
            document.head.appendChild(script);
        });
    }
    
    // 获取Pyodide实例
    async getPyodide() {
        if (!this.isPyodideLoaded) {
            return await this.loadPyodide();
        }
        return this.pyodide;
    }
}

// 单个Python运行器
class PythonRunner {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            theme: 'light',
            readOnly: false,
            showExamples: true,
            autoInit: true,
            initialCode: window.APP_CONFIG?.pythonRunner?.defaultCode || 
                        `# Python代码练习
print("Hello, Python!")

# 尝试修改下面的代码
for i in range(3):
    print(f"数字: {i}")`,
            ...options
        };
        
        this.pyodide = null;
        this.isReady = false;
        this.status = 'pending';
        
        // 初始化
        if (this.options.autoInit) {
            this.init();
        }
    }
    
    // 初始化
    async init() {
        console.log(`🚀 初始化Python运行器: ${this.containerId}`);
        
        try {
            // 1. 渲染UI
            this.render();
            
            // 2. 注册到全局
            this.registerGlobal();
            
            // 3. 设置事件监听
            this.setupEventListeners();
            
            this.status = 'ready';
            console.log(`✅ Python运行器 ${this.containerId} 初始化完成`);
            
        } catch (error) {
            console.error(`❌ Python运行器 ${this.containerId} 初始化失败:`, error);
            this.status = 'error';
        }
    }
    
    // 渲染UI
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const examples = this.options.showExamples ? `
            <div class="runner-examples">
                <div class="examples-header">示例代码：</div>
                <div class="examples-list">
                    <button class="example-btn" data-example="hello">Hello World</button>
                    <button class="example-btn" data-example="fibonacci">斐波那契</button>
                    <button class="example-btn" data-example="calculator">计算器</button>
                </div>
            </div>
        ` : '';
        
        container.innerHTML = `
            <div class="python-runner">
                <div class="runner-header">
                    <h3>🐍 Python代码练习</h3>
                    <div class="runner-status" id="${this.containerId}-status">就绪</div>
                </div>
                
                <div class="code-editor">
                    <div class="editor-header">
                        <span>编写代码：</span>
                        <div class="editor-actions">
                            <button class="btn-run" data-runner="${this.containerId}">▶ 运行</button>
                            <button class="btn-reset" data-runner="${this.containerId}">↺ 重置</button>
                            <button class="btn-format" data-runner="${this.containerId}">✨ 格式化</button>
                        </div>
                    </div>
                    <textarea 
                        class="code-input" 
                        id="${this.containerId}-input"
                        placeholder="# 在这里编写Python代码..."
                        ${this.options.readOnly ? 'readonly' : ''}
                        rows="8"
                    >${this.options.initialCode}</textarea>
                </div>
                
                <div class="runner-output">
                    <div class="output-header">
                        <span>运行结果：</span>
                        <button class="btn-clear" data-runner="${this.containerId}">🗑️ 清空</button>
                    </div>
                    <pre class="output-content" id="${this.containerId}-output">点击"运行"查看结果...</pre>
                </div>
                
                ${examples}
            </div>
        `;
    }
    
    // 注册到全局
    registerGlobal() {
        if (!window.pythonRunners) {
            window.pythonRunners = {};
        }
        window.pythonRunners[this.containerId] = this;
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 运行按钮
        const runBtn = document.querySelector(`[data-runner="${this.containerId}"].btn-run`);
        if (runBtn) {
            runBtn.addEventListener('click', () => this.run());
        }
        
        // 重置按钮
        const resetBtn = document.querySelector(`[data-runner="${this.containerId}"].btn-reset`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        // 格式化按钮
        const formatBtn = document.querySelector(`[data-runner="${this.containerId}"].btn-format`);
        if (formatBtn) {
            formatBtn.addEventListener('click', () => this.format());
        }
        
        // 清空按钮
        const clearBtn = document.querySelector(`[data-runner="${this.containerId}"].btn-clear`);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearOutput());
        }
        
        // 示例按钮
        const exampleBtns = document.querySelectorAll(`[data-runner="${this.containerId}"] .example-btn`);
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exampleName = e.target.getAttribute('data-example');
                this.loadExample(exampleName);
            });
        });
        
        // 快捷键：Ctrl+Enter 运行代码
        const codeInput = document.getElementById(`${this.containerId}-input`);
        if (codeInput) {
            codeInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.run();
                }
            });
        }
    }
    
    // 运行代码
    async run() {
        if (!this.isReady) {
            await this.initializePyodide();
            
            if (!this.isReady) {
                this.updateStatus('❌ Python环境未就绪');
                this.updateOutput('Python环境加载失败，请刷新页面重试。');
                return;
            }
        }
        
        const code = document.getElementById(`${this.containerId}-input`).value.trim();
        if (!code) {
            this.updateStatus('请输入代码');
            return;
        }
        
        // 安全检查
        if (!this.isCodeSafe(code)) {
            this.updateStatus('运行被阻止');
            this.updateOutput('安全限制：代码包含不允许的操作。');
            return;
        }
        
        this.updateStatus('运行中...');
        this.updateOutput('');
        
        try {
            const startTime = performance.now();
            
            // 设置输出重定向
            await this.pyodide.runPythonAsync(`
import sys, io, js

class OutputCapture:
    def __init__(self):
        self.buffer = io.StringIO()
    
    def write(self, text):
        self.buffer.write(text)
        # 实时输出到界面
        js.appendOutput('${this.containerId}', text)
    
    def flush(self):
        pass

sys.stdout = OutputCapture()
sys.stderr = OutputCapture()
            `);
            
            // 全局输出函数
            window.appendOutput = (runnerId, text) => {
                if (runnerId === this.containerId) {
                    this.appendOutput(text);
                }
            };
            
            // 执行代码
            await this.pyodide.runPythonAsync(code);
            
            const endTime = performance.now();
            const timeUsed = (endTime - startTime) / 1000;
            
            this.updateStatus(`✅ 运行完成 (${timeUsed.toFixed(2)}秒)`);
            
        } catch (error) {
            this.appendOutput(`\n错误：${error.message}`);
            this.updateStatus('❌ 运行出错');
            console.error('代码执行错误:', error);
        }
    }
    
    // 重置代码
    reset() {
        if (confirm('确定要重置代码吗？所有修改将丢失。')) {
            document.getElementById(`${this.containerId}-input`).value = this.options.initialCode;
            this.updateStatus('已重置');
        }
    }
    
    // 格式化代码
    format() {
        const input = document.getElementById(`${this.containerId}-input`);
        let code = input.value;
        
        // 简单格式化：制表符转4个空格
        code = code.replace(/\t/g, '    ');
        
        input.value = code;
        this.updateStatus('代码已格式化');
    }
    
    // 清空输出
    clearOutput() {
        this.updateOutput('');
    }
    
    // 加载示例
    loadExample(exampleName) {
        const examples = window.APP_CONFIG?.pythonRunner?.examples || {
            hello: `print("Hello, World!")`,
            fibonacci: `def fib(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\nfor i in range(10):\n    print(fib(i))`,
            calculator: `def calculate(a, b, op):\n    if op == '+': return a + b\n    elif op == '-': return a - b\n    elif op == '*': return a * b\n    elif op == '/': return a / b if b != 0 else "除数不能为0"\n    else: return "不支持的操作"\n\nprint(calculate(10, 5, '+'))`
        };
        
        if (examples[exampleName]) {
            document.getElementById(`${this.containerId}-input`).value = examples[exampleName];
            this.updateStatus(`已加载示例: ${exampleName}`);
        }
    }
    
    // 初始化Pyodide
    async initializePyodide() {
        if (this.pyodide) {
            this.isReady = true;
            return;
        }
        
        this.updateStatus('正在加载Python环境...');
        
        try {
            // 获取Pyodide实例
            const pyodideManager = window.PythonRunner?.manager || new PythonRunnerManager();
            this.pyodide = await pyodideManager.getPyodide();
            
            this.isReady = true;
            this.updateStatus('✅ Python环境就绪');
            
        } catch (error) {
            console.error('Pyodide初始化失败:', error);
            this.updateStatus('❌ Python环境加载失败');
            throw error;
        }
    }
    
    // 更新状态
    updateStatus(message) {
        const statusEl = document.getElementById(`${this.containerId}-status`);
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    // 更新输出
    updateOutput(content) {
        const outputEl = document.getElementById(`${this.containerId}-output`);
        if (outputEl) {
            outputEl.textContent = content;
        }
    }
    
    // 追加输出
    appendOutput(content) {
        const outputEl = document.getElementById(`${this.containerId}-output`);
        if (outputEl) {
            outputEl.textContent += content;
        }
    }
    
    // 代码安全检查
    isCodeSafe(code) {
        const dangerousPatterns = [
            'import os', '__import__', 'eval(', 'exec(', 'open(',
            'system(', 'subprocess', 'import socket',
            'import requests', 'import urllib'
        ];
        
        const lowerCode = code.toLowerCase();
        for (const pattern of dangerousPatterns) {
            if (lowerCode.includes(pattern)) {
                console.warn(`检测到不安全操作: ${pattern}`);
                return false;
            }
        }
        
        return true;
    }
    
    // 销毁运行器
    destroy() {
        // 清理事件监听器等
        this.runners.delete(this.containerId);
    }
}

// 创建全局Python运行器管理器
window.PythonRunner = {
    manager: new PythonRunnerManager(),
    
    // 快捷方法
    create: function(containerId, options) {
        return window.PythonRunner.manager.createRunner(containerId, options);
    },
    
    get: function(containerId) {
        return window.PythonRunner.manager.getRunner(containerId);
    },
    
    remove: function(containerId) {
        return window.PythonRunner.manager.removeRunner(containerId);
    }
};