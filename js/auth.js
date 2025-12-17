// auth.js - 用户认证模块
console.log('🔐 加载认证模块...');

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        console.log('🔄 创建认证管理器');
    }
    
    // 初始化
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 初始化认证系统...');
        
        try {
            // 检查登录状态
            await this.checkAuthState();
            this.isInitialized = true;
            console.log('✅ 认证系统初始化完成');
            
        } catch (error) {
            console.error('❌ 认证系统初始化失败:', error);
        }
    }
    
    // 检查认证状态
    async checkAuthState() {
        try {
            const user = await window.getCurrentUser();
            
            if (user) {
                this.currentUser = user;
                this.updateUI(true, user);
                console.log('✅ 用户已登录:', user.email);
                return { isAuthenticated: true, user };
            } else {
                this.currentUser = null;
                this.updateUI(false, null);
                console.log('👤 用户未登录');
                return { isAuthenticated: false, user: null };
            }
            
        } catch (error) {
            console.error('检查认证状态失败:', error);
            this.updateUI(false, null);
            return { isAuthenticated: false, user: null };
        }
    }
    
    // 更新UI
    updateUI(isLoggedIn, user) {
        const loginSection = document.getElementById('login-section');
        const mainContent = document.getElementById('main-content');
        const userEmail = document.getElementById('user-email');
        const userAvatar = document.getElementById('user-avatar');
        
        if (loginSection) {
            loginSection.style.display = isLoggedIn ? 'none' : 'block';
        }
        
        if (mainContent) {
            mainContent.style.display = isLoggedIn ? 'block' : 'none';
        }
        
        if (userEmail && user) {
            userEmail.textContent = user.email;
        }
        
        if (userAvatar && user) {
            const initial = user.email.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
        }
    }
    
    // 登录
    async login(email, password) {
        try {
            console.log('🔐 尝试登录:', email);
            
            if (!email || !password) {
                throw new Error('请输入邮箱和密码');
            }
            
            this.showMessage('正在登录...', 'info');
            
            const client = await window.getSupabaseClient();
            if (!client) {
                throw new Error('系统初始化失败');
            }
            
            const { data, error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            this.showMessage('登录成功！', 'success');
            console.log('✅ 登录成功:', data.user.email);
            
            // 更新状态
            this.currentUser = data.user;
            this.updateUI(true, data.user);
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('❌ 登录失败:', error);
            this.showMessage(`登录失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // 注册
    async signup(email, password) {
        try {
            console.log('📝 尝试注册:', email);
            
            if (!email || !password) {
                throw new Error('请输入邮箱和密码');
            }
            
            this.showMessage('正在注册...', 'info');
            
            const client = await window.getSupabaseClient();
            if (!client) {
                throw new Error('系统初始化失败');
            }
            
            const { data, error } = await client.auth.signUp({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            this.showMessage('注册成功！请检查邮箱验证邮件。', 'success');
            console.log('✅ 注册成功');
            
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ 注册失败:', error);
            this.showMessage(`注册失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // 登出
    async logout() {
        try {
            console.log('🚪 尝试登出');
            
            const client = await window.getSupabaseClient();
            if (!client) {
                throw new Error('系统初始化失败');
            }
            
            const { error } = await client.auth.signOut();
            
            if (error) {
                throw error;
            }
            
            // 重置状态
            this.currentUser = null;
            this.updateUI(false, null);
            
            this.showMessage('已退出登录', 'success');
            console.log('✅ 登出成功');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ 登出失败:', error);
            this.showMessage(`登出失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // 显示消息
    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        if (!messageEl) return;
        
        messageEl.textContent = text;
        messageEl.className = 'message ' + type;
        
        // 3秒后清除
        if (type !== 'info') {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, 3000);
        }
    }
    
    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// 创建全局实例
const authManager = new AuthManager();

// 暴露到全局
window.Auth = authManager;
window.handleLogin = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        authManager.showMessage('请输入邮箱和密码', 'error');
        return;
    }
    
    const result = await authManager.login(email, password);
    if (result.success) {
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
};
window.handleSignup = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        authManager.showMessage('请输入邮箱和密码', 'error');
        return;
    }
    
    await authManager.signup(email, password);
};
window.handleLogout = async function() {
    if (confirm('确定要退出登录吗？')) {
        await authManager.logout();
        setTimeout(() => {
            location.reload();
        }, 500);
    }
};
window.completeLesson = function(chapterId, lessonId) {
    alert('完成课程功能需要Supabase数据库支持');
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 认证模块初始化...');
    authManager.init();
});

console.log('✅ 认证模块加载完成');
