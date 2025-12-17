// auth.js - 修复版认证模块
console.log('🔐 加载认证模块修复版...');

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        
        console.log('🔄 创建认证管理器');
    }
    
    // 初始化
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('🚀 初始化认证系统...');
        
        try {
            // 清除可能损坏的会话
            this.clearBrokenSession();
            
            // 获取Supabase客户端
            const client = await window.SupabaseManager.getClient();
            if (!client) {
                throw new Error('无法获取Supabase客户端');
            }
            
            console.log('✅ Supabase客户端就绪');
            
            // 设置认证状态监听
            this.setupAuthListener(client);
            
            // 检查当前登录状态
            await this.checkAuthState();
            
            this.isInitialized = true;
            console.log('✅ 认证系统初始化完成');
            
        } catch (error) {
            console.error('❌ 认证系统初始化失败:', error);
        }
    }
    
    // 清除损坏的会话
    clearBrokenSession() {
        console.log('🧹 检查并清除损坏的会话...');
        
        // 检查localStorage中是否有损坏的token
        const authToken = localStorage.getItem('supabase.auth.token');
        if (authToken) {
            try {
                const tokenData = JSON.parse(authToken);
                if (!tokenData || !tokenData.access_token) {
                    console.log('发现损坏的token，清除...');
                    localStorage.removeItem('supabase.auth.token');
                }
            } catch (error) {
                console.log('解析token失败，清除...');
                localStorage.removeItem('supabase.auth.token');
            }
        }
    }
    
    // 设置认证监听
    setupAuthListener(client) {
        if (!client) return;
        
        client.auth.onAuthStateChange((event, session) => {
            console.log('🔐 认证状态变化:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    this.currentUser = session?.user || null;
                    this.updateUI(true, this.currentUser);
                    break;
                    
                case 'SIGNED_OUT':
                    this.currentUser = null;
                    this.updateUI(false, null);
                    break;
                    
                case 'USER_UPDATED':
                    this.currentUser = session?.user || null;
                    break;
                    
                case 'TOKEN_REFRESHED':
                    console.log('🔁 Token已刷新');
                    break;
            }
        });
    }
    
    // 检查认证状态
    async checkAuthState() {
        try {
            console.log('🔍 检查认证状态...');
            
            const user = await window.SupabaseManager.getCurrentUser();
            
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
            return { isAuthenticated: false, user: null, error };
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
            console.log('🔐 用户登录:', email);
            
            if (!email || !password) {
                throw new Error('请输入邮箱和密码');
            }
            
            this.showMessage('正在登录...', 'info');
            
            const client = await window.SupabaseManager.getClient();
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
            console.log('📝 用户注册:', email);
            
            if (!email || !password) {
                throw new Error('请输入邮箱和密码');
            }
            
            this.showMessage('正在注册...', 'info');
            
            const client = await window.SupabaseManager.getClient();
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
            console.log('✅ 注册成功:', email);
            
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
            console.log('🚪 用户登出');
            
            const client = await window.SupabaseManager.getClient();
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
            window.SupabaseManager.reset();
            
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
        messageEl.className = 'auth-message ' + type;
        
        // 3秒后清除
        if (type !== 'info') {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'auth-message';
            }, 3000);
        }
    }
    
    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }
}

// 创建全局实例
window.Auth = new AuthManager();

// 全局登录函数
window.handleLogin = async function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        console.error('找不到登录输入框');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        window.Auth.showMessage('请输入邮箱和密码', 'error');
        return;
    }
    
    await window.Auth.login(email, password);
};

// 全局注册函数
window.handleSignup = async function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        console.error('找不到注册输入框');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        window.Auth.showMessage('请输入邮箱和密码', 'error');
        return;
    }
    
    await window.Auth.signup(email, password);
};

// 全局登出函数
window.handleLogout = async function() {
    if (confirm('确定要退出登录吗？')) {
        await window.Auth.logout();
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 页面加载完成，初始化认证...');
    
    // 延迟初始化，避免阻塞
    setTimeout(() => {
        if (window.Auth) {
            window.Auth.init();
        }
    }, 1000);
});
