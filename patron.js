    // ==========================================
    // 1. SUPABASE BAĞLANTISI
    // ==========================================
    const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // ==========================================
    // MOBİL MENÜ KONTROLÜ
    // ==========================================
    const sidebarMain = document.getElementById('mainSidebar');
    const sideOverlay = document.getElementById('sidebarOverlay');
    const sideOpenBtn = document.getElementById('openSidebarBtn');
    const sideCloseBtn = document.getElementById('closeSidebarBtn');

    function toggleMobileSidebar() {
        if (sidebarMain) sidebarMain.classList.toggle('-translate-x-full');
        if (sideOverlay) sideOverlay.classList.toggle('hidden');
    }

    if (sideOpenBtn) sideOpenBtn.addEventListener('click', toggleMobileSidebar);
    if (sideCloseBtn) sideCloseBtn.addEventListener('click', toggleMobileSidebar);
    if (sideOverlay) sideOverlay.addEventListener('click', toggleMobileSidebar);

    // XSS KORUMASI
    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, function (tag) {
            const charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
            return charsToReplace[tag] || tag;
        });
    }

    // ==========================================
    // UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
    // ==========================================
    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-amber-500');

        const iconSvg = type === 'success'
            ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
            : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

        toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 border border-white/20`;
        toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span>${escapeHTML(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function customConfirm(message, btnText = "Evet, Onayla") {
        return new Promise((resolve) => {
            const modal = document.getElementById('customConfirmModal');
            const box = document.getElementById('customConfirmBox');
            const btnOk = document.getElementById('customConfirmOk');
            const btnCancel = document.getElementById('customConfirmCancel');

            if (!modal) { resolve(confirm(message)); return; }

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

    // ==========================================
    // GÜVENLİK VE ÇIKIŞ
    // ==========================================
    async function checkGodSecurity() {
        // 🌟 STABILIZATION: Supabase'in tam oturması için kısa bekleme
        await new Promise(r => setTimeout(r, 700));

        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) { 
                window.location.href = 'index.html'; 
                return; 
            }

            // 🌟 STEP 1: Sadece Rolü Kontrol Et (Hızlı)
            const { data: profile, error } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
            
            if (error || !profile || profile.role !== 'god') {
                console.warn("Yetkisiz erişim denemesi:", profile?.role);
                window.location.href = 'index.html';
                return;
            }

            // Yetki TAMAM. Splash falan varsa kapatalım (God panelinde genelde yok ama ekleyelim)
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('opacity-0');
                setTimeout(() => splash.classList.add('hidden'), 700);
            }

            // 🌟 STEP 2: Diğer verileri çekmeye başla
            initGodPortal();

        } catch (e) {
            console.error("God security error:", e);
            window.location.href = 'index.html';
        }
    }

    async function initGodPortal() {
        // Burada istatistikleri ve listeleri çekebiliriz (Non-blocking)
        fetchGodMetrics();
        fetchTeachers();
        loadAnnouncements();
        if(typeof loadActivationCodes === 'function') loadActivationCodes();
    }
    checkGodSecurity();

    // MODAL KONTROLLERİ
    const kurumModal = document.getElementById('addKurumModal');
    const openKurumBtn = document.getElementById('addKurumBtn');
    const closeKurumBtn = document.getElementById('closeKurumModal');
    const kurumForm = document.getElementById('newKurumForm');

    if (openKurumBtn) {
        openKurumBtn.onclick = () => {
            if(kurumModal) {
                kurumModal.classList.remove('hidden');
                setTimeout(() => {
                    kurumModal.classList.remove('opacity-0', 'scale-95');
                    kurumModal.querySelector('.bg-slate-900').classList.remove('scale-95');
                }, 10);
            }
        };
    }

    if (closeKurumBtn) {
        closeKurumBtn.onclick = () => {
            if(kurumModal) {
                kurumModal.classList.add('opacity-0');
                kurumModal.querySelector('.bg-slate-900').classList.add('scale-95');
                setTimeout(() => kurumModal.classList.add('hidden'), 300);
            }
        };
    }

    if (kurumForm) {
        kurumForm.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = kurumForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "KAYIT YAPILIYOR...";
            submitBtn.disabled = true;

            const name = document.getElementById('kurumName').value;
            const email = document.getElementById('kurumEmail').value;
            const password = document.getElementById('kurumPassword').value;

            try {
                // 1. Auth hesabı oluştur
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });

                if (authError) throw authError;

                if (authData.user) {
                    // 2. Profilini oluştur
                    const { error: profileError } = await supabaseClient.from('profiles').insert([{
                        id: authData.user.id,
                        full_name: name,
                        school_name: name,
                        school_id: authData.user.id, // 🌟 KRİTİK: B2B Kurum kendisinin tenant masterıdır
                        email: email,
                        role: 'kurum'
                    }]);

                    if (profileError) throw profileError;

                    showToast("Kurum başarıyla sisteme kaydedildi!", "success");
                    kurumForm.reset();
                    if (closeKurumBtn) closeKurumBtn.click();
                    fetchKurumlar();
                    fetchGodMetrics();
                }
            } catch (err) {
                console.error("Kurum kayıt hatası:", err);
                showToast("Hata: " + (err.message || "İşlem başarısız"), "error");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        };
    }

    document.getElementById('godLogoutBtn').addEventListener('click', async () => {
        const onay = await customConfirm("God Panel oturumunu sonlandırmak istediğinizi onaylıyor musunuz?", "Evet, Çıkış Yap");
        if (onay) {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        }
    });

    // ==========================================
    // GOD PANEL METRİKLERİ (TÜM SİSTEM)
    // ==========================================
    async function fetchGodMetrics() {
        // 1. Toplam Öğrenci Sayısı
        const { count: studentCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
        document.getElementById('godStatStudents').innerText = studentCount || 0;

        // 2. Toplam Kurum Sayısı
        const { count: kurumCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'kurum');
        document.getElementById('godStatKurum').innerText = kurumCount || 0;

        // 3. Toplam Eğitmen Sayısı
        const { count: teacherCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
        document.getElementById('godStatTeachers').innerText = teacherCount || 0;

        // 4. Sistemdeki Toplam Borç
        const { data: unpaidLessons } = await supabaseClient.from('private_lessons').select('price').eq('is_paid', false);
        let totalDebt = 0;
        if (unpaidLessons) {
            unpaidLessons.forEach(l => totalDebt += Number(l.price || 0));
        }
        document.getElementById('godStatDebt').innerText = "₺" + totalDebt.toLocaleString('tr-TR');
    }


    // ==========================================
    // ÖĞRETMEN YÖNETİM MOTORU VE GÖRÜNMEZ RADAR
    // ==========================================
    function timeAgo(dateString) {
        if (!dateString) return "<span class='text-slate-500'>Hiç giriş yapmadı</span>";
        const diff = new Date() - new Date(dateString);
        const minutes = Math.floor(diff / 60000);

        if (minutes < 5) return "<span class='text-emerald-400 font-black animate-pulse text-[10px] uppercase'>Çevrimiçi</span>";
        if (minutes < 60) return `<span class='text-amber-400'>${minutes} dk önce</span>`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `<span class='text-slate-300'>${hours} saat önce</span>`;
        return `<span class='text-slate-400'>${Math.floor(hours / 24)} gün önce</span>`;
    }

    // ==========================================
    // SEKMELER ARASI GEÇİŞ (GOD STİLE)
    // ==========================================
    const sections = {
        teachers: document.getElementById('teacherList').parentElement,
        kurum: document.getElementById('section-kurum'),
        avatars: document.getElementById('section-avatars')
    };

    function switchTab(target) {
        for (const key in sections) {
            if(sections[key]) sections[key].classList.add('hidden');
        }
        if(sections[target]) sections[target].classList.remove('hidden');

        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('bg-amber-500/10', 'text-amber-500', 'border-amber-500/20', 'active-menu'));
        const activeBtn = document.getElementById(`btn-${target}`);
        if(activeBtn) activeBtn.classList.add('bg-amber-500/10', 'text-amber-500', 'border-amber-500/20', 'active-menu');

        if(target === 'teachers') fetchTeachers();
        if(target === 'kurum') fetchKurumlar();
        if(target === 'avatars') loadShopItems();
    }

    document.getElementById('btn-teachers').onclick = (e) => { e.preventDefault(); switchTab('teachers'); };
    document.getElementById('btn-kurum').onclick = (e) => { e.preventDefault(); switchTab('kurum'); };
    document.getElementById('btn-avatars').onclick = (e) => { e.preventDefault(); switchTab('avatars'); };

    async function fetchTeachers() {
        const listContainer = document.getElementById('teacherList');
        if (!listContainer) return;

        listContainer.innerHTML = '<p class="text-slate-400 text-sm animate-pulse col-span-full text-center py-5">Öğretmen radarı ve istihbarat verileri taranıyor...</p>';

        const { data: teachers, error } = await supabaseClient.from('profiles').select('*, last_login, announcement').eq('role', 'teacher').order('created_at', { ascending: false });
        const { data: allInstitutions } = await supabaseClient.from('profiles').select('id, school_name, full_name, is_premium').eq('role', 'kurum');
        const { data: allStudents } = await supabaseClient.from('profiles').select('id, teacher_id').eq('role', 'student');
        const { data: unpaidLessons } = await supabaseClient.from('private_lessons').select('teacher_id, price').eq('is_paid', false);

        if (error || !teachers || teachers.length === 0) {
            listContainer.innerHTML = '<div class="col-span-full text-center p-8 text-slate-500 font-bold border border-dashed border-slate-700 rounded-2xl">Sistemde henüz kayıtlı öğretmen bulunmuyor.</div>';
            const godStat = document.getElementById('godStatTeachers'); if (godStat) godStat.innerText = "0";
            return;
        }

        const godStat = document.getElementById('godStatTeachers'); if (godStat) godStat.innerText = teachers.length;
        listContainer.innerHTML = '';

        teachers.forEach(teacher => {
            const myStudentsCount = allStudents ? allStudents.filter(s => s.teacher_id === teacher.id).length : 0;
            let myUnpaidDebt = 0;
            if (unpaidLessons) unpaidLessons.filter(l => l.teacher_id === teacher.id).forEach(l => myUnpaidDebt += Number(l.price || 0));

            let myInst = allInstitutions ? allInstitutions.find(i => i.id === teacher.school_id) : null;
            let isIndividualVip = teacher.is_premium;
            if (isIndividualVip && teacher.premium_until) {
                if (new Date(teacher.premium_until) < new Date()) isIndividualVip = false;
            }

            let isInstitutionalVip = myInst && myInst.is_premium;
            let isVip = isIndividualVip || isInstitutionalVip;
            
            let badgeHtml = "";

            if (isVip) {
                let label = isIndividualVip ? "VIP AKTİF" : "VIP (Kurumsal)";
                let subLabel = "";

                if (isIndividualVip && teacher.premium_until) {
                    subLabel = `SON: ${new Date(teacher.premium_until).toLocaleDateString('tr-TR')}`;
                }

                badgeHtml = `<div class="flex flex-col items-end"><span class="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)] mb-1 whitespace-nowrap">${label}</span>${subLabel ? '<span class="text-[8px] md:text-[9px] text-amber-500/70 font-bold tracking-widest whitespace-nowrap">'+subLabel+'</span>' : ''}</div>`;
            } else {
                badgeHtml = `<div class="flex flex-col items-end"><span class="bg-slate-700/50 text-slate-400 border border-slate-600 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Standart</span></div>`;
            }

            const avatarColor = isVip ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-600';
            const radarStatus = timeAgo(teacher.last_login);

            let actionUI = isVip ? `
                <div class="bg-slate-900/60 p-1.5 rounded-[14px] border border-slate-700/50 flex items-center justify-between mb-3 shadow-inner">
                    <button onclick="updateTeacherVip('${teacher.id}', -1)" class="flex-1 py-2 text-[11px] font-black text-rose-400 hover:bg-rose-500/20 rounded-lg transition">-1 AY</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 1)" class="flex-1 py-2 text-[11px] font-black text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition">+1 AY</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 3)" class="flex-1 py-2 text-[11px] font-black text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition">+3 AY</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 12)" class="flex-1 py-2 text-[11px] font-black text-purple-400 hover:bg-purple-500/20 rounded-lg transition">+1 YIL</button>
                </div>
                <div class="flex gap-3">
                    <button onclick="updateTeacherVip('${teacher.id}', 0)" class="flex-1 bg-slate-900/40 hover:bg-slate-800 text-slate-400 border border-slate-700/50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition">VIP İPTAL ET</button>
                    <button onclick="resetTeacherPassword('${teacher.id}')" class="w-12 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition" title="Şifreyi Sıfırla"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l8.44-8.44A6 6 0 0115 7h0z"></path></svg></button>
                    <button onclick="deleteTeacher('${teacher.id}')" class="w-12 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition" title="Öğretmeni Sil"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>` : `
                <div class="bg-slate-900/60 p-1.5 rounded-[14px] border border-slate-700/50 flex items-center justify-between mb-3 shadow-inner">
                    <button onclick="updateTeacherVip('${teacher.id}', 1)" class="flex-1 py-2.5 text-[11px] font-black text-amber-500 hover:bg-amber-500/20 rounded-lg transition">+1 AY VIP</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 3)" class="flex-1 py-2.5 text-[11px] font-black text-orange-500 hover:bg-orange-500/20 rounded-lg transition">+3 AY VIP</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 12)" class="flex-1 py-2.5 text-[11px] font-black text-purple-400 hover:bg-purple-500/20 rounded-lg transition">+1 YIL VIP</button>
                </div>
                <div class="flex justify-end gap-3">
                    <button onclick="resetTeacherPassword('${teacher.id}')" class="flex flex-1 items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition" title="Şifreyi Sıfırla"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l8.44-8.44A6 6 0 0115 7h0z"></path></svg> Şifreyi Sıfırla</button>
                    <button onclick="deleteTeacher('${teacher.id}')" class="flex flex-1 items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 transition" title="Öğretmeni Sil"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Hesabı Sil</button>
                </div>`;

            const currentPersonalMsg = teacher.announcement || '';
            const personalMsgUI = `
                <div class="mt-4 border-t border-slate-700/50 pt-4">
                    <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Bu Hocaya Özel Bildirim Gönder</label>
                    <div class="flex gap-2">
                        <input type="text" id="ann_${teacher.id}" value="${escapeHTML(currentPersonalMsg)}" class="w-full bg-slate-900 border border-slate-700 text-xs px-3 py-2 rounded-lg text-white outline-none focus:border-indigo-500 placeholder-slate-600" placeholder="Örn: Hocam süreniz bitiyor...">
                        <button onclick="sendPersonalMessage('${teacher.id}')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase transition shrink-0 shadow-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> İLET</button>
                    </div>
                </div>`;

            const isInstTeacher = !!teacher.school_id;
            const mySchoolName = (myInst && (myInst.school_name || myInst.full_name)) || teacher.school_name || 'Özel Kurum';
            const instBadge = isInstTeacher ? `
                <div class="mt-1 flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 w-fit">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m4 0h1m-5 4h1m4 0h1m-5 4h1m4 0h1"></path></svg>
                    <span class="text-[9px] font-black uppercase tracking-tighter">${escapeHTML(mySchoolName)}</span>
                </div>` : `
                <div class="mt-1 flex items-center gap-1.5 bg-slate-700/30 text-slate-500 px-2 py-0.5 rounded-md border border-slate-700/50 w-fit">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span class="text-[9px] font-black uppercase tracking-tighter">Bağımsız Öğretmen</span>
                </div>`;

            const card = document.createElement('div');
            card.className = "bg-slate-800/40 border border-slate-700/50 p-5 rounded-[24px] flex flex-col gap-4 hover:border-indigo-500/50 transition-colors relative overflow-hidden shadow-sm";

            card.innerHTML = `
                ${isVip ? '<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>' : ''}
                <div class="flex justify-between items-start gap-2 mb-2">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 border border-white/10">${teacher.full_name ? escapeHTML(teacher.full_name.charAt(0).toUpperCase()) : '?'}</div>
                        <div class="min-w-0">
                            <h4 class="font-black text-white text-base leading-tight truncate">${teacher.full_name ? escapeHTML(teacher.full_name) : 'İsimsiz'}</h4>
                            <p class="text-[10px] text-indigo-400 font-bold truncate lowercase mt-0.5">${teacher.email ? escapeHTML(teacher.email) : 'Mail Yok'}</p>
                            ${instBadge}
                            <p class="text-[9px] text-slate-400 mt-2 font-bold flex items-center gap-1 truncate"><svg class="w-3 h-3 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> ${radarStatus}</p>
                        </div>
                    </div>
                    <div class="shrink-0 text-right">${badgeHtml}</div>
                </div>
                <div class="flex flex-wrap gap-2 mb-1">
                    <span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> ${myStudentsCount} Öğrenci</span>
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ₺${myUnpaidDebt} Alacak</span>
                </div>
                <div class="mt-auto border-t border-slate-700/50 pt-4">${actionUI}${personalMsgUI}</div>
            `;
            listContainer.appendChild(card);
        });
    }



    // VIP KURUMSAL GÜNCELLEME MOTORU
    window.updateTeacherVip = async function (id, months) {
        let msg = "";
        if (months === 0) msg = "Öğretmenin VIP yetkisini iptal etmek ve standart pakete geçirmek istediğinizi onaylıyor musunuz?";
        else if (months < 0) msg = `Öğretmenin VIP aboneliğinden ${Math.abs(months)} ay eksiltilecektir. Onaylıyor musunuz?`;
        else msg = `Öğretmen hesabına ${months} aylık Premium VIP yetkisi tanımlanacaktır. Onaylıyor musunuz?`;

        const isConfirmed = await customConfirm(msg, "Evet, Onayla");
        if (!isConfirmed) return;

        if (typeof showToast === "function") showToast("İşlem başlatıldı...", "info");

        if (months === 0) {
            const { error } = await supabaseClient.from('profiles').update({ is_premium: false, premium_until: null }).eq('id', id);
            if (error) { if (typeof showToast === "function") showToast("Sistem hatası oluştu.", "error"); }
            else { if (typeof showToast === "function") showToast("Hesap standart pakete güncellendi.", "success"); fetchTeachers(); }
        } else {
            const { data: t } = await supabaseClient.from('profiles').select('premium_until').eq('id', id).single();
            let baseDate = new Date();

            if (t && t.premium_until) {
                const currentExpiry = new Date(t.premium_until);
                if (currentExpiry > baseDate) baseDate = currentExpiry;
            }

            baseDate.setMonth(baseDate.getMonth() + months);

            if (baseDate <= new Date()) {
                await supabaseClient.from('profiles').update({ is_premium: false, premium_until: null }).eq('id', id);
                if (typeof showToast === "function") showToast("Süre sona erdiği için hesap standart pakete alındı.", "success");
                fetchTeachers();
                return;
            }

            const expiryStr = baseDate.toISOString();
            const { error } = await supabaseClient.from('profiles').update({ is_premium: true, premium_until: expiryStr }).eq('id', id);

            if (error) { if (typeof showToast === "function") showToast("Sistem hatası oluştu.", "error"); }
            else {
                const toastMsg = months > 0 ? `Premium süre ${months} ay uzatıldı.` : `Premium süre ${Math.abs(months)} ay kısaltıldı.`;
                if (typeof showToast === "function") showToast(toastMsg, "success");
                fetchTeachers();
            }
        }
    }

    // 🌟 YENİ: KİŞİYE ÖZEL MESAJ MOTORU 🌟
    window.sendPersonalMessage = async function (teacherId) {
        const inputEl = document.getElementById(`ann_${teacherId}`);
        if (!inputEl) return;
        const msg = inputEl.value;

        showToast("Özel mesaj iletiliyor...", "info");
        const { error } = await supabaseClient.from('profiles').update({ announcement: msg }).eq('id', teacherId);

        if (error) {
            showToast("Mesaj gönderilemedi: " + error.message, "error");
        } else {
            showToast(msg === "" ? "Hocanın özel mesajı kaldırıldı." : "Özel mesaj hocanın paneline başarıyla sabitlendi!", "success");
        }
    };

    // 🌟 ULTRA GÜÇLÜ ÖĞRETMEN SİLME MOTORU (DERİN TEMİZLİK - SERVER-SIDE) 🌟
    window.deleteTeacher = async function (id) {
        // 1. Önce kaç öğrenci etkileneceğini göster
        const { count: studentCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('teacher_id', id).eq('role', 'student');
        const { count: quizCount } = await supabaseClient.from('quizzes').select('*', { count: 'exact', head: true }).eq('teacher_id', id);

        // 2. Onay modalını oluştur
        const impactModal = document.createElement('div');
        impactModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4';
        impactModal.innerHTML = `
        <div class="bg-slate-900 border-2 border-red-500/50 rounded-[30px] p-8 max-w-sm w-full">
            <div class="text-center mb-6">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <h3 class="text-xl font-black text-white mb-2">Kalıcı Silme Uyarısı</h3>
            <p class="text-slate-400 text-sm">Bu işlem şunları silecek:</p>
            </div>
            
            <div class="space-y-3 mb-6">
            <div class="flex justify-between bg-slate-800 rounded-xl px-4 py-3">
                <span class="text-slate-400 text-sm">Öğrenci Hesabı</span>
                <span class="text-red-400 font-black">${studentCount || 0} kişi</span>
            </div>
            <div class="flex justify-between bg-slate-800 rounded-xl px-4 py-3">
                <span class="text-slate-400 text-sm">Sınav ve Sorular</span>
                <span class="text-red-400 font-black">${quizCount || 0} sınav</span>
            </div>
            <div class="flex justify-between bg-slate-800 rounded-xl px-4 py-3">
                <span class="text-slate-400 text-sm">Tüm Ödev Kayıtları</span>
                <span class="text-red-400 font-black">Hepsi</span>
            </div>
            </div>
            
            <p class="text-[10px] text-slate-500 text-center mb-4 uppercase tracking-widest">Onaylamak için aşağıya "SİL" yazın</p>
            <input type="text" id="deleteConfirmText" class="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-center font-black tracking-widest mb-4 outline-none focus:border-red-500" placeholder="...">
            <div class="flex gap-3">
            <button id="cancelDeleteBtn" class="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black text-sm">İptal</button>
            <button id="confirmDeleteBtn" disabled class="flex-1 py-3 bg-red-600/50 text-red-300 rounded-xl font-black text-sm disabled:cursor-not-allowed transition">SİL</button>
            </div>
        </div>
        `;
        
        document.body.appendChild(impactModal);
        
        const input = impactModal.querySelector('#deleteConfirmText');
        const confirmBtn = impactModal.querySelector('#confirmDeleteBtn');
        const cancelBtn = impactModal.querySelector('#cancelDeleteBtn');
        
        input.addEventListener('input', (e) => {
        if (e.target.value.trim().toUpperCase() === 'SİL') {
            confirmBtn.disabled = false;
            confirmBtn.className = 'flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm transition';
        } else {
            confirmBtn.disabled = true;
            confirmBtn.className = 'flex-1 py-3 bg-red-600/50 text-red-300 rounded-xl font-black text-sm disabled:cursor-not-allowed transition';
        }
        });
        
        const isConfirmed = await new Promise((resolve) => {
        confirmBtn.onclick = () => { impactModal.remove(); resolve(true); };
        cancelBtn.onclick = () => { impactModal.remove(); resolve(false); };
        });

        if (!isConfirmed) return;

        if (typeof showToast === "function") showToast("Cihazlar arası derin temizlik başlatıldı...", "info");

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) { showToast("Oturum bulunamadı, silme başarısız.", "error"); return; }

            const apiUrl = window.location.protocol === 'file:'
                ? 'https://englishportalvip.vercel.app/api/delete-user' // Yerel test için fallback
                : '/api/delete-user';

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ targetUserId: id })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (typeof showToast === "function") showToast("Öğretmen ve ona bağlı TÜM ekosistem sistemden kazındı.", "success");
                if (typeof fetchTeachers === "function") fetchTeachers();
                if (typeof fetchGodMetrics === "function") fetchGodMetrics();
            } else {
                console.error("Deep wipe final error:", data.error);
                if (typeof showToast === "function") showToast("Hata: " + (data.error || "Operasyon başarısız"), "error");
            }

        } catch (err) {
            console.error("Zincirleme silme hatası:", err);
            if (typeof showToast === "function") showToast("Ağ bağlantısı hatası: Sunucu meşgul.", "error");
        }
    }

    // ŞİFRE SIFIRLAMA MOTORU
    // 🌟 YENİ: GOD PANEL ÖZEL ŞIK ŞİFRE GİRİŞ ARAYÜZÜ 🌟
    function godPrompt(title, desc = "", placeholder = "Buraya yazın...") {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = "fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 opacity-0 transition-all duration-300";

            const box = document.createElement('div');
            // God panel teması: Koyu Slate, Amber/Rose vurgular
            box.className = "bg-slate-900 border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-[24px] w-full max-w-sm p-6 transform scale-95 transition-all duration-400";

            box.innerHTML = `
                <div class="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-[40px] pointer-events-none"></div>
                <div class="relative z-10 mb-5">
                    <div class="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-amber-400 shadow-inner">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                    </div>
                    <h3 class="text-xl font-black text-white leading-tight uppercase tracking-wide">${title}</h3>
                    ${desc ? `<p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">${desc}</p>` : ''}
                </div>
                <input type="text" class="w-full relative z-10 bg-slate-950/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] mb-6 font-black tracking-widest placeholder-slate-600 transition" placeholder="${placeholder}" autofocus autocomplete="off">
                <div class="flex gap-3 relative z-10">
                    <button id="gpCancel" class="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition">İptal</button>
                    <button id="gpOk" class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition">KİLİDİ AÇ</button>
                </div>
            `;

            modal.appendChild(box);
            document.body.appendChild(modal);

            const input = box.querySelector('input');
            const btnOk = box.querySelector('#gpOk');
            const btnCancel = box.querySelector('#gpCancel');

            setTimeout(() => {
                modal.classList.remove('opacity-0');
                box.classList.remove('scale-95');
                input.focus();
            }, 10);

            const cleanup = (val) => {
                modal.classList.add('opacity-0');
                box.classList.add('scale-95');
                setTimeout(() => { modal.remove(); resolve(val); }, 300);
            };

            btnOk.addEventListener('click', () => cleanup(input.value.trim()));
            btnCancel.addEventListener('click', () => cleanup(null));
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') cleanup(input.value.trim()); if (e.key === 'Escape') cleanup(null); });
        });
    }

    // ŞİFRE SIFIRLAMA MOTORU
    window.resetTeacherPassword = async function (id) {
        const newPassword = await godPrompt("ŞİFREYİ SIFIRLIYORSUNUZ", "Sisteme giriş için yepyeni devasa bir anahtar belirleyin.", "Örn: sifre1234");
        if (!newPassword) return;
        if (newPassword.length < 6) {
            if (typeof showToast === "function") showToast("Hata! Şifre en az 6 karakter olmalıdır.", "error");
            return;
        }

        const onay = await customConfirm(`Öğretmenin şifresini devasa ve yepyeni olan "${newPassword}" olarak değiştirmek istediğinize emin misiniz?`, "Evet, Sistemi Kilidini Aç");
        if (!onay) return;

        if (typeof showToast === "function") showToast("Ağ sistemlerine müdahale ediliyor...", "info");

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) { showToast("Oturum bulunamadı.", "error"); return; }
            
            const apiUrl = window.location.protocol === 'file:'
                ? 'https://englishportalvip.vercel.app/api/reset-password' // Yerel test için fallback
                : '/api/reset-password';

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ targetUserId: id, newPassword: newPassword })
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error("Sunucu yanıt veremedi (Vercel API Hatası).");
            }

            if (res.ok && data.success) {
                if (typeof showToast === "function") showToast("Şifre başarıyla güncellendi!", "success");
            } else {
                if (typeof showToast === "function") showToast("Hata: " + (data.error || "Sunucu hatası"), "error");
            }
        } catch (err) {
            if (typeof showToast === "function") showToast("Ağ bağlantısı hatası: Sunucu meşgul.", "error");
        }
    }

    // ==========================================
    // KURUM YÖNETİM MOTORU
    // ==========================================
    async function fetchKurumlar() {
        const list = document.getElementById('kurumList');
        list.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Kurumsal Veritabanı Taranıyor...</p>';

        const { data: kurumlar, error } = await supabaseClient.from('profiles').select('*').eq('role', 'kurum').order('created_at', { ascending: false });

        if(error || !kurumlar || kurumlar.length === 0) {
            list.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10">Henüz B2B kayıtlı kurum bulunmuyor.</p>';
            return;
        }

        list.innerHTML = kurumlar.map(k => {
            const isVip = k.is_premium;
            const vipStatusText = isVip ? 'VIP AKTİF' : 'STANDART';
            const vipStatusColor = isVip ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : 'text-slate-500 border-slate-700/50 bg-slate-900/40';

            return `
                <div class="bg-slate-800/40 border ${isVip ? 'border-amber-500/30' : 'border-slate-700/50'} p-5 rounded-[24px] flex flex-col gap-4 hover:border-amber-500/50 transition-colors relative overflow-hidden shadow-sm">
                    ${isVip ? '<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>' : ''}
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                <img src="${k.school_logo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(k.school_name || k.full_name) + '&background=f59e0b&color=fff'}" class="w-full h-full object-cover rounded-xl">
                            </div>
                            <div>
                                <h4 class="font-black text-white text-base leading-tight">${k.school_name || k.full_name}</h4>
                                <p class="text-[10px] text-amber-500 font-bold uppercase mt-0.5 tracking-tighter">${k.email}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ${timeAgo(k.last_login)}
                        </div>
                        <div class="px-2 py-1 rounded-md border ${vipStatusColor} text-[9px] font-black uppercase tracking-widest">
                            ${vipStatusText}
                        </div>
                    </div>

                    <div class="flex gap-2 mt-auto">
                        <button onclick="updateKurumVip('${k.id}', ${!isVip})" class="flex-1 py-3 ${isVip ? 'bg-slate-900 border border-slate-700 text-slate-400' : 'bg-amber-500/20 border border-amber-500/30 text-amber-500'} text-[9px] font-black uppercase hover:text-white rounded-xl transition">
                            ${isVip ? 'VIP İPTAL' : 'VIP YAP'}
                        </button>
                        <button onclick="resetTeacherPassword('${k.id}')" class="flex-1 py-3 bg-slate-900 border border-slate-700 text-[9px] font-black uppercase text-slate-400 hover:text-white rounded-xl transition">ŞİFRE</button>
                        <button onclick="deleteKurum('${k.id}', '${k.school_name || k.full_name}')" class="flex-1 py-3 bg-rose-500/10 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition">SİL</button>
                    </div>
                </div>`;
        }).join('');
    }

    window.updateKurumVip = async function(id, targetStatus) {
        const msg = targetStatus ? "TÜM KURUMU VIP YAPMAK ÜZERESİNİZ!\n\nBu işleme bağlı tüm öğretmenler de premium özelliklere kavuşacaktır. Onaylıyor musunuz?" : "Kurumun VIP yetkisini iptal etmek üzeresiniz. Onaylıyor musunuz?";
        const onay = await customConfirm(msg, targetStatus ? "Evet, VIP Yap" : "Evet, İptal Et");
        if(!onay) return;

        showToast("Ağ sistemlerine müdahale ediliyor...", "info");
        const { error } = await supabaseClient.from('profiles').update({ is_premium: targetStatus }).eq('id', id);

        if(error) showToast(error.message, 'error');
        else {
            showToast(targetStatus ? "Kurum artık VIP! Tüm üyeler premium oldu." : "VIP yetkisi geri çekildi.", "success");
            fetchKurumlar();
            fetchGodMetrics();
        }
    }

    window.deleteKurum = async (id, name) => {
        const onay = await customConfirm(`"${name}" kurumunu ve bağlı verilerini silmek istediğinize emin misiniz?\n\nNot: Bu kuruma bağlı öğretmenler silinmez, bağımsız hale gelir.`, "SİSTEMDEN KALDIR");
        if(!onay) return;
        
        if (typeof showToast === "function") showToast("Kurumsal derin temizlik başlatıldı...", "info");

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) { showToast("Oturum bulunamadı.", "error"); return; }

            const apiUrl = window.location.protocol === 'file:'
                ? 'https://englishportalvip.vercel.app/api/delete-user' // Yerel test için fallback
                : '/api/delete-user';

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ targetUserId: id })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast("Kurum sistemden ebediyen kaldırıldı.", "success");
                fetchKurumlar();
                fetchGodMetrics();
            } else {
                showToast("Hata: " + (data.error || "Operasyon başarısız"), "error");
            }
        } catch (err) {
            showToast("Ağ hatası: Sunucu meşgul.", "error");
        }
    };

    // ==========================================
    // AYAR KAYIT MOTORLARI
    // ==========================================
    async function loadVipData() {
        const { data } = await supabaseClient.from('profiles').select('vip_price').eq('role', 'god').single();
        if (data && data.vip_price) {
            try {
                const parsed = JSON.parse(data.vip_price);
                document.getElementById('price1').value = parsed.p1 || "";
                document.getElementById('price3').value = parsed.p3 || "";
                document.getElementById('price12').value = parsed.p12 || "";
                document.getElementById('link1').value = parsed.l1 || "";
                document.getElementById('link3').value = parsed.l3 || "";
                document.getElementById('link12').value = parsed.l12 || "";
            } catch (e) { }
        }
    }
    loadVipData();

    document.getElementById('vipPriceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const p1 = document.getElementById('price1').value;
        const p3 = document.getElementById('price3').value;
        const p12 = document.getElementById('price12').value;
        const l1 = document.getElementById('link1').value;
        const l3 = document.getElementById('link3').value;
        const l12 = document.getElementById('link12').value;

        const vipData = JSON.stringify({ p1, p3, p12, l1, l3, l12 });

        const { data: { user } } = await supabaseClient.auth.getUser();
        showToast("Güncelleniyor...", "info");
        const { error } = await supabaseClient.from('profiles').update({ vip_price: vipData }).eq('id', user.id);

        if (error) showToast("Hata oluştu!", "error");
        else showToast("Fiyatlar ve Linkler Sisteme İşlendi!", "success");
    });

    async function loadApiKey() {
        const { data, error } = await supabaseClient.from('profiles').select('openai_key').eq('role', 'god').single();
        if (data && data.openai_key) {
            document.getElementById('openaiKeyInput').value = data.openai_key;
        }
    }
    loadApiKey();

    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', async () => {
            const key = document.getElementById('openaiKeyInput').value.trim();

            if (!key || !key.startsWith('sk-')) {
                showToast("Lütfen 'sk-' ile başlayan geçerli bir OpenAI şifresi girin!", "error");
                return;
            }
            showToast("Şifre sisteme gömülüyor...", "info");
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            const { error } = await supabaseClient.from('profiles').update({ openai_key: key }).eq('id', user.id);
            if (error) showToast("Kaydetme Hatası: " + error.message, "error");
            else showToast("Yapay Zeka Motoru Aktif! Şifre başarıyla kaydedildi.", "success");
        });
    }

    async function loadAnnouncement() {
        const { data } = await supabaseClient.from('profiles').select('announcement').eq('role', 'god').single();
        if (data && data.announcement) document.getElementById('godAnnouncement').value = data.announcement;
    }
    loadAnnouncement();

    const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');
    if (saveAnnouncementBtn) {
        saveAnnouncementBtn.addEventListener('click', async () => {
            const text = document.getElementById('godAnnouncement').value;
            const { data: { user } } = await supabaseClient.auth.getUser();

            showToast("Yayınlanıyor...", "info");
            const { error } = await supabaseClient.from('profiles').update({ announcement: text }).eq('id', user.id);

            if (error) showToast("Hata: " + error.message, "error");
            else showToast(text.trim() === "" ? "Duyuru kaldırıldı!" : "Duyuru tüm panellere gönderildi!", "success");
        });
    }

    // 🌟 AKTİVASYON KODU MOTORU 🌟
    window.loadActivationCodes = async function() {
        const wrapper = document.getElementById('codeDisplayWrapper');
        if (!wrapper) return;

        wrapper.classList.remove('hidden');
        wrapper.innerHTML = '<p class="text-center text-[10px] text-amber-500/70 font-bold uppercase tracking-widest p-4">Kodlar yükleniyor...</p>';

        const { data: codes, error } = await supabaseClient.from('activation_codes')
            .select('*')
            .eq('is_used', false)
            .order('created_at', { ascending: false });

        if (error || !codes || codes.length === 0) {
            wrapper.innerHTML = '<p class="text-center text-[10px] text-amber-500/50 font-bold uppercase tracking-widest p-4">Şu an boşta VIP kodu bulunmuyor.</p>';
            return;
        }

        wrapper.innerHTML = '<p class="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest mb-3 mb-2">Kullanılmamış VIP Kodları</p> <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"></div>';
        const listContainer = wrapper.querySelector('div');

        codes.forEach(c => {
            const item = document.createElement('div');
            item.className = "flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl";
            item.innerHTML = `
                <div>
                    <p class="text-lg font-black text-amber-500 font-mono tracking-widest leading-none">${c.code}</p>
                    <p class="text-[9px] text-amber-600/70 font-bold uppercase tracking-widest mt-1">${c.duration_days} Günlük Paket</p>
                </div>
                <button onclick="navigator.clipboard.writeText('${c.code}'); showToast('Kopyalandı', 'success');" class="bg-amber-500 hover:bg-amber-400 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 transition transform active:scale-95">KOPYALA</button>
            `;
            listContainer.appendChild(item);
        });
    };

    window.generateActivationCode = async function(days) {
    showToast("Kod üretiliyor...", "info");
    const code = Math.random().toString(36).substring(2,8).toUpperCase() + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    const { error } = await supabaseClient.from('activation_codes').insert([{ code, duration_days: days }]);
    
    if (!error) {
        showToast(`Kod üretildi!`, 'success');
        loadActivationCodes(); // Sadece kullanılmamış olanları tazeleyerek getir
    } else {
        showToast(`Hata oluştu: ${error.message}`, 'error');
    }
    };

    // ==========================================
    // SİSTEMİ BAŞLAT (Tek noktadan tetikleme - Satır 136'da zaten çağrıldı)
    // ==========================================

    // ==========================================
    // 🎨 AVATAR DÜKKÂN YÖNETİM MOTORU
    // ==========================================
    let avatarPendingFile = null; // Yükleme için bekleyen sıkıştırılmış blob

    // --- RESİM SIKIŞTIRMA (Canvas API — WebP, 512×512 max) ---
    function compressAvatarImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 512; // Boyut (512×512 = 1024'ün yarısı, storage tasarrufu)
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                    else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        if (!blob) { reject(new Error('Sıkıştırma başarısız')); return; }
                        resolve(blob);
                    }, 'image/webp', 0.85);
                };
                img.onerror = () => reject(new Error('Görsel yüklenemedi'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Dosya okunamadı'));
            reader.readAsDataURL(file);
        });
    }

    // --- DOSYA SEÇİCİ ---
    const avatarFileInput = document.getElementById('avatarFileInput');
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { showToast('Lütfen bir görsel dosyası seçin.', 'error'); return; }

            try {
                const compressed = await compressAvatarImage(file);
                avatarPendingFile = compressed;
                const sizeKB = Math.round(compressed.size / 1024);
                
                // Önizleme göster
                const previewImg = document.getElementById('avatarPreviewImg');
                previewImg.src = URL.createObjectURL(compressed);
                document.getElementById('avatarFileSizeInfo').textContent = `${sizeKB} KB (Sıkıştırıldı)`;
                document.getElementById('avatarDropContent').classList.add('hidden');
                document.getElementById('avatarPreviewBox').classList.remove('hidden');
            } catch (err) {
                showToast('Görsel işlenemedi: ' + err.message, 'error');
            }
        });
    }

    // --- TÜR DEĞİŞİMİNDE BASE SEÇİCİ GÖSTER/GİZLE ---
    const avatarTypeSelect = document.getElementById('avatarType');
    if (avatarTypeSelect) {
        avatarTypeSelect.addEventListener('change', (e) => {
            const row = document.getElementById('avatarBaseSelectRow');
            const priceInput = document.getElementById('avatarPrice');
            if (e.target.value === 'skin') {
                row.classList.remove('hidden');
                if (priceInput.value === '0') priceInput.value = '250';
            } else {
                row.classList.add('hidden');
                priceInput.value = '0';
            }
        });
    }

    // --- MODAL AÇ/KAPAT ---
    window.openAvatarModal = async function(editItem = null) {
        const modal = document.getElementById('avatarFormModal');
        const box = document.getElementById('avatarFormBox');
        
        // Base'leri dropdown'a yükle
        const baseSelect = document.getElementById('avatarBaseSelect');
        const { data: bases } = await supabaseClient.from('shop_items').select('id, name').eq('type', 'base').order('sort_order');
        baseSelect.innerHTML = '<option value="">-- Base Seç --</option>';
        if (bases) bases.forEach(b => {
            baseSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
        });

        // Formu sıfırla
        document.getElementById('avatarEditId').value = '';
        document.getElementById('avatarName').value = '';
        document.getElementById('avatarDesc').value = '';
        document.getElementById('avatarType').value = 'base';
        document.getElementById('avatarPrice').value = '0';
        document.getElementById('avatarBaseSelect').value = '';
        document.getElementById('avatarBaseSelectRow').classList.add('hidden');
        document.getElementById('avatarDropContent').classList.remove('hidden');
        document.getElementById('avatarPreviewBox').classList.add('hidden');
        document.getElementById('avatarModalTitle').textContent = 'Yeni Avatar Ekle';
        document.getElementById('avatarSaveText').textContent = 'KAYDET VE YAYINLA';
        avatarPendingFile = null;
        if (avatarFileInput) avatarFileInput.value = '';

        // Eğer düzenleme ise değerleri doldur
        if (editItem) {
            document.getElementById('avatarEditId').value = editItem.id;
            document.getElementById('avatarName').value = editItem.name;
            document.getElementById('avatarDesc').value = editItem.description || '';
            document.getElementById('avatarType').value = editItem.type;
            document.getElementById('avatarPrice').value = editItem.coin_price;
            document.getElementById('avatarModalTitle').textContent = 'Avatarı Düzenle';
            document.getElementById('avatarSaveText').textContent = 'GÜNCELLE';
            
            if (editItem.type === 'skin') {
                document.getElementById('avatarBaseSelectRow').classList.remove('hidden');
                document.getElementById('avatarBaseSelect').value = editItem.base_id || '';
            }
            
            // Mevcut görseli göster
            document.getElementById('avatarPreviewImg').src = editItem.image_url;
            document.getElementById('avatarFileSizeInfo').textContent = 'Mevcut görsel';
            document.getElementById('avatarDropContent').classList.add('hidden');
            document.getElementById('avatarPreviewBox').classList.remove('hidden');
        }

        modal.classList.remove('hidden');
        setTimeout(() => { modal.style.opacity = '1'; box.classList.remove('scale-95'); }, 10);
    };

    window.closeAvatarModal = function() {
        const modal = document.getElementById('avatarFormModal');
        const box = document.getElementById('avatarFormBox');
        modal.style.opacity = '0';
        box.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    // --- FORM GÖNDER (KAYDET / GÜNCELLE) ---
    const avatarForm = document.getElementById('avatarItemForm');
    if (avatarForm) {
        avatarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('avatarEditId').value;
            const name = document.getElementById('avatarName').value.trim();
            const desc = document.getElementById('avatarDesc').value.trim();
            const type = document.getElementById('avatarType').value;
            const price = parseInt(document.getElementById('avatarPrice').value) || 0;
            const baseId = type === 'skin' ? (parseInt(document.getElementById('avatarBaseSelect').value) || null) : null;

            if (!name) { showToast('Karakter adı boş olamaz!', 'error'); return; }
            if (type === 'skin' && !baseId) { showToast('Skin için bağlı base karakter seçmelisin!', 'error'); return; }
            if (!avatarPendingFile && !editId) { showToast('Lütfen bir görsel yükle!', 'error'); return; }

            const saveBtn = avatarForm.querySelector('button[type="submit"]');
            const origText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="animate-pulse">YÜKLENİYOR...</span>';
            saveBtn.disabled = true;

            try {
                let imageUrl = '';

                // Yeni dosya yüklendiyse Storage'a at
                if (avatarPendingFile) {
                    const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
                    const { data: uploadData, error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(fileName, avatarPendingFile, {
                            contentType: 'image/webp',
                            cacheControl: '31536000', // 1 yıl cache
                            upsert: false
                        });

                    if (uploadError) throw new Error('Storage hatası: ' + uploadError.message);
                    
                    const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                    imageUrl = urlData.publicUrl;
                }

                if (editId) {
                    // GÜNCELLEME
                    const updateData = { name, description: desc, type, coin_price: price, base_id: baseId };
                    if (imageUrl) updateData.image_url = imageUrl;
                    
                    const { error } = await supabaseClient.from('shop_items').update(updateData).eq('id', editId);
                    if (error) throw error;
                    showToast('Avatar güncellendi!', 'success');
                } else {
                    // YENİ EKLEME
                    const { data: lastItem } = await supabaseClient.from('shop_items').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
                    const nextOrder = (lastItem?.sort_order || 0) + 1;

                    const { error } = await supabaseClient.from('shop_items').insert([{
                        name, description: desc, type, coin_price: price, base_id: baseId,
                        image_url: imageUrl, sort_order: nextOrder, is_active: true
                    }]);
                    if (error) throw error;
                    showToast('Yeni avatar dükkâna eklendi!', 'success');
                }

                closeAvatarModal();
                loadShopItems();
            } catch (err) {
                console.error('Avatar kayıt hatası:', err);
                showToast('Hata: ' + (err.message || 'İşlem başarısız'), 'error');
            } finally {
                saveBtn.innerHTML = origText;
                saveBtn.disabled = false;
            }
        });
    }

    // --- LİSTELE (KART GÖRÜNÜMLERİ) ---
    window.loadShopItems = async function() {
        const baseList = document.getElementById('avatarBaseList');
        const skinList = document.getElementById('avatarSkinList');
        if (!baseList || !skinList) return;

        baseList.innerHTML = '<p class="col-span-full text-center text-slate-500 py-4 text-xs animate-pulse">Yükleniyor...</p>';
        skinList.innerHTML = '<p class="col-span-full text-center text-slate-500 py-4 text-xs animate-pulse">Yükleniyor...</p>';

        const { data: items, error } = await supabaseClient.from('shop_items').select('*').eq('is_active', true).order('sort_order');

        if (error || !items || items.length === 0) {
            baseList.innerHTML = '<p class="col-span-full text-center text-slate-500 py-6 text-xs font-bold uppercase tracking-widest">Henüz avatar eklenmemiş. "Yeni Avatar Ekle" butonunu kullan.</p>';
            skinList.innerHTML = '';
            return;
        }

        const bases = items.filter(i => i.type === 'base');
        const skins = items.filter(i => i.type === 'skin');

        // Base kartları
        if (bases.length === 0) {
            baseList.innerHTML = '<p class="col-span-full text-center text-slate-500 py-4 text-xs">Henüz base karakter yok.</p>';
        } else {
            baseList.innerHTML = bases.map(item => renderAvatarCard(item)).join('');
        }

        // Skin kartları
        if (skins.length === 0) {
            skinList.innerHTML = '<p class="col-span-full text-center text-slate-500 py-4 text-xs">Henüz skin yok.</p>';
        } else {
            skinList.innerHTML = skins.map(item => {
                const parentBase = bases.find(b => b.id === item.base_id);
                return renderAvatarCard(item, parentBase?.name);
            }).join('');
        }
    };

    function renderAvatarCard(item, parentBaseName) {
        const isBase = item.type === 'base';
        const borderColor = isBase ? 'border-amber-500/30' : 'border-pink-500/30';
        const priceTag = item.coin_price > 0
            ? `<span class="text-amber-400 font-black text-xs">${item.coin_price} EP</span>`
            : `<span class="text-emerald-400 font-black text-[10px] uppercase">Ücretsiz</span>`;

        return `
            <div class="bg-slate-800/60 border ${borderColor} rounded-2xl p-3 flex flex-col items-center text-center group hover:border-pink-400 transition-all relative overflow-hidden">
                <img src="${item.image_url}" class="w-24 h-24 object-contain rounded-xl mb-2 group-hover:scale-105 transition-transform" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=1e293b&color=f472b6&size=96'">
                <h5 class="text-xs font-black text-white leading-tight mb-0.5 truncate max-w-full">${item.name}</h5>
                ${parentBaseName ? `<p class="text-[9px] text-pink-400/70 font-bold uppercase tracking-wider mb-1">${parentBaseName}</p>` : ''}
                ${item.description ? `<p class="text-[9px] text-slate-400 italic leading-snug mb-2 line-clamp-2">${item.description}</p>` : ''}
                <div class="mb-2">${priceTag}</div>
                <div class="flex gap-1.5 w-full">
                    <button onclick='openAvatarModal(${JSON.stringify(item).replace(/'/g, "\\u0027")})' class="flex-1 py-1.5 bg-slate-700 hover:bg-pink-500/20 text-slate-300 hover:text-pink-400 rounded-lg text-[9px] font-black uppercase transition">Düzenle</button>
                    <button onclick="deleteShopItem(${item.id})" class="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-black uppercase transition">Sil</button>
                </div>
            </div>`;
    }

    // --- SİLME ---
    window.deleteShopItem = async function(id) {
        const onay = await customConfirm('Bu avatarı dükkândan kalıcı olarak silmek istediğinden emin misin?', 'Evet, Sil');
        if (!onay) return;

        showToast('Siliniyor...', 'info');

        // Önce görselin storage path'ini bul
        const { data: item } = await supabaseClient.from('shop_items').select('image_url').eq('id', id).single();
        
        if (item && item.image_url && item.image_url.includes('/avatars/')) {
            const parts = item.image_url.split('/avatars/');
            const filePath = parts[parts.length - 1];
            if (filePath) {
                await supabaseClient.storage.from('avatars').remove([filePath]);
            }
        }

        // Tablodan sil
        const { error } = await supabaseClient.from('shop_items').delete().eq('id', id);
        if (error) {
            showToast('Silme hatası: ' + error.message, 'error');
            return;
        }
        showToast('Avatar silindi!', 'success');
        loadShopItems();
    };
