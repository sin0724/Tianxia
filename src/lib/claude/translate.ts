import Anthropic from "@anthropic-ai/sdk";

export interface CampaignTranslationInput {
  title_ko?: string;
  brand_name_ko?: string;
  summary_ko?: string;
  description_ko?: string;
  benefits_ko?: string;
  requirements_ko?: string;
  precautions_ko?: string;
  service_options_ko?: string;
}

export interface CampaignTranslationOutput {
  title_zh_tw?: string | null;
  brand_name_zh_tw?: string | null;
  summary_zh_tw?: string | null;
  description_zh_tw?: string | null;
  benefits_zh_tw?: string | null;
  requirements_zh_tw?: string | null;
  precautions_zh_tw?: string | null;
  service_options_zh_tw?: string | null;
}

export async function translateCampaignToZhTw(
  input: CampaignTranslationInput
): Promise<CampaignTranslationOutput> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
  }

  // Build only the fields that were actually provided
  const fieldsToTranslate: Record<string, string> = {};
  if (input.title_ko !== undefined) fieldsToTranslate.title = input.title_ko;
  if (input.brand_name_ko !== undefined) fieldsToTranslate.brand_name = input.brand_name_ko;
  if (input.summary_ko !== undefined) fieldsToTranslate.summary = input.summary_ko;
  if (input.description_ko !== undefined) fieldsToTranslate.description = input.description_ko;
  if (input.benefits_ko !== undefined) fieldsToTranslate.benefits = input.benefits_ko;
  if (input.requirements_ko !== undefined) fieldsToTranslate.requirements = input.requirements_ko;
  if (input.precautions_ko !== undefined) fieldsToTranslate.precautions = input.precautions_ko;
  if (input.service_options_ko !== undefined) fieldsToTranslate.service_options = input.service_options_ko;

  const hasContent = Object.values(fieldsToTranslate).some((v) => v.trim() !== "");
  if (!hasContent) {
    return {};
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `你是一位專業的韓文到繁體中文翻譯專家。請將以下韓文內容翻譯成台灣繁體中文。

要求：
1. 使用台灣慣用的繁體中文表達方式
2. 保持原文的語氣和風格
3. 專有名詞和品牌名稱請適當音譯或保留原文
4. 翻譯要自然流暢，符合台灣讀者的閱讀習慣
5. 英文單詞請直接保留英文原文，不需要翻譯（例如：Instagram、Lifting、Botox、Filler 等）

請將以下JSON中的韓文內容翻譯成繁體中文，並以相同的JSON格式回覆（只需要回覆JSON，不要有其他文字）：

${JSON.stringify(fieldsToTranslate, null, 2)}`;

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (apiError: unknown) {
    const err = apiError as { status?: number; message?: string; error?: { message?: string } };
    if (err.status === 401) {
      throw new Error("Anthropic API 인증 실패: API 키가 유효하지 않습니다.");
    }
    if (err.status === 429) {
      throw new Error("Anthropic API 요청 한도 초과: 잠시 후 다시 시도해주세요.");
    }
    if (err.status === 529) {
      throw new Error("Anthropic API 서버 과부하: 잠시 후 다시 시도해주세요.");
    }
    throw new Error(
      `Anthropic API 호출 실패 (${err.status || "unknown"}): ${err.error?.message || err.message || "알 수 없는 오류"}`
    );
  }

  const responseText =
    message.content[0]?.type === "text" ? message.content[0].text : "";

  if (!responseText) {
    throw new Error("번역 API가 빈 응답을 반환했습니다.");
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`번역 응답을 JSON으로 파싱할 수 없습니다. 응답: ${responseText.slice(0, 200)}`);
  }

  let translated;
  try {
    translated = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`번역 JSON 파싱 실패. 응답: ${jsonMatch[0].slice(0, 200)}`);
  }

  // Return only the fields that were in the input
  const result: CampaignTranslationOutput = {};
  if ("title" in fieldsToTranslate) result.title_zh_tw = translated.title || "";
  if ("brand_name" in fieldsToTranslate) result.brand_name_zh_tw = translated.brand_name || "";
  if ("summary" in fieldsToTranslate) result.summary_zh_tw = translated.summary || "";
  if ("description" in fieldsToTranslate) result.description_zh_tw = translated.description || "";
  if ("benefits" in fieldsToTranslate) result.benefits_zh_tw = translated.benefits || "";
  if ("requirements" in fieldsToTranslate) result.requirements_zh_tw = translated.requirements || "";
  if ("precautions" in fieldsToTranslate) result.precautions_zh_tw = translated.precautions || null;
  if ("service_options" in fieldsToTranslate) result.service_options_zh_tw = translated.service_options || null;
  return result;
}
