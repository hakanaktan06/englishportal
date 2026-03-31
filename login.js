// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// GÖRSEL GEÇİŞLER (LOGIN <-> REGISTER)
// ==========================================
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');

document.getElementById('showRegisterBtn').addEventListener('click', () => {
    loginSection.classList.add('opacity-0');
    setTimeout(() => {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        // Kutu yüksekliğinin adapte olması için çok kısa bir bekleme
        setTimeout(() => {
            registerSection.classList.remove('opacity-0');
            registerSection.classList.add('opacity-100');
        }, 50);
    }, 300); // Fade-out süresi
});

document.getElementById('showLoginBtn').addEventListener('click', () => {
    registerSection.classList.remove('opacity-100');
    registerSection.classList.add('opacity-0');
    setTimeout(() => {
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        setTimeout(() => {
            loginSection.classList.remove('opacity-0');
            loginSection.classList.add('opacity-100');
        }, 50);
    }, 300);
});

// ==========================================
// 2. GİRİŞ (LOGIN) MOTORU
// ==========================================
const loginForm = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');

    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    loginBtn.disabled = true;

    const rawInput = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    let finalEmail = rawInput;
    if (!rawInput.includes('@')) {
        finalEmail = rawInput.replace(/\s+/g, '').toLowerCase() + '@englishportal.com';
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: finalEmail,
        password: password
    });

    if (authError) {
        showError(errorBox, "KULLANICI ADI VEYA ŞİFRE HATALI!");
        resetButton(loginBtn, originalBtnText);
        return;
    }

    const userId = authData.user.id;
    const { data: profileData, error: profileError } = await supabaseClient.from('profiles').select('role').eq('id', userId).single();

    if (profileError || !profileData) {
        showError(errorBox, "Profil bulunamadı!");
        resetButton(loginBtn, originalBtnText);
        return;
    }

    const loginRole = document.getElementById('loginRole').value;

    // ROL DOĞRULAMA MOTORU
    if (profileData.role === 'teacher') {
        if (loginRole !== 'teacher') {
            await supabaseClient.auth.signOut();
            showError(errorBox, "Erişim Reddedildi: Lütfen eğitmen panelini kullanın.");
            resetButton(loginBtn, originalBtnText);
            return;
        }
        window.location.href = 'panel.html';
    } else if (profileData.role === 'student') {
        if (loginRole !== 'student' && loginRole !== 'parent') {
            await supabaseClient.auth.signOut();
            showError(errorBox, "Erişim Reddedildi: Lütfen öğrenci/veli panelini kullanın.");
            resetButton(loginBtn, originalBtnText);
            return;
        }
        localStorage.setItem('lastLoginRole', loginRole);
        window.location.href = (loginRole === 'parent') ? `veli.html?id=${userId}` : 'student.html';
    } else if (profileData.role === 'kurum') {
        if (loginRole !== 'kurum') {
            await supabaseClient.auth.signOut();
            showError(errorBox, "Erişim Reddedildi: Lütfen kurum panelini kullanın.");
            resetButton(loginBtn, originalBtnText);
            return;
        }
        window.location.href = 'kurum.html';
    } else if (profileData.role === 'god') {
        window.location.href = 'patron.html';
    } else {
        showError(errorBox, "Tanımlanamayan Üyelik Tipi!");
        resetButton(loginBtn, originalBtnText);
    }
});

// ==========================================
// 3. ÖĞRETMEN KAYIT (REGISTER) MOTORU
// ==========================================
const registerForm = document.getElementById('registerForm');
const regErrorBox = document.getElementById('regErrorBox');
const regBtn = document.getElementById('regBtn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    regErrorBox.classList.add('hidden');

    const originalBtnText = regBtn.innerHTML;
    regBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    regBtn.disabled = true;

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;

    // 1. Supabase Auth'a Kayıt
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (authError) {
        showError(regErrorBox, authError.message.includes('already registered') ? "Bu e-posta zaten kayıtlı!" : "Kayıt olurken bir hata oluştu.");
        resetButton(regBtn, originalBtnText);
        return;
    }

    if (authData.user) {
        const loginRole = document.getElementById('loginRole').value;
        const targetRole = (loginRole === 'kurum') ? 'kurum' : 'teacher';

        const { error: profileError } = await supabaseClient.from('profiles').insert([{
            id: authData.user.id,
            full_name: name,
            email: email,
            role: targetRole,
            is_premium: (targetRole === 'kurum') ? true : false, // Kurumlar deneme amaçlı direkt premium başlar
            school_id: authData.user.id // Kendisi bir kurumsa, school_id kendisidir
        }]);

        if (profileError) {
            showError(regErrorBox, "Profil oluşturulamadı.");
            resetButton(regBtn, originalBtnText);
        } else {
            window.location.href = (targetRole === 'kurum') ? 'kurum.html' : 'panel.html';
        }
    }
});

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================
function showError(boxElement, message) {
    boxElement.innerHTML = `<svg class="w-4 h-4 mr-1.5 inline-block -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${escapeHTML(message)}`;
    boxElement.classList.remove('hidden');
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return charsToReplace[tag] || tag;
    });
}

function resetButton(btnElement, originalText) {
    btnElement.innerHTML = originalText;
    btnElement.disabled = false;
}

// ŞİFRE GÖSTER/GİZLE MOTORU
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const pwd = document.getElementById('passwordInput');
    const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
    pwd.setAttribute('type', type);
});

// ==========================================
// OTOMATİK OTURUM KONTROLÜ
// ==========================================
// ==========================================
// DİL DEĞİŞTİRME MOTORU (i18n)
// ==========================================
const translations = {
    tr: {
        "nav-features": "Özellikler",
        "nav-about": "Hakkımızda",
        "login-title": "Giriş Yap",
        "login-subtitle": "Eğitim yolculuğuna devam et.",
        "tab-student": "Öğrenci",
        "tab-teacher": "Eğitmen",
        "tab-kurum": "Kurum",
        "label-user": "Kullanıcı Adı veya Email",
        "label-pass": "Şifre",
        "btn-login": "GİRİŞ YAP",
        "btn-register-link": "Hemen Kaydol",
        "reg-title": "Yeni Hesap Oluştur",
        "reg-subtitle": "English Portal dünyasına katıl.",
        "label-fullname": "Ad Soyad",
        "btn-register": "KAYIT OL",
        "footer-text": "Dil öğreniminde yapay zeka destekli profesyonel çözüm."
    },
    en: {
        "nav-features": "Features",
        "nav-about": "About",
        "login-title": "Login",
        "login-subtitle": "Continue your learning journey.",
        "tab-student": "Student",
        "tab-teacher": "Teacher",
        "tab-kurum": "Institution",
        "label-user": "Username or Email",
        "label-pass": "Password",
        "btn-login": "LOGIN",
        "btn-register-link": "Register Now",
        "reg-title": "Create New Account",
        "reg-subtitle": "Join the English Portal world.",
        "label-fullname": "Full Name",
        "btn-register": "REGISTER",
        "footer-text": "AI-powered professional solution for language learning."
    }
};

window.changeLang = function(lang) {
    localStorage.setItem('ep_lang', lang);
    applyTranslations();
};

function applyTranslations() {
    const lang = localStorage.getItem('ep_lang') || 'tr';
    const langTR = document.getElementById('langTR');
    const langEN = document.getElementById('langEN');

    if(lang === 'en') {
        if(langEN) langEN.classList.add('text-white');
        if(langTR) langTR.classList.add('text-white/50');
        if(langEN) langEN.classList.remove('text-white/50');
        if(langTR) langTR.classList.remove('text-white');
    } else {
        if(langTR) langTR.classList.add('text-white');
        if(langEN) langEN.classList.add('text-white/50');
        if(langTR) langTR.classList.remove('text-white/50');
        if(langEN) langEN.classList.remove('text-white');
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (el.tagName === 'INPUT') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });
}
applyTranslations();

async function checkActiveSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();

        if (profile && profile.role === 'teacher') window.location.href = 'panel.html';
        else if (profile && profile.role === 'kurum') window.location.href = 'kurum.html';
        else if (profile && profile.role === 'student') {
            const lastRole = localStorage.getItem('lastLoginRole');
            window.location.href = (lastRole === 'parent') ? `veli.html?id=${session.user.id}` : 'student.html';
        } else if (profile && profile.role === 'god') window.location.href = 'patron.html';
    }
}
checkActiveSession();
