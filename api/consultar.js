import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

// Suas instruções completas, incorporadas diretamente no código.
const instrucoesDoGem = `
# INSTRUÇÕES PARA O MODELO DE IA

## 1. PERSONA E ESCOPO
1.1. Identidade: Você é um "Especialista em Contabilidade Pública". Sua finalidade é atuar como um assistente técnico, preciso e confiável para consultas sobre Contabilidade Aplicada ao Setor Público (CASP).
1.2. Base de Conhecimento Primária: Sua base de conhecimento primária e exclusiva para a formulação de respostas são as normas, manuais e legislações que anexei a esta sessão. Responda estritamente com base nestes documentos. Se a informação não estiver nos documentos anexados, declare que não possui a base necessária para responder.
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

// Nova função para ler os arquivos, incluindo PDFs
const getKnowledgeBase = async () => {
  try {
    console.log("Iniciando leitura da base de conhecimento...");
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    const filenames = fs.readdirSync(knowledgeDir);
    
    let knowledgeText = "";

    // Para teste, vamos ler apenas UM arquivo para não estourar a cota
    const fileToRead = filenames.find(f => f.endsWith('.pdf') || f.endsWith('.csv'));
    
    if (fileToRead) {
        console.log(`Lendo o arquivo de teste: ${fileToRead}`);
        const filePath = path.join(knowledgeDir, fileToRead);
        knowledgeText += `\n\n--- INÍCIO DO DOCUMENTO: ${fileToRead} ---\n`;
        
        if (fileToRead.endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            knowledgeText += data.text;
        } else { // Para .csv e outros arquivos de texto
            const content = fs.readFileSync(filePath, 'utf8');
            knowledgeText += content;
        }
        knowledgeText += `\n--- FIM DO DOCUMENTO: ${fileToRead} ---\n`;
    } else {
        console.log("Nenhum arquivo PDF ou CSV encontrado para teste.");
    }
    
    console.log("Leitura da base de conhecimento de teste concluída.");
    return knowledgeText;
  } catch (error) {
    console.error("ERRO CRÍTICO ao ler a base de conhecimento:", error);
    return `ERRO INTERNO: Não foi possível ler os documentos de base. Detalhe: ${error.message}`;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { consulta } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // AGORA VAMOS LER (APENAS UM) ARQUIVO
    const knowledgeBase = await getKnowledgeBase();

    // Se a base de conhecimento estiver vazia, retornamos a resposta padrão
    if (!knowledgeBase || knowledgeBase.trim() === "") {
        return res.status(200).json({ result: "Não foi possível encontrar documentos na base de conhecimento para responder à consulta." });
    }

    const promptFinal = `${instrucoesDoGem}\n\n${knowledgeBase}\n\n---CONSULTA DO USUÁRIO:\n${consulta}`;

    const result = await model.generateContent(promptFinal);
    const responseText = result.response.text();
    
    return res.status(200).json({ result: responseText });

  } catch (error) {
    console.error('ERRO NO BACKEND:', error);
    return res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
  }
}
