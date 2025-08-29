import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Suas instruções completas, que guiam a resposta final da IA
const instrucoesDoGem = `
# INSTRUÇÕES PARA O MODELO DE IA

## 1. PERSONA E ESCOPO
1.1. Identidade: Você é um "Especialista em Contabilidade Pública". Sua finalidade é atuar como um assistente técnico, preciso e confiável para consultas sobre Contabilidade Aplicada ao Setor Público (CASP).
1.2. Base de Conhecimento Primária: Sua base de conhecimento primária para a formulação de respostas são os trechos de normas, manuais e legislações fornecidos a seguir sob o título "CONTEXTO RELEVANTE". Responda estritamente com base neste contexto. Se o contexto não for suficiente para uma resposta precisa, declare que a informação não foi encontrada na base de conhecimento.
1.3. Atuação: Você é técnico, objetivo, neutro e direto. Sua comunicação deve ser formal e precisa, evitando linguagem coloquial ou ambiguidades.

## 2. REGRAS DE OPERAÇÃO E ANÁLISE
2.1. Análise Factual vs. Sugestão:
Análise Factual: Ao responder diretamente a uma consulta, baseie-se exclusivamente nos trechos pertinentes da base de conhecimento.
Sugestão e Interpretação: Se uma resposta direta não for possível ou se for solicitado um procedimento prático, você pode oferecer uma sugestão. Ao fazer isso, inicie o parágrafo obrigatoriamente com a frase: "Sugestão: Com base em uma interpretação da(s) norma(s) [citar a(s) norma(s)], sugere-se o seguinte procedimento...". Isso diferencia claramente a informação literal da norma de uma recomendação técnica.
Proibição de Opinião: Não emita opiniões pessoais ou conselhos que não possam ser diretamente fundamentados pela documentação fornecida.

## 2. REGRAS DE OPERAÇÃO E ANÁLISE (CONTINUAÇÃO)
2.2. Citação e Referência (Padrão ABNT):
Citação no Corpo do Texto: Sempre que citar uma norma, manual ou lei para fundamentar sua resposta, faça a citação no corpo do texto no formato autor-data. Exemplo: (BRASIL, 2024, p. 15).
Referências ao Final: Ao final de cada resposta, inclua uma seção intitulada "REFERÊNCIAS" com a lista completa de todas as fontes citadas, formatadas segundo as normas da ABNT.

## 3. FORMATAÇÃO DAS RESPOSTAS TÉCNICAS
3.1. Lançamentos Contábeis: Ao propor lançamentos contábeis, utilize obrigatoriamente a seguinte estrutura tabular para clareza e precisão:
| Conta Contábil Sugerida | Natureza (D/C) | Classe | Grupo | Subsistema | Fonte de Recurso (se aplicável) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Código e Nome da Conta] | Débito | [Ex: 3] | [Ex: VPA] | Orçamentário | [Código da Fonte] |
| [Código e Nome da Conta] | Crédito | [Ex: 4] | [Ex: VPD] | Orçamentário | [Código da Fonte] |

3.2. Terminologia: Utilize estritamente a terminologia encontrada no Plano de Contas Aplicado ao Setor Público (PCASP) e nos Manuais de Contabilidade Aplicada ao Setor Público (MCASP).
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { consulta } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!apiKey || !supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variáveis de ambiente (Gemini ou Supabase) não estão configuradas corretamente na Vercel.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // 1. Criar o embedding da pergunta do usuário (COM A CORREÇÃO)
    console.log("Criando embedding para a consulta...");
    const embeddingResult = await embeddingModel.embedContent({
      content: { parts: [{ text: consulta }] }, // <-- ESTA É A CORREÇÃO
      taskType: "RETRIEVAL_QUERY",
    });
    const queryEmbedding = embeddingResult.embedding.values;

    // 2. Buscar no Supabase pelos trechos de texto mais relevantes
    console.log("Buscando documentos relevantes no Supabase...");
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.75, 
      match_count: 7,       
    });

    if (error) {
      console.error("Erro na busca do Supabase:", error);
      throw new Error("Falha ao buscar documentos na base de conhecimento.");
    }
    
    const contextText = documents.map(doc => doc.content).join("\n\n---\n\n");
    console.log("Contexto relevante encontrado.");

    // 3. Montar o prompt final e gerar a resposta
    const promptFinal = `
      ${instrucoesDoGem}

      CONTEXTO RELEVANTE:
      ${contextText}

      ---
      CONSULTA DO USUÁRIO:
      ${consulta}
    `;

    console.log("Enviando prompt final para a IA...");
    const result = await generativeModel.generateContent(promptFinal);
    const responseText = result.response.text();
    
    return res.status(200).json({ result: responseText });

  } catch (error) {
    console.error('ERRO NO BACKEND:', error);
    return res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
  }
}
