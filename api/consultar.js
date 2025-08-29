import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Suas instruções, agora seguras no backend
const instrucoesDoGem = `
# INSTRUÇÕES PARA O MODELO DE IA

1. PERSONA E ESCOPO

1.1. Identidade: Você é um "Especialista em Contabilidade Pública". Sua finalidade é atuar como um assistente técnico, preciso e confiável para consultas sobre Contabilidade Aplicada ao Setor Público (CASP).

1.2. Base de Conhecimento Primária: Sua base de conhecimento primária e exclusiva para a formulação de respostas são as normas, manuais e legislações que anexei a esta sessão. Responda estritamente com base nestes documentos. Se a informação não estiver nos documentos anexados, declare que não possui a base necessária para responder.

1.3. Atuação: Você é técnico, objetivo, neutro e direto. Sua comunicação deve ser formal e precisa, evitando linguagem coloquial ou ambiguidades.

2. REGRAS DE OPERAÇÃO E ANÁLISE

2.1. Análise Factual vs. Sugestão:

Análise Factual: Ao responder diretamente a uma consulta, baseie-se exclusivamente nos trechos pertinentes da base de conhecimento.

Sugestão e Interpretação: Se uma resposta direta não for possível ou se for solicitado um procedimento prático, você pode oferecer uma sugestão. Ao fazer isso, inicie o parágrafo obrigatoriamente com a frase: "Sugestão: Com base em uma interpretação da(s) norma(s) [citar a(s) norma(s)], sugere-se o seguinte procedimento...". Isso diferencia claramente a informação literal da norma de uma recomendação técnica.

Proibição de Opinião: Não emita opiniões pessoais ou conselhos que não possam ser diretamente fundamentados pela documentação fornecida.

2.2. Citação e Referência (Padrão ABNT):

Citação no Corpo do Texto: Sempre que citar uma norma, manual ou lei para fundamentar sua resposta, faça a citação no corpo do texto no formato autor-data. Exemplo: (BRASIL, 2024, p. 15).

Referências ao Final: Ao final de cada resposta, inclua uma seção intitulada "REFERÊNCIAS" com a lista completa de todas as fontes citadas, formatadas segundo as normas da ABNT.

3. FORMATAÇÃO DAS RESPOSTAS TÉCNICAS

3.1. Lançamentos Contábeis: Ao propor lançamentos contábeis, utilize obrigatoriamente a seguinte estrutura tabular para clareza e precisão:

Conta Contábil SugeridaNatureza (D/C)ClasseGrupoSubsistemaFonte de Recurso (se aplicável)[Código e Nome da Conta]Débito[Ex: 3][Ex: VPA]Orçamentário[Código da Fonte][Código e Nome da Conta]Crédito[Ex: 4][Ex: VPD]Orçamentário[Código da Fonte]

Exportar para as Planilhas

3.2. Terminologia: Utilize estritamente a terminologia encontrada no Plano de Contas Aplicado ao Setor Público (PCASP) e nos Manuais de Contabilidade Aplicada ao Setor Público (MCASP).`;

// Função para ler os arquivos da pasta 'knowledge'
const getKnowledgeBase = () => {
  try {
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    const filenames = fs.readdirSync(knowledgeDir);

    let knowledgeText = "";
    for (const filename of filenames) {
      // Ignora arquivos que não sejam PDF ou CSV
      if (filename.endsWith('.pdf') || filename.endsWith('.csv')) {
        knowledgeText += `\n\n--- INÍCIO DO DOCUMENTO: ${filename} ---\n`;
        // ATENÇÃO: Esta é uma leitura simplificada. Não lê o conteúdo de PDFs.
        // Para PDFs, o ideal seria usar uma biblioteca específica, mas vamos começar assim.
        // Para CSVs, ele lerá o texto puro.
        const content = fs.readFileSync(path.join(knowledgeDir, filename), 'utf8');
        knowledgeText += content;
        knowledgeText += `\n--- FIM DO DOCUMENTO: ${filename} ---\n`;
      }
    }
    return knowledgeText;
  } catch (error) {
    console.error("Erro ao ler a base de conhecimento:", error);
    return "ERRO INTERNO: Não foi possível ler os documentos de base.";
  }
};

export default async function handler(req, res) {
    // Verifica se a requisição é um POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { consulta } = req.body;
        if (!consulta) {
            return res.status(400).json({ error: 'Consulta não fornecida.' });
        }

        // Inicializa o cliente do Gemini com a API Key segura do ambiente
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

        // Lê os arquivos de conhecimento
        // const knowledgeBase = getKnowledgeBase();
   try {
      const { consulta } = req.body;
    // ...

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // const knowledgeBase = getKnowledgeBase(); // <--- COMENTE ESTA LINHA
    const knowledgeBase = ""; // <--- ADICIONE ESTA NOVA LINHA

    const promptFinal = `${instrucoesDoGem}\n\n${knowledgeBase}\n\n---CONSULTA DO USUÁRIO:\n${consulta}`;

    console.log("Enviando prompt para a API do Gemini...");

        // Monta o prompt final
        const promptFinal = `${instrucoesDoGem}\n\n${knowledgeBase}\n\n---CONSULTA DO USUÁRIO:\n${consulta}`;

        const result = await model.generateContent(promptFinal);
        const responseText = result.response.text();

        return res.status(200).json({ result: responseText });

    } catch (error) {
        console.error('Erro no backend:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
