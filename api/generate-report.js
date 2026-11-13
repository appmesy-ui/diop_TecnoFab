// Endpoint protegido: solo responde a usuarios con sesión válida de Supabase
// cuyo email esté en la lista permitida.
const SB_URL = process.env.SUPABASE_URL || 'https://ihqrqcgswgvtmzddoquf.supabase.co';
// Clave anon (pública por diseño, la misma que lleva la app en el navegador)
const SB_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocXJxY2dzd2d2dG16ZGRvcXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODYyMzQsImV4cCI6MjA4OTI2MjIzNH0.b5EPYLXVJxQ53QW-ceBb-vdVzl2zubwefTnp7B94X8U';
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || 'esymartin@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const MAX_PROMPT_CHARS = 100000;

async function getUserEmail(token) {
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const user = await r.json();
  return (user && user.email ? String(user.email) : '').toLowerCase() || null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1) Autenticación
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const email = await getUserEmail(token);
    if (!email) return res.status(401).json({ error: 'Sesión no válida' });
    if (!ALLOWED_EMAILS.includes(email)) return res.status(403).json({ error: 'Sin permiso' });

    // 2) Validación de la petición
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return res.status(413).json({ error: 'Prompt demasiado largo' });
    }

    // 3) Llamada a OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 8000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OpenAI error',
        details: data
      });
    }

    const content = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ content });
  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};
