const { OpenAI, toFile } = require('openai');
const { createClient } = require('@supabase/supabase-js');

const allowedOrigins = ['https://englishportalvip.vercel.app', 'http://englishportalvip.com', 'http://127.0.0.1:3000'];

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Sunucu hatası: OPENAI_API_KEY tanımlı değil.' });
  }

  const { audioBase64, ext, prompt } = req.body;
  if (!audioBase64) return res.status(400).json({ error: 'Eksik parametre: audioBase64' });

  try {
    const openai = new OpenAI({ apiKey });
    const buffer = Buffer.from(audioBase64, 'base64');
    
    const file = await toFile(buffer, `audio.${ext || 'webm'}`, { type: `audio/${ext || 'webm'}` });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      prompt: prompt || ''
    });

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ error: 'OpenAI ile iletişim kurulamadı.', details: err.message });
  }
};
