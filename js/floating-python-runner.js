// floating-python-runner.js - 浮动Python运行器
console.log('🔄 加载浮动Python运行器...');

class FloatingPythonRunner {
    constructor() {
        this.isVisible = false;
        this.runner = null;
        console.log('🔄 创建浮动Python运行器');
    }
    
    init() {
        this.createFloatingButton();
        this.createRunnerPanel();
        this.bindEvents();
    }
    
    createFloatingButton() {
        const button = document.createElement('button');
        button.id = 'floating-python-btn';
        button.innerHTML = '🐍';
        button.title = '打开Python运行器';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 1000;
            transition: all 0.3s;
        `;
        document.body.appendChild(button);
    }
    
    createRunnerPanel() {
        const panel = document.createElement('div');
        panel.id = 'floating-python-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 500px;
            max-width: 90vw;
            height: 600px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            z-index: 999;
            display: none;
            flex-direction: column;
            border: 2px solid #667eea;
        `;
        
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; border-radius: 10px 10px 0 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px;">Python代码运行器</h3>
                    <button onclick="window.floatingRunner.hide()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">×</button>
                </div>
            </div>
            
            <div style="flex: 1; padding: 20px; overflow: hidden; display: flex; flex-direction: column;">
                <div style="font-size: 13px; color: #6c757d; margin-bottom: 10px; padding: 4px 8px; background: #f8f9fa; border-radius: 4px;" id="python-panel-status">就绪</div>
                
                <div style="flex: 1; margin-bottom: 15px;">
                    <textarea id="python-panel-code" 
                        placeholder="# 在这里编写Python代码..."
                        style="width: 100%; height: 100%; padding: 12px; border: 2px solid #dee2e6; border-radius: 8px; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; resize: none;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button onclick="window.floatingRunner.run()" 
                        style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">▶ 运行</button>
                    <button onclick="window.floatingRunner.clear()" 
                        style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">🗑️ 清空</button>
                    <button onclick="window.floatingRunner.insertExample()" 
                        style="flex: 1; padding: 10px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">📋 示例</button>
                </div>
                
                <div style="flex: 1; min-height: 150px;">
                    <pre id="python-panel-output" 
                        style="height: 100%; background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 8px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.4; white-space: pre-wrap; overflow-y: auto; margin: 0;">运行结果将显示在这里...</pre>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
    
    bindEvents() {
        document.getElementById('floating-python-btn').addEventListener('click', () => {
            this.toggle();
        });
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('floating-python-panel');
        const button = document.getElementById('floating-python-btn');
        
        if (this.isVisible) {
            panel.style.display = 'flex';
            button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            
            if (!this.runner) {
                this.initRunner();
            }
            
        } else {
            panel.style.display = 'none';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }
    
    show() {
        this.isVisible = true;
        document.getElementById('floating-python-panel').style.display = 'flex';
        document.getElementById('floating-python-btn').style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }
    
    hide() {
        this.isVisible = false;
        document.getElementById('floating-python-panel').style.display = 'none';
        document.getElementById('floating-python-btn').style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    initRunner() {
        this.runner = {
            pyodide: null,
            isInitialized: false
        };
        
        const codeTextarea = document.getElementById('python-panel-code');
        if (codeTextarea && !codeTextarea.value) {
            codeTextarea.value = `# Python运行器
print("Hello, World!")

# 试试修改下面的代码
numbers = [1, 2, 3, 4, 5]
for num in numbers:
    print(f"数字: {num}")`;
        }
    }
    
    async run() {
        const code = document.getElementById('python-panel-code').value;
        const outputEl = document.getElementById('python-panel-output');
        const statusEl = document.getElementById('python-panel-status');
        
        if (!code.trim()) {
            outputEl.textContent = '请输入Python代码！';
            return;
        }
        
        outputEl.textContent = '';
        statusEl.textContent = '运行中...';
        
        try {
            if (!this.runner.pyodide) {
                if (!window.loadPyodide) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                    document.head.appendChild(script);
                    
                    await new Promise((resolve) => {
                        script.onload = resolve;
                    });
                }
                
                this.runner.pyodide = await loadPyodide();
                this.runner.isInitialized = true;
            }
            
            await this.runner.pyodide.runPythonAsync(`
import sys, io
output = io.StringIO()
sys.stdout = output
sys.stderr = output
            `);
            
            await this.runner.pyodide.runPythonAsync(code);
            
            const result = await this.runner.pyodide.runPythonAsync('output.getvalue()');
            outputEl.textContent = result || '代码执行完成（无输出）';
            statusEl.textContent = '✅ 运行完成';
            
        } catch (error) {
            outputEl.textContent = '错误：' + error.message;
            statusEl.textContent = '❌ 运行出错';
        }
    }
    
    clear() {
        document.getElementById('python-panel-output').textContent = '';
    }
    
    insertExample() {
        const examples = [
            `# 列表操作
fruits = ['苹果', '香蕉', '橙子', '葡萄']
print("水果列表:")
for fruit in fruits:
    print(f"  - {fruit}")`,
            
            `# 字典示例
student = {
    "name": "小明",
    "age": 18,
    "score": 95.5
}
print("学生信息:")
for key, value in student.items():
    print(f"{key}: {value}")`,
            
            `# 函数定义
def greet(name):
    return f"你好，{name}！"

print(greet("世界"))
print(greet("Python"))`
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        document.getElementById('python-panel-code').value = randomExample;
    }
}

// 创建全局实例
window.floatingRunner = new FloatingPythonRunner();

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 浮动运行器初始化...');
    window.floatingRunner.init();
});

console.log('✅ 浮动Python运行器加载完成');
