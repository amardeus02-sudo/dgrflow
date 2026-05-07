import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Missing SDS text",
      });
    }

    const prompt = `
You are a dangerous goods specialist.

Analyze this SDS and identify:

- UN Number
- Proper Shipping Name
- Hazard Class
- Packing Group

Return ONLY valid JSON.

SDS:
${text}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    const result = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Classification failed",
    });
  }
}
