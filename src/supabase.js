import { createClient } from '@supabase/supabase-js'

// Cole aqui as suas credenciais do Supabase (passo 2 do guia)
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://SEU-PROJETO.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'SUA-CHAVE-AQUI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
