# QVAC Word Meaning Simplifier

Enter a complex or jargon word and an on-device AI gives a simple one-sentence definition plus an example sentence. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:32035

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

Type a complex or jargon word or term into the form and submit it. The server sends the model a short system prompt plus two few-shot examples that show the exact "Definition: ... / Example: ..." format expected. The streamed reply is parsed into those two fields, checked for refusal phrases and for at least a loose keyword overlap with the input term (so the definition doesn't silently drift onto an unrelated word), and shown as a definition plus an example sentence. If anything looks off, a generic but grammatically safe fallback definition/example pair is shown instead.

**Example**

- Input: `ubiquitous`
- Output — Definition: "Present or seeming to be present everywhere at once." Example: "Smartphones have become ubiquitous in modern daily life."

## License

MIT
