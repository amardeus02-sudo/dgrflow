export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🔎 validação do body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vazio' });
    }

    const { title, description } = req.body;

    // 🔎 validação dos campos
    if (!title || !description) {
      return res.status(400).json({
        error: 'Campos obrigatórios: title e description',
      });
    }

    // 💾 Simulação de criação (substitua pelo seu banco)
    const newJob = {
      id: Date.now(),
      title,
      description,
      createdAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      job: newJob,
    });

  } catch (error) {
    console.error('Erro interno:', error);

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
    });
  }
}
