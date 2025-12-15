const CARD_W = 1050;
const CARD_H = 600;

const DEFAULTS = {
  name: "王小明",
  title: "产品经理",
  company: "绿野科技",
  bio: "关注用户体验与增长，擅长从 0 到 1 搭建产品并推动落地。喜欢把复杂问题讲清楚，并把产品做简单。",
  email: "name@example.com",
  phone: "138 0000 0000",
};

const form = document.getElementById("form");
const preview = document.getElementById("preview");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const bioCount = document.getElementById("bioCount");

const measureCanvas = document.createElement("canvas");
const measureCtx = measureCanvas.getContext("2d");

function normalize(value) {
  return (value ?? "").toString().trim();
}

function escapeXml(value) {
  return normalize(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapTextByMeasure(text, maxWidthPx, font, maxLines, ellipsis = "…") {
  const content = normalize(text);
  if (!content) return [];

  measureCtx.font = font;
  const lines = [];
  let line = "";

  const tokens = content
    .replaceAll("\r\n", "\n")
    .split("\n")
    .flatMap((seg, idx, arr) => (idx < arr.length - 1 ? [seg, "\n"] : [seg]))
    .flatMap((seg) => {
      if (seg === "\n") return ["\n"];
      return seg.split(/(\s+)/).filter((t) => t !== "");
    });

  function pushLine(nextLine) {
    lines.push(nextLine);
    line = "";
  }

  for (const token of tokens) {
    if (token === "\n") {
      pushLine(line.trimEnd());
      continue;
    }

    const next = line ? line + token : token;
    if (measureCtx.measureText(next).width <= maxWidthPx) {
      line = next;
      continue;
    }

    if (line) {
      pushLine(line.trimEnd());
      line = token.trimStart();
      continue;
    }

    let hard = "";
    for (const ch of token) {
      const candidate = hard + ch;
      if (measureCtx.measureText(candidate).width <= maxWidthPx) {
        hard = candidate;
      } else {
        if (hard) pushLine(hard);
        hard = ch;
      }
    }
    line = hard;
  }
  if (line) pushLine(line.trimEnd());

  const compact = lines.filter((l) => l !== "");
  if (compact.length <= maxLines) return compact;

  const sliced = compact.slice(0, maxLines);
  const last = sliced[maxLines - 1] ?? "";
  const targetW = maxWidthPx;

  let out = last;
  while (out && measureCtx.measureText(out + ellipsis).width > targetW) {
    out = out.slice(0, -1);
  }
  sliced[maxLines - 1] = out ? out + ellipsis : ellipsis;
  return sliced;
}

function getState() {
  const data = new FormData(form);
  return {
    name: normalize(data.get("name")) || DEFAULTS.name,
    title: normalize(data.get("title")) || DEFAULTS.title,
    company: normalize(data.get("company")) || DEFAULTS.company,
    bio: normalize(data.get("bio")) || DEFAULTS.bio,
    email: normalize(data.get("email")) || DEFAULTS.email,
    phone: normalize(data.get("phone")) || DEFAULTS.phone,
  };
}

function renderCardSvg(state) {
  const pad = 72;
  const contentX = 34;
  const contentY = 34;
  const contentW = CARD_W - 68;
  const contentH = CARD_H - 68;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif";
  const nameFont = `820 64px ${fontFamily}`;
  const titleFont = `700 26px ${fontFamily}`;
  const companyFont = `650 24px ${fontFamily}`;
  const bioFont = `520 25px ${fontFamily}`;
  const bioStrongFont = `750 25px ${fontFamily}`;
  const contactFont = `700 24px ${fontFamily}`;
  const labelFont = `700 16px ${fontFamily}`;

  const safeEmail = escapeXml(state.email);
  const safePhone = escapeXml(state.phone);

  const maxNameW = CARD_W - pad * 2 - 180;
  const maxTitleW = 420;
  const maxCompanyW = CARD_W - pad * 2;

  const nameLine = (wrapTextByMeasure(state.name, maxNameW, nameFont, 1)[0] ?? "").trim();
  const titleLine = (wrapTextByMeasure(state.title, maxTitleW, titleFont, 1)[0] ?? "").trim();
  const companyLine = (wrapTextByMeasure(state.company, maxCompanyW, companyFont, 1)[0] ?? "").trim();

  measureCtx.font = titleFont;
  const pillW = Math.max(140, Math.min(460, Math.ceil(measureCtx.measureText(titleLine).width + 44)));

  const mono = escapeXml((normalize(state.name).replaceAll(/\s+/g, "")[0] ?? "U").toUpperCase());

  const bioX = pad;
  const bioY = 250;
  const bioW = CARD_W - pad * 2;
  const bioH = 176;
  const bioTextX = bioX + 56;
  const bioTextW = bioW - 56 - 28;
  const bioLines = wrapTextByMeasure(state.bio, bioTextW, bioFont, 5);
  const bioLead = bioLines.length ? bioLines[0] : "";
  const bioRest = bioLines.slice(1);

  const bioTspans = [
    bioLead
      ? `<tspan x="${bioTextX}" y="${bioY + 72}" style="font:${bioStrongFont};">${escapeXml(bioLead)}</tspan>`
      : "",
    ...bioRest.map((line, idx) => {
      const y = bioY + 72 + (idx + 1) * 34;
      return `<tspan x="${bioTextX}" y="${y}">${escapeXml(line)}</tspan>`;
    }),
  ].join("");

  const footerY = 444;
  const footerH = 110;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F3FFF7"/>
      <stop offset="0.55" stop-color="#E7FBF0"/>
      <stop offset="1" stop-color="#D9F6E6"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1AA36B"/>
      <stop offset="1" stop-color="#1F7A4B"/>
    </linearGradient>
    <radialGradient id="blob" cx="70%" cy="20%" r="60%">
      <stop offset="0" stop-color="#1AA36B" stop-opacity=".22"/>
      <stop offset="1" stop-color="#1AA36B" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#105434" flood-opacity=".18"/>
    </filter>
    <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#105434" flood-opacity=".12"/>
    </filter>
    <clipPath id="contentClip">
      <rect x="${contentX}" y="${contentY}" width="${contentW}" height="${contentH}" rx="28"/>
    </clipPath>
  </defs>

  <rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" rx="30" fill="url(#pageBg)"/>

  <rect x="${contentX}" y="${contentY}" width="${contentW}" height="${contentH}" rx="28" fill="rgba(255,255,255,.68)" stroke="rgba(12,52,30,.10)" filter="url(#softShadow)"/>
  <g clip-path="url(#contentClip)">
    <rect x="${contentX + 10}" y="${contentY + 10}" width="${contentW - 20}" height="${contentH - 20}" rx="24" fill="rgba(255,255,255,.52)"/>

    <rect x="${contentX}" y="${contentY}" width="${contentW}" height="168" fill="url(#blob)"/>
    <path d="M${contentX} ${contentY + 138} C ${contentX + 260} ${contentY + 112}, ${contentX + 440} ${contentY + 188}, ${contentX + 720} ${contentY + 144} C ${contentX + 860} ${contentY + 124}, ${contentX + 952} ${contentY + 138}, ${contentX + contentW} ${contentY + 118} L ${contentX + contentW} ${contentY + 168} L ${contentX} ${contentY + 168} Z" fill="rgba(26,163,107,.06)"/>

    <rect x="${contentX + 22}" y="${contentY + 22}" width="10" height="${contentH - 44}" rx="999" fill="url(#accent)" opacity=".92"/>

    <g transform="translate(${CARD_W - pad - 70}, ${contentY + 68})">
      <circle cx="34" cy="34" r="34" fill="rgba(26,163,107,.12)" stroke="rgba(26,163,107,.22)"/>
      <circle cx="34" cy="34" r="22" fill="url(#accent)" opacity=".92"/>
      <text x="34" y="42" text-anchor="middle" fill="#FFFFFF" style="font:800 22px ${fontFamily};">${mono}</text>
      <text x="34" y="82" text-anchor="middle" fill="rgba(31,122,75,.55)" style="font:${labelFont}; letter-spacing:.24em;">INTRO</text>
    </g>

    <text x="${pad}" y="152" fill="#0B2A17" style="font:${nameFont}; letter-spacing:.2px;">${escapeXml(nameLine)}</text>

    <g transform="translate(${pad}, 174)">
      <rect x="0" y="0" width="${pillW}" height="44" rx="999" fill="rgba(26,163,107,.14)" stroke="rgba(26,163,107,.26)"/>
      <path d="M18 22 C 18 10.4, 27.4 1, 39 1 L ${pillW - 39} 1 C ${pillW - 27.4} 1, ${pillW - 18} 10.4, ${pillW - 18} 22 C ${pillW - 18} 33.6, ${pillW - 27.4} 43, ${pillW - 39} 43 L 39 43 C 27.4 43, 18 33.6, 18 22 Z" fill="rgba(26,163,107,.06)"/>
      <text x="22" y="30" fill="#1F7A4B" style="font:${titleFont};">${escapeXml(titleLine)}</text>
    </g>

    <text x="${pad}" y="244" fill="rgba(53,104,75,.92)" style="font:${companyFont};">${escapeXml(companyLine)}</text>

    <rect x="${pad}" y="268" width="${CARD_W - pad * 2}" height="0.8" fill="rgba(10,42,23,.10)"/>

    <g filter="url(#lift)">
      <rect x="${bioX}" y="${bioY}" width="${bioW}" height="${bioH}" rx="22" fill="rgba(248,255,252,.72)" stroke="rgba(12,52,30,.10)"/>
      <rect x="${bioX}" y="${bioY}" width="8" height="${bioH}" rx="999" fill="rgba(26,163,107,.55)"/>
      <g transform="translate(${bioX + 22}, ${bioY + 22})" opacity=".90">
        <path d="M24 0C10 0 0 12 0 28C0 44 10 56 24 56C29.5 56 34 54.8 38 52.4C32.6 46.5 29.8 40.3 29.8 32.5C29.8 17.2 40 7.8 55 7.8C56.6 7.8 58.1 7.9 59.5 8.1C55 2.9 48.2 0 40 0H24Z" fill="rgba(31,122,75,.22)"/>
      </g>
      <text x="${bioTextX}" y="${bioY + 72}" fill="#0B2A17" style="font:${bioFont}; opacity:.92;">
        ${bioTspans}
      </text>
    </g>

    <g filter="url(#lift)">
      <rect x="${pad}" y="${footerY}" width="${CARD_W - pad * 2}" height="${footerH}" rx="22" fill="rgba(26,163,107,.10)" stroke="rgba(26,163,107,.18)"/>
      <rect x="${pad + (CARD_W - pad * 2) / 2}" y="${footerY + 18}" width="1" height="${footerH - 36}" fill="rgba(10,42,23,.10)"/>

      <g transform="translate(${pad + 26}, ${footerY + 36})">
        <circle cx="18" cy="18" r="18" fill="rgba(26,163,107,.16)" stroke="rgba(26,163,107,.22)"/>
        <path d="M9.5 13.0L18 19.8L26.5 13.0" fill="none" stroke="#1F7A4B" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="9.1" y="11.1" width="17.8" height="13.8" rx="3.6" fill="none" stroke="#1F7A4B" stroke-width="1.9"/>
      </g>
      <text x="${pad + 68}" y="${footerY + 62}" fill="#0B2A17" style="font:${contactFont};">${safeEmail}</text>
      <text x="${pad + 68}" y="${footerY + 86}" fill="rgba(53,104,75,.85)" style="font:${labelFont};">邮箱</text>

      <g transform="translate(${pad + 520}, ${footerY + 36})">
        <circle cx="18" cy="18" r="18" fill="rgba(26,163,107,.16)" stroke="rgba(26,163,107,.22)"/>
        <path d="M13.0 12.5C14.6 15.2 16.8 17.4 19.5 19.0L21.4 17.1C21.9 16.6 22.6 16.5 23.2 16.7C24.0 17.0 24.8 17.2 25.8 17.3C26.4 17.4 26.8 17.9 26.8 18.5V21.1C26.8 21.7 26.4 22.2 25.8 22.2C17.2 22.2 10.3 15.3 10.3 6.7C10.3 6.1 10.8 5.7 11.4 5.7H14.0C14.6 5.7 15.1 6.1 15.2 6.7C15.3 7.6 15.5 8.5 15.8 9.3C16.0 9.9 15.9 10.6 15.4 11.1L13.6 12.9" fill="none" stroke="#1F7A4B" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="${pad + 562}" y="${footerY + 62}" fill="#0B2A17" style="font:${contactFont};">${safePhone}</text>
      <text x="${pad + 562}" y="${footerY + 86}" fill="rgba(53,104,75,.85)" style="font:${labelFont};">电话</text>
    </g>
  </g>
</svg>`;
}

function setPreviewFromSvg(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.documentElement;
  preview.replaceChildren(svg);
}

function update() {
  const state = getState();
  const bio = normalize(new FormData(form).get("bio"));
  bioCount.textContent = String(bio.length);
  const svg = renderCardSvg(state);
  setPreviewFromSvg(svg);
  return svg;
}

async function exportPng(svgString) {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    if (typeof img.decode === "function") {
      await img.decode();
    } else {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("图片加载失败"));
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    ctx.drawImage(img, 0, 0, CARD_W, CARD_H);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("PNG 导出失败（toBlob 返回空）");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(pngBlob);
    const safe = (getState().name || "business-card").replaceAll(/[\\/:*?\"<>|]+/g, "_");
    a.download = `${safe}-card.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setFormDefaults() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const el = form.elements.namedItem(key);
    if (!el) continue;
    el.value = value;
  }
}

form.addEventListener("input", () => update());
downloadBtn.addEventListener("click", async () => {
  downloadBtn.disabled = true;
  downloadBtn.textContent = "正在生成…";
  try {
    const svg = update();
    await exportPng(svg);
  } catch (err) {
    console.error(err);
    alert(err instanceof Error ? err.message : "导出失败");
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = "下载 PNG";
  }
});
resetBtn.addEventListener("click", () => {
  setFormDefaults();
  update();
});

setFormDefaults();
update();
