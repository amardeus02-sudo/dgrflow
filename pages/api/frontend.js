async function createJob() {
  try {
    const response = await fetch('/api/create-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Novo Job',
        description: 'Descrição do job',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar job');
    }

    console.log('Sucesso:', data);
  } catch (error) {
    console.error('Erro:', error);
  }
}
