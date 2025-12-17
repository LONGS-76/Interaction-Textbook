// supabase-client.js - Supabase客户端管理
console.log('🚀 加载Supabase客户端...');

// Supabase管理器 - 单例模式
class SupabaseManager {
    constructor() {
        console.log('🔄 创建Supabase管理器');
        this._client = null;
        this._isInitializing = false;
    }
    
    // 获取客户端
    async getClient() {
        if (this._client) {
            return this._client;
        }
        
        if (this._isInitializing) {
            // 等待初始化完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.getClient();
        }
        
        this._isInitializing = true;
        console.log('🔧 初始化Supabase客户端...');
        
        try {
            // 检查配置
            if (!window.APP_CONFIG || !window.APP_CONFIG.supabase) {
                throw new Error('应用程序配置未加载');
            }
            
            const config = window.APP_CONFIG.supabase;
            
            if (!config.url || !config.anonKey) {
                throw new Error('Supabase配置不完整');
            }
            
            // 确保supabase库已加载
            if (!window.supabase) {
                await this.loadSupabaseLibrary();
            }
            
            // 创建客户端
            this._client = window.supabase.createClient(config.url, config.anonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
            
            console.log('✅ Supabase客户端初始化成功');
            return this._client;
            
        } catch (error) {
            console.error('❌ Supabase客户端初始化失败:', error);
            this._isInitializing = false;
            throw error;
        } finally {
            this._isInitializing = false;
        }
    }
    
    // 加载Supabase库
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }
            
            console.log('📦 加载Supabase库...');
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Supabase库加载完成');
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('无法加载Supabase库'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // 获取当前用户
    async getCurrentUser() {
        try {
            const client = await this.getClient();
            if (!client) return null;
            
            const { data: { user }, error } = await client.auth.getUser();
            
            if (error) {
                console.warn('获取用户信息失败:', error.message);
                return null;
            }
            
            return user;
            
        } catch (error) {
            console.error('获取用户信息异常:', error);
            return null;
        }
    }
    
    // 重置客户端
    reset() {
        this._client = null;
        console.log('🔄 Supabase客户端已重置');
    }
}

// 创建全局实例
const supabaseManager = new SupabaseManager();

// 暴露到全局
window.SupabaseManager = supabaseManager;
window.getSupabaseClient = () => supabaseManager.getClient();
window.getCurrentUser = () => supabaseManager.getCurrentUser();

console.log('✅ Supabase客户端模块加载完成');
