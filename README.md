# Untangle

A Chrome extension that finds hard-to-read sentences on any webpage,
underlines them, and explains *why* they're dense — with an optional
AI-powered rewrite on demand.

## Why

Dense writing hides in plain sight — legal pages, government sites,
academic articles, insurance policies. Untangle surfaces it as you read,
instead of leaving you to notice (or not) that a sentence just didn't land.

## Features

- **Instant, local detection.** Every sentence on a page is scored the
  moment it loads, using a custom implementation of the Flesch-Kincaid
  Grade Level formula combined with heuristics for long-word density,
  nested clauses, passive voice, and jargon. No API calls, no network
  requests, no delay — it works completely offline.
- **Explainable, not just flagged.** Hovering a flagged sentence shows a
  breakdown of *why* it was flagged (grade level, jargon, passive voice,
  clause count) instead of a black-box score.
- **Adjustable sensitivity.** A 1-10 slider in the popup controls how
  aggressively sentences get flagged, from "only the most extreme" to
  "flag almost anything moderately complex."
- **AI-powered rewrite, on demand.** Click "Simplify this sentence" to
  get a plain-language rewrite from a Meta Llama model — called only when
  you ask, keeping API usage minimal.
- **AI second opinion.** A separate "Check with AI" button independently
  asks the model whether a flagged sentence is genuinely complex, useful
  for sanity-checking edge cases the local heuristic might get wrong.
- **On/off toggle**, right from the extension icon.

## How it works

```
readability.js   ->  Pure scoring engine. Splits text into sentences,
                      computes Flesch-Kincaid grade + jargon/clause
                      heuristics. Zero dependencies, zero network calls.

content.js       ->  Walks the page DOM, calls readability.js on real
                      text elements, highlights flagged sentences, and
                      renders the hover tooltip.

background.js    ->  Service worker. Handles "Simplify" and "Check with
                      AI" requests by calling a Meta Llama model hosted
                      on Hugging Face's Inference API.

popup.html/js    ->  Toolbar popup - on/off toggle and sensitivity slider.

options.html/js  ->  Where you add your own Hugging Face API key.
```

## Installation

Untangle isn't published on the Chrome Web Store - it's built to be run
locally, which also means it's fully inspectable (nothing hidden, no
build step, just readable source).

1. Clone this repo:
   ```
   git clone https://github.com/<your-username>/untangle.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the cloned folder
5. Pin the Untangle icon to your toolbar for easy access

The highlighting works immediately with zero setup. The "Simplify" and
"Check with AI" buttons need a free API key - see
[**SETUP.md**](./SETUP.md) for a 2-minute walkthrough.

## Tech

Vanilla JavaScript, Chrome Extension Manifest V3, Hugging Face Inference
API (Meta Llama 3.2). No build tools, no bundler, no dependencies -
everything runs directly as-is.

## Status

Core features are complete and working:
- [x] Local readability scoring engine
- [x] DOM scanning + sentence highlighting
- [x] Hover tooltip with explanation
- [x] Popup with on/off toggle + sensitivity slider
- [x] Llama-powered "Simplify" rewrite
- [x] Llama-powered "Check with AI" verification
- [x] Options page for API key setup

## License

MIT - see [LICENSE](./LICENSE).