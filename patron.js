// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM MOTORU
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-amber-500');
    
    const iconSvg = type === 'success' 
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` 
        : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;
    toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

// ==========================================
// GÜVENLİK (KAPI KONTROLÜ)
// ==========================================
async function checkGodSecurity() {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) { window.location.href = 'index.html'; return; } 
    
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'god') {
        window.location.href = 'index.html'; // Yetkisi olmayan direkt atılır
        return;
    }
    fetchSystemData();
}
checkGodSecurity();

document.getElementById('godLogoutBtn').addEventListener('click', async () => {
    if(confirm("God Panelden çıkış yapıyorsun. Emin misin?")) {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
});

// ==========================================
// SİSTEMİ TARAMA VE LİSTELEME
// ==========================================
async function fetchSystemData() {
    // Tüm Öğretmenleri Çek
    const { data: teachers, error: tErr } = await supabaseClient.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false });
    
    // Sistemdeki tüm öğrencileri çek (Öğretmenlerin istatistiklerini hesaplamak için)
    const { data: allStudents } = await supabaseClient.from('profiles').select('id, teacher_id').eq('role', 'student');

    const tbody = document.getElementById('teachersList');
    if(tErr || !teachers) { tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-rose-500">Veri çekilemedi!</td></tr>'; return; }

    document.getElementById('statTotalTeachers').innerText = teachers.length;
    document.getElementById('statTotalStudents').innerText = allStudents ? allStudents.length : 0;

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-slate-500 font-medium">Sistemde henüz kayıtlı öğretmen yok.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    teachers.forEach(teacher => {
        const regDate = new Date(teacher.created_at).toLocaleDateString('tr-TR');
        const studentCount = allStudents ? allStudents.filter(s => s.teacher_id === teacher.id).length : 0;
        
        const isPremium = teacher.is_premium;
        const statusBadge = isPremium 
            ? `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">PREMİUM</span>`
            : `<span class="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">FREEMIUM</span>`;

        const actionBtn = isPremium
            ? `<button onclick="togglePremium('${teacher.id}', false)" class="text-xs bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 px-4 py-2 rounded-xl font-bold transition">Yetkiyi Al</button>`
            : `<button onclick="togglePremium('${teacher.id}', true)" class="text-xs bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl font-black shadow-[0_0_15px_rgba(245,158,11,0.3)] transition transform active:scale-95 flex items-center gap-1 ml-auto">PREMİUM YAP <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></button>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/50 transition">
                <td class="p-4">
                    <p class="text-sm font-black text-white">${teacher.full_name}</p>
                </td>
                <td class="p-4 text-center text-sm font-bold text-blue-400">${studentCount}</td>
                <td class="p-4 text-xs font-medium text-slate-400">${regDate}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-right">${actionBtn}</td>
            </tr>`;
    });
}

// ==========================================
// PREMİUM ONAY MEKANİZMASI
// ==========================================
window.togglePremium = async function(teacherId, makePremium) {
    const actionText = makePremium ? "Bu öğretmeni Premium yapıyorsun. Onaylıyor musun?" : "Öğretmenin Premium yetkisini iptal ediyorsun. Emin misin?";
    if (!confirm(actionText)) return;

    showToast("İşlem yapılıyor...", "info");

    const { error } = await supabaseClient.from('profiles').update({ is_premium: makePremium }).eq('id', teacherId);

    if (error) {
        showToast("Hata: " + error.message, "error");
    } else {
        showToast(makePremium ? "Hoca başarıyla Premium yapıldı! Para kasada 💸" : "Premium yetkisi alındı.", "success");
        fetchSystemData(); // Tabloyu yenile
    }
}
