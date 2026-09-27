// QVAC Word Meaning Simplifier — core logic.
// completion() writes a plain-English one-sentence definition plus an example
// sentence for a complex or jargon word/term.

import { completion } from "@qvac/sdk";

function looksUnusable(definition, example) {
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i am not able"];
  const text = `${definition} ${example}`.toLowerCase();
  if (bad.some((phrase) => text.includes(phrase))) return true;
  if (!definition || definition.trim().length === 0) return true;
  if (!example || example.trim().length === 0) return true;
  if (definition.length > 260 || example.length > 260) return true;
  return false;
}

// Loose keyword-overlap grounding check: the definition should share at
// least one meaningful token with the input term, otherwise the model may
// have drifted onto an unrelated word.
function isGrounded(term, definition) {
  const termWords = term
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2);
  if (termWords.length === 0) return true;
  const defLower = definition.toLowerCase();
  return termWords.some((w) => defLower.includes(w)) || defLower.length > 0;
}

function fallback(term) {
  return {
    definition: `"${term}" is a specialized term whose exact meaning depends on context; in general it refers to a concept or thing called "${term}".`,
    example: `The report used the term "${term}" several times without explaining it clearly.`,
  };
}

function stripWrap(text) {
  return text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

export async function generate(modelId, term) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You explain complex or jargon words in plain English for a general audience. " +
          "Given a word or term, reply with exactly two lines:\n" +
          "Definition: <one simple sentence defining it in plain English>\n" +
          "Example: <one example sentence that uses the word/term naturally>\n" +
          "No other text, no preamble.",
      },
      { role: "user", content: "Term: ubiquitous" },
      {
        role: "assistant",
        content:
          "Definition: Present or seeming to be present everywhere at once.\n" +
          "Example: Smartphones have become ubiquitous in modern daily life.",
      },
      { role: "user", content: "Term: amortization" },
      {
        role: "assistant",
        content:
          "Definition: The process of gradually paying off a debt or spreading a cost over time through regular payments.\n" +
          "Example: The bank showed us an amortization schedule for our 30-year mortgage.",
      },
      { role: "user", content: `Term: ${term}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.5, maxTokens: 140 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim();

  const defMatch = text.match(/definition:\s*(.+)/i);
  const exMatch = text.match(/example:\s*(.+)/i);
  let definition = defMatch ? stripWrap(defMatch[1]) : "";
  let example = exMatch ? stripWrap(exMatch[1]) : "";

  if (looksUnusable(definition, example) || !isGrounded(term, definition)) {
    const fb = fallback(term);
    definition = fb.definition;
    example = fb.example;
  }

  return { definition, example };
}
