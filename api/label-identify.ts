type LabelIdentifyRequest = {
  body?: {
    imageDataUrl?: string;
    fileName?: string;
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
            content:
              "You identify wine bottles from label photos. Return only valid compact JSON. If unsure, use nulls and a lower confidence."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  `File name: ${fileName}`,
                  "Read the visible wine label and identify the bottle.",
                  "Return JSON with: name, producer, vintage, region, country, grape array, appellation, style, raw_text, lookup_queries array, confidence number 0-1, note.",
                  "Prefer the actual front-label text over guesses. Include producer and vintage when visible. For style use one of Red, White, Rose, Orange, Sparkling, Unknown."
                ].join("\n")
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
