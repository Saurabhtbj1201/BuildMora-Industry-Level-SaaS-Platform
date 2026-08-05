"use client";

import { useState } from "react";
import { Users as _Users, UserPlus, Pencil, Trash2, X, Check, Loader2, AlertCircle, FolderGit2 } from "lucide-react";
import { GithubIcon } from "@/components/icons/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";

interface Contributor {
  id: string;
  name: string;
  githubUrl: string | null;
  role: string | null;
  avatarUrl: string | null;
  bio: string | null;
  projectId: string;
  projectTitle: string;
  createdAt: string;
}

interface OsProject { id: string; title: string }

interface Props {
  tenantId: string;
  initialContributors: Contributor[];
  osProjects: OsProject[];
}

const EMPTY_FORM = { name: "", githubUrl: "", role: "", avatarUrl: "", bio: "", projectId: "" };

export default function ContributorsClient({ tenantId, initialContributors, osProjects }: Props) {
  const [contributors, setContributors] = useState<Contributor[]>(initialContributors);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("all");

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, projectId: osProjects[0]?.id ?? "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Contributor) {
    setEditId(c.id);
    setForm({
      name: c.name, githubUrl: c.githubUrl ?? "", role: c.role ?? "",
      avatarUrl: c.avatarUrl ?? "", bio: c.bio ?? "", projectId: c.projectId,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) { setError("Please select a project"); return; }
    setLoading(true); setError("");

    const res = await fetch(editId ? `/api/contributors/${editId}` : "/api/contributors", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tenantId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }

    if (editId) {
      setContributors((prev) => prev.map((c) => c.id === editId ? { ...c, ...form, projectTitle: osProjects.find((p) => p.id === form.projectId)?.title ?? c.projectTitle } : c));
    } else {
      // Re-fetch fresh list
      const listRes = await fetch(`/api/contributors?tenantId=${tenantId}`);
      if (listRes.ok) setContributors(await listRes.json());
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contributor?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/contributors/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) setContributors((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = filterProject === "all" ? contributors : contributors.filter((c) => c.projectId === filterProject);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Projects ({contributors.length})</option>
          {osProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({contributors.filter((c) => c.projectId === p.id).length})
            </option>
          ))}
        </select>
        <Button onClick={openAdd} className="gap-2" disabled={osProjects.length === 0}>
          <UserPlus className="w-4 h-4" /> Add Contributor
        </Button>
      </div>

      {osProjects.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground bg-card border border-border rounded-xl">
          Create an Open Source project first to manage contributors.
        </div>
      )}

      {/* Slide-down Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-display text-foreground">{editId ? "Edit Contributor" : "Add Contributor"}</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Name *</label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Project *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select project…</option>
                  {osProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Role / Title</label>
                <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Core Maintainer" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">GitHub URL</label>
                <Input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/username" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Avatar URL</label>
                <Input value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://avatars.githubusercontent.com/…" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Bio</label>
                <Input value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Short bio…" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? "Update" : "Add Contributor"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Contributors Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-xl">
          No contributors yet. Click "Add Contributor" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {c.avatarUrl
                    ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                    : getInitials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                  {c.role && <p className="text-xs text-primary truncate">{c.role}</p>}
                </div>
              </div>

              {/* Project badge */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg">
                <FolderGit2 className="w-3 h-3" />
                <span className="truncate">{c.projectTitle}</span>
              </div>

              {c.bio && <p className="text-xs text-muted-foreground line-clamp-2">{c.bio}</p>}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {c.githubUrl && (
                  <a href={c.githubUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <GithubIcon className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                <div className="ml-auto flex gap-1">
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
