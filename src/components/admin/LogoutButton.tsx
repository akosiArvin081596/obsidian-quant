"use client";

export default function AdminLogoutButton() {
  return (
    <button
      type="button"
      className="text-silver/50 hover:text-gold"
      onClick={async () => {
        await fetch("/api/admin/auth/", { method: "DELETE" });
        window.location.href = "/admin/login/";
      }}
    >
      Sign out
    </button>
  );
}
