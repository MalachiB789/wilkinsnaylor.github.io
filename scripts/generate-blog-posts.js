const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src/content/blog");
const OUTPUT_DIR = path.join(ROOT, "docs/blog");
const POSTS_DATA_FILE = path.join(ROOT, "docs/js/posts.js");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateLabel(dateValue) {
  const utcDate = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(utcDate.getTime())) {
    throw new Error(`Invalid date "${dateValue}". Use YYYY-MM-DD.`);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);
}

function estimateReadTime(markdownBody) {
  const plainText = markdownBody
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/[*_#>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return "1 min read";

  const wordCount = plainText.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

function parseFrontMatter(rawSource, filePath) {
  const normalized = rawSource.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error(`Missing front matter in ${path.relative(ROOT, filePath)}`);
  }

  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    throw new Error(`Front matter is not closed in ${path.relative(ROOT, filePath)}`);
  }

  const frontMatterBlock = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 5).trim();
  const frontMatter = {};

  frontMatterBlock.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Invalid front matter line "${line}" in ${path.relative(ROOT, filePath)}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    frontMatter[key] = value;
  });

  return { frontMatter, body };
}

function renderInlineMarkdown(text) {
  const placeholders = [];
  let html = escapeHtml(text);

  html = html.replace(/\[\[br\]\]/gi, "<br />");

  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const placeholder = `__CODE_${placeholders.length}__`;
    placeholders.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = escapeHtml(url);
    const isExternal = /^https?:\/\//i.test(url);
    const externalAttrs = isExternal ? ' target="_blank" rel="noreferrer"' : "";
    return `<a href="${safeUrl}"${externalAttrs}>${label}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  placeholders.forEach((snippet, index) => {
    html = html.replace(`__CODE_${index}__`, snippet);
  });

  return html;
}

function renderMarkdown(markdownBody) {
  const lines = markdownBody.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      `<ul>\n${listItems.map((item) => `  <li>${renderInlineMarkdown(item)}</li>`).join("\n")}\n</ul>`
    );
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInlineMarkdown(trimmed.slice(3).trim())}</h2>`);
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${renderInlineMarkdown(trimmed.slice(4).trim())}</h3>`);
      return;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      listItems.push(trimmed.slice(2).trim());
      return;
    }

    paragraphLines.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks.join("\n          ");
}

function buildPostRecord(fileName) {
  if (!fileName.endsWith(".md") || fileName.startsWith("_")) {
    return null;
  }

  const filePath = path.join(CONTENT_DIR, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const { frontMatter, body } = parseFrontMatter(source, filePath);
  const slug = (frontMatter.slug || fileName.replace(/\.md$/i, "")).trim();
  const title = (frontMatter.title || slugToTitle(slug)).trim();
  const excerpt = (frontMatter.excerpt || "").trim();
  const date = (frontMatter.date || "").trim();

  if (!title || !excerpt || !date) {
    throw new Error(
      `Post ${path.relative(ROOT, filePath)} must include title, excerpt, and date in the front matter.`
    );
  }

  return {
    slug,
    title,
    excerpt,
    date,
    dateLabel: formatDateLabel(date),
    category: (frontMatter.category || "").trim(),
    readTime: (frontMatter.readTime || estimateReadTime(body)).trim(),
    body,
    bodyHtml: renderMarkdown(body),
  };
}

function loadPosts() {
  return fs
    .readdirSync(CONTENT_DIR)
    .map(buildPostRecord)
    .filter(Boolean)
    .sort((left, right) => right.date.localeCompare(left.date));
}

function renderPostPage(post) {
  const metaLine = post.dateLabel;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <title>${escapeHtml(post.title)} | Blog</title>
  <meta name="description" content="${escapeHtml(post.excerpt)}" />

  <link rel="icon" href="../../favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="../../favicon.svg" />
  <link rel="stylesheet" href="../../css/base.css" />
  <link rel="stylesheet" href="../../css/components.css" />
  <link rel="stylesheet" href="../../css/pages.css" />
</head>

<body>
  <div id="site-header"></div>

  <main>
    <section class="page-hero blog-post-hero">
      <div class="container blog-post-hero-inner">
        <p class="kicker"><span class="hero-badge">Blog</span></p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(metaLine)}</p>
        <p class="muted blog-post-excerpt">${escapeHtml(post.excerpt)}</p>
      </div>
    </section>
    <div class="section-divider" aria-hidden="true"></div>

    <section class="section blog-post-section">
      <div class="container">
        <article class="blog-post-article">
          <div class="blog-post-prose">
          ${post.bodyHtml}
          </div>
          <p class="blog-post-back"><a class="text-link" href="../">Back to blog</a></p>
        </article>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="../../js/main.js" defer></script>
</body>
</html>
`;
}

function renderPostsData(posts) {
  const data = posts.map(({ slug, title, excerpt, date, dateLabel, category, readTime }) => ({
    slug,
    title,
    excerpt,
    date,
    dateLabel,
    category,
    readTime,
  }));

  return `window.BLOG_POSTS = ${JSON.stringify(data, null, 2)};\n`;
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function generate() {
  ensureDirectory(OUTPUT_DIR);
  const posts = loadPosts();

  posts.forEach((post) => {
    const outputPath = path.join(OUTPUT_DIR, post.slug, "index.html");
    ensureDirectory(path.dirname(outputPath));
    fs.writeFileSync(outputPath, renderPostPage(post), "utf8");
    console.log(`Generated ${path.relative(ROOT, outputPath)}`);
  });

  fs.writeFileSync(POSTS_DATA_FILE, renderPostsData(posts), "utf8");
  console.log(`Generated ${path.relative(ROOT, POSTS_DATA_FILE)}`);
}

generate();
