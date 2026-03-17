<template>
  <div class="wellness-app">
    <div class="content-wrapper">
      <header class="hero">
        <div class="logo-container">
          <span class="logo-icon">🌿</span>
          <div class="pulse-ring"></div>
        </div>
        <h1>MindfulPath</h1>
        <p>A space for your thoughts, powered by Gemini AI.</p>
      </header>

      <div class="main-layout">
        <section class="card input-section">
          <div class="card-header">
            <h3>How's your energy today?</h3>
            <span class="date-chip">{{ currentDateTime }}</span>
          </div>
          
          <div class="mood-selector">
            <div class="emoji-wrapper">
              <transition name="bounce" mode="out-in">
                <div :key="moodEmoji" class="emoji-display">{{ moodEmoji }}</div>
              </transition>
            </div>
            <input v-model="newEntry.mood_level" type="range" min="1" max="10" class="slider">
            <div class="score-label">Intensity Level: <strong>{{ newEntry.mood_level }}</strong></div>
          </div>
          
          <div class="input-group">
            <textarea 
              v-model="newEntry.journal_entry" 
              placeholder="Tell me what's happening, Reniel..."
              :disabled="isSubmitting"
            ></textarea>
            <div class="char-count">{{ newEntry.journal_entry.length }} characters</div>
          </div>

          <transition name="fade">
            <div v-if="aiMessage || isSubmitting" class="ai-box" :class="{ 'loading': isSubmitting }">
              <div class="ai-header">
                <span class="ai-sparkle">✨</span>
                <strong>Gemini Counselor</strong>
              </div>
              <p v-if="isSubmitting" class="typing-text">Analysing your thoughts...</p>
              <p v-else>{{ aiMessage }}</p>
            </div>
          </transition>

          <button @click="saveMood" class="btn-primary" :disabled="isSubmitting || !newEntry.journal_entry">
            <span v-if="!isSubmitting">Sync to Cloud</span>
            <span v-else class="loader"></span>
          </button>
        </section>

        <section class="history-section">
          <div class="section-header">
            <h3>Previous Reflections</h3>
            <span class="count-badge">{{ history.length }} entries</span>
          </div>
          
          <div class="history-scroll">
            <div v-if="history.length === 0" class="empty-state">
              <div class="empty-icon">📂</div>
              <p>Your journey begins with your first entry.</p>
            </div>
            
            <transition-group name="list">
              <div v-for="item in history" :key="item.id" class="mood-card">
                <div class="mood-side" :style="{ background: getMoodColor(item.mood_level) }">
                  <span class="side-score">{{ item.mood_level }}</span>
                </div>
                <div class="mood-content">
                  <div class="mood-meta">
                    <small>{{ formatDate(item.created_at) }}</small>
                  </div>
                  <p class="user-text">{{ item.mood_text || item.journal_entry }}</p>
                  <div v-if="item.ai_response" class="ai-mini-reply">
                    <small><strong>AI:</strong> {{ item.ai_response }}</small>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const history = ref([]);
const isSubmitting = ref(false);
const aiMessage = ref('');
const newEntry = ref({ mood_level: 5, journal_entry: '' });

// 1. ENSURE THIS URL IS CORRECT (No trailing slash)
const API_URL = 'https://se2-lab6-backend.onrender.com';

const currentDateTime = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));

const moodEmoji = computed(() => {
  const val = newEntry.value.mood_level;
  if (val <= 2) return '🌧️';
  if (val <= 4) return '☁️';
  if (val <= 6) return '⛅';
  if (val <= 8) return '🌤️';
  return '☀️';
});

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
};

const fetchHistory = async () => {
  try {
    const res = await axios.get(`${API_URL}/moods`);
    history.value = res.data;
  } catch (err) { 
    console.error("Cloud Error:", err); 
  }
};

const saveMood = async () => {
  if (!newEntry.value.journal_entry.trim()) return;
  
  isSubmitting.value = true;
  aiMessage.value = ''; 
  
  try {
    // FIX: Sending 'mood' to match your backend's req.body.mood
    const response = await axios.post(`${API_URL}/moods`, {
      mood: newEntry.value.journal_entry,
      mood_level: parseInt(newEntry.value.mood_level)
    });
    
    aiMessage.value = response.data.ai_response;
    newEntry.value.journal_entry = '';
    await fetchHistory();
  } catch (err) {
    // This alert triggers if the server is still "spinning up" or if there's a CORS error
    alert("The Cloud API is waking up... give it 30 seconds and try again!");
  } finally { 
    isSubmitting.value = false; 
  }
};

const getMoodColor = (s) => {
  if (s >= 8) return 'linear-gradient(135deg, #42e695 0%, #3bb2b8 100%)';
  if (s >= 5) return 'linear-gradient(135deg, #fce38a 0%, #f38181 100%)';
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
};

onMounted(fetchHistory);
</script>

<style scoped>
/* Keeping your peak styling exactly as provided */
.wellness-app { 
  background: radial-gradient(circle at top left, #fdfbfb 0%, #ebedee 100%);
  min-height: 100vh; 
  width: 100vw; 
  display: flex; 
  justify-content: center; 
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #2d3436; 
}

.content-wrapper { width: 100%; max-width: 1200px; padding: 40px 20px; }
.hero { text-align: center; margin-bottom: 50px; }
.hero h1 { font-size: 2.5rem; letter-spacing: -1px; margin: 10px 0; color: #1e272e; }
.hero p { color: #7f8c8d; font-size: 1.1rem; }
.logo-icon { font-size: 3rem; display: block; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); }
.main-layout { display: grid; grid-template-columns: 1fr 1.3fr; gap: 40px; }
.card { 
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 30px; 
  border-radius: 24px; 
  box-shadow: 0 20px 40px rgba(0,0,0,0.05); 
  border: 1px solid rgba(255,255,255,0.3);
  position: sticky; top: 30px;
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.date-chip { background: #dfe6e9; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.emoji-wrapper { height: 120px; display: flex; align-items: center; justify-content: center; }
.emoji-display { font-size: 5.5rem; }
.slider { width: 100%; height: 8px; border-radius: 5px; appearance: none; background: #dfe6e9; outline: none; transition: 0.2s; }
.slider::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #00b894; cursor: pointer; border: 4px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
.input-group { margin-top: 30px; position: relative; }
textarea { 
  width: 100%; height: 150px; padding: 20px; border: 2px solid transparent; 
  background: #f1f2f6; border-radius: 18px; resize: none; font-size: 1.05rem; 
  transition: all 0.3s; box-sizing: border-box;
}
textarea:focus { outline: none; background: white; border-color: #00b894; box-shadow: 0 10px 20px rgba(0,184,148,0.05); }
.char-count { text-align: right; font-size: 0.75rem; color: #b2bec3; margin-top: 5px; }
.ai-box { 
  margin: 25px 0; padding: 20px; background: white; border-radius: 18px; 
  box-shadow: 0 10px 25px rgba(0,0,0,0.04); border-left: 6px solid #00b894;
}
.ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.9rem; }
.ai-box p { margin: 0; line-height: 1.5; color: #2d3436; font-size: 1.05rem; }
.btn-primary { 
  width: 100%; padding: 18px; background: #1e272e; color: white; border: none; 
  border-radius: 18px; font-weight: 700; cursor: pointer; transition: all 0.3s;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); background: #000; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.history-scroll { max-height: 70vh; overflow-y: auto; padding-right: 15px; }
.mood-card { 
  background: white; border-radius: 20px; display: flex; overflow: hidden; 
  margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.02); transition: 0.3s;
}
.mood-card:hover { transform: scale(1.02); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.mood-side { width: 60px; display: flex; align-items: center; justify-content: center; color: white; }
.side-score { font-weight: 800; font-size: 1.4rem; }
.mood-content { padding: 20px; flex: 1; }
.mood-meta { margin-bottom: 8px; }
.user-text { font-weight: 500; margin-bottom: 12px; }
.ai-mini-reply { background: #f8f9fa; padding: 12px; border-radius: 12px; font-style: italic; color: #636e72; }
.bounce-enter-active { animation: bounce-in 0.5s; }
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.typing-text { opacity: 0.6; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.3; } }
@media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } .card { position: relative; top: 0; } }
</style>