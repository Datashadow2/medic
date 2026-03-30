// ============ SUPABASE CONFIGURATION ============
const SUPABASE_URL = 'https://lkvewvtoaautmdcryvya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdmV3dnRvYWF1dG1kY3J5dnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjMwMDUsImV4cCI6MjA5MDQzOTAwNX0.JWbLZMKYp29aSPP2HoDqTJWPB6fwAxzFYymswed_eG0';

if (typeof window.supabase === 'undefined') {
  console.error('Supabase client not loaded');
  alert('Supabase client failed to load. Please refresh the page.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ GLOBAL VARIABLES ============
let currentUser = null;
let deathCounter = 15000;
let counterInterval;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  createParticles();
  createFloatingHearts();
  startDeathCounter();
  checkAuthState();
  setupEventListeners();
  setupTabNavigation();
  setupCheckboxLogic();
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
  
  deathCounter = Math.floor(Math.random() * 5000) + 12000;
  counterElement.textContent = deathCounter.toLocaleString();
  
  counterInterval = setInterval(() => {
    deathCounter += Math.floor(Math.random() * 3) + 1;
    counterElement.textContent = deathCounter.toLocaleString();
  }, 3000);
}

// ============ CHECKBOX LOGIC ============
function setupCheckboxLogic() {
  // Family history "None" logic
  const familyNone = document.querySelector('#familyHistoryGroup input[value="none_family"]');
  if (familyNone) {
    familyNone.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.querySelectorAll('#familyHistoryGroup input').forEach(cb => {
          if (cb.value !== 'none_family') cb.checked = false;
        });
      }
    });
  }
  
  // Surgery "None" logic
  const surgeryNone = document.querySelector('#surgeryGroup input[value="none_surgery"]');
  if (surgeryNone) {
    surgeryNone.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.querySelectorAll('#surgeryGroup input').forEach(cb => {
          if (cb.value !== 'none_surgery') cb.checked = false;
        });
      }
    });
  }
  
  // If any other checkbox is checked, uncheck "None"
  document.querySelectorAll('#familyHistoryGroup input[value!="none_family"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked && familyNone) familyNone.checked = false;
    });
  });
  
  document.querySelectorAll('#surgeryGroup input[value!="none_surgery"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked && surgeryNone) surgeryNone.checked = false;
    });
  });
}

// ============ AUTH STATE MANAGEMENT ============
async function checkAuthState() {
  const storedUser = localStorage.getItem('premed_user');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      console.log('Found stored user:', currentUser.email);
      showDashboard();
      loadDashboardData();
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('premed_user');
    }
  }
}

async function registerUser(formData) {
  console.log('Attempting to register user:', formData.email);
  
  const passwordHash = await hashPassword(formData.password);
  const verificationToken = generateToken();
  const userId = crypto.randomUUID ? crypto.randomUUID() : generateToken();
  
  // Collect family medical history
  const familyHistory = Array.from(document.querySelectorAll('#familyHistoryGroup input:checked'))
    .filter(cb => cb.value !== 'none_family')
    .map(cb => cb.value);
  
  // Collect surgical history
  const surgeries = Array.from(document.querySelectorAll('#surgeryGroup input:checked'))
    .filter(cb => cb.value !== 'none_surgery')
    .map(cb => cb.value);
  
  const userData = {
    id: userId,
    email: formData.email,
    username: formData.username,
    password_hash: passwordHash,
    verification_token: verificationToken,
    email_verified: false,
    full_name: formData.fullName || null,
    age: formData.age ? parseInt(formData.age) : null,
    phone: formData.phone || null,
    date_of_birth: formData.dateOfBirth || null,
    relationship_status: formData.relationshipStatus || null,
    living_situation: formData.livingSituation || null,
    education_level: formData.educationLevel || null,
    emergency_contact_name: formData.emergencyName || null,
    emergency_contact_phone: formData.emergencyPhone || null,
    emergency_contact_relationship: formData.emergencyRelationship || null,
    family_medical_history: familyHistory.length ? familyHistory : null,
    surgical_history: surgeries.length ? surgeries : null,
    exercise_frequency: formData.exerciseFrequency || null,
    diet_type: formData.dietType || null,
    sleep_hours: formData.sleepHours ? parseInt(formData.sleepHours) : null,
    smoking_status: formData.smokingStatus || null,
    alcohol_consumption: formData.alcoholConsumption || null,
    support_system: formData.supportSystem || null,
    primary_concern: formData.primaryConcern || null,
    medical_goals: formData.medicalGoals || null,
    profile_completed: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('Inserting user with comprehensive medical profile');
  
  const { data, error } = await supabaseClient
    .from('users')
    .insert([userData])
    .select();
  
  if (error) {
    console.error('Supabase insert error:', error);
    if (error.code === '23505') {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
  
  console.log('User registered successfully');
  
  localStorage.setItem('pending_verification', JSON.stringify({
    email: formData.email,
    token: verificationToken,
    timestamp: Date.now()
  }));
  
  return { email: formData.email, verificationToken };
}

async function loginUser(email, password) {
  console.log('Attempting login for:', email);
  
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error('Login query error:', error);
    throw new Error('Database error. Please try again.');
  }
  
  if (!data) {
    throw new Error('Invalid email or password');
  }
  
  if (data.password_hash !== passwordHash) {
    throw new Error('Invalid email or password');
  }
  
  if (!data.email_verified) {
    throw new Error('Please verify your email first. Check your inbox.');
  }
  
  console.log('Login successful for:', email);
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
    const profileDetails = document.getElementById('profileDetails');
    
    if (welcomeSpan) welcomeSpan.textContent = currentUser.full_name || currentUser.username;
    if (profileName) profileName.textContent = currentUser.full_name || currentUser.username;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    
    if (profileDetails) {
      let detailsHtml = '';
      if (currentUser.phone) detailsHtml += `<p><i class="fas fa-phone"></i> ${escapeHtml(currentUser.phone)}</p>`;
      if (currentUser.date_of_birth) detailsHtml += `<p><i class="fas fa-birthday-cake"></i> DOB: ${currentUser.date_of_birth}</p>`;
      if (currentUser.relationship_status) detailsHtml += `<p><i class="fas fa-heart"></i> ${currentUser.relationship_status.replace('_', ' ')}</p>`;
      if (currentUser.education_level) detailsHtml += `<p><i class="fas fa-graduation-cap"></i> ${escapeHtml(currentUser.education_level)}</p>`;
      profileDetails.innerHTML = detailsHtml || '<p>Complete your profile to see more details</p>';
    }
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
  console.log('Loading dashboard data...');
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
  
  if (error) {
    console.error('Error loading modules:', error);
    modulesGrid.innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading modules</p>';
    return;
  }
  
  if (!data || data.length === 0) {
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
  
  if (error) {
    console.error('Error loading forum topics:', error);
    forumContainer.innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading discussions</p>';
    return;
  }
  
  if (!data || data.length === 0) {
    forumContainer.innerHTML = '<p style="text-align: center; color: #64748b;">No discussions yet. Be the first to start one!</p>';
    return;
  }
  
  forumContainer.innerHTML = data.map(topic => `
    <div class="forum-topic" onclick="window.viewTopic('${topic.id}')">
      <div class="topic-info">
        <h4>${escapeHtml(topic.title)}</h4>
        <div class="topic-meta">
          <span><i class="fas fa-user"></i> Student</span>
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
    { icon: 'fa-graduation-cap', text: 'Completed medical profile registration', time: 'Just now' },
    { icon: 'fa-heartbeat', text: 'Joined PreMed Explorer community', time: 'Just now' },
    { icon: 'fa-star-of-life', text: 'Started your journey to save lives', time: 'Welcome!' }
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
  alert(`📚 Learning Module Coming Soon!\n\nThis module will include:\n• Video lessons from medical experts\n• Interactive quizzes\n• Real medical case studies\n• Discussion with peers\n• Progress tracking\n\nGet ready to start your medical journey!`);
}

window.viewTopic = function(topicId) {
  alert(`💬 Discussion Forum Coming Soon!\n\nFeatures coming:\n• Full discussion threads\n• Reply to other students\n• Share medical resources\n• Ask questions to mentors\n• Earn badges for participation\n\nStart thinking about what medical topics interest you!`);
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName').value.trim(),
        age: document.getElementById('age').value,
        phone: document.getElementById('phone').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        relationshipStatus: document.getElementById('relationshipStatus').value,
        livingSituation: document.getElementById('livingSituation').value,
        educationLevel: document.getElementById('educationLevel').value.trim(),
        emergencyName: document.getElementById('emergencyName').value.trim(),
        emergencyPhone: document.getElementById('emergencyPhone').value.trim(),
        emergencyRelationship: document.getElementById('emergencyRelationship').value.trim(),
        exerciseFrequency: document.getElementById('exerciseFrequency').value,
        dietType: document.getElementById('dietType').value,
        sleepHours: document.getElementById('sleepHours').value,
        smokingStatus: document.getElementById('smokingStatus').value,
        alcoholConsumption: document.getElementById('alcoholConsumption').value,
        supportSystem: document.getElementById('supportSystem').value.trim(),
        primaryConcern: document.getElementById('primaryConcern').value.trim(),
        medicalGoals: document.getElementById('medicalGoals').value.trim()
      };
      
      if (!formData.username || !formData.email || !formData.password) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }
      
      if (formData.password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
      }
      
      if (formData.age && (formData.age < 13 || formData.age > 19)) {
        showMessage('Age must be between 13 and 19', 'error');
        return;
      }
      
      const submitBtn = document.getElementById('submitBtn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<div class="spinner"></div> Creating your medical profile...';
      submitBtn.disabled = true;
      
      try {
        await registerUser(formData);
        showVerificationPage(formData.email);
        showMessage('Account created! Check your email for verification.', 'success');
      } catch (error) {
        console.error('Registration error:', error);
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
      if (!currentUser) {
        showMessage('Please login first to create a discussion', 'error');
        return;
      }
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
      if (!currentUser) {
        showMessage('Please login first', 'error');
        return;
      }
      
      const title = document.getElementById('topicTitle').value;
      const content = document.getElementById('topicContent').value;
      const category = document.getElementById('topicCategory').value;
      
      if (!title || !content) {
        showMessage('Please fill in all fields', 'error');
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
        console.error('Error posting topic:', error);
        showMessage('Error posting topic. Please try again.', 'error');
      } else {
        showMessage('Topic posted successfully!', 'success');
        document.getElementById('newTopicModal').classList.remove('active');
        newTopicForm.reset();
        loadForumTopics();
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
    console.log(`${type}: ${message}`);
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
