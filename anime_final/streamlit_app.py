HTML_TEMPLATE = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Anime Recommender – Tag Rank Similarity</title>
<style>
    :root {
        --bg: #050816;
        --bg-elevated: rgba(15, 23, 42, 0.95);
        --border-subtle: rgba(148, 163, 184, 0.25);
        --accent: #6366f1;
        --accent-soft: rgba(99, 102, 241, 0.15);
        --accent-strong: #4f46e5;
        --text-main: #e5e7eb;
        --text-soft: #9ca3af;
        --radius-lg: 18px;
        --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.75);
    }

    * { box-sizing: border-box; }

    html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: visible;
    }

    body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Segoe UI", sans-serif;
        color: var(--text-main);
        background: transparent;
    }

    .app-root {
        width: 100%;
        padding: 0;
        background: transparent;
        display: block;
    }

    /* ---- controls row ---- */
    .controls-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
        margin-bottom: 14px;
        flex-wrap: wrap;
    }

    .toggle-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        color: var(--text-soft);
        white-space: nowrap;
    }

    .toggle-label { font-size: 0.78rem; }

    .switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
    }

    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: #4b5563;
        transition: 0.2s;
        border-radius: 999px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
    }

    input:checked + .slider { background-color: var(--accent-strong); }
    input:checked + .slider:before { transform: translateX(16px); }

    /* ---- grid ---- */
    .recs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 6px;
    }

    .rec-card {
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(15, 23, 42, 0.97);
        padding: 10px;
        font-size: 0.9rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        will-change: transform;
    }

    .rec-card:hover {
        border-color: var(--accent);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.18);
        transform: translateY(-4px);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .rec-thumb {
        width: 100%;
        height: 120px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid rgba(148, 163, 184, 0.5);
        margin-bottom: 4px;
    }

    .rec-title {
        font-weight: 700;
        font-size: 1.02rem;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .rec-meta-row {
        font-size: 0.82rem;
        color: var(--text-soft);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
    }

    .badge-score {
        border-color: rgba(99, 102, 241, 0.9);
        background: rgba(99, 102, 241, 0.12);
        color: #c7d2fe;
    }

    .badge-pop {
        border-color: rgba(56, 189, 248, 0.7);
        background: rgba(56, 189, 248, 0.10);
        color: #bae6fd;
    }

    .badge-perfect {
        border-color: rgba(34, 197, 94, 0.9);
        background: rgba(34, 197, 94, 0.12);
        color: #bbf7d0;
    }

    .badge-good {
        border-color: rgba(59, 130, 246, 0.9);
        background: rgba(59, 130, 246, 0.12);
        color: #bfdbfe;
    }

    .badge-decent {
        border-color: rgba(234, 179, 8, 0.9);
        background: rgba(234, 179, 8, 0.12);
        color: #facc15;
    }

    .badge-loose {
        border-color: rgba(248, 113, 113, 0.9);
        background: rgba(248, 113, 113, 0.12);
        color: #fecaca;
    }

    .rec-genres {
        font-size: 0.82rem;
        color: var(--text-soft);
        max-height: 54px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ---- detail header ---- */
    .detail-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 16px;
    }

    .back-btn {
        background: var(--accent-soft);
        border: 1px solid var(--accent);
        color: var(--text-main);
        padding: 7px 16px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: background 0.15s;
        flex-shrink: 0;
    }

    .back-btn:hover {
        background: var(--accent);
        color: #fff;
    }

    .detail-title {
        font-size: 1.25rem;
        font-weight: 750;
        line-height: 1.3;
    }

    .detail-genres {
        font-size: 0.85rem;
        color: var(--text-soft);
        margin-top: 2px;
    }

    .section-label {
        font-size: 0.88rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-soft);
        margin: 0 0 10px;
    }

    .empty-msg {
        text-align: center;
        color: var(--text-soft);
        font-size: 0.92rem;
        padding: 32px 0;
    }

    /* ---- responsive ---- */
    @media (max-width: 768px) {
        .recs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .rec-thumb { height: 140px; }
    }
</style>
</head>

<body>
<div class="app-root">

    <!-- Controls -->
    <div class="controls-row">
      <div class="toggle-wrap">
        <span class="toggle-label">Include 18+ / adult</span>
        <label class="switch">
          <input type="checkbox" id="adult-toggle" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- ========== BROWSE VIEW ========== -->
    <div id="browse-view">
      <div class="section-label">ANIME LIST</div>
      <div id="browse-grid" class="recs-grid"></div>
      <div id="browse-empty" class="empty-msg" style="display:none;">
        No anime on this page.
      </div>
    </div>

    <!-- ========== DETAIL / RECOMMENDATION VIEW ========== -->
    <div id="detail-view" style="display:none;">
      <div class="detail-header">
        <button class="back-btn" id="back-btn">&#8592; Back</button>
        <div>
          <div class="detail-title" id="detail-title"></div>
          <div class="detail-genres" id="detail-genres"></div>
        </div>
      </div>
      <div class="section-label">SIMILAR ANIME</div>
      <div id="recs-grid" class="recs-grid"></div>
      <div id="recs-empty" class="empty-msg" style="display:none;">
        No recommendations available for this title.
      </div>
    </div>

</div>

<script>
/* ---------- data injected by Streamlit ---------- */
const ANIME_DATA    = __ANIME_JSON__;
const NEIGHBORS     = __NEIGHBORS_JSON__;
const BROWSE_TITLES = __BROWSE_JSON__;

const CARD_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'%3E%3Crect width='600' height='200' fill='%230f172a'/%3E%3Crect x='1' y='1' width='598' height='198' rx='11' ry='11' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3Ctext x='50%25' y='44%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='28' fill='%23334155'%3E%E2%9C%A6%3C/text%3E%3Ctext x='50%25' y='64%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='12' fill='%23475569' letter-spacing='2'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

let includeAdult = false;

/* ---------- helpers ---------- */

function isAdultTitle(title, anime) {
    if (!anime) return false;
    if (anime.isAdult === true) return true;
    const gl = (anime.genres || []).map(g => g.toLowerCase());
    if (gl.includes("hentai")) return true;
    if (title.toLowerCase().includes("hentai")) return true;
    return false;
}

function bannerFor(anime) {
    return anime.bannerImage || anime.trailer_thumbnail || CARD_PLACEHOLDER;
}

function similarityLabel(score) {
    if (score === null || score === undefined || isNaN(score)) return "Unknown";
    if (score >= 90) return "Perfect match";
    if (score >= 70) return "Good match";
    if (score >= 50) return "Decent match";
    return "Loose match";
}

function labelClass(label) {
    if (label === "Perfect match") return "badge badge-perfect";
    if (label === "Good match")    return "badge badge-good";
    if (label === "Decent match")  return "badge badge-decent";
    return "badge badge-loose";
}

function makeImg(src, alt) {
    const img = document.createElement("img");
    img.className = "rec-thumb";
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    img.onerror = () => { img.onerror = null; img.src = CARD_PLACEHOLDER; };
    return img;
}

/* ---------- views ---------- */

const browseView  = document.getElementById("browse-view");
const detailView  = document.getElementById("detail-view");
const browseGrid  = document.getElementById("browse-grid");
const browseEmpty = document.getElementById("browse-empty");
const recsGrid    = document.getElementById("recs-grid");
const recsEmpty   = document.getElementById("recs-empty");
const detailTitle = document.getElementById("detail-title");
const detailGenres= document.getElementById("detail-genres");
const backBtn     = document.getElementById("back-btn");
const adultToggle = document.getElementById("adult-toggle");

function showBrowse() {
    browseView.style.display = "";
    detailView.style.display = "none";
    renderBrowseGrid();
}

function showDetail(title) {
    browseView.style.display = "none";
    detailView.style.display = "";
    renderDetail(title);
}

/* ---- browse grid ---- */

function renderBrowseGrid() {
    browseGrid.innerHTML = "";
    let count = 0;

    BROWSE_TITLES.forEach(title => {
        const anime = ANIME_DATA[title];
        if (!anime) return;
        if (!includeAdult && isAdultTitle(title, anime)) return;

        count++;
        const card = document.createElement("div");
        card.className = "rec-card";
        card.addEventListener("click", () => showDetail(title));

        card.appendChild(makeImg(bannerFor(anime), title));

        const titleEl = document.createElement("div");
        titleEl.className = "rec-title";
        titleEl.textContent = title;
        card.appendChild(titleEl);

        const metaRow = document.createElement("div");
        metaRow.className = "rec-meta-row";

        if (anime.averageScore) {
            const sb = document.createElement("span");
            sb.className = "badge badge-score";
            sb.textContent = "★ " + anime.averageScore;
            metaRow.appendChild(sb);
        }

        if (anime.popularity) {
            const pb = document.createElement("span");
            pb.className = "badge badge-pop";
            pb.textContent = "♥ " + anime.popularity.toLocaleString();
            metaRow.appendChild(pb);
        }

        card.appendChild(metaRow);

        const genresEl = document.createElement("div");
        genresEl.className = "rec-genres";
        genresEl.textContent = (anime.genres || []).join(", ") || "—";
        card.appendChild(genresEl);

        browseGrid.appendChild(card);
    });

    browseEmpty.style.display = count === 0 ? "" : "none";
}

/* ---- detail / recommendations ---- */

function renderDetail(title) {
    const anime = ANIME_DATA[title];
    detailTitle.textContent = title;
    detailGenres.textContent = anime ? (anime.genres || []).join(", ") : "";

    const list = NEIGHBORS[title] || [];
    recsGrid.innerHTML = "";
    let count = 0;

    list.forEach(entry => {
        const recTitle = entry.title;
        const score    = entry.score;
        const recAnime = ANIME_DATA[recTitle];
        if (!recAnime) return;
        if (!includeAdult && isAdultTitle(recTitle, recAnime)) return;

        count++;
        const rank = count;

        const card = document.createElement("a");
        card.className = "rec-card";
        if (recAnime.siteUrl) {
            card.href = recAnime.siteUrl;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
        }

        card.appendChild(makeImg(bannerFor(recAnime), recTitle));

        const titleEl = document.createElement("div");
        titleEl.className = "rec-title";
        titleEl.textContent = "#" + rank + " · " + recTitle;
        card.appendChild(titleEl);

        const metaRow = document.createElement("div");
        metaRow.className = "rec-meta-row";

        const sim = typeof score === "number" ? Math.round(score * 100) / 100 : score;
        const lbl = similarityLabel(sim);
        const badge = document.createElement("span");
        badge.className = labelClass(lbl);
        badge.textContent = lbl;
        metaRow.appendChild(badge);

        card.appendChild(metaRow);

        const genresEl = document.createElement("div");
        genresEl.className = "rec-genres";
        genresEl.textContent = (recAnime.genres || []).join(", ") || "—";
        card.appendChild(genresEl);

        recsGrid.appendChild(card);
    });

    recsEmpty.style.display = count === 0 ? "" : "none";
}

/* ---------- events ---------- */

backBtn.addEventListener("click", showBrowse);

adultToggle.addEventListener("change", (e) => {
    includeAdult = e.target.checked;
    if (detailView.style.display !== "none") {
        renderDetail(detailTitle.textContent);
    } else {
        renderBrowseGrid();
    }
});

/* ---------- boot ---------- */
window.addEventListener("load", showBrowse);
</script>
</body>
</html>
"""
