type LabelIdentifyRequest = {
  body?: {
    imageDataUrl?: string;
    fileName?: string;
    mode?: "wine-label" | "menu-item";
  };
  method?: string;
};

type LabelIdentifyResponse = {
  status: (code: number) => LabelIdentifyResponse;
  json: (body: unknown) => void;
};

type OpenAiMessageContent = {
  text?: string;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | OpenAiMessageContent[];
    };
  }>;
};

const fallbackModel = "gpt-5.5";

export default async function handler(request: LabelIdentifyRequest, response: LabelIdentifyResponse) {
  if (request.method && request.method !== "POST") {
    response.status(405).json({ error: "Use POST for label identification." });
    return;
  }

  const imageDataUrl = request.body?.imageDataUrl;
  const fileName = request.body?.fileName ?? "uploaded label";
  const mode = request.body?.mode ?? "wine-label";

  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    response.status(400).json({ error: "Missing image data URL." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(200).json({
      available: false,
      note: "OPENAI_API_KEY is not configured; falling back to browser OCR."
    });
    return;
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || fallbackModel,
        messages: [
          {
            role: "system",
            content: [
              "You analyze user-uploaded food and wine images for a wine pairing app.",
              "Return only valid compact JSON.",
              "Never invent text that is not visible. If the image is unreadable or unrelated, return low confidence and null fields."
            ].join(" ")
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: mode === "menu-item" ? menuPrompt(fileName) : wineLabelPrompt(fileName)
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 700
      })
    });

    if (!upstream.ok) {
      response.status(200).json({
        available: false,
        note: "Vision label identification could not complete; falling back to browser OCR."
      });
      return;
    }

    const payload = (await upstream.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content;
    const text = Array.isArray(content) ? content.map((item) => item.text ?? "").join("\n") : content ?? "";
    const parsed = JSON.parse(text || "{}") as Record<string, unknown>;

    response.status(200).json({
      available: true,
      result: parsed
    });
  } catch {
    response.status(200).json({
      available: false,
      note: "Vision label identification failed; falling back to browser OCR."
    });
  }
}

function wineLabelPrompt(fileName: string) {
  return [
    `File name: ${fileName}`,
    "Read the visible wine label and identify the bottle.",
    "Return JSON with: name, producer, vintage, region, country, grape array, appellation, style, raw_text, lookup_queries array, confidence number 0-1, note.",
    "Prefer exact front-label text over guesses. Include producer and vintage only when visible or strongly implied by visible label text.",
    "For style use one of Red, White, Rose, Orange, Sparkling, Unknown.",
    "If this is not a readable wine label, set name to null, confidence below 0.4, and explain why in note."
  ].join("\n");
}

function menuPrompt(fileName: string) {
  return [
    `File name: ${fileName}`,
    "Read the menu screenshot or food photo.",
    "Return JSON with: meal_description, dish_name, main_ingredients array, cuisine, sauce, protein, raw_text, confidence number 0-1, note.",
    "If it is a menu, extract the most specific visible menu item. If it is a food photo, describe the likely dish without overclaiming.",
    "The meal_description should be one plain-English phrase suitable for wine pairing.",
    "If the image is unreadable or not food/menu related, set meal_description to null and confidence below 0.4."
  ].join("\n");
}
