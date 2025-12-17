// config.js - 应用程序配置
window.APP_CONFIG = {
    // Supabase配置
    supabase: {
        url: 'https://mdputttsejaxpgimracz.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHV0dHRzZWpheHBnaW1yYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODUxNzcsImV4cCI6MjA4MTQ2MTE3N30.Y9ndFe2-Sc1ibxXTkKKLjuRRi49MPRNxfT6kweDv9eA'
    },
    
    // Python运行器配置
    pythonRunner: {
        defaultCode: `# Python代码练习
print("Hello, Python!")

# 尝试修改下面的代码
for i in range(3):
    print(f"数字: {i}")`,
        
        examples: {
            hello: `# Hello World
print("Hello, World!")

# 基本运算
a = 10
b = 3
print(f"{a} + {b} = {a + b}")
print(f"{a} - {b} = {a - b}")`,
            
            fibonacci: `# 斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")`,
            
            calculator: `# 简单计算器
def calculate(a, b, op):
    if op == '+': return a + b
    elif op == '-': return a - b
    elif op == '*': return a * b
    elif op == '/': return a / b if b != 0 else "错误: 除数不能为0"
    else: return "错误: 不支持的操作符"

print(calculate(10, 5, '+'))
print(calculate(10, 5, '-'))
print(calculate(10, 5, '*'))
print(calculate(10, 5, '/'))`
        }
    },
    
    // 应用配置
    app: {
        version: '1.0.0',
        debug: true
    }
};

console.log('✅ 配置文件加载完成');
