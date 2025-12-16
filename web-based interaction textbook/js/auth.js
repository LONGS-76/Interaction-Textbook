// 检查用户是否已登录
async function checkAuthState() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // 用户已登录，显示主内容
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('user-email').textContent = user.email;
    
    // 加载用户的学习进度
    loadUserProgress(user.id);
  } else {
    // 用户未登录，显示登录界面
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
  }
}

// 注册新用户
async function handleSignup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('auth-message');
  
  if (!email || !password) {
    messageEl.textContent = '请输入邮箱和密码';
    messageEl.style.color = 'red';
    return;
  }
  
  if (password.length < 6) {
    messageEl.textContent = '密码至少6位';
    messageEl.style.color = 'red';
    return;
  }
  
  messageEl.textContent = '正在注册...';
  messageEl.style.color = 'blue';
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  
  if (error) {
    messageEl.textContent = '注册失败: ' + error.message;
    messageEl.style.color = 'red';
  } else {
    messageEl.textContent = '注册成功！请检查邮箱验证邮件，然后登录。';
    messageEl.style.color = 'green';
  }
}

// 用户登录
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('auth-message');
  
  if (!email || !password) {
    messageEl.textContent = '请输入邮箱和密码';
    messageEl.style.color = 'red';
    return;
  }
  
  messageEl.textContent = '正在登录...';
  messageEl.style.color = 'blue';
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) {
    messageEl.textContent = '登录失败: ' + error.message;
    messageEl.style.color = 'red';
  } else {
    messageEl.textContent = '登录成功！';
    messageEl.style.color = 'green';
    
    // 刷新页面状态
    setTimeout(() => {
      checkAuthState();
    }, 1000);
  }
}

// 用户登出
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    // 重新检查登录状态
    checkAuthState();
  }
}

// 保存学习进度
async function saveProgress(userId, chapterId, lessonId, progressData = {}) {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      chapter_id: chapterId,
      lesson_id: lessonId,
      progress_data: progressData,
      completed: true,
      last_accessed: new Date().toISOString()
    });
  
  if (error) {
    console.error('保存进度失败:', error);
    return false;
  }
  
  console.log('进度保存成功');
  return true;
}

// 加载用户学习进度
async function loadUserProgress(userId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('加载进度失败:', error);
    return;
  }
  
  // 更新页面上的进度状态
  data.forEach(item => {
    const statusEl = document.getElementById(`status-${item.chapter_id}-${item.lesson_id}`);
    if (statusEl && item.completed) {
      statusEl.textContent = '✓ 已完成';
    }
  });
}

// 完成课程
async function completeLesson(chapterId, lessonId) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    alert('请先登录');
    return;
  }
  
  const success = await saveProgress(user.id, chapterId, lessonId, {
    completedAt: new Date().toISOString(),
    action: 'marked_complete'
  });
  
  if (success) {
    const statusEl = document.getElementById(`status-${chapterId}-${lessonId}`);
    if (statusEl) {
      statusEl.textContent = '✓ 已完成';
    }
    alert('进度已保存！');
  } else {
    alert('保存失败，请重试');
  }
}

// 提交测验
async function submitQuiz(quizId) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    alert('请先登录');
    return;
  }
  
  // 获取用户选择的答案
  const selectedAnswer = document.querySelector(`input[name="q${quizId}"]:checked`);
  
  if (!selectedAnswer) {
    alert('请选择一个答案');
    return;
  }
  
  const answer = selectedAnswer.value;
  const isCorrect = answer === 'A'; // 假设正确答案是A
  
  // 保存答题记录
  const { error } = await supabase
    .from('quiz_answers')
    .insert({
      user_id: user.id,
      quiz_id: `quiz_${quizId}`,
      answer_data: { selected: answer, correct: 'A' },
      is_correct: isCorrect,
      score: isCorrect ? 100 : 0
    });
  
  if (error) {
    console.error('保存答题记录失败:', error);
    alert('提交失败');
  } else {
    const resultEl = document.getElementById('quiz-result');
    if (isCorrect) {
      resultEl.textContent = '🎉 回答正确！';
      resultEl.style.color = 'green';
    } else {
      resultEl.textContent = '❌ 回答错误，正确答案是A';
      resultEl.style.color = 'red';
    }
  }
}

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  console.log('认证状态变化:', event);
  checkAuthState();
});

// 页面加载时检查登录状态
window.addEventListener('DOMContentLoaded', checkAuthState);