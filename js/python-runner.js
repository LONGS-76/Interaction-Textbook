// python-runner.js - Python代码运行器
console.log('🐍 加载Python运行器...');

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
        
        if (this.options.autoInit) {
            this.init();
        }
    }
    
    async init() {
        console.log(`🚀 初始化Python运行器: ${this.containerId}`);
        
        try {
            this.render();
            this.registerGlobal();
            this.setupEventListeners();
            
            this.status = 'ready';
            console.log(`✅ Python运行器 ${this.containerId} 初始化完成`);
            
        } catch (error) {
            console.error(`❌ Python运行器 ${this.containerId} 初始化失败:`, error);
            this.status = 'error';
        }
    }
    
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const examples = this.options.showExamples ? `
            <div class="examples-section">
                <div class="examples-title">示例代码：</div>
                <div class="examples-buttons">
                    <button class="example-btn" onclick="loadExample('${this.containerId}', 'hello')">Hello World</button>
                    <button class="example-btn" onclick="loadExample('${this.containerId}', 'fibonacci')">斐波那契</button>
                    <button class="example-btn" onclick="loadExample('${this.containerId}', 'calculator')">计算器</button>
                </div>
            </div>
        ` : '';
        
        container.innerHTML = `
            <div class="python-runner">
                <div class="runner-header">
                    <div class="runner-title">🐍 Python代码练习</div>
                    <div class="runner-status" id="${this.containerId}-status">就绪</div>
                </div>
                
                <div class="code-section">
                    <div class="editor-header">
                        <div class="editor-label">编写代码：</div>
                        <div class="editor-actions">
                            <button class="btn-run" onclick="runPython('${this.containerId}')">▶ 运行</button>
                            <button class="btn-reset" onclick="resetPython('${this.containerId}')">↺ 重置</button>
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
                
                <div class="output-section">
                    <div class="output-header">
                        <div class="output-label">运行结果：</div>
                        <button class="btn-clear" onclick="clearOutput('${this.containerId}')">🗑️ 清空</button>
                    </div>
                    <pre class="output-content" id="${this.containerId}-output">点击"运行"查看结果...</pre>
                </div>
                
                ${examples}
            </div>
        `;
    }
    
    registerGlobal() {
        if (!window.pythonRunners) {
            window.pythonRunners = {};
        }
        window.pythonRunners[this.containerId] = this;
    }
    
    setupEventListeners() {
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
        
        this.updateStatus('运行中...');
        this.updateOutput('');
        
        try {
            const startTime = performance.now();
            
            await this.pyodide.runPythonAsync(`
import sys, io, js

class OutputCapture:
    def __init__(self):
        self.buffer = io.StringIO()
    
    def write(self, text):
        self.buffer.write(text)
        js.appendPythonOutput('${this.containerId}', text)
    
    def flush(self):
        pass

sys.stdout = OutputCapture()
sys.stderr = OutputCapture()
            `);
            
            window.appendPythonOutput = (runnerId, text) => {
                if (runnerId === this.containerId) {
                    this.appendOutput(text);
                }
            };
            
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
    
    reset() {
        if (confirm('确定要重置代码吗？所有修改将丢失。')) {
            document.getElementById(`${this.containerId}-input`).value = this.options.initialCode;
            this.updateStatus('已重置');
        }
    }
    
    clearOutput() {
        this.updateOutput('');
    }
    
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
    
    async initializePyodide() {
        if (this.pyodide) {
            this.isReady = true;
            return;
        }
        
        this.updateStatus('正在加载Python环境...');
        
        try {
            if (!window.loadPyodide) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            
            this.pyodide = await loadPyodide();
            this.isReady = true;
            this.updateStatus('✅ Python环境就绪');
            
        } catch (error) {
            console.error('Pyodide初始化失败:', error);
            this.updateStatus('❌ Python环境加载失败');
            throw error;
        }
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById(`${this.containerId}-status`);
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    updateOutput(content) {
        const outputEl = document.getElementById(`${this.containerId}-output`);
        if (outputEl) {
            outputEl.textContent = content;
        }
    }
    
    appendOutput(content) {
        const outputEl = document.getElementById(`${this.containerId}-output`);
        if (outputEl) {
            outputEl.textContent += content;
        }
    }
}

// 全局函数
window.runPython = function(containerId) {
    const runner = window.pythonRunners?.[containerId];
    if (runner) {
        runner.run();
    }
};
window.resetPython = function(containerId) {
    const runner = window.pythonRunners?.[containerId];
    if (runner) {
        runner.reset();
    }
};
window.clearOutput = function(containerId) {
    const runner = window.pythonRunners?.[containerId];
    if (runner) {
        runner.clearOutput();
    }
};
window.loadExample = function(containerId, exampleName) {
    const runner = window.pythonRunners?.[containerId];
    if (runner) {
        runner.loadExample(exampleName);
    }
};

console.log('✅ Python运行器模块加载完成');
