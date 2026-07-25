import { useEffect, useState } from "react";

/* 每封信是一张排版海报：版式与色板按固定节奏轮转，
   同一封信永远得到同一张版面（不随刷新变化）。 */
const VARIANT_RHYTHM = [
  "sleeve", "stripe", "label", "duotone", "sleeve", "minimal",
  "overprint", "sleeve", "duotone", "label", "stripe", "minimal",
];
const PALETTE_RHYTHM = [
  "magenta", "cyan", "ink", "cream", "magenta", "orange",
  "cyan", "cream", "ink", "magenta", "orange", "cyan",
];

/* 碎碎念专属版式：短句/歌词，比信件紧凑，以引文本身为主角。 */
const FRAG_VARIANT_RHYTHM = [
  "note", "bilingual", "ticket", "whisper", "note", "stub",
  "bilingual", "whisper", "ticket", "note", "stub", "bilingual",
];

/* 八张手工背景（去掉偏平的 06-wash），按固定节奏铺给每封信；
   dark = 深底，卡片自动切白字。文件在 assets/bg/。 */
const BASE = import.meta.env.BASE_URL;
const BG_RHYTHM = [
  { file: "02-grain", dark: false },
  { file: "04-riso", dark: true },
  { file: "08-marble", dark: false },
  { file: "09-dust", dark: true },
  { file: "01-mesh", dark: false },
  { file: "03-halftone", dark: false },
  { file: "07-chroma", dark: false },
  { file: "05-bloom", dark: false },
  { file: "09-dust", dark: true },
  { file: "02-grain", dark: false },
  { file: "04-riso", dark: true },
  { file: "08-marble", dark: false },
];

/* content.js 与主站共用；运行时加载，新增信件不需要重新构建。 */
const CONTENT_URL = "../../content.js";

function plain(html) {
  if (!html) return "";
  const box = document.createElement("div");
  box.innerHTML = html;
  return (box.textContent || "").replace(/\s+/g, " ").trim();
}

/* 与主站 script.js 的 normalizeCollection 保持一致：先按日期倒序，
   再给未写 id 的条目补 `前缀-日期数字`，重名追加 -2、-3……
   这样这里生成的链接和主站的历史链接完全对得上。 */
function normalize(list, prefix) {
  const items = (list || []).slice();
  items.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const used = new Set(items.map((x) => x.id).filter(Boolean));
  const n = items.length;

  return items.map((item, i) => {
    let id = item.id;
    if (!id) {
      const base = `${prefix}-${String(item.date || "").replace(/\D/g, "") || `n${n - i}`}`;
      id = base;
      let k = 2;
      while (used.has(id)) id = `${base}-${k++}`;
      used.add(id);
    }
    return { ...item, id };
  });
}

function firstSentence(text) {
  const cut = String(text || "").split(/(?<=[。！？!?])|<br\s*\/?>/i)[0];
  return (cut || text || "").trim();
}

function collectLetters(content) {
  if (!content) return [];
  const pick = (type, list, prefix) =>
    normalize(list, prefix).map((item) => ({
      id: item.id,
      type,
      date: item.date || "",
      title: item.title || "",
      excerpt: plain(item.body).slice(0, 150),
    }));

  return [
    ...pick("letters", content.letters, "letter"),
    ...pick("replies", content.replies, "reply"),
  ].map((item, order) => ({ ...item, order }));
}

function stripTags(s) {
  const box = document.createElement("div");
  box.innerHTML = s || "";
  return (box.textContent || "").replace(/\s+/g, " ").trim();
}
const hasCJK = (s) => /[一-鿿]/.test(s);

/* 碎碎念：短句/歌词/引文，结尾常带「-出处」。拆成引文行 + 出处，
   让专属版式以引文为主角、出处作署名。 */
function collectFragments(content) {
  if (!content) return [];
  return normalize(content.fragments, "fragment").map((item, order) => {
    let lines = String(item.body || "")
      .split(/<br\s*\/?>/i)
      .map(stripTags)
      .filter(Boolean);

    /* 末尾的 -出处 / —出处 抽成 source */
    let source = "";
    if (lines.length) {
      const last = lines[lines.length - 1];
      const m = last.match(/[\-—–]\s*([^\-—–]{1,24})\s*$/);
      if (m) {
        source = m[1].trim();
        const head = last.slice(0, m.index).trim();
        if (head) lines[lines.length - 1] = head;
        else lines.pop();
      }
    }
    if (!lines.length) lines = [stripTags(item.body)];

    const plainText = lines.join(" ");
    return {
      id: item.id,
      type: "fragments",
      date: item.date || "",
      lines, // 引文各行（可能中英交替）
      source, // 出处
      title: lines[0]?.slice(0, 26) || item.title || "",
      excerpt: plainText.slice(0, 150),
      order,
    };
  });
}

/* 一次加载 content.js，同时备好信件与碎碎念两套数据。 */
function useContent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      const c = window.SITE_CONTENT;
      setData({ letters: collectLetters(c), fragments: collectFragments(c) });
    };

    if (window.SITE_CONTENT) {
      finish();
      return undefined;
    }
    const script = document.createElement("script");
    script.src = CONTENT_URL;
    script.onload = finish;
    script.onerror = () => {
      if (!cancelled) setData({ letters: [], fragments: [] });
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

/* 碎碎念专属版面：比信件短、更紧凑，以引文本身为主角，出处作署名。
   五种版式共用同一套印刷语言，靠字号与留白拉开节奏。 */
function FragmentBody({ variant, item, num }) {
  const lines = item.lines && item.lines.length ? item.lines : [item.excerpt];
  const date = item.date;
  const src = item.source;

  /* 中英分组：便于双语版式一上一下排 */
  const cn = lines.filter(hasCJK);
  const en = lines.filter((l) => !hasCJK(l));
  const lead = lines[0] || "";

  if (variant === "whisper") {
    /* 最轻的一张：一句话居中，四周大量留白 */
    return (
      <>
        <span className="p-eyebrow">{date}</span>
        <p className="f-whisper">{lead}</p>
        <span className="p-foot">{src || "碎碎念"}</span>
      </>
    );
  }

  if (variant === "stub") {
    /* 票根：极小的引文 + 巨大的编号，几乎没有字 */
    return (
      <>
        <div className="f-stubtop">
          <span>{date}</span>
          <span>NO.{num}</span>
        </div>
        <b className="f-stubnum" data-text={num} aria-hidden="true">
          {num}
        </b>
        <p className="f-stubline">{lead}</p>
        {src ? <span className="p-foot">{src}</span> : null}
      </>
    );
  }

  if (variant === "bilingual") {
    /* 双语并置：英文小字压在中文大字上方，像唱片内页的译注 */
    return (
      <>
        <span className="p-eyebrow">{date}</span>
        <div className="f-bi">
          {en.slice(0, 2).map((l, i) => (
            <p key={`e${i}`} className="f-bi-en">
              {l}
            </p>
          ))}
          {(cn.length ? cn : lines).slice(0, 2).map((l, i) => (
            <p key={`c${i}`} className="f-bi-cn">
              {l}
            </p>
          ))}
        </div>
        <span className="p-foot">{src || "碎碎念"}</span>
      </>
    );
  }

  if (variant === "ticket") {
    /* 存根条：顶部虚线撕口 + 紧凑多行 */
    return (
      <>
        <div className="f-perf" aria-hidden="true" />
        <div className="f-stubtop">
          <span>{date}</span>
          <span>FRAGMENT {num}</span>
        </div>
        <div className="f-rows">
          {lines.slice(0, 3).map((l, i) => (
            <p key={i} className={hasCJK(l) ? "f-row f-row--cn" : "f-row"}>
              {l}
            </p>
          ))}
        </div>
        <span className="p-foot">{src || "碎碎念"}</span>
      </>
    );
  }

  /* note：便签——引文占主体，出处压在右下 */
  return (
    <>
      <span className="p-eyebrow">
        {date} · NO.{num}
      </span>
      <p className="f-note" data-text={lead}>
        {lead}
      </p>
      {lines[1] ? <p className="f-note-sub">{lines[1]}</p> : null}
      <span className="f-sign">{src ? `— ${src}` : "— 碎碎念"}</span>
    </>
  );
}

/* 一封信 = 一张唱片封套。共用印刷语言：套印错位、网点、纸纹，
   靠构图与留白拉开差别——有的满版大标题，有的几乎只剩一个编号。 */
function PosterBody({ variant, letter, kind, num }) {
  const title = letter.title;
  const date = letter.date;

  /* 套印错位的标题：data-text 供伪元素复制出青/品两层 */
  const Misreg = ({ className }) => (
    <h3 className={className} data-text={title}>
      {title}
    </h3>
  );

  if (variant === "minimal") {
    return (
      <>
        <span className="p-eyebrow">{date}</span>
        <b className="p-numeral" data-text={num} aria-hidden="true">
          {num}
        </b>
        <span className="p-foot">{kind}</span>
      </>
    );
  }

  if (variant === "label") {
    return (
      <>
        <span className="p-eyebrow">{date}</span>
        <div className="p-disc" aria-hidden="true">
          <span className="p-disc-ring" />
          <b>{num}</b>
        </div>
        <Misreg className="p-title p-title--sm" />
        <span className="p-foot">{kind}</span>
      </>
    );
  }

  if (variant === "stripe") {
    return (
      <>
        <div className="p-stripes" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <span className="p-eyebrow">{date}</span>
        <Misreg className="p-title" />
        <span className="p-foot">
          {kind} · NO.{num}
        </span>
      </>
    );
  }

  if (variant === "duotone") {
    return (
      <>
        <span className="p-halftone" aria-hidden="true" />
        <span className="p-eyebrow">{date}</span>
        <Misreg className="p-title p-title--lg" />
        <span className="p-foot">{kind}</span>
      </>
    );
  }

  if (variant === "overprint") {
    return (
      <>
        <span className="p-blot p-blot--a" aria-hidden="true" />
        <span className="p-blot p-blot--b" aria-hidden="true" />
        <span className="p-eyebrow">{date}</span>
        <p className="p-line">{firstSentence(letter.excerpt)}</p>
        <span className="p-foot">
          {kind} · NO.{num}
        </span>
      </>
    );
  }

  /* sleeve：正封——满版大标题 + 底部信息条 */
  return (
    <>
      <div className="p-topline">
        <span>{date}</span>
        <span>SIDE {num}</span>
      </div>
      <Misreg className="p-title p-title--lg" />
      <div className="p-baseline">
        <span>{kind}</span>
        <span className="p-mark">
          VEGA<i>∞</i>ALTAiR
        </span>
      </div>
    </>
  );
}

function LetterCard({ letter, index }) {
  const isFragment = letter.type === "fragments";
  const kind = letter.type === "replies" ? "你写给我" : "我写给你";
  const variant = isFragment
    ? FRAG_VARIANT_RHYTHM[index % FRAG_VARIANT_RHYTHM.length]
    : VARIANT_RHYTHM[index % VARIANT_RHYTHM.length];
  const palette = PALETTE_RHYTHM[index % PALETTE_RHYTHM.length];
  const bg = BG_RHYTHM[index % BG_RHYTHM.length];
  const num = String(index + 1).padStart(2, "0");

  return (
    <a
      className="legacy-card legacy-card-link"
      href={`../../article.html?type=${letter.type}&id=${encodeURIComponent(
        letter.id,
      )}`}
      aria-label={`${letter.date} ${letter.title}`}
    >
      <div
        className={`legacy-card-art poster poster--${variant} pal--${palette} has-bg${
          bg.dark ? " is-dark" : ""
        }${isFragment ? " is-fragment" : ""}`}
        style={{
          backgroundImage: `url(${BASE}assets/bg/${bg.file}.jpg)`,
        }}
      >
        <span className="poster-grid" aria-hidden="true" />
        {isFragment ? (
          <FragmentBody variant={variant} item={letter} num={num} />
        ) : (
          <PosterBody
            variant={variant}
            letter={letter}
            kind={kind}
            num={num}
          />
        )}
      </div>
    </a>
  );
}

function FlowColumn({ items, index, columnKey }) {
  /* 首尾各放一份，配合 legacy-flow-up 的 -50% 位移形成无缝循环。 */
  const looped = [...items, ...items];

  return (
    <div
      className="legacy-flow-column"
      style={{
        "--flow-duration": `${[34, 27, 31][index]}s`,
        "--flow-delay": `${[0, -8, -15][index]}s`,
      }}
    >
      {looped.map((item, cardIndex) => (
        <LetterCard
          key={`${columnKey}-${index}-${cardIndex}`}
          letter={item}
          index={item.order}
        />
      ))}
    </div>
  );
}

/* 两种视图的文案 */
const COPY = {
  letters: {
    tag: (
      <>
        A <b>love, letters &amp; starlight</b> studio — writing refreshingly
        honest words that help two hearts cut through <b>11,000&nbsp;km</b> of
        noise.
      </>
    ),
    manifesto: (
      <>
        We make <em>distance</em> feel like a place two people can live in —{" "}
        <em>until eternity, universe edge.</em>
      </>
    ),
    head: "OUR LETTERS",
    toggle: "MURMURS →",
    empty: "还没有信件。",
  },
  fragments: {
    tag: (
      <>
        The little things — <b>lyrics, small talk &amp; midnight thoughts</b> —
        that never made it into a letter, kept here under a{" "}
        <b>dusk sky</b>.
      </>
    ),
    manifesto: (
      <>
        Not every feeling needs a whole letter. Some are just{" "}
        <em>soft murmurs</em>, said and kept.
      </>
    ),
    head: "SOFT MURMURS",
    toggle: "← LETTERS",
    empty: "还没有碎碎念。",
  },
};

export default function LegacyV9UI({ view = "letters", onToggleView }) {
  const data = useContent();
  const items = data ? data[view] || [] : null;
  const ready = Array.isArray(items) && items.length > 0;
  const copy = COPY[view] || COPY.letters;

  /* 被主站当作「草原模式」嵌入时，顶栏多一个退出入口，
     这样整页只有这一条顶栏，不会和主站的按钮打架。 */
  const embedded =
    typeof window !== "undefined" && window.self !== window.top;
  const exitMode = () => {
    try {
      window.parent.__marsExit?.();
    } catch (e) {
      /* 跨域时降级：直接回主站 */
      window.top.location.href = "../../index.html";
    }
  };

  const columns = [[], [], []];
  if (ready) items.forEach((item, i) => columns[i % 3].push(item));

  return (
    <div className={`legacy-v9-ui view-${view}`}>
      <header className="legacy-topbar">
        <a className="legacy-logo" href="../../index.html">
          VEGALTAIR®
        </a>
        <nav aria-label="V9 sections">
          <a href="#legacy-work">INDEX</a>
          <button
            type="button"
            className="legacy-viewtoggle"
            onClick={onToggleView}
          >
            {copy.toggle}
          </button>
          {embedded ? (
            <button
              type="button"
              className="legacy-viewtoggle legacy-exit"
              onClick={exitMode}
            >
              EXIT
            </button>
          ) : (
            <a href="#legacy-contact">CONTACT</a>
          )}
        </nav>
      </header>

      <a className="legacy-demo-badge" href="./">
        UI FUSION · 返回场景版
      </a>

      <div className="legacy-page">
        <section className="legacy-hero legacy-pad">
          <p className="legacy-tag">{copy.tag}</p>
          <div className="legacy-scroll-cue">SCROLL — 01</div>
        </section>

        <section className="legacy-manifesto legacy-pad">
          <p>{copy.manifesto}</p>
        </section>

        <section className="legacy-work legacy-pad" id="legacy-work">
          <div className="legacy-work-head">
            <h2>{ready ? `${copy.head} — ${items.length}` : copy.head}</h2>
            <span>2026 — ∞</span>
          </div>
          {ready ? (
            <div className="legacy-flow">
              {columns.map((columnItems, index) => (
                <FlowColumn
                  key={index}
                  columnKey={view}
                  items={columnItems}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="legacy-flow-empty">
              {items === null ? "正在取信……" : copy.empty}
            </p>
          )}
        </section>

        <section className="legacy-marquee" aria-hidden="true">
          <div className="legacy-marquee-track">
            {[0, 1, 2].map((item) => (
              <span key={item}>
                LOVE, LETTERS <i>&amp; MOTION</i> — VEGALTAIR® — UNTIL
                ETERNITY <i>UNIVERSE EDGE</i> —
              </span>
            ))}
          </div>
        </section>

        <footer className="legacy-footer" id="legacy-contact">
          <div className="legacy-footer-big">
            Got a feeling
            <br />
            to tell you? <i>Write it down.</i>
          </div>
          <ul>
            <li>
              <a href="https://toueloveletter.com">TOUELOVELETTER.COM</a>
            </li>
            <li>
              <span>COLUMBUS, OHIO</span>
            </li>
            <li>
              <span>YOUR CITY, CHINA</span>
            </li>
            <li>
              <span>SINCE 2026.03.20 — 23:22</span>
            </li>
          </ul>
        </footer>
        <div className="legacy-credit">
          V9 INITIAL UI × MARS FIELD · LOCAL DESIGN STUDY
        </div>
      </div>
    </div>
  );
}
