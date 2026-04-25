import { state } from './state';

// ─── Adult Content Blocker ──────────────────────────────────────────────────

function isPornDomain(): boolean {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();

  const adultKeywords = /(pornhub|xvideos|xnxx|xhamster|redtube|spankbang|eporner|youporn|tube8|nhentai|chaturbate|stripchat|cam4|bonga)/i;

  const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'yandex'];
  const isSearchEngine = searchEngines.some((se) => hostname.includes(se));

  if (!isSearchEngine && adultKeywords.test(url)) {
    return true;
  }

  return false;
}

function buildPornBlockOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'ls-porn-block';
  overlay.innerHTML = `
    <style>
      #ls-porn-block {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #09090b !important;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
      }
      #ls-porn-block * { box-sizing: border-box !important; }
      .ls-porn-bg {
        position: absolute; inset: -20%;
        background: radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 70%);
        filter: blur(80px); pointer-events: none;
      }
      .ls-porn-card {
        position: relative; z-index: 1;
        text-align: center; max-width: 420px; width: 90%;
        padding: 48px 36px;
        border-radius: 24px;
        border: 1px solid rgba(225,29,72,0.15);
        background: rgba(255,255,255,0.03);
        backdrop-filter: blur(20px);
        box-shadow: 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .ls-porn-shield {
        display: inline-flex; align-items: center; justify-content: center;
        width: 72px; height: 72px; margin-bottom: 20px;
        border-radius: 20px;
        background: rgba(225,29,72,0.1);
        border: 1px solid rgba(225,29,72,0.3);
      }
      .ls-porn-shield svg {
        width: 36px; height: 36px;
        stroke: #fb7185; fill: none; stroke-width: 2;
        stroke-linecap: round; stroke-linejoin: round;
      }
      .ls-porn-title {
        font-size: 22px; font-weight: 700; letter-spacing: -0.5px;
        color: #f1f5f9; margin: 0 0 6px 0;
        background: linear-gradient(135deg, #fb7185, #e11d48);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .ls-porn-subtitle {
        font-size: 13px; color: rgba(255,255,255,0.5);
        margin: 0 0 32px 0; font-weight: 400; line-height: 1.5;
      }
      .ls-porn-quote {
        font-size: 13px; font-style: italic; line-height: 1.6;
        color: rgba(255,255,255,0.35); margin: 0 0 8px 0;
      }
      .ls-porn-btn {
        display: inline-block;
        padding: 12px 24px;
        border-radius: 12px;
        background: linear-gradient(to right, #e11d48, #be123c);
        color: #ffffff;
        font-weight: 600;
        font-size: 13px;
        text-decoration: none;
        border: none;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .ls-porn-btn:hover {
        transform: scale(1.02);
      }
    </style>
    <div class="ls-porn-bg"></div>
    <div class="ls-porn-card">
      <div class="ls-porn-shield">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
      </div>
      <h1 class="ls-porn-title">Content Blocked</h1>
      <p class="ls-porn-subtitle">LifeSolver has blocked this website because it appears to contain adult content.</p>
      <p class="ls-porn-quote">"Do not trade what you want most for what you want now."</p>
      <br>
      <div id="ls-porn-buttons" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button class="ls-porn-btn" id="ls-porn-close">Close Tab</button>
        <button class="ls-porn-btn" id="ls-porn-bypass" style="background: transparent; border: 1px solid rgba(225,29,72,0.3); color: rgba(255,255,255,0.5);">I must need it (Allow 15m)</button>
      </div>
      <div id="ls-porn-cognitive" style="display: none; flex-direction: column; gap: 12px; margin-top: 12px; text-align: left;">
        <p style="font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; text-align: center;">Type the following sentence exactly to proceed:</p>
        <p style="font-size: 14px; font-weight: 600; color: #fb7185; margin: 0; user-select: none; text-align: center;">I am sacrificing my long-term goals for a short-term hit</p>
        <input type="text" id="ls-porn-cognitive-input" autocomplete="off" spellcheck="false" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(225,29,72,0.3); background: rgba(0,0,0,0.5); color: #fff; font-size: 13px; outline: none; text-align: center; width: 100%;">
        <button class="ls-porn-btn" id="ls-porn-cognitive-submit" style="background: #3f3f46; color: #a1a1aa; pointer-events: none;">Unlock for 15m</button>
      </div>
    </div>
  `;

  overlay.querySelector('#ls-porn-close')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'LS_CLOSE_TAB' });
  });

  const bypassBtn = overlay.querySelector('#ls-porn-bypass');
  const buttonsDiv = overlay.querySelector('#ls-porn-buttons');
  const cognitiveDiv = overlay.querySelector('#ls-porn-cognitive');
  const input = overlay.querySelector('#ls-porn-cognitive-input') as HTMLInputElement;
  const submit = overlay.querySelector('#ls-porn-cognitive-submit') as HTMLButtonElement;

  bypassBtn?.addEventListener('click', () => {
    if (state.frictionSettings.cognitive) {
      if (buttonsDiv && cognitiveDiv) {
        (buttonsDiv as HTMLElement).style.display = 'none';
        (cognitiveDiv as HTMLElement).style.display = 'flex';
        input?.focus();
      }
    } else {
      const bypassUntil = Date.now() + 15 * 60 * 1000;
      chrome.storage.local.set({ ls_porn_bypass_until: bypassUntil }, () => {
        window.location.reload();
      });
    }
  });

  const TARGET_SENTENCE = 'I am sacrificing my long-term goals for a short-term hit';
  input?.addEventListener('input', () => {
    if (input.value === TARGET_SENTENCE) {
      submit.style.background = 'linear-gradient(to right, #e11d48, #be123c)';
      submit.style.color = '#ffffff';
      submit.style.pointerEvents = 'auto';
    } else {
      submit.style.background = '#3f3f46';
      submit.style.color = '#a1a1aa';
      submit.style.pointerEvents = 'none';
    }
  });

  submit?.addEventListener('click', () => {
    if (input.value === TARGET_SENTENCE) {
      const bypassUntil = Date.now() + 15 * 60 * 1000;
      chrome.storage.local.set({ ls_porn_bypass_until: bypassUntil }, () => {
        window.location.reload();
      });
    }
  });

  return overlay;
}

function removePornBlock() {
  const overlay = document.getElementById('ls-porn-block');
  if (overlay) {
    overlay.remove();
    document.documentElement.style.overflow = '';
  }
}

export async function checkPornBlock(activeState?: boolean) {
  try {
    let isActive = activeState;
    if (isActive === undefined) {
      const data = await chrome.storage.local.get('ls_porn_blocker_active');
      isActive = !!data.ls_porn_blocker_active;
    }

    if (!isActive) {
      removePornBlock();
      return;
    }

    const bypassData = await chrome.storage.local.get('ls_porn_bypass_until');
    if (bypassData.ls_porn_bypass_until && Date.now() < (bypassData.ls_porn_bypass_until as number)) {
      removePornBlock();
      return;
    }

    if (isPornDomain()) {
      window.stop();

      if (document.documentElement) {
        document.documentElement.innerHTML = '';
        document.documentElement.style.background = '#09090b';
      }

      if (!document.getElementById('ls-porn-block')) {
        const overlay = buildPornBlockOverlay();
        document.documentElement.appendChild(overlay);
        document.documentElement.style.overflow = 'hidden';
      }
    } else {
      removePornBlock();
    }
  } catch (_) {}
}
