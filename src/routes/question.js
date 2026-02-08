/** @format */

require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const questionRouter = express.Router();
const axios = require("axios");
const fs = require("fs");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

questionRouter.post("/ask", async (req, res) => {
  try {
    // Hardcoded for now (can read from req.body later)
    const question =
      req.body.question || "Explain quantum computing in simple terms.";

    const response = await client.chat.completions.create({
      model: "gpt-4o", // fast + affordable
      messages: [
        {
          role: "system",
          content: `You are a senior CBSE question paper setter.

MANDATORY RULES:
1. Generate ALL sections.
2. Follow question counts EXACTLY.
3. If any section is incomplete, REGENERATE internally.
4. Do NOT stop early.
5. Verify counts before final answer.`,
        },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 700,
    });

    const answer = response.choices[0].message.content;

    res.json({
      success: true,
      question,
      answer,
    });
  } catch (error) {
    console.error("OPENAI ERROR:", error);

    res.status(500).json({
      success: false,
      error: "AI service failed",
      details: error.message,
    });
  }
});

questionRouter.post("/ocr", async (req, res) => {
  const API_KEY = process.env.HF_API;
  const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: API_KEY,
  });
  const imageBuffer = fs.readFileSync("src/assets/four.jpeg");
  console.log("Image buffer:", imageBuffer);
  const base64Image = imageBuffer.toString("base64");
  try {
    const chatCompletion = await client.chat.completions.create({
      model: "Qwen/Qwen2.5-VL-72B-Instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
You are an OCR engine.

Extract ALL text from the image exactly as written.
Rules:
- Do NOT describe the image.
- Do NOT summarize.
- Preserve line breaks.
- Preserve table structure using Markdown tables.
- Convert mathematical formulas to LaTeX.
- If something is unreadable, write [UNCLEAR].
- Output ONLY the extracted content.
`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    res.json(chatCompletion.choices[0].message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

questionRouter.post("/ocr-pdf", async (req, res) => {
  try {
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_API,
    });

    const pdfPath = "src/assets/Science-SQP_removed.pdf";

    // 1️⃣ PDF → Images
    const { pdf } = await import("pdf-to-img");
    const document = await pdf(pdfPath, { scale: 3 });

    let fullText = "";
    let pageNo = 1;

    for await (const imageBuffer of document) {
      const base64Image = imageBuffer.toString("base64");

      // 2️⃣ OCR via LLM
      const completion = await client.chat.completions.create({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
You are an OCR engine.

Extract ALL text exactly as written.
Rules:
- Do NOT describe the image
- Preserve line breaks
- Preserve tables using Markdown
- Convert formulas to LaTeX
- Output ONLY extracted content
`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });

      fullText += `\n\n--- PAGE ${pageNo} ---\n\n`;
      fullText += completion.choices[0].message.content;
      pageNo++;
    }

    res.json({ extractedText: fullText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = questionRouter;
