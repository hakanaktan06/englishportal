// ==========================================
// 1. SUPABASE BAĞLANTISI (Sistem Anahtarı)
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-${bgColor}/30 font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;
    toast.innerHTML = `<span class="text-lg">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function customConfirm(message, btnText = "Evet, Sil") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const box = document.getElementById('customConfirmBox');
        const btnOk = document.getElementById('customConfirmOk');
        const btnCancel = document.getElementById('customConfirmCancel');

        if(!modal) { resolve(confirm(message)); return; }

        // Metni VE buton yazısını dinamik yapıyoruz!
        document.getElementById('customConfirmMessage').innerText = message;
        btnOk.innerText = btnText; 
        
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);

        const cleanup = () => {
            modal.classList.add('opacity-0'); box.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
            btnOk.replaceWith(btnOk.cloneNode(true));
            btnCancel.replaceWith(btnCancel.cloneNode(true));
        };

        document.getElementById('customConfirmOk').addEventListener('click', () => { cleanup(); resolve(true); });
        document.getElementById('customConfirmCancel').addEventListener('click', () => { cleanup(); resolve(false); });
    });
}


// ÇIKIŞ MOTORU (SAĞ ÜSTTEKİ BUTON)
document.addEventListener('click', async (e) => {
    if (e.target.closest('#studentLogoutBtn')) {
        // İkinci parametre olarak butonun üstünde ne yazacağını gönderiyoruz!
        const onay = await customConfirm("Oturumunu kapatmak istediğine emin misin?", "Evet, Çıkış Yap");
        if(!onay) return;
        const { error } = await supabaseClient.auth.signOut();
        if (!error) window.location.href = 'index.html';
        else showToast("Çıkış yapılamadı!", "error");
    }
});



// ==========================================
// YENİ: MOBİL HAMBURGER MENÜ MOTORU
// ==========================================
const sidebarMain = document.getElementById('mainSidebar');
const sideOverlay = document.getElementById('sidebarOverlay');
const sideOpenBtn = document.getElementById('openSidebarBtn');
const sideCloseBtn = document.getElementById('closeSidebarBtn');

function toggleMobileSidebar() {
    if(sidebarMain) sidebarMain.classList.toggle('-translate-x-full');
    if(sideOverlay) sideOverlay.classList.toggle('hidden');
}

if(sideOpenBtn) sideOpenBtn.addEventListener('click', toggleMobileSidebar);
if(sideCloseBtn) sideCloseBtn.addEventListener('click', toggleMobileSidebar);
if(sideOverlay) sideOverlay.addEventListener('click', toggleMobileSidebar);


// ==========================================
// 2. SEKMELER ARASI GEÇİŞ VE NAVİGASYON
// ==========================================
const btnDashboard = document.getElementById('btn-dashboard'); 
const btnStudents = document.getElementById('btn-students');
const btnHomeworks = document.getElementById('btn-homeworks');
const btnActivities = document.getElementById('btn-activities'); 
const btnQuizzes = document.getElementById('btn-quizzes'); 
const btnResults = document.getElementById('btn-results'); 

const sectionDashboard = document.getElementById('section-dashboard'); 
const sectionStudents = document.getElementById('section-students');
const sectionHomeworks = document.getElementById('section-homeworks');
const sectionActivities = document.getElementById('section-activities');
const sectionQuizzes = document.getElementById('section-quizzes');
const sectionResults = document.getElementById('section-results'); 

function switchTab(target) {
    if(window.innerWidth < 768 && sidebarMain && !sidebarMain.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }

    if (sectionDashboard) sectionDashboard.classList.add('hidden');
    if (sectionStudents) sectionStudents.classList.add('hidden');
    if (sectionHomeworks) sectionHomeworks.classList.add('hidden');
    if (sectionActivities) sectionActivities.classList.add('hidden');
    if (sectionQuizzes) sectionQuizzes.classList.add('hidden');
    if (sectionResults) sectionResults.classList.add('hidden'); 
    
    if (btnDashboard) btnDashboard.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnStudents) btnStudents.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnHomeworks) btnHomeworks.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnActivities) btnActivities.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnQuizzes) btnQuizzes.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnResults) btnResults.classList.remove('bg-indigo-800', 'shadow-inner'); 

    if (target === 'dashboard') {
        if(sectionDashboard) sectionDashboard.classList.remove('hidden');
        if(btnDashboard) btnDashboard.classList.add('bg-indigo-800', 'shadow-inner');
        fetchDashboardStats();
    } else if (target === 'homeworks') {
        if(sectionHomeworks) sectionHomeworks.classList.remove('hidden');
        if(btnHomeworks) btnHomeworks.classList.add('bg-indigo-800', 'shadow-inner');
        fillStudentSelect();
        fetchHomeworks();
    } else if (target === 'activities') {
        if(sectionActivities) sectionActivities.classList.remove('hidden');
        if(btnActivities) btnActivities.classList.add('bg-indigo-800', 'shadow-inner');
        fetchActivities();
    } else if (target === 'quizzes') {
        if(sectionQuizzes) sectionQuizzes.classList.remove('hidden');
        if(btnQuizzes) btnQuizzes.classList.add('bg-indigo-800', 'shadow-inner');
        fetchQuizzes();
    } else if (target === 'results') { 
        if(sectionResults) sectionResults.classList.remove('hidden');
        if(btnResults) btnResults.classList.add('bg-indigo-800', 'shadow-inner');
        fetchResults(); 
    } else {
        if(sectionStudents) sectionStudents.classList.remove('hidden');
        if(btnStudents) btnStudents.classList.add('bg-indigo-800', 'shadow-inner');
        fetchStudents();
    }
}

if(btnDashboard) btnDashboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
if(btnHomeworks) btnHomeworks.addEventListener('click', (e) => { e.preventDefault(); switchTab('homeworks'); });
if(btnStudents) btnStudents.addEventListener('click', (e) => { e.preventDefault(); switchTab('students'); });
if(btnActivities) btnActivities.addEventListener('click', (e) => { e.preventDefault(); switchTab('activities'); });
if(btnQuizzes) btnQuizzes.addEventListener('click', (e) => { e.preventDefault(); switchTab('quizzes'); });
if(btnResults) btnResults.addEventListener('click', (e) => { e.preventDefault(); switchTab('results'); });


// ==========================================
// KOKPİT (DASHBOARD) İSTATİSTİK MOTORU
// ==========================================
async function fetchDashboardStats() {
    const { count: studentCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const dStud = document.getElementById('dashStudentCount');
    if (dStud) dStud.innerText = studentCount || 0;

    const { count: quizCount } = await supabaseClient.from('quizzes').select('*', { count: 'exact', head: true });
    const dQuiz = document.getElementById('dashQuizCount');
    if (dQuiz) dQuiz.innerText = quizCount || 0;

    const { count: hwCount } = await supabaseClient.from('homeworks').select('*', { count: 'exact', head: true });
    const dHw = document.getElementById('dashHwCount');
    if (dHw) dHw.innerText = hwCount || 0;

    const { data: results } = await supabaseClient.from('quiz_results').select('score');
    let avgScore = 0;
    if(results && results.length > 0) {
        const total = results.reduce((sum, r) => sum + r.score, 0);
        avgScore = Math.round(total / results.length);
    }
    const dAvg = document.getElementById('dashAvgScore');
    if (dAvg) dAvg.innerText = avgScore ? `%${avgScore}` : '%0';
}


// ==========================================
// 3. ÖĞRENCİ MOTORLARI (KAYIT, SİLME, LİSTELEME)
// ==========================================
const studentModalEl = document.getElementById('addStudentModal');
const openStudBtn = document.getElementById('addStudentBtn');
const closeStudBtn = document.getElementById('closeModalBtn');
const studentFormEl = document.getElementById('newStudentForm');

if(openStudBtn) {
    openStudBtn.addEventListener('click', () => { 
        if(studentModalEl) studentModalEl.classList.remove('hidden'); 
    });
}

if(closeStudBtn) {
    closeStudBtn.addEventListener('click', () => { 
        if(studentModalEl) studentModalEl.classList.add('hidden'); 
    });
}

if(studentFormEl) {
    studentFormEl.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        
        const submitBtn = studentFormEl.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "⏳ Sisteme Kaydediliyor...";

        const name = document.getElementById('studentName').value;
        const email = document.getElementById('studentEmail').value;
        const password = document.getElementById('studentPassword').value;

        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if (error) {
            showToast("Hata: " + error.message, "error");
            submitBtn.innerText = originalText;
            return;
        }

        if (data.user) {
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([{ id: data.user.id, full_name: name, role: 'student' }]);

            if (profileError) {
                showToast("Profile eklenirken hata: " + profileError.message, "error");
            } else {
                showToast("Şov! Öğrenci başarıyla eklendi.", "success");
                if(studentModalEl) studentModalEl.classList.add('hidden'); 
                studentFormEl.reset(); 
                fetchStudents();
            }
        }
        submitBtn.innerText = originalText;
    });
}

window.deleteStudent = async function(id) {
    const onay = await customConfirm("Bu öğrenciyi kalıcı olarak silmek istediğine emin misin? Dönüşü yok!");
    if (!onay) return; 
    
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
        
    if (error) { 
        showToast("Silerken hata oldu: " + error.message, "error"); 
    } else { 
        showToast("Öğrenci silindi.", "success");
        fetchStudents(); 
    }
};

async function fetchStudents() {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
    if (error) return; 

    const tbody = document.getElementById('studentList');
    const totalStudents = document.getElementById('totalStudents');

    if (!data || data.length === 0) {
        if(totalStudents) totalStudents.innerText = "0";
        if(tbody) tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-500 italic">Henüz hiç öğrenci yok.</td></tr>`;
        return;
    }

    if(totalStudents) totalStudents.innerText = data.length;
    if(tbody) tbody.innerHTML = ''; 

    data.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-100 hover:bg-indigo-50/20 transition";
        const dateObj = new Date(student.created_at);
        const date = dateObj.toLocaleDateString('tr-TR');

        tr.innerHTML = `
            <td class="p-4 font-bold text-gray-800 flex items-center text-sm">
                <div class="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs mr-3 shadow-sm">
                    ${student.full_name.charAt(0).toUpperCase()}
                </div>
                ${student.full_name}
            </td>
            <td class="p-4 text-gray-400 text-xs italic font-medium">Öğrenci Hesabı</td>
            <td class="p-4 text-gray-500 text-xs font-bold">${date}</td>
            <td class="p-4 text-right">
                <button onclick="deleteStudent('${student.id}')" class="text-gray-300 hover:text-red-500 p-2 text-xl transition" title="Öğrenciyi Sil">
                    🗑️
                </button>
            </td>
        `;
        if(tbody) tbody.appendChild(tr);
    });
}


// ==========================================
// 4. ÖDEV MOTORLARI 
// ==========================================
window.deleteHomework = async function(id) {
    const onay = await customConfirm("Bu ödevi tamamen siliyorum, emin misin?");
    if (!onay) return;
    
    const { error } = await supabaseClient.from('homeworks').delete().eq('id', id);

    if (error) showToast("Ödev silinirken hata oldu!", "error");
    else {
        showToast("Ödev silindi.", "success");
        fetchHomeworks();
    }
};

async function fillStudentSelect() {
    const { data } = await supabaseClient.from('profiles').select('id, full_name').eq('role', 'student');
    const select = document.getElementById('hwStudentSelect');
    if (data && select) {
        select.innerHTML = '<option value="">Öğrenci Seçin...</option>';
        data.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.full_name}</option>`; });
    }
}

const homeworkFormEl = document.getElementById('newHomeworkForm');
if(homeworkFormEl) {
    homeworkFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const studentId = document.getElementById('hwStudentSelect').value;
        if (!studentId) { showToast("Önce öğrenciyi seçmelisin!", "error"); return; }

        const btn = homeworkFormEl.querySelector('button');
        btn.innerText = "🚀 Gönderiliyor...";

        const { error } = await supabaseClient.from('homeworks').insert([{
            student_id: studentId,
            title: document.getElementById('hwTitle').value,
            description: document.getElementById('hwDesc').value,
            due_date: document.getElementById('hwDueDate').value
        }]);

        if (error) { 
            showToast("Ödev hatası: " + error.message, "error"); 
        } else { 
            showToast("Ödev başarıyla verildi!", "success"); 
            homeworkFormEl.reset(); 
            fetchHomeworks(); 
        }
        btn.innerText = "Ödevi Gönder";
    });
}

async function fetchHomeworks() {
    const { data, error } = await supabaseClient.from('homeworks').select('*, profiles(full_name)').order('created_at', { ascending: false });
    const tbody = document.getElementById('homeworkList');
    if (error || !tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400 italic text-sm">Henüz hiç ödev verilmemiş.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(hw => {
        const date = new Date(hw.due_date).toLocaleDateString('tr-TR');
        const status = hw.status || 'bekliyor';
        
        let statusHtml = status === 'Tamamlandı' 
            ? `<span class="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[10px] font-black uppercase tracking-widest block w-fit mx-auto">Tamamlandı</span>` 
            : `<span class="px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-lg text-[10px] font-black uppercase tracking-widest block w-fit mx-auto">Bekliyor</span>`;

        let noteHtml = hw.student_note 
            ? `<button onclick="openStudentNoteModal('${hw.student_note.replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, "\\n")}')" class="mt-2 w-full bg-yellow-100 hover:bg-yellow-500 text-yellow-700 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition shadow-sm border border-yellow-200 hover:border-yellow-600">NOTU GÖR</button>` 
            : '';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td class="p-4 font-bold text-gray-800 text-sm">${hw.profiles ? hw.profiles.full_name : 'Bilinmeyen'}</td>
                <td class="p-4 text-gray-600 text-sm truncate max-w-[200px]" title="${hw.title}">${hw.title}</td>
                <td class="p-4 text-red-500 font-bold text-xs">${date}</td>
                <td class="p-4 text-center">${statusHtml}${noteHtml}</td>
                <td class="p-4 text-right"><button onclick="deleteHomework('${hw.id}')" class="text-gray-300 hover:text-red-500 p-2 text-xl transition" title="Ödevi Sil">🗑️</button></td>
            </tr>`;
    });
}

window.openStudentNoteModal = function(noteText) {
    const elNote = document.getElementById('fullStudentNoteText');
    const modalNote = document.getElementById('studentNoteModal');
    if (elNote) elNote.innerText = noteText;
    if (modalNote) modalNote.classList.remove('hidden');
};

window.closeStudentNoteModal = function() {
    const modalNote = document.getElementById('studentNoteModal');
    if (modalNote) modalNote.classList.add('hidden');
};


// ==========================================
// 5. ETKİNLİK MOTORLARI 
// ==========================================
const activityFormEl = document.getElementById('newActivityForm');
if (activityFormEl) {
    activityFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = activityFormEl.querySelector('button');
        btn.innerText = "🚀 Ekleniyor...";

        const { error } = await supabaseClient.from('activities').insert([{
            title: document.getElementById('actTitle').value,
            category: document.getElementById('actCategory').value,
            link: document.getElementById('actLink').value
        }]);

        if (error) {
            showToast("Hata: " + error.message, "error");
        } else {
            showToast("Etkinlik kütüphaneye eklendi!", "success");
            activityFormEl.reset();
            fetchActivities();
        }
        btn.innerText = "Kütüphaneye Ekle";
    });
}

window.deleteActivity = async (id) => {
    const onay = await customConfirm("Bu etkinliği sileyim mi kanka?");
    if (!onay) return;
    
    const { error } = await supabaseClient.from('activities').delete().eq('id', id);
    if (error) showToast("Silinirken hata!", "error"); else fetchActivities();
};

async function fetchActivities() {
    const { data, error } = await supabaseClient.from('activities').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('activityCards');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic font-medium p-10">Kütüphane henüz boş.</p>';
        return;
    }

    container.innerHTML = '';
    const icons = { video: '📺', game: '🎮', pdf: '📄' };

    data.forEach(act => {
        container.innerHTML += `
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                <div>
                    <span class="text-4xl">${icons[act.category] || '🔗'}</span>
                    <h4 class="font-black mt-3 text-gray-800 uppercase text-xs tracking-widest">${act.title}</h4>
                </div>
                <div class="mt-5 flex justify-between items-center border-t pt-3">
                    <a href="${act.link}" target="_blank" class="text-indigo-600 font-black text-[10px] hover:underline uppercase tracking-tighter">AÇ ↗</a>
                    <button onclick="deleteActivity('${act.id}')" class="text-gray-300 hover:text-red-500 transition text-xl">🗑️</button>
                </div>
            </div>`;
    });
}


// ==========================================
// 6. ÇOKLU SORU VE SINAV MOTORU
// ==========================================
const quizAddBtnEl = document.getElementById('addQuizBtn');
if (quizAddBtnEl) {
    quizAddBtnEl.addEventListener('click', () => {
        const modalQuiz = document.getElementById('quizNameModal');
        if (modalQuiz) modalQuiz.classList.remove('hidden');
    });
}

const quizSaveBtnEl = document.getElementById('saveQuizTitleBtn');
if (quizSaveBtnEl) {
    quizSaveBtnEl.addEventListener('click', async () => {
        const qTitleInput = document.getElementById('quizTitleInput');
        const title = qTitleInput ? qTitleInput.value : '';
        if (!title) { showToast("Lütfen sınav ismini yaz!", "error"); return; }

        const { data, error } = await supabaseClient.from('quizzes').insert([{ title: title }]).select();
        
        if (error) {
            showToast("Sınav oluşturma hatası: " + error.message, "error");
        } else {
            showToast("Sınav başarıyla oluşturuldu! Hadi soru ekleyelim.", "success");
            const modalQuiz = document.getElementById('quizNameModal');
            if (modalQuiz) modalQuiz.classList.add('hidden');
            if (qTitleInput) qTitleInput.value = '';
            fetchQuizzes();
            openQuestionEditor(data[0].id, data[0].title);
        }
    });
}

window.openQuestionEditor = function(id, title) {
    currentActiveQuizId = id;
    const titleHeader = document.getElementById('currentQuizTitle');
    if (titleHeader) titleHeader.innerText = title;
    
    const qModal = document.getElementById('questionModal');
    if (qModal) qModal.classList.remove('hidden');
    
    fetchQuestionsForQuiz(id);
};

async function fetchQuestionsForQuiz(quizId) {
    const { data, error } = await supabaseClient.from('questions').select('*').eq('quiz_id', quizId).order('created_at', { ascending: true });
    const listContainer = document.getElementById('addedQuestionsList');
    const countDisplay = document.getElementById('questionCount');
    
    if (!listContainer) return;

    if (!data || data.length === 0) {
        if(countDisplay) countDisplay.innerText = "0";
        listContainer.innerHTML = '<div class="text-center py-20 text-gray-300 font-bold italic">Henüz hiç soru eklenmemiş kanka. Sol taraftan başla!</div>';
        return;
    }

    if(countDisplay) countDisplay.innerText = data.length;
    listContainer.innerHTML = '';

    data.forEach((q, index) => {
        listContainer.innerHTML += `
            <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-indigo-200 transition">
                <div class="flex items-start">
                    <span class="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mr-3 mt-1">${index + 1}</span>
                    <div class="flex-1">
                        <p class="text-sm font-black text-gray-800 leading-tight mb-3">${q.question_text}</p>
                        <div class="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                            <span class="p-2 rounded-xl ${q.correct_option === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">A: ${q.option_a}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'B' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">B: ${q.option_b}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'C' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">C: ${q.option_c}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'D' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">D: ${q.option_d}</span>
                        </div>
                    </div>
                </div>
                <button onclick="deleteQuestion('${q.id}')" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-red-300 hover:text-red-500 text-2xl font-black">&times;</button>
            </div>`;
    });
}

const questionFormEl = document.getElementById('newQuestionForm');
if (questionFormEl) {
    questionFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = questionFormEl.querySelector('button[type="submit"]');
        btn.innerText = "🚀 Soru Kaydediliyor...";

        const { error } = await supabaseClient.from('questions').insert([{
            quiz_id: currentActiveQuizId,
            question_text: document.getElementById('qText').value,
            option_a: document.getElementById('optA').value,
            option_b: document.getElementById('optB').value,
            option_c: document.getElementById('optC').value,
            option_d: document.getElementById('optD').value,
            correct_option: document.getElementById('correctOpt').value
        }]);

        if (error) showToast("Soru kaydedilirken hata: " + error.message, "error");
        else {
            showToast("Soru başarıyla eklendi!", "success");
            questionFormEl.reset();
            fetchQuestionsForQuiz(currentActiveQuizId);
        }
        btn.innerText = "SORUYU KAYDET";
    });
}

window.deleteQuestion = async (id) => {
    const onay = await customConfirm("Kanka bu soruyu sileyim mi?");
    if (!onay) return;
    
    await supabaseClient.from('questions').delete().eq('id', id);
    showToast("Soru silindi.", "success");
    fetchQuestionsForQuiz(currentActiveQuizId);
};

async function fetchQuizzes() {
    const { data, error } = await supabaseClient.from('quizzes').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('quizList');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="col-span-full bg-white p-20 rounded-[50px] text-center text-gray-400 font-bold italic border-2 border-dashed border-gray-100">Henüz hiç sınav hazırlamamışsın.</div>`;
        return;
    }

    container.innerHTML = '';
    data.forEach(quiz => {
        container.innerHTML += `
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-red-200 transition flex justify-between items-center group">
                <div class="flex-1 mr-4 overflow-hidden">
                    <h4 class="text-base font-black text-gray-800 group-hover:text-red-600 transition truncate">${quiz.title}</h4>
                    <p class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Yayın Aktif</p>
                </div>
                <div class="flex space-x-2 shrink-0">
                    <button onclick="openQuestionEditor('${quiz.id}', '${quiz.title.replace(/'/g, "\\'")}')" class="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-sm">YÖNET</button>
                    <button onclick="deleteQuiz('${quiz.id}')" class="bg-gray-50 text-gray-300 hover:text-red-500 p-2 rounded-xl transition text-lg">🗑️</button>
                </div>
            </div>`;
    });
}

window.deleteQuiz = async (id) => {
    const onay = await customConfirm("Bu sınavı ve içindeki TÜM soruları siliyorum, emin misin?");
    if (!onay) return;
    
    await supabaseClient.from('quizzes').delete().eq('id', id);
    showToast("Sınav tamamen silindi.", "success");
    fetchQuizzes();
};

// ==========================================
// 7. SONUÇLAR VE ÖĞRETMEN ANALİZ MOTORU
// ==========================================
let currentResultsData = {}; 

async function fetchResults() {
    const { data, error } = await supabaseClient
        .from('quiz_results')
        .select(`*, profiles ( full_name ), quizzes ( title )`)
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('resultsList');
    if (!tbody || error) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-gray-400 italic font-bold">Henüz hiç sınav çözen öğrenci yok.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    currentResultsData = {}; 

    data.forEach(res => {
        currentResultsData[res.id] = res;
        const dateObj = new Date(res.created_at);
        const date = dateObj.toLocaleDateString('tr-TR') + ' ' + dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
        
        let scoreColor = 'text-green-600 bg-green-50 border-green-100';
        if (res.score < 50) scoreColor = 'text-red-600 bg-red-50 border-red-100';
        else if (res.score < 80) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-100';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-blue-50/30 transition text-sm">
                <td class="p-4 font-black text-gray-800">${res.profiles ? res.profiles.full_name : 'Bilinmeyen Öğrenci'}</td>
                <td class="p-4 text-gray-600 font-bold">${res.quizzes ? res.quizzes.title : 'Silinmiş Sınav'}</td>
                <td class="p-4 text-center"><span class="px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider border ${scoreColor}">${res.score} PUAN</span></td>
                <td class="p-4 text-gray-400 text-xs font-bold">${date}</td>
                <td class="p-4 text-right flex items-center justify-end space-x-2">
                    <button onclick="openTeacherAnalysis('${res.id}')" class="bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition">GÖZ AT</button>
                    <button onclick="deleteResult('${res.id}')" class="text-gray-300 hover:text-red-500 p-2 rounded-xl text-xl transition" title="Sonucu Sil">🗑️</button>
                </td>
            </tr>`;
    });
}

window.deleteResult = async function(id) {
    const onay = await customConfirm("Bu öğrencinin sınav sonucunu kalıcı olarak siliyorum, emin misin?");
    if (!onay) return;
    
    const { error } = await supabaseClient.from('quiz_results').delete().eq('id', id);
    if (error) showToast("Silerken hata oldu: " + error.message, "error"); 
    else { showToast("Sonuç başarıyla silindi.", "success"); fetchResults(); }
};

window.openTeacherAnalysis = function(resultId) {
    const res = currentResultsData[resultId];
    if(!res) return;

    const taStud = document.getElementById('taStudentName');
    const taQuiz = document.getElementById('taQuizTitle');
    const taScore = document.getElementById('taScoreDisplay');
    const taCont = document.getElementById('taDetailsContainer');
    const taModal = document.getElementById('teacherAnalysisModal');

    if(taStud) taStud.innerText = res.profiles?.full_name || 'Bilinmeyen Öğrenci';
    if(taQuiz) taQuiz.innerText = res.quizzes?.title || 'Silinmiş Sınav';
    if(taScore) taScore.innerText = res.score;

    if(taCont) {
        taCont.innerHTML = '';
        const details = res.details || [];
        if(details.length === 0) {
            taCont.innerHTML = '<p class="text-center text-gray-400 font-bold mt-10">Bu sınav için detaylı analiz bulunmuyor. (Öğrenci eski sürümde çözmüş).</p>';
        } else {
            details.forEach(detail => {
                const boxStyle = detail.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50';
                const iconInfo = detail.is_correct ? '✓' : '✗';
                taCont.innerHTML += `
                    <div class="p-6 rounded-[30px] border-2 mb-6 ${boxStyle} shadow-sm">
                        <div class="flex items-start gap-4 mb-4">
                            <span class="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">${iconInfo}</span>
                            <h4 class="text-lg font-black text-gray-800 pt-1">${detail.q_no}. ${detail.q_text}</h4>
                        </div>
                        <div class="pl-12 text-sm font-bold text-gray-500">
                            Cevabı: ${detail.selected_opt} | Doğru: ${detail.correct_opt}
                        </div>
                    </div>`;
            });
        }
    }
    if(taModal) taModal.classList.remove('hidden');
}

window.closeTeacherAnalysisModal = function() {
    const taModal = document.getElementById('teacherAnalysisModal');
    if (taModal) taModal.classList.add('hidden');
}

// ==========================================
// 8. BAŞLANGIÇ ÇALIŞTIRMALARI
// ==========================================
switchTab('dashboard');
