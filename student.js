// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = ‘https://vucpxabicxqfmmmqvkpv.supabase.co’;
const supabaseKey = ‘eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk’;
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let currentStudentId = null;
let currentQuizQuestions = [];
let activeTakingQuizId = null;
let quizTimerInterval = null;

document.querySelector(‘main’)?.addEventListener(‘touchstart’, function() {}, {passive: true});

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
// ==========================================
function showToast(message, type = ‘success’) {
const container = document.getElementById(‘toast-container’);
if(!container) return;
const toast = document.createElement(‘div’);
const bgColor = type === ‘success’ ? ‘bg-emerald-500’ : (type === ‘error’ ? ‘bg-rose-500’ : ‘bg-indigo-500’);

```
const iconSvg = type === 'success' 
    ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` 
    : (type === 'error' 
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` 
        : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);

toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-${bgColor}/30 font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;
toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span>${message}</span>`;
container.appendChild(toast);

setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300); 
}, 3000);
```

}

function customConfirm(message, btnText = “Evet, Onayla”) {
return new Promise((resolve) => {
const modal = document.getElementById(‘customConfirmModal’);
const box = document.getElementById(‘customConfirmBox’);
const btnOk = document.getElementById(‘customConfirmOk’);
const btnCancel = document.getElementById(‘customConfirmCancel’);

```
    if(!modal) { resolve(confirm(message)); return; }

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
```

}

// ==========================================
// ÇIKIŞ MOTORU VE MENÜ
// ==========================================
document.addEventListener(‘click’, async (e) => {
if (e.target.closest(’#studentLogoutBtn’)) {
const onay = await customConfirm(“Oturumunu kapatmak istediğine emin misin?”, “Evet, Çıkış Yap”);
if(!onay) return;
const { error } = await supabaseClient.auth.signOut();
if (!error) window.location.href = ‘index.html’;
else showToast(“Çıkış yapılamadı!”, “error”);
}
});

const sidebarMain = document.getElementById(‘mainSidebar’);
const sideOverlay = document.getElementById(‘sidebarOverlay’);
const sideOpenBtn = document.getElementById(‘openSidebarBtn’);
const sideCloseBtn = document.getElementById(‘closeSidebarBtn’);

function toggleMobileSidebar() {
if(sidebarMain) sidebarMain.classList.toggle(’-translate-x-full’);
if(sideOverlay) sideOverlay.classList.toggle(‘hidden’);
}

if(sideOpenBtn) sideOpenBtn.addEventListener(‘click’, toggleMobileSidebar);
if(sideCloseBtn) sideCloseBtn.addEventListener(‘click’, toggleMobileSidebar);
if(sideOverlay) sideOverlay.addEventListener(‘click’, toggleMobileSidebar);

// ==========================================
// TEMA MOTORU
// ==========================================
const dmToggleBtn = document.getElementById(‘darkModeToggle’);
const htmlElement = document.documentElement;
const iconMoon = document.getElementById(‘icon-moon’);
const iconSun = document.getElementById(‘icon-sun’);

if (localStorage.getItem(‘studentTheme’) === ‘dark’ || (!(‘studentTheme’ in localStorage) && window.matchMedia(’(prefers-color-scheme: dark)’).matches)) {
htmlElement.classList.add(‘dark’);
if (iconMoon) iconMoon.classList.add(‘hidden’);
if (iconSun) iconSun.classList.remove(‘hidden’);
}

if (dmToggleBtn) {
dmToggleBtn.addEventListener(‘click’, () => {
htmlElement.classList.toggle(‘dark’);
if (htmlElement.classList.contains(‘dark’)) {
localStorage.setItem(‘studentTheme’, ‘dark’);
if (iconMoon) iconMoon.classList.add(‘hidden’);
if (iconSun) iconSun.classList.remove(‘hidden’);
showToast(“Gece Modu Aktif”, “success”);
} else {
localStorage.setItem(‘studentTheme’, ‘light’);
if (iconMoon) iconMoon.classList.remove(‘hidden’);
if (iconSun) iconSun.classList.add(‘hidden’);
showToast(“Gündüz Modu Aktif”, “success”);
}
});
}

// ==========================================
// AKORDEON (AÇILIR) MENÜ MOTORU
// ==========================================
window.toggleSubMenu = function(menuId, iconId) {
const el = document.getElementById(menuId);
const icon = document.getElementById(iconId);
if(el.classList.contains(‘hidden’)) {
el.classList.remove(‘hidden’);
el.classList.add(‘flex’);
if(icon) icon.classList.add(‘rotate-180’);
} else {
el.classList.add(‘hidden’);
el.classList.remove(‘flex’);
if(icon) icon.classList.remove(‘rotate-180’);
}
}

// ==========================================
// 2. OTURUM KONTROLÜ VE SPLASH EKRANI KAPATMA
// ==========================================
async function initStudentPortal() {
const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
if (authError || !user) { window.location.href = ‘index.html’; return; }

```
currentStudentId = user.id;

const { data: profile } = await supabaseClient.from('profiles').select('full_name, xp').eq('id', currentStudentId).single();
if (profile) { 
    const nameEl = document.getElementById('studentNameDisplay');
    if(nameEl) nameEl.innerText = profile.full_name; 
    
    const welcomeEl = document.getElementById('welcomeStudentName');
    if(welcomeEl) {
        const firstName = profile.full_name.split(' ')[0]; 
        welcomeEl.innerText = firstName;
    }

    const currentXp = profile.xp || 0;
    const currentLevel = Math.floor(currentXp / 500) + 1;
    
    const elXp = document.getElementById('studentXpText');
    const elLevel = document.getElementById('studentLevelText');
    
    if(elXp) elXp.innerText = currentXp;
    if(elLevel) elLevel.innerText = currentLevel;
}

switchTab('homeworks');

setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if(splash) {
        splash.classList.add('opacity-0');
        setTimeout(() => splash.classList.add('hidden'), 700);
    }
}, 400);
```

}

// ==========================================
// 3. SEKMELER ARASI GEÇİŞ
// ==========================================
function switchTab(target) {
if(window.innerWidth < 768 && sidebarMain && !sidebarMain.classList.contains(’-translate-x-full’)) {
toggleMobileSidebar();
}

```
const sections = ['section-homeworks', 'section-activities', 'section-quizzes', 'section-results'];
sections.forEach(sec => {
    const el = document.getElementById(sec);
    if(el) el.classList.add('hidden');
});

const activeBtns = document.querySelectorAll('.menu-btn');
activeBtns.forEach(btn => {
    btn.classList.remove('bg-indigo-800', 'shadow-inner', 'text-white');
    if(btn.id !== 'btn-homeworks') btn.classList.add('text-indigo-300');
});

const targetSec = document.getElementById(`section-${target}`);
const targetBtn = document.getElementById(`btn-${target}`);

if(targetSec) targetSec.classList.remove('hidden');
if(targetBtn) {
    if(targetBtn.id === 'btn-homeworks') {
        targetBtn.classList.add('bg-indigo-800', 'shadow-inner');
    } else {
        targetBtn.classList.remove('text-indigo-300');
        targetBtn.classList.add('text-white');
    }
}

if (target === 'homeworks') fetchMyHomeworks();
if (target === 'activities') fetchActivities();
if (target === 'quizzes') fetchQuizzes();
if (target === 'results') fetchMyResults();
```

}

document.getElementById(‘btn-homeworks’)?.addEventListener(‘click’, (e) => { e.preventDefault(); switchTab(‘homeworks’); });
document.getElementById(‘btn-quizzes’)?.addEventListener(‘click’, (e) => { e.preventDefault(); switchTab(‘quizzes’); });
document.getElementById(‘btn-results’)?.addEventListener(‘click’, (e) => { e.preventDefault(); switchTab(‘results’); });

// ==========================================
// 4. ÖDEVLER
// ==========================================
async function fetchMyHomeworks() {
const { data } = await supabaseClient.from(‘homeworks’).select(’*’).eq(‘student_id’, currentStudentId).order(‘due_date’, { ascending: true });
const container = document.getElementById(‘myHomeworksList’);
if (!container) return;

```
if (!data || data.length === 0) { 
    container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Bekleyen veya teslim edilen ödevin yok.</div>'; 
    return; 
}

let newHwHtml = '';
let doneHwHtml = '';

data.forEach(hw => {
    const dueDate = new Date(hw.due_date).toLocaleDateString('tr-TR');
    const isCompleted = hw.status === 'Tamamlandı';
    
    let cardTitle = hw.title;
    let isFlashcard = false;
    let flashcardDataStr = "[]";
    
    if (hw.title.includes('[KELİME_KARTI]')) {
        isFlashcard = true;
        cardTitle = hw.title.replace('[KELİME_KARTI]', '🚀 Telaffuz Görevi:');
        flashcardDataStr = hw.description.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    }

    const card = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all flex flex-col h-full relative overflow-hidden group">
            ${isCompleted ? '<div class="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>' : (isFlashcard ? '<div class="absolute top-0 left-0 w-full h-1.5 bg-purple-500"></div>' : '<div class="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>')}
            
            <h4 class="text-base font-black ${isFlashcard ? 'text-purple-600 dark:text-purple-400' : 'text-gray-800 dark:text-white'} mb-2 mt-1 line-clamp-2 leading-tight">${cardTitle}</h4>
            
            ${isFlashcard 
                ? `<p class="text-gray-500 dark:text-gray-400 text-xs mb-5 flex-1 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl font-medium border border-purple-100 dark:border-purple-800/50">Yapay zeka ile üretilmiş ${isCompleted ? 'tamamlanmış' : 'yeni'} kelime telaffuz görevi.</p>` 
                : `<p class="text-gray-500 dark:text-gray-400 text-xs mb-5 flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl leading-relaxed font-medium border border-gray-100 dark:border-slate-700/50">${hw.description}</p>`
            }

            <div class="flex justify-between items-center mt-auto border-t border-gray-50 dark:border-slate-700 pt-4">
                <span class="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-600"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Son: ${dueDate}</span>
                
                ${isCompleted 
                    ? '<span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ONAYLANDI</span>' 
                    : (isFlashcard 
                        ? `<button onclick="startFlashcardTask('${hw.id}', '${flashcardDataStr}', '${hw.title.replace(/'/g, "\\'")}')" class="text-[10px] font-black text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 px-4 py-2 rounded-lg shadow-md transform active:scale-95 transition flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> BAŞLA</button>`
                        : '<span class="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> BEKLİYOR</span>'
                    )
                }
            </div>
        </div>`;

    if(isCompleted) doneHwHtml += card;
    else newHwHtml += card;
});

container.innerHTML = `
    <div class="col-span-full mb-1"><h4 class="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2"><svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Yeni / Bekleyen Ödevler</h4></div>
    ${newHwHtml || '<div class="col-span-full text-sm text-gray-400 italic mb-6">Bekleyen ödevin yok, harikasın!</div>'}
    
    <div class="col-span-full mt-8 mb-1"><h4 class="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Onaylananlar</h4></div>
    ${doneHwHtml || '<div class="col-span-full text-sm text-gray-400 italic">Henüz onaylanan ödevin yok.</div>'}
`;
```

}

// ==========================================
// 5. ETKİNLİKLER VE SOL MENÜ FİLTRELEME
// ==========================================
let currentActivityFilter = ‘all’;

async function fetchActivities() {
const { data } = await supabaseClient.from(‘activities’).select(’*’).order(‘created_at’, { ascending: false });
const container = document.getElementById(‘myActivitiesList’);
if (!container) return;

```
if (!data || data.length === 0) { 
    container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Etkinlik bulunmuyor.</div>'; 
    return; 
}

container.innerHTML = ''; 
const icons = { 
    video: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', 
    game: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', 
    pdf: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>' 
};

data.forEach(act => {
    const displayStyle = (currentActivityFilter === 'all' || act.category === currentActivityFilter) ? 'flex' : 'none';

    container.innerHTML += `
        <div class="activity-card bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-800 transition flex flex-col h-full group" data-category="${act.category}" style="display: ${displayStyle};">
            <div class="flex items-center gap-4 mb-5">
                <div class="bg-purple-50 dark:bg-purple-900/30 p-3.5 rounded-2xl text-2xl border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400 shadow-inner group-hover:scale-110 transition transform">
                    ${icons[act.category] || '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>'}
                </div>
                <h4 class="text-sm md:text-base font-black text-gray-800 dark:text-white flex-1 line-clamp-2 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">${act.title}</h4>
            </div>
            <a href="${act.link}" target="_blank" class="mt-auto w-full bg-slate-50 dark:bg-slate-900 hover:bg-purple-600 text-gray-500 hover:text-white border border-gray-200 dark:border-slate-700 hover:border-purple-600 transition font-black py-3 rounded-xl text-center text-xs tracking-widest uppercase shadow-sm flex justify-center items-center gap-2">
                AÇ VE İNCELE <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
        </div>`;
});
```

}

document.querySelectorAll(’.sidebar-filter-btn’).forEach(btn => {
btn.addEventListener(‘click’, (e) => {
e.preventDefault();

```
    document.querySelectorAll('.sidebar-filter-btn').forEach(b => {
        b.classList.remove('text-white');
        b.classList.add('text-indigo-300');
    });
    e.currentTarget.classList.remove('text-indigo-300');
    e.currentTarget.classList.add('text-white');

    currentActivityFilter = e.currentTarget.getAttribute('data-filter');

    const actSection = document.getElementById('section-activities');
    if (actSection && actSection.classList.contains('hidden')) {
        switchTab('activities'); 
    } else {
        document.querySelectorAll('.activity-card').forEach(card => {
            card.style.display = (currentActivityFilter === 'all' || card.getAttribute('data-category') === currentActivityFilter) ? 'flex' : 'none';
        });
    }

    if(window.innerWidth < 768 && sidebarMain && !sidebarMain.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }
});
```

});

// ==========================================
// 6. SINAV MOTORU VE SONUÇLAR
// ==========================================
async function fetchQuizzes() {
const { data } = await supabaseClient.from(‘quizzes’).select(’*’).order(‘created_at’, { ascending: false });
const container = document.getElementById(‘myQuizzesList’);
if (!container) return;

```
if (!data || data.length === 0) { 
    container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Çözülecek sınav bulunmuyor.</div>'; 
    return; 
}

container.innerHTML = '';
data.forEach(quiz => {
    container.innerHTML += `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-red-300 dark:hover:border-red-800 transition flex flex-col h-full group">
            <div class="flex items-center gap-4 mb-5">
                <div class="bg-red-50 dark:bg-red-900/30 p-3.5 rounded-2xl border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 shadow-inner group-hover:scale-110 transition transform">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                </div>
                <h4 class="text-sm md:text-base font-black text-gray-800 dark:text-white flex-1 line-clamp-2 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition">${quiz.title}</h4>
            </div>
            <button onclick="startQuiz('${quiz.id}', '${quiz.title.replace(/'/g, "\\'")}')" class="mt-auto w-full bg-slate-50 dark:bg-slate-900 hover:bg-red-500 text-gray-500 hover:text-white border border-gray-200 dark:border-slate-700 hover:border-red-500 transition font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-sm">SINAVA BAŞLA</button>
        </div>`;
});
```

}

async function fetchMyResults() {
const { data } = await supabaseClient.from(‘quiz_results’).select(’*, quizzes(title)’).eq(‘student_id’, currentStudentId).order(‘created_at’, { ascending: false });
const container = document.getElementById(‘myResultsList’);
if(!container) return;

```
if(!data || data.length === 0){
    container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Henüz çözdüğün bir sınav yok.</div>'; 
    return;
}

container.innerHTML = '';
data.forEach(res => {
    const dateObj = new Date(res.created_at);
    const dateStr = dateObj.toLocaleDateString('tr-TR');
    
    let scoreColor = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    if (res.score < 50) scoreColor = 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    else if (res.score < 80) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';

    container.innerHTML += `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition flex flex-col justify-between">
            <div class="flex justify-between items-start mb-4">
                <h4 class="text-sm font-black text-gray-800 dark:text-white line-clamp-2 pr-2">${res.quizzes ? res.quizzes.title : 'Silinmiş Sınav'}</h4>
                <span class="px-3 py-1 rounded-xl font-black text-lg border ${scoreColor} shrink-0">${res.score}</span>
            </div>
            <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <span class="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    ${dateStr}
                </span>
                <button onclick='renderAnalysisScreen(${JSON.stringify(res.details).replace(/'/g, "&#39;")}, ${res.score})' class="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition">İncele ↗</button>
            </div>
        </div>`;
});
```

}

window.startQuiz = async function(quizId, quizTitle) {
activeTakingQuizId = quizId;
document.getElementById(‘takingQuizTitle’).innerText = quizTitle;
const container = document.getElementById(‘questionsContainer’);
const timerContainer = document.getElementById(‘quizTimerContainer’);
const timerDisplay = document.getElementById(‘quizTimerDisplay’);

```
if(quizTimerInterval) clearInterval(quizTimerInterval);
if(timerContainer) timerContainer.classList.add('hidden');

container.innerHTML = '<p class="text-center text-gray-400 font-medium text-sm py-10 animate-pulse">Sınav Yükleniyor...</p>';
document.getElementById('quizTakingModal').classList.remove('hidden');

const { data: quizInfo } = await supabaseClient.from('quizzes').select('time_limit').eq('id', quizId).single();
const { data: questions, error } = await supabaseClient.from('questions').select('*').eq('quiz_id', quizId).order('created_at', { ascending: true });

if (error || !questions || questions.length === 0) {
    container.innerHTML = '<p class="text-center text-red-500 font-bold text-sm py-10">Öğretmeniniz bu sınava henüz soru eklememiş.</p>';
    return;
}

currentQuizQuestions = questions; 
container.innerHTML = '';

questions.forEach((q, index) => {
    container.innerHTML += `
        <div class="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[30px] border border-gray-100 dark:border-slate-700 shadow-sm question-block" data-question-id="${q.id}" data-correct="${q.correct_option}">
            <h4 class="text-base md:text-lg font-black text-gray-800 dark:text-white mb-6 leading-relaxed"><span class="text-indigo-500 mr-2">${index + 1}.</span> ${q.question_text}</h4>
            <div class="space-y-3">
                <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                    <input type="radio" name="q_${q.id}" value="A" class="w-5 h-5 text-indigo-600 mr-4" required>
                    <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">A) ${q.option_a}</span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                    <input type="radio" name="q_${q.id}" value="B" class="w-5 h-5 text-indigo-600 mr-4" required>
                    <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">B) ${q.option_b}</span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                    <input type="radio" name="q_${q.id}" value="C" class="w-5 h-5 text-indigo-600 mr-4" required>
                    <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">C) ${q.option_c}</span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                    <input type="radio" name="q_${q.id}" value="D" class="w-5 h-5 text-indigo-600 mr-4" required>
                    <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">D) ${q.option_d}</span>
                </label>
            </div>
        </div>`;
});

if (quizInfo && quizInfo.time_limit > 0 && timerContainer) {
    let timeLeft = quizInfo.time_limit * 60; 
    timerContainer.classList.remove('hidden');
    
    quizTimerInterval = setInterval(() => {
        let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        let s = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `${m}:${s}`;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimerInterval);
            showToast("SÜRE DOLDU! Sınav otomatik olarak gönderiliyor...", "error");
            document.getElementById('quizForm').dispatchEvent(new Event('submit')); 
        }
        timeLeft--;
    }, 1000);
}
```

};

window.closeQuizModal = async function() {
const onay = await customConfirm(“Sınavdan çıkarsan verilerin kaydedilmez. Emin misin?”, “Evet, Çık”);
if(onay) {
if(quizTimerInterval) clearInterval(quizTimerInterval);
document.getElementById(‘quizTakingModal’).classList.add(‘hidden’);
}
}

const quizFormEl = document.getElementById(‘quizForm’);
if(quizFormEl) {
quizFormEl.addEventListener(‘submit’, async (e) => {
e.preventDefault();
if(quizTimerInterval) clearInterval(quizTimerInterval);

```
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

    if (error) { 
        showToast("Hata oluştu: " + error.message, "error"); 
        return; 
    }

    const { data: prof } = await supabaseClient.from('profiles').select('xp').eq('id', currentStudentId).single();
    const newXp = (prof.xp || 0) + score;
    await supabaseClient.from('profiles').update({ xp: newXp }).eq('id', currentStudentId);

    showToast(`Tebrikler! ${score} Puan ve +${score} XP kazandın!`, "success");
    
    document.getElementById('quizTakingModal').classList.add('hidden');
    window.renderAnalysisScreen(examDetails, score);
    initStudentPortal(); 
});
```

}

window.renderAnalysisScreen = function(details, score) {
document.getElementById(‘analysisScoreDisplay’).innerText = score;
const container = document.getElementById(‘analysisDetailsContainer’);
container.innerHTML = ‘’;

```
details.forEach(detail => {
    const boxStyle = detail.is_correct ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800' : 'border-rose-300 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800';
    const iconInfo = detail.is_correct ? '<span class="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></span>' : '<span class="bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></span>';
    
    container.innerHTML += `
        <div class="p-6 rounded-[20px] border-2 mb-6 ${boxStyle} shadow-sm">
            <div class="flex items-start gap-4 mb-4">
                <span class="shrink-0">${iconInfo}</span>
                <h4 class="text-sm md:text-base font-black text-gray-800 dark:text-white pt-1"><span class="text-gray-400 mr-1">${detail.q_no}.</span> ${detail.q_text}</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12 text-sm font-bold">
                <div class="p-3 rounded-xl ${detail.correct_opt === 'A' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">A) ${detail.optA}</div>
                <div class="p-3 rounded-xl ${detail.correct_opt === 'B' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">B) ${detail.optB}</div>
                <div class="p-3 rounded-xl ${detail.correct_opt === 'C' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">C) ${detail.optC}</div>
                <div class="p-3 rounded-xl ${detail.correct_opt === 'D' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">D) ${detail.optD}</div>
            </div>
            ${!detail.is_correct ? `<div class="mt-4 pl-12 flex flex-col sm:flex-row gap-3"><span class="inline-block bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Senin Cevabın: ${detail.selected_opt}</span><span class="inline-block bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Doğru Cevap: ${detail.correct_opt}</span></div>` : ''}
        </div>`;
});
document.getElementById('analysisModal').classList.remove('hidden');
```

}

window.closeAnalysisModal = function() {
document.getElementById(‘analysisModal’).classList.add(‘hidden’);
switchTab(‘quizzes’);
}

// ==========================================
// 7. 3D KELİME KARTI VE TELAFFUZ MOTORU
// ==========================================
let currentFcWords = [];
let currentFcIndex = 0;
let currentFcTaskId = null;
let isCardFlipped = false;

window.startFlashcardTask = function(taskId, dataStr, title) {
currentFcTaskId = taskId;

```
const rawData = dataStr.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
try {
    currentFcWords = JSON.parse(rawData);
} catch(e) {
    showToast("Kelime verisi okunamadı!", "error");
    return;
}

if(currentFcWords.length === 0) return;

currentFcIndex = 0;
document.getElementById('fcModalTitle').innerText = title.replace('[KELİME_KARTI]', '').trim();
document.getElementById('flashcardModal').classList.remove('hidden');

updateFlashcardUI();
```

}

window.closeFlashcardModal = function() {
document.getElementById(‘flashcardModal’).classList.add(‘hidden’);
}

window.flipCard = function() {
const card = document.getElementById(‘fcInner’);
isCardFlipped = !isCardFlipped;
if (isCardFlipped) {
card.classList.add(‘rotate-y-180’);
} else {
card.classList.remove(‘rotate-y-180’);
}
}

function updateFlashcardUI() {
const word = currentFcWords[currentFcIndex];

```
// Türkçe (ön yüz)
document.getElementById('fcWordTr').innerText = word.tr;

// İngilizce (arka yüz)
document.getElementById('fcWordEn').innerText = word.en;

// 🆕 FONETİK YAZILIŞI GÜNCELLE
const phEl = document.getElementById('fcWordPh');
if (phEl) {
    phEl.innerText = word.ph ? `/${word.ph}/` : '';
    phEl.style.display = word.ph ? 'block' : 'none';
}

document.getElementById('fcProgress').innerText = `Kelime ${currentFcIndex + 1} / ${currentFcWords.length}`;

// Kartı ön yüze çevir
isCardFlipped = false;
document.getElementById('fcInner').classList.remove('rotate-y-180');

// Mikrofon durumunu sıfırla
const micStatus = document.getElementById('micStatus');
const micIcon = document.getElementById('micIcon');
const ripple = document.getElementById('micRipple');
if (micStatus) {
    micStatus.innerText = "Mikrofona Dokun ve Oku";
    micStatus.className = "text-xs text-indigo-100 font-bold uppercase tracking-widest mt-4";
}
if (micIcon) micIcon.className = "w-10 h-10 text-purple-600 transition-colors";
if (ripple) ripple.classList.remove('animate-ping', 'opacity-100');

// Son kelimedeyse bitir butonunu göster
if (currentFcIndex === currentFcWords.length - 1) {
    document.getElementById('btnFinishFlashcard').classList.remove('hidden');
} else {
    document.getElementById('btnFinishFlashcard').classList.add('hidden');
}
```

}

window.nextCard = function() {
if (currentFcIndex < currentFcWords.length - 1) {
currentFcIndex++;
updateFlashcardUI();
}
}

window.prevCard = function() {
if (currentFcIndex > 0) {
currentFcIndex–;
updateFlashcardUI();
}
}

// ==========================================
// 🔧 TELAFFUZ MOTORU — TAM DÜZELTME
// Ana sorun: onspeechend → stop() çağırıyordu ama onresult henüz tetiklenmemişti.
// Çözüm: onspeechend kaldırıldı. onend + resultReceived flag sistemi kuruldu.
// ==========================================
window.startListening = function() {
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
showToast(“Tarayıcınız ses tanımayı desteklemiyor.”, “error”);
return;
}

```
const targetWordOriginal = currentFcWords[currentFcIndex].en;
// Çok kelimeli ifadelerin sadece ilk kelimesini al (örn: "run away" → "run")
const targetWord = targetWordOriginal.toLowerCase().split(' ')[0].replace(/[^\w]/gi, '').trim();
const targetWordFull = targetWordOriginal.toLowerCase().replace(/[^\w\s]/gi, '').trim();

const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 5; // Daha fazla alternatif = daha yüksek doğruluk
recognition.continuous = false;

const micStatus = document.getElementById('micStatus');
const micIcon = document.getElementById('micIcon');
const ripple = document.getElementById('micRipple');

// Dinleme başladı — UI güncelle
micStatus.innerText = "Sizi dinliyor... Konuşun 🎤";
micStatus.className = "text-xs text-white font-bold uppercase tracking-widest mt-4 animate-pulse";
micIcon.className = "w-10 h-10 text-rose-400 animate-pulse transition-colors";
ripple.classList.add('animate-ping', 'opacity-100');

// Sonuç geldi mi? Bu flag olmadan onend yanlış "ses alınamadı" verebiliyordu
let resultReceived = false;

function resetMicUI(msg, isError = true) {
    micStatus.innerText = msg;
    micStatus.className = `text-xs font-bold uppercase tracking-widest mt-4 ${isError ? 'text-rose-300' : 'text-emerald-300'}`;
    micIcon.className = "w-10 h-10 text-purple-600 transition-colors";
    ripple.classList.remove('animate-ping', 'opacity-100');
}

// ✅ SONUÇ GELDİ
recognition.onresult = function(event) {
    resultReceived = true;

    // Tüm alternatifleri topla
    let spokenWords = [];
    for(let i = 0; i < event.results[0].length; i++) {
        const cleaned = event.results[0][i].transcript
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .trim();
        spokenWords.push(cleaned);
    }

    // Eşleşme kontrolü — hem tam kelime hem de ilk kelime kontrolü
    let isMatch = false;
    spokenWords.forEach(spoken => {
        // Tam eşleşme
        if (spoken === targetWordFull) isMatch = true;
        // İlk kelime eşleşmesi
        if (spoken === targetWord) isMatch = true;
        // Kelime içerme (kısa kelimelerde yanıltabilir, ama genel olarak iyi)
        if (spoken.includes(targetWord) && targetWord.length > 2) isMatch = true;
        if (targetWord.includes(spoken) && spoken.length > 2) isMatch = true;

        // Sesteş kelimeler (Homophones) listesi
        const homophones = {
            'red': ['read'], 'read': ['red'],
            'two': ['to', 'too'], 'to': ['two', 'too'], 'too': ['to', 'two'],
            'write': ['right'], 'right': ['write'],
            'eight': ['ate'], 'ate': ['eight'],
            'buy': ['by', 'bye'], 'by': ['buy', 'bye'], 'bye': ['buy', 'by'],
            'see': ['sea'], 'sea': ['see'],
            'know': ['no'], 'no': ['know'],
            'hear': ['here'], 'here': ['hear'],
            'their': ['there', 'theyre'], 'there': ['their'],
            'one': ['won'], 'won': ['one'],
            'sun': ['son'], 'son': ['sun'],
            'meet': ['meat'], 'meat': ['meet'],
            'week': ['weak'], 'weak': ['week'],
            'flower': ['flour'], 'flour': ['flower'],
            'whole': ['hole'], 'hole': ['whole'],
            'bare': ['bear'], 'bear': ['bare'],
            'pair': ['pear', 'pare'], 'pear': ['pair'],
            'peace': ['piece'], 'piece': ['peace'],
            'rain': ['reign', 'rein'], 'reign': ['rain'],
            'blue': ['blew'], 'blew': ['blue'],
            'for': ['four', 'fore'], 'four': ['for'],
            'hair': ['hare'], 'hare': ['hair'],
            'knight': ['night'], 'night': ['knight'],
            'knot': ['not'], 'not': ['knot'],
            'know': ['no'], 'no': ['know'],
            'new': ['knew'], 'knew': ['new'],
            'our': ['hour'], 'hour': ['our'],
            'plain': ['plane'], 'plane': ['plain'],
            'sale': ['sail'], 'sail': ['sale'],
            'some': ['sum'], 'sum': ['some'],
            'stair': ['stare'], 'stare': ['stair'],
            'steal': ['steel'], 'steel': ['steal'],
            'tale': ['tail'], 'tail': ['tale'],
            'waist': ['waste'], 'waste': ['waist'],
            'way': ['weigh'], 'weigh': ['way'],
            'wood': ['would'], 'would': ['wood'],
        };

        if (homophones[targetWord] && homophones[targetWord].includes(spoken)) isMatch = true;
    });

    if (isMatch) {
        // 🎉 DOĞRU!
        micStatus.innerText = "HARİKA! DOĞRU TELAFFUZ! 🎉";
        micStatus.className = "text-xs text-emerald-300 font-black uppercase tracking-widest mt-4";
        micIcon.className = "w-10 h-10 text-emerald-400 transition-colors";
        ripple.classList.remove('animate-ping', 'opacity-100');
        
        // Başarı sesi
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});

        // 1.5 saniye sonra otomatik ilerle
        setTimeout(() => {
            if (currentFcIndex < currentFcWords.length - 1) {
                nextCard();
            } else {
                micStatus.innerText = "TÜM KELİMELER TAMAM! 🏆";
                micStatus.className = "text-xs text-amber-400 font-black uppercase tracking-widest mt-4";
            }
        }, 1500);

    } else {
        // ❌ YANLIŞ
        const heard = spokenWords[0] || '?';
        resetMicUI(`Yanlış! "${heard}" duyduk. Tekrar dene.`);
        
        // Hata sesi
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }
};

// ✅ TANIMI KAPANDI (onresult sonrası veya hata olmadan)
// Bu event her zaman tetiklenir — onresult'tan SONRA da çalışır
recognition.onend = function() {
    // Eğer hiç sonuç gelmediyse kullanıcıya bildir
    if (!resultReceived) {
        resetMicUI("Ses alınamadı, tekrar dokuna bas.");
    }
    // Animasyonları her durumda durdur
    ripple.classList.remove('animate-ping', 'opacity-100');
};

// ✅ HATA
recognition.onerror = function(event) {
    resultReceived = true; // onend'in "ses alınamadı" göstermesini engelle

    if (event.error === 'no-speech') {
        resetMicUI("Ses algılanamadı. Biraz daha yüksek konuş.");
    } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        showToast("Mikrofon izni reddedildi! Tarayıcı ayarlarından izin ver.", "error");
        resetMicUI("Mikrofon izni yok.");
    } else if (event.error === 'network') {
        resetMicUI("Ağ hatası. İnternet bağlantını kontrol et.");
    } else {
        resetMicUI("Anlayamadım, tekrar dokun.");
    }
};

// Başlat
try {
    recognition.start();
} catch(e) {
    // Zaten çalışıyorsa (çift tıklama koruması)
    resetMicUI("Lütfen bekle ve tekrar dene.");
}
```

}

window.finishFlashcardTask = async function() {
const onay = await customConfirm(“Kelime pratiğini tamamladın mı?”, “Evet, Bitir”);
if (!onay) return;

```
showToast("Görev tamamlanıyor...", "info");

const { error } = await supabaseClient.from('homeworks').update({ status: 'Tamamlandı' }).eq('id', currentFcTaskId);
if (error) { showToast("Hata: " + error.message, "error"); return; }

const { data: prof } = await supabaseClient.from('profiles').select('xp').eq('id', currentStudentId).single();
if (prof) {
    const newXp = (prof.xp || 0) + 50;
    await supabaseClient.from('profiles').update({ xp: newXp }).eq('id', currentStudentId);
}

showToast("Tebrikler! +50 XP kazandın!", "success");
closeFlashcardModal();
initStudentPortal();
```

}

// Sistemi Başlat
initStudentPortal();