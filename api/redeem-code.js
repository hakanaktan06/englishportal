const { createClient } = require('@supabase/supabase-js');

const allowedOrigins = ['https://englishportalvip.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'];

module.exports = async function handler(req, res) {
  // CORS 
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://englishportalvip.vercel.app');
  }
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST kabul edilir.' });

  const { codeInput } = req.body;
  if (!codeInput) return res.status(400).json({ error: 'Kodu girmediniz.' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://vucpxabicxqfmmmqvkpv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) return res.status(500).json({ error: 'Sunucu hatası: SUPABASE_SERVICE_ROLE_KEY eksik.' });

  // JWT AUTH 
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen oturum açın.' });
  }

  const callerToken = authHeader.split('Bearer ')[1];
  
  // Süper Yetkili Supabase İstemcisi Yarat (RLS'i Bypas Eder)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(callerToken);
  
  if (authError || !caller) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }

  try {
    // 1. Kodu Bul
    const { data: codeData, error: codeErr } = await supabaseAdmin
        .from('activation_codes')
        .select('*')
        .eq('code', codeInput)
        .single();

    if (codeErr || !codeData) {
        return res.status(400).json({ error: 'Geçersiz aktivasyon kodu.' });
    }

    if (codeData.is_used) {
        return res.status(400).json({ error: 'Bu kod daha önce kullanılmış.' });
    }

    // 2. Hocanın Profilini Bul
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_premium, premium_until')
        .eq('id', caller.id)
        .single();

    if (!profile) {
        return res.status(404).json({ error: 'Kullanıcı profili bulunamadı.' });
    }

    // 3. Yeni Süreyi Hesapla
    let baseDate = new Date();
    if (profile.is_premium === true && profile.premium_until) {
        const currentExpiry = new Date(profile.premium_until);
        if (currentExpiry > baseDate) {
            baseDate = currentExpiry;
        }
    }

    const extendDays = Number(codeData.duration_days) || 30;
    baseDate.setDate(baseDate.getDate() + extendDays);
    const expiryStr = baseDate.toISOString();

    // 4. Hocanın Profilini GÜNCELLE (Supabase Admin ile yapıldığı için RLS ENGELLEYEMEZ)
    const { error: profileErr } = await supabaseAdmin
        .from('profiles')
        .update({ is_premium: true, premium_until: expiryStr })
        .eq('id', caller.id);

    if (profileErr) {
        console.error("Profile update error:", profileErr);
        return res.status(500).json({ error: 'Hesap yükseltilirken veritabanı hatası oluştu.' });
    }

    // 5. Kodu Kullanılmış Yap
    await supabaseAdmin
        .from('activation_codes')
        .update({ is_used: true, used_by: caller.id, used_at: new Date().toISOString() })
        .eq('id', codeData.id);

    // Bitti!
    return res.status(200).json({ 
        success: true, 
        message: `VIP üyelik başarıyla ${extendDays} gün uzatıldı!` 
    });

  } catch (err) {
    console.error("Redeem Code API Error:", err);
    return res.status(500).json({ error: 'Sunucu hatası meydana geldi.' });
  }
};
