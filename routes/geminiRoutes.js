const express = require("express");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { protect } = require("../middleware");

const router = express.Router();

router.post("/chat", protect, async (req, res) => {
  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log("Gemini request received:", { prompt: prompt?.substring(0, 50), hasApiKey: !!apiKey });
  
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
  }

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    // Simple call to Gemini 1.5 Flash via REST (text-only)
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...(Array.isArray(history) ? history : []),
          { role: "user", parts: [{ text: prompt }] }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return res.status(500).json({ message: "Gemini API error: " + response.status });
    }
    
    const data = await response.json();
    console.log("Gemini response:", data);
    
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "Sorry, I couldn't generate a response.";
    return res.status(200).json({ reply: text });
  } catch (e) {
    console.error("Gemini request failed:", e);
    return res.status(500).json({ message: "Gemini request failed: " + e.message });
  }
});

module.exports = router;


