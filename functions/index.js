/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Groq = require("groq-sdk");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const genPromptT = (context) => {
  return `
    You are a Content Takeaway Bot.

    Analyze the following content and extract key takeaways:
    
CONTEXT:
${context}

Guidelines:
1. Read through the entire content carefully
2. Identify at least 10 key takeaways from each paragraph
3. Ensure no important information is missed
4. Present takeaways as concise bullet points
5. Use clear, simple language
6. Maintain the original meaning and context
7. Number each takeaway for easy reference
8. If the content has subsections, group takeaways accordingly

Output Format:
- List all takeaways as numbered bullet points
- If applicable, use subheadings to organize takeaways by content sections
- Ensure each takeaway is a complete thought, even if brief

Additional Notes:
- Generate as many takeaways as needed to cover all important points
- Avoid repetition, but don't miss nuances or related ideas
- Avoid direct promotional content
- Focus on providing value to the reader
- Focus on facts, insights, and actionable information
- Include relevant statistics or data points if present in the content

Aim to create a comprehensive list of takeaways that could serve as a detailed summary of the entire content.
`;
};

const groq = new Groq({
  apiKey: process.env["GROQ_API_KEY"], // This is the default and can be omitted
});

async function main(query) {
  let prompt = genPromptT(query);
//   console.log(prompt);
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-8b-8192",
  });

  let res = chatCompletion.choices[0].message.content;
  console.log(res);
  return res;
}

app.get("/", (req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from App!");
});

// middleware to check for x-api-key in header and validate it
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env["API_KEY"]) {
    next();
  } else {
    res.status(401).send("Invalid API Key");
  }
});

app.post("/api", async (req, res) => {
  // get data field from body of post request
  const data = req.body;
//   console.log(data.data);
  const result = await main(JSON.stringify(data.data));
  res.json({ result: result });
});

exports.app = onRequest(app);
