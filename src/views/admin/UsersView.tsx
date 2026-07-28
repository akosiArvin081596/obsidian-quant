"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Role = { id: string; name: string };
type UserRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: Role[];
  createdAt: string;
};

const blankForm = {
  name: "",
  email: "",
  password: "",
  roleIds: [] as string[],
  status: "active" as "active" | "disabled",
};

export default function UsersView() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to load users");
      setUsers(data.users);
      setRoles(data.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      roleIds: user.roles.map((r) => r.id),
      status: user.status as "active" | "disabled",
    });
    setMessage(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        roleIds: form.roleIds,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      const url = editingId ? `/api/admin/users/${editingId}/` : "/api/admin/users/";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? payload
            : { ...payload, password: form.password },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Save failed");
      setMessage(editingId ? "User updated." : "User created.");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter((id) => id !== roleId)
        : [...f.roleIds, roleId],
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/blog/"
          className="text-[.65rem] uppercase tracking-[.16em] text-silver/45 hover:text-gold"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-silver">Users</h1>
        <p className="mt-2 max-w-xl text-sm text-silver/55">
          Create accounts, assign roles, and disable access without database access.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border border-gold/15 bg-ink/50 px-3 py-2 text-sm text-silver"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {loading ? (
            <p className="text-sm text-silver/50">Loading…</p>
          ) : (
            <div className="overflow-x-auto border border-gold/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gold/10 text-[.65rem] uppercase tracking-[.14em] text-silver/45">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Roles</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gold/5 text-silver/80">
                      <td className="px-3 py-2">{user.name}</td>
                      <td className="px-3 py-2">{user.email}</td>
                      <td className="px-3 py-2">{user.roles.map((r) => r.name).join(", ")}</td>
                      <td className="px-3 py-2 capitalize">{user.status}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="text-gold hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border border-gold/10 bg-ink/40 p-5">
          <h2 className="text-[.65rem] uppercase tracking-[.16em] text-gold">
            {editingId ? "Edit user" : "New user"}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? "New password (optional)" : "Password (min 8)"}
              className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
            />
            <div>
              <p className="mb-2 text-xs text-silver/50">Roles</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-1 text-xs text-silver/70">
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "active" | "disabled" })
              }
              className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={
                  saving ||
                  !form.name ||
                  !form.email ||
                  form.roleIds.length === 0 ||
                  (!editingId && form.password.length < 8)
                }
                className="bg-gold px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-gold/20 px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-silver/70"
                >
                  Cancel
                </button>
              )}
            </div>
            {message && <p className="text-sm text-emerald-400">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
