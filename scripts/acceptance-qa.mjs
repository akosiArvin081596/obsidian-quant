/**
 * Blog CMS Acceptance QA (§22) — API + browser checks.
 * Usage: node scripts/acceptance-qa.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

const BASE = process.argv[2] || process.env.BASE_URL || "http://localhost:3002";
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@obsidianquantgroup.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "ChangeMeNow!2026";
const AUTHOR_EMAIL = "author-qa@obsidianquantgroup.com";
const AUTHOR_PASSWORD = "AuthorQa!2026";
const RUN_ID = Date.now().toString(36);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "tmp", "acceptance-qa");

mkdirSync(OUT_DIR, { recursive: true });

const prisma = new PrismaClient();
const results = [];

function record(id, ok, detail = "") {
  results.push({ id, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${id}${detail ? ` — ${detail}` : ""}`);
}

function jarFromResponse(res, jar) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const list = raw.length ? raw : [res.headers.get("set-cookie")].filter(Boolean);
  for (const c of list) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(jar, method, urlPath, body, { formData } = {}) {
  const headers = {};
  if (jar?.size) headers.Cookie = cookieHeader(jar);
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body: payload });
  if (jar) jarFromResponse(res, jar);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { res, json, text };
}

async function login(email, password) {
  const jar = new Map();
  const { res, json } = await api(jar, "POST", "/api/admin/auth/", { email, password });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  return jar;
}

async function ensureAuthorUser() {
  const authorRole = await prisma.role.findUniqueOrThrow({ where: { name: "Author" } });
  const passwordHash = await hashPassword(AUTHOR_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: AUTHOR_EMAIL },
    create: {
      name: "QA Author",
      email: AUTHOR_EMAIL,
      passwordHash,
      status: "active",
    },
    update: { passwordHash, status: "active" },
  });
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({ data: { userId: user.id, roleId: authorRole.id } });
  return user;
}

function tinyPng() {
  // 1x1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

async function uploadFeatured(jar, altText) {
  const fd = new FormData();
  fd.append("file", new Blob([tinyPng()], { type: "image/png" }), "qa-featured.png");
  fd.append("altText", altText);
  const { res, json } = await api(jar, "POST", "/api/admin/media/", undefined, { formData: fd });
  if (!res.ok) throw new Error(`Media upload failed: ${JSON.stringify(json)}`);
  return json.media;
}

async function getOrCreateTag(jar, name, slug) {
  const list = await api(jar, "GET", "/api/admin/tags/");
  const existing = list.json.tags?.find((t) => t.slug === slug);
  if (existing) return existing;
  const created = await api(jar, "POST", "/api/admin/tags/", { name, slug });
  if (!created.res.ok) throw new Error(`Tag create failed: ${JSON.stringify(created.json)}`);
  return created.json.tag;
}

async function getCategory(jar) {
  const list = await api(jar, "GET", "/api/admin/categories/");
  const cat = list.json.categories?.[0];
  if (!cat) throw new Error("No categories seeded");
  return cat;
}

async function createDraft(jar, title) {
  const { res, json } = await api(jar, "POST", "/api/admin/posts/", { title });
  if (!res.ok) throw new Error(`Create draft failed: ${JSON.stringify(json)}`);
  return json.post;
}

async function patchPost(jar, id, body) {
  const { res, json } = await api(jar, "PATCH", `/api/admin/posts/${id}/`, body);
  if (!res.ok) throw new Error(`PATCH failed: ${JSON.stringify(json)}`);
  return json.post;
}

async function publish(jar, id) {
  const { res, json } = await api(jar, "POST", `/api/admin/posts/${id}/publish/`);
  return { res, json };
}

async function unpublish(jar, id) {
  return api(jar, "POST", `/api/admin/posts/${id}/unpublish/`);
}

async function softDelete(jar, id) {
  return api(jar, "DELETE", `/api/admin/posts/${id}/`);
}

async function restore(jar, id) {
  return api(jar, "POST", `/api/admin/posts/${id}/restore/`);
}

function contentHtml(body, { deadInternal = false, deadExternal = false } = {}) {
  const links = [];
  links.push('<a href="/firm/">Our firm</a>');
  if (deadInternal) links.push('<a href="/blog/missing-slug/">Dead internal</a>');
  if (deadExternal) links.push('<a href="https://httpstat.us/404">Dead external</a>');
  return `<p>${body}</p><h2>Notes</h2><p>${links.join(" ")}</p><script>alert("xss")</script><img src=x onerror=alert(1)>`;
}

async function main() {
  console.log(`\nAcceptance QA against ${BASE}\n`);
  await ensureAuthorUser();
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const author = await login(AUTHOR_EMAIL, AUTHOR_PASSWORD);
  const category = await getCategory(admin);
  const tagShared = await getOrCreateTag(admin, "Acceptance Shared", `qa-shared-${RUN_ID}`);
  const tagOther = await getOrCreateTag(admin, "Acceptance Other", `qa-other-${RUN_ID}`);
  const media = await uploadFeatured(admin, "Acceptance featured alt text");

  // --- 1. Draft create + save persistence ---
  const draftTitle = `QA Draft ${RUN_ID}`;
  let draft = await createDraft(admin, draftTitle);
  draft = await patchPost(admin, draft.id, {
    title: draftTitle,
    slug: `qa-draft-${RUN_ID}`,
    excerpt: "Draft excerpt for acceptance.",
    contentHtml: contentHtml("Draft body saved successfully."),
    contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Draft body" }] }] },
    version: draft.version,
    createRevision: true,
    revisionReason: "manual_save",
  });
  const reloaded = await api(admin, "GET", `/api/admin/posts/${draft.id}/`);
  record(
    "draft-autosave-persist",
    reloaded.res.ok &&
      reloaded.json.post?.title === draftTitle &&
      (reloaded.json.post?.contentHtml || "").includes("Draft body saved"),
    `post ${draft.id}`,
  );

  // --- 2. Editor capabilities (browser) ---
  const editorDraft = await createDraft(admin, `QA Editor UI ${RUN_ID}`);
  await patchPost(admin, editorDraft.id, {
    title: `QA Editor UI ${RUN_ID}`,
    slug: `qa-editor-ui-${RUN_ID}`,
    excerpt: "Editor UI acceptance draft.",
    contentHtml: "<p>Editor body</p><h2>Section</h2>",
    featuredMediaId: media.id,
    version: editorDraft.version,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const cookieVal = [...admin.entries()].find(([k]) => k.includes("session") || k.includes("oqg"))?.[1]
    || admin.get("oqg_admin_session");
  if (!cookieVal) throw new Error("Missing admin session cookie for Playwright");
  await context.addCookies([
    { name: "oqg_admin_session", value: cookieVal, url: BASE },
  ]);
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto(`${BASE}/admin/blog/${editorDraft.id}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  let writeBlogVisible = false;
  let hasPreview = false;
  let hasFormat = false;
  let hasAlt = false;
  let previewOk = false;
  try {
    await page.getByRole("button", { name: /Save Draft/i }).waitFor({ state: "visible", timeout: 90_000 });
    writeBlogVisible = true;
    hasPreview = await page.getByRole("button", { name: /^Preview$/i }).isVisible();
    hasFormat =
      (await page.getByRole("button", { name: /Bold/i }).count()) > 0 &&
      (await page.getByRole("button", { name: /Insert link/i }).count()) > 0 &&
      (await page.getByRole("button", { name: /Insert image/i }).count()) > 0;
    // Publish settings: featured alt
    await page.getByRole("button", { name: /Publish settings/i }).click();
    hasAlt =
      (await page.locator("text=/Featured image alt text/i").count()) > 0 ||
      (await page.locator("input[placeholder*='alt' i], input[placeholder*='Describe the featured' i]").count()) > 0;
    await page.getByRole("button", { name: /^Preview$/i }).click();
    await page.getByRole("button", { name: /Mobile/i }).click();
    await page.getByRole("button", { name: /Tablet/i }).click();
    await page.getByRole("button", { name: /Desktop/i }).click();
    previewOk = (await page.locator("text=/Preview/i").count()) > 0;
  } catch (err) {
    await page.screenshot({ path: path.join(OUT_DIR, "editor-fail.png"), fullPage: true });
    writeFileSync(path.join(OUT_DIR, "editor-fail.html"), await page.content());
    console.error("Editor UI error:", err);
  }
  record(
    "editor-format-preview",
    writeBlogVisible && hasPreview && hasFormat && hasAlt && previewOk,
    `save=${writeBlogVisible} previewBtn=${hasPreview} format=${hasFormat} alt=${hasAlt} previewModes=${previewOk}`,
  );
  await page.screenshot({ path: path.join(OUT_DIR, "editor.png"), fullPage: true });

  // --- 3 & 4. Publish without deploy + public listing ---
  const pubSlug = `qa-published-${RUN_ID}`;
  let published = await patchPost(admin, draft.id, {
    title: `QA Published ${RUN_ID}`,
    slug: pubSlug,
    excerpt: "Published excerpt for SEO and listings.",
    contentHtml: contentHtml("Published article body with internal link.", {
      deadInternal: true,
      deadExternal: true,
    }),
    featuredMediaId: media.id,
    primaryCategoryId: category.id,
    categoryIds: [category.id],
    tagIds: [tagShared.id],
    robotsIndex: true,
    seo: {
      metaTitle: `QA Meta ${RUN_ID}`,
      metaDescription: "QA meta description for acceptance checklist.",
      socialTitle: `QA Social ${RUN_ID}`,
      socialDescription: "QA social description.",
      schemaType: "BlogPosting",
    },
    version: (await api(admin, "GET", `/api/admin/posts/${draft.id}/`)).json.post.version,
    createRevision: true,
    revisionReason: "pre_publish",
  });
  const pubResult = await publish(admin, published.id);
  record(
    "publish-without-deploy",
    pubResult.res.ok && pubResult.json.post?.status === "published",
    pubResult.res.ok ? pubResult.json.url : JSON.stringify(pubResult.json),
  );

  const blogIndex = await fetch(`${BASE}/blog/`);
  const blogHtml = await blogIndex.text();
  const onIndex = blogIndex.ok && blogHtml.includes(pubSlug);
  const catPage = await fetch(`${BASE}/blog/category/${category.slug}/`);
  const catHtml = await catPage.text();
  const tagPage = await fetch(`${BASE}/blog/tag/${tagShared.slug}/`);
  const tagHtml = await tagPage.text();
  record(
    "public-listing-tag-category",
    onIndex && catPage.ok && catHtml.includes(pubSlug) && tagPage.ok && tagHtml.includes(pubSlug),
    `index=${onIndex} cat=${catPage.ok && catHtml.includes(pubSlug)} tag=${tagPage.ok && tagHtml.includes(pubSlug)}`,
  );

  // --- 5. View-source SEO ---
  const articleRes = await fetch(`${BASE}/blog/${pubSlug}/`);
  const articleHtml = await articleRes.text();
  writeFileSync(path.join(OUT_DIR, "article.html"), articleHtml);
  const hasTitle = articleHtml.includes(`QA Meta ${RUN_ID}`) || articleHtml.includes(`QA Published ${RUN_ID}`);
  const hasDesc = articleHtml.includes("QA meta description");
  const hasCanonical = /rel=["']canonical["']/i.test(articleHtml);
  const hasRobots = /name=["']robots["']/i.test(articleHtml);
  const hasOg = /property=["']og:(title|description|image)["']/i.test(articleHtml);
  const hasJsonLd =
    articleHtml.includes("application/ld+json") &&
    (articleHtml.includes("BlogPosting") || articleHtml.includes('"@type":"BlogPosting"'));
  const hasBody = articleHtml.includes("Published article body");
  record(
    "seo-meta-jsonld",
    articleRes.ok && hasBody && hasTitle && hasDesc && hasCanonical && hasRobots && hasOg && hasJsonLd,
    `body=${hasBody} title=${hasTitle} desc=${hasDesc} canonical=${hasCanonical} robots=${hasRobots} og=${hasOg} jsonld=${hasJsonLd}`,
  );

  // --- 6. Sitemap include / exclude on unpublish / noindex / trash ---
  const sm1 = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const inSitemap = sm1.includes(`/blog/${pubSlug}/`);
  record("sitemap-includes-published", inSitemap);

  // noindex
  published = await patchPost(admin, published.id, {
    robotsIndex: false,
    version: (await api(admin, "GET", `/api/admin/posts/${published.id}/`)).json.post.version,
  });
  const smNoindex = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const noindexGone = !smNoindex.includes(`/blog/${pubSlug}/`);
  // restore index for later tests
  published = await patchPost(admin, published.id, {
    robotsIndex: true,
    version: (await api(admin, "GET", `/api/admin/posts/${published.id}/`)).json.post.version,
  });

  // unpublish
  await unpublish(admin, published.id);
  const smUnpub = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const unpubGone = !smUnpub.includes(`/blog/${pubSlug}/`);
  // republish
  await publish(admin, published.id);

  // trash
  await softDelete(admin, published.id);
  const smTrash = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const trashGone = !smTrash.includes(`/blog/${pubSlug}/`);
  await restore(admin, published.id);
  await publish(admin, published.id);

  record(
    "sitemap-removed-unpublish-noindex-trash",
    noindexGone && unpubGone && trashGone,
    `noindex=${noindexGone} unpub=${unpubGone} trash=${trashGone}`,
  );

  // --- 7. Slug change redirect ---
  const oldSlug = pubSlug;
  const newSlug = `qa-renamed-${RUN_ID}`;
  const beforeRename = (await api(admin, "GET", `/api/admin/posts/${published.id}/`)).json.post;
  published = await patchPost(admin, published.id, {
    slug: newSlug,
    version: beforeRename.version,
  });
  const redirectHit = await fetch(`${BASE}/blog/${oldSlug}/`, { redirect: "manual" });
  const redirectLoc = redirectHit.headers.get("location") || "";
  let redirectWorks =
    [301, 302, 303, 307, 308].includes(redirectHit.status) && redirectLoc.includes(newSlug);
  if (!redirectWorks) {
    const followed = await fetch(`${BASE}/blog/${oldSlug}/`, { redirect: "follow" });
    const followedHtml = await followed.text();
    redirectWorks =
      followed.ok &&
      (followed.url.includes(newSlug) || followedHtml.includes(`QA Published ${RUN_ID}`));
  }
  const redirectRow = await prisma.redirect.findFirst({
    where: {
      OR: [{ sourcePath: `/blog/${oldSlug}/` }, { sourcePath: `/blog/${oldSlug}` }],
    },
  });
  record(
    "slug-change-redirect",
    Boolean(redirectRow?.active) && redirectWorks,
    `db=${Boolean(redirectRow)} dest=${redirectRow?.destinationUrl || "-"} http=${redirectHit.status} loc=${redirectLoc || "(follow)"}`,
  );

  // --- 8. Draft/preview/admin/trash/noindex not in sitemap ---
  const draftOnly = await createDraft(admin, `Hidden Draft ${RUN_ID}`);
  await patchPost(admin, draftOnly.id, {
    title: `Hidden Draft ${RUN_ID}`,
    slug: `qa-hidden-draft-${RUN_ID}`,
    excerpt: "hidden",
    contentHtml: "<p>hidden draft</p>",
    version: draftOnly.version,
  });
  const noindexPost = await createDraft(admin, `Noindex ${RUN_ID}`);
  let nip = await patchPost(admin, noindexPost.id, {
    title: `Noindex ${RUN_ID}`,
    slug: `qa-noindex-${RUN_ID}`,
    excerpt: "noindex post",
    contentHtml: contentHtml("noindex body"),
    featuredMediaId: media.id,
    primaryCategoryId: category.id,
    categoryIds: [category.id],
    tagIds: [tagOther.id],
    robotsIndex: false,
    seo: { metaTitle: "Noindex", metaDescription: "noindex" },
    version: noindexPost.version,
  });
  await publish(admin, nip.id);
  const smHidden = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const hiddenOk =
    !smHidden.includes(`qa-hidden-draft-${RUN_ID}`) &&
    !smHidden.includes(`qa-noindex-${RUN_ID}`) &&
    !smHidden.includes("/admin/");
  record("sitemap-excludes-nonpublic", hiddenOk);

  // --- 9. Unauthorized cannot publish/delete/restore/SEO ---
  const authorDraft = await createDraft(author, `Author Draft ${RUN_ID}`);
  await patchPost(author, authorDraft.id, {
    title: `Author Draft ${RUN_ID}`,
    slug: `qa-author-${RUN_ID}`,
    excerpt: "author",
    contentHtml: contentHtml("author body"),
    version: authorDraft.version,
  });
  const authorPublish = await publish(author, authorDraft.id);
  const authorDelete = await softDelete(author, authorDraft.id);
  const authorSeo = await api(author, "PATCH", `/api/admin/posts/${authorDraft.id}/`, {
    seo: { metaTitle: "Hacked" },
    version: (await api(author, "GET", `/api/admin/posts/${authorDraft.id}/`)).json.post.version,
  });
  // After SEO patch without permission, metaTitle should remain unset/ignored
  const afterSeo = (await api(author, "GET", `/api/admin/posts/${authorDraft.id}/`)).json.post;
  const unauthOk =
    [401, 403].includes(authorPublish.res.status) &&
    [401, 403].includes(authorDelete.res.status) &&
    authorSeo.res.ok &&
    afterSeo.seo?.metaTitle !== "Hacked";
  // restore test: trash via admin then author restore
  await softDelete(admin, authorDraft.id);
  const authorRestore = await restore(author, authorDraft.id);
  const restoreForbidden = [401, 403].includes(authorRestore.res.status);
  record(
    "unauthorized-actions-blocked",
    unauthOk && restoreForbidden,
    `publish=${authorPublish.res.status} delete=${authorDelete.res.status} seoIgnored=${afterSeo.seo?.metaTitle !== "Hacked"} restore=${authorRestore.res.status}`,
  );

  // --- 10. Sanitization ---
  const dirty = await createDraft(admin, `Sanitize ${RUN_ID}`);
  const cleaned = await patchPost(admin, dirty.id, {
    title: `Sanitize ${RUN_ID}`,
    slug: `qa-sanitize-${RUN_ID}`,
    contentHtml: '<p>ok</p><script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>',
    version: dirty.version,
  });
  const html = cleaned.contentHtml || "";
  const sanitized =
    !html.includes("<script") && !/onerror=/i.test(html) && !/javascript:/i.test(html);
  record("sanitize-unsafe-html", sanitized, html.slice(0, 120));

  // --- 11. Revision restore keeps later rows ---
  const revPost = await createDraft(admin, `Revision ${RUN_ID}`);
  let rp = await patchPost(admin, revPost.id, {
    title: `Revision A ${RUN_ID}`,
    slug: `qa-revision-${RUN_ID}`,
    contentHtml: "<p>version A</p>",
    version: revPost.version,
    createRevision: true,
    revisionReason: "rev_a",
  });
  rp = await patchPost(admin, rp.id, {
    title: `Revision B ${RUN_ID}`,
    contentHtml: "<p>version B</p>",
    version: rp.version,
    createRevision: true,
    revisionReason: "rev_b",
  });
  const revsBefore = await api(admin, "GET", `/api/admin/posts/${rp.id}/revisions/`);
  const firstRev = revsBefore.json.revisions?.slice().sort((a, b) => a.revisionNo - b.revisionNo)[0];
  const restoreRes = await api(admin, "POST", `/api/admin/posts/${rp.id}/revisions/${firstRev.id}/restore/`);
  const revsAfter = await api(admin, "GET", `/api/admin/posts/${rp.id}/revisions/`);
  const countBefore = revsBefore.json.revisions?.length ?? 0;
  const countAfter = revsAfter.json.revisions?.length ?? 0;
  const titleRestored = restoreRes.json.post?.title === `Revision A ${RUN_ID}`;
  const rowsPreserved = countAfter >= countBefore; // restore adds pre_restore + restore rows; never deletes
  const oldStillThere = revsAfter.json.revisions?.some((r) => r.id === firstRev.id);
  record(
    "revision-restore-preserves-rows",
    restoreRes.res.ok && titleRestored && rowsPreserved && oldStillThere,
    `before=${countBefore} after=${countAfter} title=${restoreRes.json.post?.title}`,
  );

  // --- 12. Audit log ---
  const audit = await api(admin, "GET", "/api/admin/audit/?pageSize=100");
  const actions = new Set((audit.json.items || audit.json.logs || []).map((a) => a.action));
  // Try alternate shape
  const rows = audit.json.items || audit.json.logs || audit.json.audit || [];
  const actionList = rows.map((a) => a.action);
  const need = ["auth.login", "post.publish", "post.unpublish"];
  // delete/restore may be named post.delete / post.trash / post.restore
  const hasDelete = actionList.some((a) => /delete|trash/i.test(a));
  const hasRestore = actionList.some((a) => /restore/i.test(a));
  const hasLogin = actionList.some((a) => a === "auth.login");
  const hasPublish = actionList.some((a) => a === "post.publish");
  const hasUnpublish = actionList.some((a) => a === "post.unpublish");
  record(
    "audit-log-actions",
    hasLogin && hasPublish && hasUnpublish && hasDelete && hasRestore,
    `login=${hasLogin} publish=${hasPublish} unpublish=${hasUnpublish} delete=${hasDelete} restore=${hasRestore} sample=${[...new Set(actionList)].slice(0, 12).join(",")}`,
  );

  // --- 13. Related posts prefer shared tags/category ---
  const relatedA = await createDraft(admin, `Related Seed ${RUN_ID}`);
  let ra = await patchPost(admin, relatedA.id, {
    title: `Related Seed ${RUN_ID}`,
    slug: `qa-related-seed-${RUN_ID}`,
    excerpt: "seed related",
    contentHtml: contentHtml("related seed body"),
    featuredMediaId: media.id,
    primaryCategoryId: category.id,
    categoryIds: [category.id],
    tagIds: [tagShared.id],
    seo: { metaTitle: "seed", metaDescription: "seed related" },
    version: relatedA.version,
  });
  await publish(admin, ra.id);

  const relatedB = await createDraft(admin, `Related Match ${RUN_ID}`);
  let rb = await patchPost(admin, relatedB.id, {
    title: `Related Match ${RUN_ID}`,
    slug: `qa-related-match-${RUN_ID}`,
    excerpt: "match related",
    contentHtml: contentHtml("related match body"),
    featuredMediaId: media.id,
    primaryCategoryId: category.id,
    categoryIds: [category.id],
    tagIds: [tagShared.id],
    seo: { metaTitle: "match", metaDescription: "match related" },
    version: relatedB.version,
  });
  await publish(admin, rb.id);

  const filler = await createDraft(admin, `Unrelated Filler ${RUN_ID}`);
  let rf = await patchPost(admin, filler.id, {
    title: `Unrelated Filler ${RUN_ID}`,
    slug: `qa-unrelated-filler-${RUN_ID}`,
    excerpt: "filler",
    contentHtml: contentHtml("unrelated filler body"),
    featuredMediaId: media.id,
    primaryCategoryId: category.id,
    categoryIds: [category.id],
    tagIds: [tagOther.id],
    seo: { metaTitle: "filler", metaDescription: "filler" },
    version: filler.version,
  });
  await publish(admin, rf.id);

  const relatedPage = await (await fetch(`${BASE}/blog/qa-related-seed-${RUN_ID}/`)).text();
  const matchBeforeFiller = (() => {
    const iMatch = relatedPage.indexOf(`qa-related-match-${RUN_ID}`);
    const iFiller = relatedPage.indexOf(`qa-unrelated-filler-${RUN_ID}`);
    if (iMatch < 0) return false;
    if (iFiller < 0) return true; // match present, filler absent = still prefer shared
    return iMatch < iFiller;
  })();
  record(
    "related-posts-prefer-shared",
    matchBeforeFiller,
    `matchIdx=${relatedPage.indexOf(`qa-related-match-${RUN_ID}`)} fillerIdx=${relatedPage.indexOf(`qa-unrelated-filler-${RUN_ID}`)}`,
  );

  // --- 14. Link health ---
  const linkCheckPost = await api(admin, "GET", `/api/admin/posts/${published.id}/link-check/`);
  const findings = linkCheckPost.json.findings || linkCheckPost.json.results || linkCheckPost.json.links || [];
  const deadInternalFound = JSON.stringify(linkCheckPost.json).includes("/blog/missing-slug/");
  const pageLinkHealth = await context.newPage();
  await pageLinkHealth.goto(`${BASE}/admin/blog/links/`, { waitUntil: "networkidle", timeout: 120_000 });
  const linkHealthUi = await pageLinkHealth.content();
  await pageLinkHealth.screenshot({ path: path.join(OUT_DIR, "link-health.png"), fullPage: true });
  // Trigger scan if button exists
  const scanBtn = pageLinkHealth.getByRole("button", { name: /check|scan|run/i });
  if (await scanBtn.count()) {
    await scanBtn.first().click().catch(() => {});
    await pageLinkHealth.waitForTimeout(3000);
  }
  const globalCheck = await api(admin, "GET", "/api/admin/link-check/");
  const globalHasDead = JSON.stringify(globalCheck.json).includes("/blog/missing-slug/");
  record(
    "link-health-dead-links",
    (deadInternalFound || globalHasDead) && linkCheckPost.res.ok,
    `postCheck=${deadInternalFound} global=${globalHasDead} uiStatus=${pageLinkHealth.url()} findings=${findings.length}`,
  );

  await browser.close();

  // Summary
  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);
  const report = {
    base: BASE,
    runId: RUN_ID,
    passed: passed.length,
    failed: failed.length,
    results,
  };
  writeFileSync(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log(`\n${passed.length} passed, ${failed.length} failed`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(` - ${f.id}: ${f.detail}`);
  }
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
