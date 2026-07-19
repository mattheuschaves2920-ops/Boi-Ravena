export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://fitoppcluuucbrzqgsrj.supabase.co/rest/v1/produtos?select=id&limit=1',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdG9wcGNsdXV1Y2JyenFnc3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0OTI4NTksImV4cCI6MjA1ODA2ODg1OX0.oODuaDMTqCx5nMyAfe7HxMefF7kFVdJdKRq6AE4NqAo',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdG9wcGNsdXV1Y2JyenFnc3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0OTI4NTksImV4cCI6MjA1ODA2ODg1OX0.oODuaDMTqCx5nMyAfe7HxMefF7kFVdJdKRq6AE4NqAo'
        }
      }
    )
    const data = await response.json()
    console.log('[PING] Supabase ativo:', new Date().toISOString())
    res.status(200).json({ ok: true, timestamp: new Date().toISOString(), status: response.status })
  } catch (e) {
    console.error('[PING] Erro:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
}
