// ============ SUPABASE CONFIGURATION ============
// Using window.supabase from the CDN script tag
const SUPABASE_URL = 'https://lkvewvtoaautmdcryvya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdmV3dnRvYWF1dG1kY3J5dnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjMwMDUsImV4cCI6MjA5MDQzOTAwNX0.JWbLZMKYp29aSPP2HoDqTJWPB6fwAxzFYymswed_eG0';

// Check if supabase is available from CDN
if (typeof window.supabase === 'undefined') {
  console.error('Supabase client not loaded. Please check your internet connection.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ GLOBAL VARIABLES ============
let currentUser = null;
let deathCounter = 15000;
let counterInterval;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  createFloatingHearts();
  startDeathCounter();
  checkAuthState();
  setupEventListeners();
  setupTabNavigation();
});

// ============ BACKGROUND ANIMATIONS ============
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  for (let i = 0; i < 100; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 4 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = Math.random() * 10 + 5 + 's';
    particle.style.animationDelay = Math.random() * 10 + 's';
    container.appendChild(particle);
  }
}

function createFloatingHearts() {
  const container = document.getElementById('floatingHearts');
  if (!container) return;
  
  setInterval(() => {
    const heart = document.createElement('i');
    heart.className = 'fas fa-heart heart-particle';
    heart.style.left = Math.random() * 100 + '%';
    heart.style.animationDuration = Math.random() * 5 + 3 + 's';
    heart.style.fontSize = Math.random() * 20 + 10 + 'px';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 8000);
  }, 2000);
}

function startDeathCounter() {
  const counterElement = document.getElementById('liveCounter');
  if (!counterElement) return;
  
  // Initialize with random starting number
  deathCounter = Math.floor(Math.random() * 5000) + 12000;
  counterElement.textContent = deathCounter.toLocaleString();
  
  counterInterval = setInterval(() => {
    deathCounter += Math.floor(Math.random() * 3) + 1;
    counterElement.textContent = deathCounter.toLocaleString();
  }, 3000);
}

// ============ AUTH STATE MANAGEMENT ============
async function checkAuthState() {
  const storedUser = localStorage.getItem('premed_user');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      showDashboard();
      loadDashboardData();
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('premed_user');
    }
  }
}

async function registerUser(email, password, username, fullName, age) {
  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  
  const { data, error } = await supabaseClient
    .from('users')
    .insert([{
      email: email,
      username: username,
      password_hash: passwordHash,
      verification_token: verificationToken,
      email_verified: false,
      full_name: fullName || null,
      age: age ? parseInt(age) : null,
      created_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
  
  // Store pending verification
  localStorage.setItem('pending_verification', JSON.stringify({
    email: email,
    token: verificationToken,
    timestamp: Date.now()
  }));
  
  return { email, verificationToken };
}

async function loginUser(email, password) {
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) throw new Error('Invalid email or password');
  
  // Verify password
  if (data.password_hash !== passwordHash) {
    throw new Error('Invalid email or password');
  }
  
  if (!data.email_verified) throw new Error('Please verify your email first');
  
  currentUser = data;
  localStorage.setItem('premed_user', JSON.stringify(data));
  return data;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ============ UI NAVIGATION ============
function showVerificationPage(email) {
  const creationPage = document.getElementById('creationPage');
  const verificationPage = document.getElementById('verificationPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  if (creationPage) creationPage.classList.remove('active');
  if (verificationPage) verificationPage.classList.add('active');
  if (dashboardPage) dashboardPage.classList.remove('active');
  
  const emailDisplay = document.getElementById('verificationEmailDisplay');
  if (emailDisplay) emailDisplay.textContent = email;
}

function showDashboard() {
  const creationPage = document.getElementById('creationPage');
  const verificationPage = document.getElementById('verificationPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  if (creationPage) creationPage.classList.remove('active');
  if (verificationPage) verificationPage.classList.remove('active');
  if (dashboardPage) dashboardPage.classList.add('active');
  
  if (currentUser) {
    const welcomeSpan = document.getElementById('welcomeName');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileFullName = document.getElementById('profileFullName');
    const profileAge = document.getElementById('profileAge');
    
    if (welcomeSpan) welcomeSpan.textContent = currentUser.full_name || currentUser.username;
    if (profileName) profileName.textContent = currentUser.full_name || currentUser.username;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileFullName) profileFullName.value = currentUser.full_name || '';
    if (profileAge) profileAge.value = currentUser.age || '';
  }
}

function showCreationPage() {
  const creationPage = document.getElementById('creationPage');
  const verificationPage = document.getElementById('verificationPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  if (creationPage) creationPage.classList.add('active');
  if (verificationPage) verificationPage.classList.remove('active');
  if (dashboardPage) dashboardPage.classList.remove('active');
}

// ============ DASHBOARD DATA LOADING ============
async function loadDashboardData() {
  await loadModules();
  await loadForumTopics();
  await loadUserProgress();
  loadRecentActivity();
}

async function loadModules() {
  const { data, error } = await supabaseClient
    .from('learning_modules')
    .select('*')
    .eq('is_published', true)
    .order('order_index');
  
  const modulesGrid = document.getElementById('modulesGrid');
  if (!modulesGrid) return;
  
  if (error || !data || data.length === 0) {
    modulesGrid.innerHTML = '<p style="text-align: center; color: #64748b;">No modules available yet. Check back soon!</p>';
    return;
  }
  
  modulesGrid.innerHTML = data.map(module => `
    <div class="module-card" onclick="window.startModule('${module.id}')">
      <div class="module-header">
        <i class="fas ${getModuleIcon(module.category)}"></i>
        <span class="module-badge">${module.difficulty || 'Beginner'}</span>
      </div>
      <div class="module-content">
        <h3>${escapeHtml(module.title)}</h3>
        <p>${escapeHtml(module.description || 'Learn about this important medical topic')}</p>
      </div>
      <div class="module-footer">
        <span><i class="fas fa-clock"></i> ${module.estimated_minutes || 15} min</span>
        <span><i class="fas fa-star"></i> ${module.points_reward || 100} points</span>
      </div>
    </div>
  `).join('');
}

function getModuleIcon(category) {
  const icons = {
    'anatomy': 'fa-heartbeat',
    'clinical': 'fa-stethoscope',
    'emergency': 'fa-ambulance',
    'general': 'fa-book-open',
    'physiology': 'fa-lungs',
    'pathology': 'fa-microscope'
  };
  return icons[category] || 'fa-graduation-cap';
}

async function loadForumTopics() {
  const { data, error } = await supabaseClient
    .from('forum_topics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  const forumContainer = document.getElementById('forumTopics');
  if (!forumContainer) return;
  
  if (error || !data || data.length === 0) {
    forumContainer.innerHTML = '<p style="text-align: center; color: #64748b;">No discussions yet. Be the first to start one!</p>';
    return;
  }
  
  forumContainer.innerHTML = data.map(topic => `
    <div class="forum-topic" onclick="window.viewTopic('${topic.id}')">
      <div class="topic-info">
        <h4>${escapeHtml(topic.title)}</h4>
        <div class="topic-meta">
          <span><i class="fas fa-user"></i> ${escapeHtml(topic.user_id || 'Anonymous')}</span>
          <span><i class="fas fa-clock"></i> ${new Date(topic.created_at).toLocaleDateString()}</span>
          <span><i class="fas fa-tag"></i> ${topic.category || 'General'}</span>
        </div>
      </div>
      <div class="topic-stats">
        <div><i class="fas fa-comment"></i> ${topic.reply_count || 0}</div>
        <div><i class="fas fa-eye"></i> ${topic.views || 0}</div>
      </div>
    </div>
  `).join('');
}

async function loadUserProgress() {
  if (!currentUser) return;
  
  const { data, error } = await supabaseClient
    .from('user_progress')
    .select('*')
    .eq('user_id', currentUser.id);
  
  const completedModules = data?.filter(p => p.status === 'completed').length || 0;
  const totalPoints = data?.reduce((sum, p) => sum + (p.quiz_score || 0), 0) || 0;
  
  const modulesCompletedEl = document.getElementById('modulesCompleted');
  const totalPointsEl = document.getElementById('totalPoints');
  const streakDaysEl = document.getElementById('streakDays');
  
  if (modulesCompletedEl) modulesCompletedEl.textContent = completedModules;
  if (totalPointsEl) totalPointsEl.textContent = totalPoints;
  if (streakDaysEl) streakDaysEl.textContent = Math.floor(Math.random() * 30) + 1;
  
  const forumPosts = await getUserPostCount();
  const forumPostsEl = document.getElementById('forumPosts');
  if (forumPostsEl) forumPostsEl.textContent = forumPosts;
}

async function getUserPostCount() {
  if (!currentUser) return 0;
  
  const { count, error } = await supabaseClient
    .from('forum_replies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id);
  
  return count || 0;
}

function loadRecentActivity() {
  const activities = [
    { icon: 'fa-graduation-cap', text: 'Started Introduction to Anatomy module', time: '2 hours ago' },
    { icon: 'fa-comment', text: 'Commented on "Future of Medicine" discussion', time: '1 day ago' },
    { icon: 'fa-trophy', text: 'Earned "First Steps" badge', time: '3 days ago' }
  ];
  
  const activityList = document.getElementById('recentActivityList');
  if (!activityList) return;
  
  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <i class="fas ${activity.icon}" style="color: #006d77;"></i>
      <span>${activity.text}</span>
      <small style="margin-left: auto; color: #94a3b8;">${activity.time}</small>
    </div>
  `).join('');
}

// ============ MODULE FUNCTIONS ============
window.startModule = function(moduleId) {
  alert(`📚 Module ${moduleId} would open here.\n\nThis would include:\n• Video lessons\n• Interactive quizzes\n• Medical case studies\n• Discussion forums\n• Progress tracking\n\nComing soon!`);
}

window.viewTopic = function(topicId) {
  alert(`💬 Topic ${topicId} would open here.\n\nThis would show:\n• Full discussion thread\n• Replies from other students\n• Option to reply\n• Medical resources\n• Expert insights\n\nComing soon!`);
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const fullName = document.getElementById('fullName').value.trim();
      const age = document.getElementById('age').value;
      
      const submitBtn = document.getElementById('submitBtn');
      if (!submitBtn) return;
      
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<div class="spinner"></div> Creating account...';
      submitBtn.disabled = true;
      
      try {
        await registerUser(email, password, username, fullName, age);
        showVerificationPage(email);
        showMessage('Account created! Check your email for verification.', 'success');
      } catch (error) {
        showMessage(error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Resend email
  const resendBtn = document.getElementById('resendEmailBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      showMessage('Verification email resent! Please check your inbox.', 'success');
    });
  }
  
  // Back to register
  const backBtn = document.getElementById('backToRegisterBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showCreationPage();
    });
  }
  
  // Login link
  const loginLink = document.getElementById('loginLink');
  if (loginLink) {
    loginLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt('Enter your email:');
      if (!email) return;
      const password = prompt('Enter your password:');
      if (!password) return;
      
      try {
        await loginUser(email, password);
        showDashboard();
        loadDashboardData();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    });
  }
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('premed_user');
      currentUser = null;
      showCreationPage();
      showMessage('Logged out successfully', 'success');
    });
  }
  
  // New topic modal
  const newTopicBtn = document.getElementById('newTopicBtn');
  if (newTopicBtn) {
    newTopicBtn.addEventListener('click', () => {
      const modal = document.getElementById('newTopicModal');
      if (modal) modal.classList.add('active');
    });
  }
  
  // Close modal
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('newTopicModal');
      if (modal) modal.classList.remove('active');
    });
  }
  
  // New topic form
  const newTopicForm = document.getElementById('newTopicForm');
  if (newTopicForm) {
    newTopicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('topicTitle').value;
      const content = document.getElementById('topicContent').value;
      const category = document.getElementById('topicCategory').value;
      
      if (!currentUser) {
        showMessage('Please login first', 'error');
        return;
      }
      
      const { error } = await supabaseClient
        .from('forum_topics')
        .insert([{
          title: title,
          content: content,
          category: category,
          user_id: currentUser.id,
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        showMessage('Error posting topic', 'error');
      } else {
        showMessage('Topic posted successfully!', 'success');
        document.getElementById('newTopicModal').classList.remove('active');
        newTopicForm.reset();
        loadForumTopics();
      }
    });
  }
  
  // Profile update
  const profileForm = document.getElementById('profileUpdateForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      
      const fullName = document.getElementById('profileFullName').value;
      const age = document.getElementById('profileAge').value;
      const bio = document.getElementById('profileBio').value;
      
      const { error } = await supabaseClient
        .from('users')
        .update({ 
          full_name: fullName, 
          age: age ? parseInt(age) : null, 
          bio: bio 
        })
        .eq('id', currentUser.id);
      
      if (!error) {
        currentUser.full_name = fullName;
        currentUser.age = age;
        localStorage.setItem('premed_user', JSON.stringify(currentUser));
        showMessage('Profile updated successfully!', 'success');
        
        const welcomeSpan = document.getElementById('welcomeName');
        const profileName = document.getElementById('profileName');
        if (welcomeSpan) welcomeSpan.textContent = fullName || currentUser.username;
        if (profileName) profileName.textContent = fullName || currentUser.username;
      } else {
        showMessage('Error updating profile', 'error');
      }
    });
  }
  
  // Click outside modal to close
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('newTopicModal');
    if (modal && e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

function setupTabNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;
      if (!tab) return;
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      const activeTab = document.getElementById(`${tab}Tab`);
      if (activeTab) activeTab.classList.add('active');
    });
  });
}

function showMessage(message, type) {
  const container = document.getElementById('formMessages');
  if (!container) {
    // Fallback to alert if container not found
    alert(message);
    return;
  }
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `${type}-message`;
  msgDiv.textContent = message;
  container.appendChild(msgDiv);
  
  setTimeout(() => {
    if (msgDiv && msgDiv.remove) msgDiv.remove();
  }, 5000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
