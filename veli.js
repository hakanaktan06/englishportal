// 1. SUPABASE BAĞLANTISI (Aynı Anahtar)
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// URL'den ID'yi al
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

// Theme Initialization
let themeIconDark, themeIconLight;

document.addEventListener('DOMContentLoaded', () => {
    themeIconDark = document.getElementById('themeIconDark');
    themeIconLight = document.getElementById('themeIconLight');

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(themeIconDark) themeIconDark.classList.remove('hidden');
        if(themeIconLight) themeIconLight.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if(themeIconLight) themeIconLight.classList.remove('hidden');
        if(themeIconDark) themeIconDark.classList.add('hidden');
    }
});

let veliChartInstance = null;

window.toggleTheme = function() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if(themeIconLight) themeIconLight.classList.remove('hidden');
        if(themeIconDark) themeIconDark.classList.add('hidden');
        updateChartTheme(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if(themeIconDark) themeIconDark.classList.remove('hidden');
        if(themeIconLight) themeIconLight.classList.add('hidden');
        updateChartTheme(true);
    }
}

function updateChartTheme(isDark) {
    if(!veliChartInstance) return;
    const textColor = isDark ? '#9ca3af' : '#4b5563'; // gray-400 / gray-600
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    veliChartInstance.options.scales.x.ticks.color = textColor;
    veliChartInstance.options.scales.x.grid.color = gridColor;
    veliChartInstance.options.scales.y.ticks.color = textColor;
    veliChartInstance.options.scales.y.grid.color = gridColor;
    veliChartInstance.update();
}

async function loadVeliPortal() {
    if (!studentId) { showError(); return; }

    // 1. Öğrenci Adını Çek
    const { data: profile, error: profErr } = await supabaseClient.from('profiles').select('full_name').eq('id', studentId).single();
    if (profErr || !profile) { showError(); return; }
    document.getElementById('veliStudentName').innerText = profile.full_name;

    // 2. Dersleri Çek ve Borcu Hesapla
    const { data: lessons } = await supabaseClient.from('private_lessons').select('*').eq('student_id', studentId).order('lesson_date', { ascending: false });
    const listEl = document.getElementById('veliLessonList');

    if (!lessons || lessons.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 italic">Henüz işlenmiş bir özel ders kaydı bulunmuyor.</p>';
    } else {
        let totalDebt = 0;
        lessons.forEach(l => {
            const date = new Date(l.lesson_date).toLocaleDateString('tr-TR');
            const time = l.lesson_time ? ` | ⏰ ${l.lesson_time}` : '';
            const duration = l.duration_hours ? ` | ⏳ ${l.duration_hours} Saat` : '';

            if (!l.is_paid) totalDebt += Number(l.price || 0);

            listEl.innerHTML += `
                <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <p class="text-[11px] font-black text-indigo-500 dark:text-indigo-400 tracking-wider">📅 ${date} ${time} ${duration}</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-gray-100 mt-1">${l.topic}</p>
                    </div>
                    ${l.price ? `<span class="text-xs font-black ${l.is_paid ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' : 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/30'} px-3 py-1.5 rounded-lg whitespace-nowrap">${l.price} TL - ${l.is_paid ? 'ÖDENDİ' : 'ÖDENMEDİ'}</span>` : ''}
                </div>`;
        });

        if (totalDebt > 0) {
            document.getElementById('veliDebtText').innerText = totalDebt + " TL";
            document.getElementById('veliDebtBadge').classList.remove('hidden');
        }
    }

    // 3. Sınavları Çek ve Grafiği Çiz
    const { data: results } = await supabaseClient.from('quiz_results').select('score, quizzes(title)').eq('student_id', studentId).order('created_at', { ascending: true });
    let labels = []; let scores = [];

    if (!results || results.length === 0) {
        labels = ['Sınav Yok']; scores = [0];
    } else {
        results.forEach(r => { labels.push(r.quizzes.title); scores.push(r.score); });
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    veliChartInstance = new Chart(document.getElementById('veliChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Puan',
                data: scores,
                borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3, tension: 0.4, fill: true,
                pointBackgroundColor: '#fff', pointBorderColor: '#4f46e5',
                pointBorderWidth: 2, pointRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 100,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Perdeyi Kaldır
    document.getElementById('loadingScreen').classList.add('opacity-0');
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }, 500);
}

function showError() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').classList.remove('hidden');
}

loadVeliPortal();
