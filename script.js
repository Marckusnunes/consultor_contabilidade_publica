const gerarBtn = document.getElementById('gerarBtn');
const userInput = document.getElementById('userInput');
const resultadoDiv = document.getElementById('resultado');

gerarBtn.addEventListener('click', async () => {
    if (!userInput.value) {
        alert("Por favor, digite sua consulta.");
        return;
    }

    gerarBtn.disabled = true;
    resultadoDiv.innerHTML = "<p>Processando consulta técnica... Isso pode levar um momento.</p>";

    try {
        // Agora a chamada é para o nosso próprio backend na Vercel
        const response = await fetch('/api/consultar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                consulta: userInput.value
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Mostra o erro vindo do nosso backend
            throw new Error(data.error || 'Erro na comunicação com o servidor.');
        }

        resultadoDiv.innerText = data.result;

    } catch (error) {
        console.error("Erro:", error);
        resultadoDiv.innerHTML = `<p style="color: red;">Ocorreu um erro: ${error.message}</p>`;
    } finally {
        gerarBtn.disabled = false;
    }
});
