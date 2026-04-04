const { createClient } = require('@supabase/supabase-js');

const allowedOrigins = ['https://englishportalvip.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'];

module.exports = async function handler(req, res) {
  // CORS (Güvenlik Daraltması - Eski '*' kaldırıldı)
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });

  // === GÜVENLİK BARİYERİ (JWT AUTH) ===
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz erişim. Oturum açın.' });
  }

  const callerToken = authHeader.split('Bearer ')[1];
  const supabaseUrl = process.env.SUPABASE_URL || 'https://vucpxabicxqfmmmqvkpv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(callerToken);
  if (authError || !caller) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
  // === GÜVENLİK BARİYERİ BİTTİ ===

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'Sunucu hatası: OPENAI_API_KEY tanımlı değil.' });
  }

  const payload = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: payload.model || 'gpt-4o-mini',
        messages: payload.messages,
        temperature: payload.temperature || 0.7,
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'OpenAI ile iletişim kurulamadı.', details: err.message });
  }
};
