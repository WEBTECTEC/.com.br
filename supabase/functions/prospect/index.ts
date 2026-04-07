// Função que busca leads novos e tenta enriquecer com dados públicos
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
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

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  // Para cada lead, simular enriquecimento (futuro: API de CNPJ, Instagram, etc)
  const resultados = []
  for (const lead of leads) {
    // Ação semiautônoma: apenas prepara dados, não envia ainda
    const enriquecido = {
      ...lead,
      sugestao_instagram: `@${lead.nome_empresa.replace(/\s/g, '').toLowerCase()}`,
      status: 'analise_manual'
    }
    
    await supabase.from('leads_prospeccao').update({ 
      status: 'analise_manual',
      observacoes: `Sugestão de contato: ${enriquecido.sugestao_instagram}`
    }).eq('id', lead.id)
    
    resultados.push(enriquecido)
  }

  return new Response(JSON.stringify({ 
    message: `✅ ${resultados.length} leads preparados para revisão manual`,
    leads: resultados 
  }), { status: 200 })
})
