// 用你的实际信息替换下面两个值！！！
// 注意：保持引号，只替换引号里的内容
const SUPABASE_URL = 'https://mdputttsejaxpgimracz.supabase.co';  // 替换为你的Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHV0dHRzZWpheHBnaW1yYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODUxNzcsImV4cCI6MjA4MTQ2MTE3N30.Y9ndFe2-Sc1ibxXTkKKLjuRRi49MPRNxfT6kweDv9eA';               // 替换为你的anon public

// 创建Supabase客户端
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 测试连接
async function testConnection() {
  console.log('正在测试Supabase连接...');
  console.log('URL:', SUPABASE_URL);
  
  try {
    const { data, error } = await supabase.from('user_progress').select('count');
    if (error) {
      console.error('连接失败:', error.message);
    } else {
      console.log('连接成功！');
    }
  } catch (err) {
    console.error('网络错误:', err.message);
  }
}

// 页面加载时测试连接
window.addEventListener('DOMContentLoaded', testConnection);