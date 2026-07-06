"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, X, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Group {
  id: string;
  groupName: string;
  emoji: string;
  memberCount: number;
  expenseCount: number;
  myBalance: number;
  lastActivity: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

export default function GroupListPage() {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("🏠");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchResult[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const EMOJIS = ["🏠", "✈️", "🍽️", "🎉", "🏋️", "🎮", "💼", "👥"];

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        setGroups(await res.json());
        setError("");
      } else {
        setError("Failed to load groups");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetchGroups]);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {}
    }, 250);
  }

  function toggleMember(user: SearchResult) {
    setSelectedMembers((prev) =>
      prev.find((m) => m.id === user.id) ? prev.filter((m) => m.id !== user.id) : [...prev, user]
    );
    setSearchQuery("");
    setSearchResults([]);
  }

  async function handleCreate() {
    if (!groupName) return;
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          emoji: groupEmoji,
          memberIds: selectedMembers.map((m) => m.id),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setCreateError(d.error);
        return;
      }

      const group = await res.json();
      setModalOpen(false);
      setGroupName("");
      setSelectedMembers([]);
      fetchGroups();
      router.push(`/group/${group.id}`);
    } catch {
      setCreateError("Connection error");
    } finally {
      setCreating(false);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setGroupName("");
    setSelectedMembers([]);
    setSearchQuery("");
    setSearchResults([]);
    setCreateError("");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-monochrome-900">Groups</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          New Group
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={fetchGroups} className="ml-2 font-medium underline hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 slide-in-stagger">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-28 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full skeleton rounded" />
                <div className="h-2 w-3/4 skeleton rounded" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="h-3 w-24 skeleton rounded" />
                <div className="h-5 w-16 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create a group to start splitting expenses with friends."
          action={{ label: "Create your first group", onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 slide-in-stagger">
          {groups.map((g) => (
            <div
              key={g.id}
              className="card p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group"
              onClick={() => router.push(`/group/${g.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
                    {g.emoji}
                  </span>
                  <div>
                    <h3 className="font-semibold text-monochrome-900 group-hover:text-accent-600 transition-colors">
                      {g.groupName}
                    </h3>
                    <p className="text-xs text-monochrome-400">
                      {g.memberCount} member{g.memberCount !== 1 ? "s" : ""}
                      {' · '}
                      {g.expenseCount} expense{g.expenseCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-monochrome-100">
                <span className="text-xs text-monochrome-400">
                  {g.lastActivity
                    ? formatDistanceToNow(new Date(g.lastActivity), { addSuffix: true })
                    : "No activity"}
                </span>
                <span
                  className={`text-sm font-mono font-semibold px-2.5 py-1 rounded-full ${
                    g.myBalance > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : g.myBalance < 0
                      ? "bg-red-50 text-red-600"
                      : "bg-monochrome-100 text-monochrome-500"
                  }`}
                >
                  {g.myBalance > 0
                    ? `+${fmt(g.myBalance)}`
                    : g.myBalance < 0
                    ? `-${fmt(Math.abs(g.myBalance))}`
                    : "Settled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-monochrome-900">Create New Group</h3>
              <button onClick={handleModalClose} className="text-monochrome-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Group Name</label>
                <input
                  className="input"
                  placeholder="Roommates"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Group Emoji</label>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all duration-200 ${
                        groupEmoji === e
                          ? "border-monochrome-900 bg-monochrome-900 text-white scale-110"
                          : "border-monochrome-200 hover:bg-monochrome-100 hover:border-monochrome-300"
                      }`}
                      onClick={() => setGroupEmoji(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Add Members</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-monochrome-400" />
                  <input
                    className="input pl-9"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border border-monochrome-200 rounded-lg mt-2 max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-monochrome-50 flex items-center justify-between transition-colors"
                        onClick={() => toggleMember(u)}
                      >
                        <div>
                          <span className="font-medium text-monochrome-900">{u.name}</span>
                          <span className="text-monochrome-400 ml-1.5 text-xs">{u.email}</span>
                        </div>
                        <span className={`text-xs font-medium ${
                          selectedMembers.find((m) => m.id === u.id)
                            ? "text-emerald-600"
                            : "text-monochrome-400"
                        }`}>
                          {selectedMembers.find((m) => m.id === u.id) ? "Added" : "+ Add"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-monochrome-100 rounded-lg text-xs font-medium text-monochrome-700"
                      >
                        {m.name}
                        <button
                          onClick={() => toggleMember(m)}
                          className="text-monochrome-400 hover:text-red-500 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {createError && (
                <p className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                  {createError}
                </p>
              )}

              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={handleModalClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleCreate}
                  disabled={!groupName || creating}
                >
                  {creating ? "Creating..." : "Create Group"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
