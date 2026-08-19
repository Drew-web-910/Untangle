// content.js
// Walks the page, scores sentences using CognitiveLoad (readability.js),
// and highlights the worst offenders with a hover tooltip.

(function () {
  // 1-10 sensitivity scale. Level 1 flags almost everything, level 10
  // only flags the most extreme, jargon-dense sentences.
  const LEVEL_TO_THRESHOLD = {
    1: 2, 2: 8, 3: 15, 4: 22, 5: 30,
    6: 38, 7: 46, 8: 55, 9: 65, 10: 80,
  };
  const LEVEL_DEFAULT = 5;
  const SELECTOR = 'p, li, blockquote, td, dd, figcaption';
  const PROCESSED_ATTR = 'data-untangle-processed';
  const HIGHLIGHT_CLASS = 'untangle-highlight';

  let threshold = LEVEL_TO_THRESHOLD[LEVEL_DEFAULT];
  let enabled = true;
  let flaggedCount = 0;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Rebuild an element's HTML, wrapping flagged sentences in highlight spans.
  function processElement(el) {
    const text = el.textContent.trim();
    if (text.length < 20) return; // skip trivial fragments

    const results = window.CognitiveLoad.analyzeText(text);
    const flagged = results.filter((r) => r.score >= threshold);
    if (flagged.length === 0) {
      el.setAttribute(PROCESSED_ATTR, 'true');
      return;
    }

    let html = escapeHtml(text);
    // Replace longest sentences first to avoid partial-match collisions.
    const sorted = [...flagged].sort((a, b) => b.sentence.length - a.sentence.length);
    sorted.forEach((r, i) => {
      const escaped = escapeHtml(r.sentence);
      if (html.indexOf(escaped) === -1) return;
      const meta = encodeURIComponent(
        JSON.stringify({
          grade: Math.round(r.grade * 10) / 10,
          longWordRatio: Math.round(r.longWordRatio * 100),
          clauseCount: r.clauseCount,
          passive: r.passive,
          jargon: r.jargon,
          score: Math.round(r.score),
        })
      );
      const span = `<span class="${HIGHLIGHT_CLASS}" data-untangle-meta="${meta}" data-untangle-id="uid-${Date.now()}-${i}">${escaped}</span>`;
      html = html.replace(escaped, span);
    });

    el.innerHTML = html;
    el.setAttribute(PROCESSED_ATTR, 'true');
    flaggedCount += flagged.length;
  }

  function scanPage() {
    if (!enabled) return;
    const elements = document.querySelectorAll(SELECTOR);
    elements.forEach((el) => {
      if (el.hasAttribute(PROCESSED_ATTR)) return;
      if (el.closest('script, style, textarea, input, [contenteditable="true"]')) return;
      processElement(el);
    });
    chrome.runtime.sendMessage({ type: 'UNTANGLE_STATS', flaggedCount }).catch(() => {});
  }

  // --- Tooltip ---
  let tooltipEl = null;

  function ensureTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'untangle-tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function describeReasons(meta) {
    const reasons = [];
    if (meta.grade >= 12) reasons.push(`Reads at a grade ${meta.grade} level`);
    if (meta.longWordRatio >= 20) reasons.push(`${meta.longWordRatio}% long/complex words`);
    if (meta.clauseCount >= 3) reasons.push(`${meta.clauseCount} nested clauses`);
    if (meta.passive) reasons.push('Passive voice');
    if (meta.jargon) reasons.push('Jargon detected');
    return reasons.length ? reasons : ['Dense sentence structure'];
  }

  function showTooltip(target) {
    const meta = JSON.parse(decodeURIComponent(target.getAttribute('data-untangle-meta')));
    const tip = ensureTooltip();
    const reasons = describeReasons(meta);

    tip.innerHTML = `
      <div class="untangle-tooltip-header">Complexity score: ${meta.score}</div>
      <ul class="untangle-tooltip-reasons">
        ${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
      <button class="untangle-simplify-btn" type="button">Simplify this sentence</button>
    `;

    const rect = target.getBoundingClientRect();
    tip.style.display = 'block';
    tip.style.top = `${window.scrollY + rect.bottom + 2}px`;
    tip.style.left = `${window.scrollX + rect.left}px`;

    const btn = tip.querySelector('.untangle-simplify-btn');
    btn.addEventListener('click', () => {
      btn.textContent = 'Simplifying...';
      btn.disabled = true;
      chrome.runtime
        .sendMessage({ type: 'UNTANGLE_SIMPLIFY', sentence: target.textContent })
        .then((res) => {
          if (res && res.rewrite) {
            btn.outerHTML = `<div class="untangle-rewrite">${escapeHtml(res.rewrite)}</div>`;
          } else {
            btn.textContent = 'Failed — try again';
            btn.disabled = false;
          }
        })
        .catch(() => {
          btn.textContent = 'Failed — try again';
          btn.disabled = false;
        });
    });
  }

  let hideTimer = null;

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideTooltip, 300);
  }

  function cancelHide() {
    clearTimeout(hideTimer);
  }

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(`.${HIGHLIGHT_CLASS}`);
    if (target) {
      cancelHide();
      showTooltip(target);
    }
    if (e.target.closest('.untangle-tooltip')) {
      cancelHide();
    }
  });

  document.addEventListener('mouseout', (e) => {
    const leavingHighlight = e.target.closest(`.${HIGHLIGHT_CLASS}`);
    const leavingTooltip = e.target.closest('.untangle-tooltip');
    if (leavingHighlight || leavingTooltip) {
      scheduleHide();
    }
  });

  // --- Init: load settings, then scan ---
  chrome.storage.sync.get(['untangleEnabled', 'untangleLevel'], (settings) => {
    enabled = settings.untangleEnabled !== false;
    const level = settings.untangleLevel || LEVEL_DEFAULT;
    threshold = LEVEL_TO_THRESHOLD[level] || LEVEL_TO_THRESHOLD[LEVEL_DEFAULT];
    if (enabled) scanPage();
  });

  // Re-scan on dynamic content changes (debounced).
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scanPage, 800);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();