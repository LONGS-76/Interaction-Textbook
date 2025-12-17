// supabase-client.js - 修复版
console.log('🚀 加载Supabase客户端修复版...');

// Supabase客户端管理器
class SupabaseClientManager {
    constructor() {
        this.client = null;
        this.isInitializing = false;
        this.initPromise = null;
        
        console.log('🔄 创建Supabase客户端管理器');
    }
    
    // 获取Supabase客户端
    async getClient() {
        // 如果已经有客户端，直接返回
        if (this.client) {
            console.log('✅ 返回已存在的Supabase客户端');
            return this.client;
        }
        
        // 如果正在初始化，等待初始化完成
        if (this.isInitializing && this.initPromise) {
            console.log('⏳ Supabase正在初始化，等待...');
            return await this.initPromise;
        }
        
        // 开始初始化
        this.isInitializing = true;
        this.initPromise = this.initializeClient();
        
        try {
            this.client = await this.initPromise;
            return this.client;
        } finally {
            this.isInitializing = false;
        }
    }
    
    // 初始化客户端
    async initializeClient() {
        console.log('🚀 开始初始化Supabase客户端...');
        
        try {
            // 1. 检查配置
            if (!window.APP_CONFIG || !window.APP_CONFIG.supabase) {
                throw new Error('❌ 应用程序配置未加载');
            }
            
            const config = window.APP_CONFIG.supabase;
            
            if (!config.url || !config.anonKey) {
                throw new Error('❌ Supabase配置不完整');
            }
            
            console.log('🔧 配置检查通过');
            
            // 2. 加载Supabase库
            await this.loadSupabaseLibrary();
            
            console.log('📦 Supabase库加载完成');
            
            // 3. 创建客户端
            const client = window.supabase.createClient(config.url, config.anonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage,
                    storageKey: 'supabase.auth.token'
                },
                global: {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            });
            
            console.log('✅ Supabase客户端创建成功');
            
            // 4. 测试连接
            await this.testConnection(client);
            
            return client;
            
        } catch (error) {
            console.error('❌ Supabase客户端初始化失败:', error);
            throw error;
        }
    }
    
    // 加载Supabase库
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            // 如果已经加载，直接返回
            if (window.supabase && window.supabase.createClient) {
                console.log('✅ Supabase库已加载');
                resolve();
                return;
            }
            
            console.log('📥 加载Supabase库...');
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            script.async = true;
            script.onload = () => {
                console.log('✅ Supabase库加载成功');
                resolve();
            };
            script.onerror = (error) => {
                console.error('❌ 加载Supabase库失败:', error);
                reject(new Error('无法加载Supabase库'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // 测试连接
    async testConnection(client) {
        try {
            console.log('🔌 测试Supabase连接...');
            
            const { data, error } = await client
                .from('user_progress')
                .select('count', { count: 'exact', head: true })
                .limit(1);
            
            if (error) {
                console.warn('⚠️ Supabase连接测试有警告:', error.message);
                // 不抛出错误，客户端可能仍可用
            } else {
                console.log('✅ Supabase连接正常');
            }
            
        } catch (error) {
            console.warn('⚠️ Supabase连接测试异常:', error.message);
        }
    }
    
    // 获取当前用户
    async getCurrentUser() {
        try {
            const client = await this.getClient();
            if (!client) {
                console.warn('Supabase客户端不可用');
                return null;
            }
            
            const { data: { user }, error } = await client.auth.getUser();
            
            if (error) {
                // 认证错误，清除损坏的会话
                if (error.message.includes('Auth session missing')) {
                    console.log('🔄 检测到损坏的会话，清除本地存储');
                    this.clearAuthStorage();
                }
                return null;
            }
            
            return user;
            
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }
    
    // 清除认证存储
    clearAuthStorage() {
        try {
            // 清除Supabase相关的本地存储
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-mdputttsejaxpgimracz-auth-token');
            
            // 清除sessionStorage
            sessionStorage.clear();
            
            console.log('🧹 认证存储已清除');
            
        } catch (error) {
            console.error('清除认证存储失败:', error);
        }
    }
    
    // 重置客户端
    reset() {
        console.log('🔄 重置Supabase客户端');
        this.client = null;
        this.isInitializing = false;
        this.initPromise = null;
        this.clearAuthStorage();
    }
}

// 创建全局实例
window.SupabaseManager = new SupabaseClientManager();

// 暴露快捷方法
window.Supabase = {
    getClient: () => window.SupabaseManager.getClient(),
    getUser: () => window.SupabaseManager.getCurrentUser(),
    reset: () => window.SupabaseManager.reset()
};
