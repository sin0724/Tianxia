import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CampaignTranslationInput {
  title_ko: string;
  brand_name_ko: string;
  summary_ko: string;
  description_ko: string;
  benefits_ko: string;
  requirements_ko: string;
  precautions_ko?: string;
}

export interface CampaignTranslationOutput {
  title_zh_tw: string;
  brand_name_zh_tw: string;
  summary_zh_tw: string;
  description_zh_tw: string;
  benefits_zh_tw: string;
  requirements_zh_tw: string;
  precautions_zh_tw?: string;
}

export async function translateCampaignToZhTw(
  input: CampaignTranslationInput
): Promise<CampaignTranslationOutput> {
  const fieldsToTranslate = {
    title: input.title_ko,
    brand_name: input.brand_name_ko,
    summary: input.summary_ko,
    description: input.description_ko,
    benefits: input.benefits_ko,
    requirements: input.requirements_ko,
    ...(input.precautions_ko && { precautions: input.precautions_ko }),
  };

  const prompt = `你是一位專業的韓文到繁體中文翻譯專家。請將以下韓文內容翻譯成台灣繁體中文。

要求：
1. 使用台灣慣用的繁體中文表達方式
2. 保持原文的語氣和風格
3. 專有名詞和品牌名稱請適當音譯或保留原文
4. 翻譯要自然流暢，符合台灣讀者的閱讀習慣

請將以下JSON中的韓文內容翻譯成繁體中文，並以相同的JSON格式回覆（只需要回覆JSON，不要有其他文字）：

${JSON.stringify(fieldsToTranslate, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse translation response");
  }

  const translated = JSON.parse(jsonMatch[0]);

  return {
    title_zh_tw: translated.title,
    brand_name_zh_tw: translated.brand_name,
    summary_zh_tw: translated.summary,
    description_zh_tw: translated.description,
    benefits_zh_tw: translated.benefits,
    requirements_zh_tw: translated.requirements,
    precautions_zh_tw: translated.precautions || null,
  };
}
