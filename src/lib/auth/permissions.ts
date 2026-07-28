/** Permission keys enforced by the admin API. */
export const PERMISSIONS = {
  postsRead: "posts:read",
  postsWrite: "posts:write",
  postsPublish: "posts:publish",
  postsDelete: "posts:delete",
  postsRestore: "posts:restore",
  mediaManage: "media:manage",
  tagsManage: "tags:manage",
  categoriesManage: "categories:manage",
  seoEdit: "seo:edit",
  redirectsManage: "redirects:manage",
  usersManage: "users:manage",
  settingsManage: "settings:manage",
  auditRead: "audit:read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Administrator: Object.values(PERMISSIONS),
  Editor: [
    PERMISSIONS.postsRead,
    PERMISSIONS.postsWrite,
    PERMISSIONS.postsPublish,
    PERMISSIONS.postsDelete,
    PERMISSIONS.postsRestore,
    PERMISSIONS.mediaManage,
    PERMISSIONS.tagsManage,
    PERMISSIONS.categoriesManage,
    PERMISSIONS.seoEdit,
    PERMISSIONS.redirectsManage,
    PERMISSIONS.auditRead,
  ],
  Author: [
    PERMISSIONS.postsRead,
    PERMISSIONS.postsWrite,
    PERMISSIONS.mediaManage,
  ],
  "SEO Manager": [
    PERMISSIONS.postsRead,
    PERMISSIONS.seoEdit,
    PERMISSIONS.auditRead,
  ],
  Viewer: [PERMISSIONS.postsRead, PERMISSIONS.auditRead],
};
