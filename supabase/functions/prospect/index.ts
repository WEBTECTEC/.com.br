// supabase/functions/prospect/index.ts
// Função que busca leads novos e tenta enriquecer com dados públicos
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuração CORS - permitir apenas seu domínio
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://webtectec.com.br',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Responder requisições OPTIONS (preflight) imediatamente
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  // Buscar leads com status 'novo' e sem enriquecimento
  const { data: leads, error } = await supabase
    .from('leads_prospeccao')
    .select('*')
    .eq('status', 'novo')
    .limit(5)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Verificar se existem leads para processar
  if (!leads || leads.length === 0) {
    return new Response(JSON.stringify({ 
      message: '📭 Nenhum lead novo para processar no momento.',
      leads: [] 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Para cada lead, simular enriquecimento (futuro: API de CNPJ, Instagram, etc)
  const resultados = []
  for (const lead of leads) {
    // Gera sugestão de Instagram a partir do nome da empresa ou email
    const nomeBase = lead.nome_empresa || lead.email?.split('@')[0] || 'empresa'
    const sugestaoInstagram = `@${nomeBase.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 30)}`
    
    // Ação semiautônoma: apenas prepara dados, não envia ainda
    const { error: updateError } = await supabase
      .from('leads_prospeccao')
      .update({ 
        status: 'analise_manual',
        observacoes: `Sugestão de contato: ${sugestaoInstagram} | Lead captado via formulário`
      })
      .eq('id', lead.id)
    
    if (!updateError) {
      resultados.push({
        id: lead.id,
        nome_empresa: lead.nome_empresa,
        telefone: lead.telefone,
        email: lead.email,
        sugestao_instagram: sugestaoInstagram
      })
    }
  }

  return new Response(JSON.stringify({ 
    message: `✅ ${resultados.length} lead(s) preparado(s) para revisão manual.`,
    leads: resultados 
  }), { 
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
