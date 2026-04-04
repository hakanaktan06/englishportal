const { createClient } = require('@supabase/supabase-js');

const allowedOrigins = ['https://englishportalvip.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'];

module.exports = async function handler(req, res) {
  // CORS ayarları (Güvenlik daraltması)
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://englishportalvip.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  const { targetUserId, newPassword } = req.body;

  if (!targetUserId || !newPassword) {
    return res.status(400).json({ error: 'Kullanıcı ID veya yeni şifre eksik.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://vucpxabicxqfmmmqvkpv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return res.status(500).json({ error: 'Sunucu hatası: SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' });
  }

  // === GÜVENLİK BARİYERİ (JWT AUTH) ===
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz istek. Lütfen oturum açın.' });
  }

  const callerToken = authHeader.split('Bearer ')[1];

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(callerToken);
  if (authError || !caller) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
  }

  // İşlemi yapan kişi kim? God, Kurum veya Öğretmen (sadece kendi öğrencisini sıfırlayabilmeli)
  const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', caller.id).single();
  const allowedRoles = ['god', 'kurum', 'teacher'];
  if (!callerProfile || !allowedRoles.includes(callerProfile.role)) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }

  // Eğitmen kendi öğrencisi dışında bir sıfırlama talep edemez!
  if (callerProfile.role === 'teacher' || callerProfile.role === 'kurum') {
    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('teacher_id, school_id').eq('id', targetUserId).single();
    if (!targetProfile || (targetProfile.teacher_id !== caller.id && targetProfile.school_id !== caller.id)) {
        return res.status(403).json({ error: 'Sadece kendi öğrencilerinize işlem yapabilirsiniz.' });
    }
  }
  // === GÜVENLİK BARİYERİ BİTTİ ===

  try {
    // Admin API ile şifreyi güncelle
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Şifre başarıyla güncellendi.' });
  } catch (err) {
    return res.status(500).json({ error: 'Bilinmeyen bir hata oluştu: ' + err.message });
  }
};
