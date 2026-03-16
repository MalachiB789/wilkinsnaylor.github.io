function getBlogPostUrl(slug) {
  return `./blog/${encodeURIComponent(slug)}.html`;
}

function getPostMeta(post) {
  return post.dateLabel || "";
}

function createBlogCardMarkup(post) {
  return `
    <article class="service-card">
      <p class="blog-card-meta">${getPostMeta(post)}</p>
      <h3>${post.title}</h3>
      <p class="muted">${post.excerpt}</p>
      <p style="margin-top: 10px;"><a class="text-link" href="${getBlogPostUrl(post.slug)}">Read post</a></p>
    </article>
  `;
}

function renderBlogArchivePage() {
  const featuredContainer = document.querySelector("[data-blog-featured]");
  const gridContainer = document.querySelector("[data-blog-grid]");
  if (!featuredContainer || !gridContainer) return;

  const posts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];
  if (!posts.length) {
    featuredContainer.innerHTML = `
      <article class="blog-featured">
        <span class="hero-badge">Latest Update</span>
        <h3>No posts yet</h3>
        <p class="muted">Add a markdown file in <code>src/content/blog</code> and run <code>node scripts/generate-blog-posts.js</code>.</p>
      </article>
    `;
    return;
  }

  const [latestPost, ...olderPosts] = posts;

  featuredContainer.innerHTML = `
    <article class="blog-featured">
      <span class="hero-badge">Latest Update</span>
      <p class="blog-card-meta">${getPostMeta(latestPost)}</p>
      <h3>${latestPost.title}</h3>
      <p class="muted">${latestPost.excerpt}</p>
      <a class="btn" href="${getBlogPostUrl(latestPost.slug)}">Read article</a>
    </article>
  `;

  gridContainer.innerHTML = olderPosts.map(createBlogCardMarkup).join("");
}

function renderHomepageBlogPreview() {
  const track = document.querySelector("[data-home-blog-track]");
  if (!track) return;

  const posts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS.slice(0, 4) : [];
  if (!posts.length) return;

  track.innerHTML = posts.map(createBlogCardMarkup).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderBlogArchivePage();
  renderHomepageBlogPreview();
});
