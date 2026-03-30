// ============ SUPABASE CONFIGURATION ============
const SUPABASE_URL = 'https://lkvewvtoaautmdcryvya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdmV3dnRvYWF1dG1kY3J5dnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjMwMDUsImV4cCI6MjA5MDQzOTAwNX0.JWbLZMKYp29aSPP2HoDqTJWPB6fwAxzFYymswed_eG0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
});

// ============ BACKGROUND ANIMATIONS ============
function createParticles() {
  const container = document.getElementById('particles');
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
  
  counterInterval = setInterval(() => {
    deathCounter += Math.floor(Math.random() * 3) + 1;
    counterElement.textContent = deathCounter.toLocaleString();
  }, 3000);
}

// ============ AUTH STATE MANAGEMENT ============
async function checkAuthState() {
  const storedUser = localStorage.getItem('premed_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showDashboard();
    loadDashboardData();
  }
}

async function registerUser(email, password, username, fullName, age) {
  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  
  const { data, error } = await supabase
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
  
  if (error) throw error;
  
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
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password_hash', passwordHash)
    .single();
  
  if (error || !data) throw new Error('Invalid email or password');
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
  document.getElementById('creationPage').classList.remove('active');
  document.getElementById('verificationPage').classList.add('active');
  document.getElementById('verificationEmailDisplay').textContent = email;
}

function showDashboard() {
  document.getElementById('creationPage').classList.remove('active');
  document.getElementById('verificationPage').classList.remove('active');
  document.getElementById('dashboardPage').classList.add('active');
  
  if (currentUser) {
    document.getElementById('welcomeName').textContent = currentUser.full_name || currentUser.username;
    document.getElementById('profileName').textContent = currentUser.full_name || currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileFullName').value = currentUser.full_name || '';
    document.getElementById('profileAge').value = currentUser.age || '';
  }
}

function showCreationPage() {
  document.getElementById('creationPage').classList.add('active');
  document.getElementById('verificationPage').classList.remove('active');
  document.getElementById('dashboardPage').classList.remove('active');
}

// ============ DASHBOARD DATA LOADING ============
async function loadDashboardData() {
  await loadModules();
  await loadForumTopics();
  await loadUserProgress();
  loadRecentActivity();
}

async function loadModules() {
  const { data, error } = await supabase
    .from('learning_modules')
    .select('*')
    .eq('is_published', true)
    .order('order_index');
  
  const modulesGrid = document.getElementById('modulesGrid');
  if (error || !data || data.length === 0) {
    modulesGrid.innerHTML = '<p>No modules available yet. Check back soon!</p>';
    return;
  }
  
  modulesGrid.innerHTML = data.map(module => `
    <div class="module-card" onclick="startModule('${module.id}')">
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
    'general': 'fa-book-open'
  };
  return icons[category] || 'fa-graduation-cap';
}

async function loadForumTopics() {
  const { data, error } = await supabase
    .from('forum_topics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  const forumContainer = document.getElementById('forumTopics');
  if (error || !data || data.length === 0) {
    forumContainer.innerHTML = '<p>No discussions yet. Be the first to start one!</p>';
    return;
  }
  
  forumContainer.innerHTML = data.map(topic => `
    <div class="forum-topic" onclick="viewTopic('${topic.id}')">
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
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', currentUser.id);
  
  const completedModules = data?.filter(p => p.status === 'completed').length || 0;
  const totalPoints = data?.reduce((sum, p) => sum + (p.quiz_score || 0), 0) || 0;
  
  document.getElementById('modulesCompleted').textContent = completedModules;
  document.getElementById('totalPoints').textContent = totalPoints;
  document.getElementById('streakDays').textContent = Math.floor(Math.random() * 30) + 1;
  document.getElementById('forumPosts').textContent = await getUserPostCount();
}

async function getUserPostCount() {
  const { count, error } = await supabase
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
  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <i class="fas ${activity.icon}" style="color: #006d77;"></i>
      <span>${activity.text}</span>
      <small style="margin-left: auto; color: #94a3b8;">${activity.time}</small>
    </div>
  `).join('');
}

// ============ MODULE FUNCTIONS ============
function startModule(moduleId) {
  alert(`Module ${moduleId} would open here.\n\nIn production, this would load the full learning content with videos, quizzes, and interactive elements.`);
}

function viewTopic(topicId) {
  alert(`Topic ${topicId} would open here.\n\nIn production, this would show the full discussion thread with replies.`);
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
  document.getElementById('resendEmailBtn')?.addEventListener('click', () => {
    showMessage('Verification email resent! Please check your inbox.', 'success');
  });
  
  // Back to register
  document.getElementById('backToRegisterBtn')?.addEventListener('click', () => {
    showCreationPage();
  });
  
  // Login link
  document.getElementById('loginLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    if (email && password) {
      loginUser(email, password).then(() => {
        showDashboard();
        loadDashboardData();
      }).catch(err => showMessage(err.message, 'error'));
    }
  });
  
  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('premed_user');
    currentUser = null;
    showCreationPage();
  });
  
  // Tab navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(`${tab}Tab`).classList.add('active');
    });
  });
  
  // New topic modal
  document.getElementById('newTopicBtn')?.addEventListener('click', () => {
    document.getElementById('newTopicModal').classList.add('active');
  });
  
  document.querySelector('.close-modal')?.addEventListener('click', () => {
    document.getElementById('newTopicModal').classList.remove('active');
  });
  
  // Profile update
  const profileForm = document.getElementById('profileUpdateForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('profileFullName').value;
      const age = document.getElementById('profileAge').value;
      const bio = document.getElementById('profileBio').value;
      
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, age: age ? parseInt(age) : null, bio: bio })
        .eq('id', currentUser.id);
      
      if (!error) {
        currentUser.full_name = fullName;
        currentUser.age = age;
        localStorage.setItem('premed_user', JSON.stringify(currentUser));
        showMessage('Profile updated successfully!', 'success');
        document.getElementById('welcomeName').textContent = fullName || currentUser.username;
        document.getElementById('profileName').textContent = fullName || currentUser.username;
      } else {
        showMessage('Error updating profile', 'error');
      }
    });
  }
}

function showMessage(message, type) {
  const container = document.getElementById('formMessages');
  if (!container) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `${type}-message`;
  msgDiv.textContent = message;
  container.appendChild(msgDiv);
  
  setTimeout(() => msgDiv.remove(), 5000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}
