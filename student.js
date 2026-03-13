// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let currentStudentId = null;
let currentQuizQuestions = []; 
let activeTakingQuizId = null;

// ==========================================
// UI ULTRA: TOAST BİLDİRİM MOTORU
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');

    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg shadow-${bgColor}/30 font-medium text-xs flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
    
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}


// ==========================================
// 2. OTURUM KONTROLÜ VE BAŞLANGIÇ
// ==========================================
async function initStudentPortal() {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) { window.location.href = 'index.html'; return; }

    currentStudentId = user.id;

    const { data: profile } = await supabaseClient.from('profiles').select('full_name').eq('id', currentStudentId).single();
    if (profile) { document.getElementById('studentNameDisplay').innerText = profile.full_name; }

    switchTab('homeworks');
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});

// ==========================================
// 3. SEKMELER ARASI GEÇİŞ
// ==========================================
function switchTab(target) {
    document.getElementById('section-homeworks').classList.add('hidden');
    document.getElementById('section-activities').classList.add('hidden');
    document.getElementById('section-quizzes').classList.add('hidden');

    document.getElementById('btn-homeworks').classList.remove('bg-white/20');
    document.getElementById('btn-activities').classList.remove('bg-white/20');
    document.getElementById('btn-quizzes').classList.remove('bg-white/20');

    document.getElementById(`section-${target}`).classList.remove('hidden');
    document.getElementById(`btn-${target}`).classList.add('bg-white/20');

    if (target === 'homeworks') fetchMyHomeworks();
    if (target === 'activities') fetchActivities();
    if (target === 'quizzes') fetchQuizzes();
}

document.getElementById('btn-homeworks').addEventListener('click', (e) => { e.preventDefault(); switchTab('homeworks'); });
document.getElementById('btn-activities').addEventListener('click', (e) => { e.preventDefault(); switchTab('activities'); });
document.getElementById('btn-quizzes').addEventListener('click', (e) => { e.preventDefault(); switchTab('quizzes'); });

// ==========================================
// 4. ÖDEVLER VE YENİ TESLİM MOTORU (Zarif Kartlar)
// ==========================================
async function fetchMyHomeworks() {
    const { data } = await supabaseClient.from('homeworks').select('*').eq('student_id', currentStudentId).order('due_date', { ascending: true });
    const container = document.getElementById('myHomeworksList');
    if (!data || data.length === 0) { container.innerHTML = '<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-400 font-medium text-sm border border-dashed border-gray-200">Bekleyen ödevin yok. 🎉</div>'; return; }
    
    container.innerHTML = '';
    data.forEach(hw => {
        const dueDate = new Date(hw.due_date).toLocaleDateString('tr-TR');
        const isCompleted = hw.status === 'Tamamlandı';
        
        let actionAreaHtml = '';
        if (isCompleted) {
            actionAreaHtml = `
                <div class="w-full bg-green-50 text-green-700 font-bold py-2.5 rounded-lg text-xs text-center border border-green-100 flex items-center justify-center gap-1.5">
                    <span>✅</span> TESLİM EDİLDİ
                </div>`;
        } else {
            actionAreaHtml = `
                <button onclick="openHomeworkModal('${hw.id}', '${hw.title.replace(/'/g, "\\'")}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg transition">
                    ÖDEVİ TAMAMLA
                </button>`;
        }

        container.innerHTML += `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition flex flex-col h-full relative overflow-hidden">
                ${isCompleted ? '<div class="absolute top-0 left-0 w-full h-1 bg-green-500"></div>' : '<div class="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>'}
                <h4 class="text-sm font-bold text-gray-800 mb-1.5 mt-1 truncate" title="${hw.title}">${hw.title}</h4>
                <p class="text-gray-500 text-xs mb-4 flex-1 bg-gray-50/50 p-3 rounded-lg leading-relaxed line-clamp-3" title="${hw.description}">${hw.description}</p>
                <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><svg class="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${dueDate}</span>
                </div>
                ${actionAreaHtml}
            </div>`;
    });
}

window.openHomeworkModal = function(id, title) {
    document.getElementById('submitHwId').value = id;
    document.getElementById('submitHwTitle').innerText = title;
    document.getElementById('submitHwNote').value = '';
    document.getElementById('homeworkSubmitModal').classList.remove('hidden');
}

window.closeHomeworkModal = function() {
    document.getElementById('homeworkSubmitModal').classList.add('hidden');
}

document.getElementById('homeworkSubmitForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hwId = document.getElementById('submitHwId').value;
    const note = document.getElementById('submitHwNote').value;
    const btn = document.querySelector('#homeworkSubmitForm button[type="submit"]');
    
    btn.innerText = "⏳ Gönderiliyor...";

    const { error } = await supabaseClient
        .from('homeworks')
        .update({ status: 'Tamamlandı', student_note: note })
        .eq('id', hwId);

    if (error) {
        showToast("Hata: " + error.message, "error");
    } else {
        showToast("Harikasın! Ödevin başarıyla teslim edildi.", "success");
        closeHomeworkModal();
        fetchMyHomeworks(); 
    }
    btn.innerText = "BİTİRDİM, GÖNDER";
});


// ==========================================
// 5. ETKİNLİKLER (VEKTÖREL SVG İKONLARLA ZARİFLEŞTİRİLDİ)
// ==========================================
async function fetchActivities() {
    const { data } = await supabaseClient.from('activities').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('myActivitiesList');
    if (!data || data.length === 0) { container.innerHTML = '<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-400 font-medium text-sm border border-dashed">Etkinlik bulunmuyor.</div>'; return; }
    
    container.innerHTML = ''; 
    
    // Profesyonel SVG Vektörel İkonlar
    const svgIcons = { 
        video: `<svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`, 
        game: `<svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`, 
        pdf: `<svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>` 
    };

    data.forEach(act => {
        container.innerHTML += `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition flex flex-col h-full">
                <div class="flex items-center gap-3 mb-4">
                    <div class="bg-purple-50 p-2.5 rounded-xl">${svgIcons[act.category] || svgIcons.pdf}</div>
                    <h4 class="text-sm font-bold text-gray-800 flex-1 line-clamp-2 leading-tight">${act.title}</h4>
                </div>
                <a href="${act.link}" target="_blank" class="mt-auto w-full bg-gray-50 hover:bg-purple-500 text-purple-600 hover:text-white transition font-bold py-2.5 rounded-lg text-center text-xs">ETKİNLİĞİ AÇ ↗</a>
            </div>`;
    });
}

// ==========================================
// 6. SINAV VE ANALİZ MOTORU (KİBAR VE ŞIK)
// ==========================================
async function fetchQuizzes() {
    const { data } = await supabaseClient.from('quizzes').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('myQuizzesList');
    if (!data || data.length === 0) { container.innerHTML = '<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-400 font-medium text-sm border border-dashed">Sınav bulunmuyor.</div>'; return; }
    
    container.innerHTML = '';
    const quizIcon = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`;

    data.forEach(quiz => {
        container.innerHTML += `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 transition flex flex-col h-full">
                <div class="flex items-center gap-3 mb-4">
                    <div class="bg-red-50 p-2.5 rounded-xl">${quizIcon}</div>
                    <h4 class="text-sm font-bold text-gray-800 flex-1 line-clamp-2 leading-tight">${quiz.title}</h4>
                </div>
                <button onclick="startQuiz('${quiz.id}', '${quiz.title.replace(/'/g, "\\'")}')" class="mt-auto w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-bold py-2.5 rounded-lg transition text-xs">SINAVA BAŞLA</button>
            </div>`;
    });
}

window.startQuiz = async function(quizId, quizTitle) {
    activeTakingQuizId = quizId;
    document.getElementById('takingQuizTitle').innerText = quizTitle;
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '<p class="text-center text-gray-400 font-medium text-sm py-10 animate-pulse">Sınav Yükleniyor...</p>';
    document.getElementById('quizTakingModal').classList.remove('hidden');

    const { data: questions, error } = await supabaseClient.from('questions').select('*').eq('quiz_id', quizId).order('created_at', { ascending: true });
    
    if (error || !questions || questions.length === 0) {
        container.innerHTML = '<p class="text-center text-red-500 font-bold text-sm py-10">Öğretmeniniz bu sınava henüz soru eklememiş.</p>';
        return;
    }

    currentQuizQuestions = questions; 
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        container.innerHTML += `
            <div class="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm question-block" data-question-id="${q.id}" data-correct="${q.correct_option}">
                <h4 class="text-sm font-bold text-gray-800 mb-4 leading-relaxed"><span class="text-indigo-500 mr-1">${index + 1}.</span> ${q.question_text}</h4>
                <div class="space-y-2">
                    <label class="flex items-center p-3 bg-gray-50 border border-transparent rounded-lg cursor-pointer hover:border-indigo-200 transition">
                        <input type="radio" name="q_${q.id}" value="A" class="w-4 h-4 text-indigo-600 mr-3" required>
                        <span class="text-sm text-gray-700">A) ${q.option_a}</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 border border-transparent rounded-lg cursor-pointer hover:border-indigo-200 transition">
                        <input type="radio" name="q_${q.id}" value="B" class="w-4 h-4 text-indigo-600 mr-3" required>
                        <span class="text-sm text-gray-700">B) ${q.option_b}</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 border border-transparent rounded-lg cursor-pointer hover:border-indigo-200 transition">
                        <input type="radio" name="q_${q.id}" value="C" class="w-4 h-4 text-indigo-600 mr-3" required>
                        <span class="text-sm text-gray-700">C) ${q.option_c}</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 border border-transparent rounded-lg cursor-pointer hover:border-indigo-200 transition">
                        <input type="radio" name="q_${q.id}" value="D" class="w-4 h-4 text-indigo-600 mr-3" required>
                        <span class="text-sm text-gray-700">D) ${q.option_d}</span>
                    </label>
                </div>
            </div>`;
    });
};

document.getElementById('quizForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let correctAnswers = 0;
    let examDetails = [];

    currentQuizQuestions.forEach((q, index) => {
        const selectedRadio = document.querySelector(`input[name="q_${q.id}"]:checked`);
        const selectedValue = selectedRadio ? selectedRadio.value : 'Boş';
        const isCorrect = (selectedValue === q.correct_option);
        if (isCorrect) correctAnswers++;

        examDetails.push({
            q_no: index + 1, q_text: q.question_text, correct_opt: q.correct_option, selected_opt: selectedValue, is_correct: isCorrect,
            optA: q.option_a, optB: q.option_b, optC: q.option_c, optD: q.option_d
        });
    });

    const totalQuestions = currentQuizQuestions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    showToast("Cevapların öğretmene iletiliyor...", "info");

    const { error } = await supabaseClient.from('quiz_results').insert([{
        quiz_id: activeTakingQuizId, student_id: currentStudentId, score: score, details: examDetails
    }]);

    if (error) { showToast("Hata oluştu: " + error.message, "error"); return; }

    showToast(`Tebrikler! ${score} Puan aldın.`, "success");
    document.getElementById('quizTakingModal').classList.add('hidden');
    renderAnalysisScreen(examDetails, score);
});

window.closeQuizModal = function() {
    if(confirm("Sınavdan çıkarsan verilerin kaydedilmez. Emin misin?")) { document.getElementById('quizTakingModal').classList.add('hidden'); }
}

function renderAnalysisScreen(details, score) {
    document.getElementById('analysisScoreDisplay').innerText = score;
    const container = document.getElementById('analysisDetailsContainer');
    container.innerHTML = '';

    details.forEach(detail => {
        const boxStyle = detail.is_correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50';
        const iconInfo = detail.is_correct ? '<span class="text-green-500 font-black">✓</span>' : '<span class="text-red-500 font-black">✗</span>';
        
        container.innerHTML += `
            <div class="p-5 rounded-2xl border mb-4 ${boxStyle}">
                <div class="mb-3">
                    <h4 class="text-sm font-bold text-gray-800">${iconInfo} <span class="text-gray-500 ml-1 mr-1">${detail.q_no}.</span> ${detail.q_text}</h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 text-xs font-medium">
                    <div class="p-2 rounded-lg ${detail.correct_opt === 'A' ? 'bg-green-100 text-green-800 font-bold' : 'bg-white text-gray-500 border'}">A) ${detail.optA}</div>
                    <div class="p-2 rounded-lg ${detail.correct_opt === 'B' ? 'bg-green-100 text-green-800 font-bold' : 'bg-white text-gray-500 border'}">B) ${detail.optB}</div>
                    <div class="p-2 rounded-lg ${detail.correct_opt === 'C' ? 'bg-green-100 text-green-800 font-bold' : 'bg-white text-gray-500 border'}">C) ${detail.optC}</div>
                    <div class="p-2 rounded-lg ${detail.correct_opt === 'D' ? 'bg-green-100 text-green-800 font-bold' : 'bg-white text-gray-500 border'}">D) ${detail.optD}</div>
                </div>
                ${!detail.is_correct ? `<div class="mt-3 pl-6 flex flex-col sm:flex-row gap-2"><span class="inline-block bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Senin Cevabın: ${detail.selected_opt}</span><span class="inline-block bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Doğru Cevap: ${detail.correct_opt}</span></div>` : ''}
            </div>`;
    });
    document.getElementById('analysisModal').classList.remove('hidden');
}

window.closeAnalysisModal = function() {
    document.getElementById('analysisModal').classList.add('hidden'); switchTab('quizzes');
}

// Sistemi Başlat
initStudentPortal();
