import OpenAI from "openai";
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
  },
});
export default async function initialize() {
  const completion = await openai.chat.completions.create({
    model: "deepseek/deepseek-r1:free",
    messages: [
      {
        role: "user",
        content: "Qual o significado da vida?",
      },
    ],
  });

  console.log(completion.choices[0].message);
}
