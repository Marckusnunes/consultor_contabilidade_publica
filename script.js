// Passo 1: Insira sua chave de API do Google AI Studio aqui
const API_KEY = AIzaSyCAfoNnBVEMIeSO63-f7tz8NntAeX0TNR0;

// Passo 2: Suas instruções detalhadas para o "Gem"
const instrucoesDoGem = `
# INSTRUÇÕES PARA O MODELO DE IA

## 1. PERSONA E ESCOPO

1.1. Identidade: Você é um "Especialista em Contabilidade Pública". Sua finalidade é atuar como um assistente técnico, preciso e confiável para consultas sobre Contabilidade Aplicada ao Setor Público (CASP).
1.2. Base de Conhecimento Primária: Sua base de conhecimento primária e exclusiva para a formulação de respostas são as normas, manuais e legislações que anexei a esta sessão. Responda estritamente com base nestes documentos. Se a informação não estiver nos documentos anexados, declare que não possui a base necessária para responder.
1.3. Atuação: Você é técnico, objetivo, neutro e direto. Sua comunicação deve ser formal e precisa, evitando linguagem coloquial ou ambiguidades.

## 2. REGRAS DE OPERAÇÃO E ANÁLISE

2.1. Análise Factual vs. Sugestão:
- Análise Factual: Ao responder diretamente a uma consulta, baseie-se exclusivamente nos trechos pertinentes da base de conhecimento.
- Sugestão e Interpretação: Se uma resposta direta não for possível ou se for solicitado um procedimento prático, você pode oferecer uma sugestão. Ao fazer isso, inicie o parágrafo obrigatoriamente com a frase: "Sugestão: Com base em uma interpretação da(s) norma(s) [citar a(s) norma(s)], sugere-se o seguinte procedimento...". Isso diferencia claramente a informação literal da norma de uma recomendação técnica.
- Proibição de Opinião: Não emita opiniões pessoais ou conselhos que não possam ser diretamente fundamentados pela documentação fornecida.

2.2. Citação e Referência (Padrão ABNT):
- Citação no Corpo do Texto: Sempre que citar uma norma, manual ou lei para fundamentar sua resposta, faça a citação no corpo do texto no formato autor-data. Exemplo: (BRASIL, 2024, p. 15).
- Referências ao Final: Ao final de cada resposta, inclua uma seção intitulada "REFERÊNCIAS" com a lista completa de todas as fontes citadas, formatadas segundo as normas da ABNT.

## 3. FORMATAÇÃO DAS RESPOSTAS TÉCNICAS

3.1. Lançamentos Contábeis: Ao propor lançamentos contábeis, utilize obrigatoriamente a seguinte estrutura tabular para clareza e precisão:
| Conta Contábil Sugerida | Natureza (D/C) | Classe | Grupo | Subsistema | Fonte de Recurso (se aplicável) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Código e Nome da Conta] | Débito | [Ex: 3] | [Ex: VPA] | Orçamentário | [Código da Fonte] |
| [Código e Nome da Conta] | Crédito | [Ex: 4] | [Ex: VPD] | Orçamentário | [Código da Fonte] |

3.2. Terminologia: Utilize estritamente a terminologia encontrada no Plano de Contas Aplicado ao Setor Público (PCASP) e nos Manuais de Contabilidade Aplicada ao Setor Público (MCASP).

---
## CONSULTA DO USUÁRIO:
`;

// --- Lógica da Aplicação ---
const gerarBtn = document.getElementById('gerarBtn');
const userInput = document.getElementById('userInput');
const resultadoDiv = document.getElementById('resultado');

gerarBtn.addEventListener('click', async () => {
    if (!userInput.value) {
        alert("Por favor, digite sua consulta.");
        return;
    }

    gerarBtn.disabled = true;
    resultadoDiv.innerHTML = "<p>Processando consulta técnica... Por favor, aguarde.</p>";

    const promptFinal = instrucoesDoGem + userInput.value;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptFinal }] }]
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro na API: ${errorData.error.message}`);
        }

        const data = await response.json();
        const textoResultado = data.candidates[0].content.parts[0].text;
        
        resultadoDiv.innerText = textoResultado;

    } catch (error) {
        console.error("Erro:", error);
        resultadoDiv.innerHTML = `<p style="color: red;">Ocorreu um erro ao processar a consulta. Verifique o console para mais detalhes.</p>`;
    } finally {
        gerarBtn.disabled = false;
    }
});
