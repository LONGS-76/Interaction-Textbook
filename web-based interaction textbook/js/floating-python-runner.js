// 浮动Python运行器
class FloatingPythonRunner {
    constructor() {
        this.isVisible = false;
        this.runner = null;
        this.init();
    }
    
    init() {
        // 创建浮动按钮
        this.createFloatingButton();
        
        // 创建运行器面板
        this.createRunnerPanel();
        
        // 绑定事件
        this.bindEvents();
    }
    
    createFloatingButton() {
        const button = document.createElement('button');
        button.id = 'floating-python-btn';
        button.innerHTML = '🐍';
        button.title = '打开Python运行器';
        document.body.appendChild(button);
    }
    
    createRunnerPanel() {
        const panel = document.createElement('div');
        panel.id = 'floating-python-panel';
        panel.className = 'floating-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3>Python代码运行器</h3>
                <button class="close-btn" onclick="window.floatingRunner.hide()">×</button>
            </div>
            <div class="panel-content">
                <div class="panel-status" id="python-panel-status">就绪</div>
                
                <div class="code-section">
                    <textarea id="python-panel-code" placeholder="# 在这里编写Python代码..." rows="8">
# Python运行器
print("Hello, World!")

# 试试修改下面的代码
numbers = [1, 2, 3, 4, 5]
for num in numbers:
    print(f"数字: {num}")</textarea>
                </div>
                
                <div class="panel-actions">
                    <button onclick="window.floatingRunner.run()" class="run-btn">▶ 运行</button>
                    <button onclick="window.floatingRunner.clear()" class="clear-btn">🗑️ 清空</button>
                    <button onclick="window.floatingRunner.insertExample()" class="example-btn">📋 示例</button>
                </div>
                
                <div class="output-section">
                    <pre id="python-panel-output">运行结果将显示在这里...</pre>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
    
    bindEvents() {
        // 浮动按钮点击
        document.getElementById('floating-python-btn').addEventListener('click', () => {
            this.toggle();
        });
        
        // 初始化运行器
        this.runner = new PythonRunner({
            containerId: 'python-runner-hidden',
            theme: 'light'
        });
    }
    
    async toggle() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('floating-python-panel');
        const button = document.getElementById('floating-python-btn');
        
        if (this.isVisible) {
            panel.style.display = 'block';
            button.classList.add('active');
            
            // 初始化Python环境
            if (!this.runner.isInitialized) {
                await this.runner.initialize();
            }
            
        } else {
            panel.style.display = 'none';
            button.classList.remove('active');
        }
    }
    
    show() {
        this.isVisible = true;
        document.getElementById('floating-python-panel').style.display = 'block';
        document.getElementById('floating-python-btn').classList.add('active');
    }
    
    hide() {
        this.isVisible = false;
        document.getElementById('floating-python-panel').style.display = 'none';
        document.getElementById('floating-python-btn').classList.remove('active');
    }
    
    async run() {
        const code = document.getElementById('python-panel-code').value;
        const outputEl = document.getElementById('python-panel-output');
        const statusEl = document.getElementById('python-panel-status');
        
        outputEl.textContent = '';
        statusEl.textContent = '运行中...';
        
        try {
            // 绑定输出函数
            window.runnerAppendOutput = (text) => {
                outputEl.textContent += text;
            };
            
            await this.runner.runCode(code);
            statusEl.textContent = '✅ 运行完成';
            
        } catch (error) {
            outputEl.textContent = '错误：\n' + error.message;
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

// 添加到全局
window.FloatingPythonRunner = FloatingPythonRunner;