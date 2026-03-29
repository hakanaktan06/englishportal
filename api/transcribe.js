const { OpenAI, toFile } = require('openai');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Sunucu hatası: OPENAI_API_KEY tanımlı değil.' });
  }

  const { audioBase64, ext, prompt } = req.body;
  if (!audioBase64) return res.status(400).json({ error: 'Eksik parametre: audioBase64' });

  try {
    const openai = new OpenAI({ apiKey });
    const buffer = Buffer.from(audioBase64, 'base64');
    
    // Ses dosyasını API'nin istediği formata dönüştür
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
