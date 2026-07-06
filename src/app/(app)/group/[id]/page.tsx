"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, ArrowLeft, Loader2, UserMinus } from "lucide-react";
import BalanceSummary from "@/components/group/BalanceSummary";
import AddExpenseModal from "@/components/group/AddExpenseModal";
import SettleModal from "@/components/group/SettleModal";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface GroupDetail {
  id: string;
  groupName: string;
  emoji: string;
  members: { userId: string; role: string; user: { id: string; name: string; email: string } }[];
  expenses: {
    id: string;
    description: string;
    totalAmount: number;
    date: string;
    splitMethod: string;
    payer: { id: string; name: string };
    splits: { userId: string; user: { id: string; name: string }; amount: number; percentage: number | null }[];
  }[];
  settlements: {
    id: string;
    settler: { id: string; name: string };
    receiver: { id: string; name: string };
    amount: number;
    method: string;
    createdAt: string;
  }[];
  balances: { userId: string; name: string; email: string; balance: number }[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fmt = useFormatCurrency();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ userId: string; name: string; balance: number } | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((u) => setCurrentUserId(u.id));
  }, []);

  const fetchGroup = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${params.id}`);
      if (res.ok) setGroup(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  async function handleLeaveGroup() {
    if (!group || !confirm("Are you sure you want to leave this group?")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/members?userId=${currentUserId}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/group");
    } catch {
      console.error("Failed to leave group");
    } finally {
      setLeaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-monochrome-400" size={32} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="card p-5 text-center">
        <p className="text-monochrome-400">Group not found</p>
        <button className="btn-secondary mt-4" onClick={() => router.push("/group")}>
          Back to Groups
        </button>
      </div>
    );
  }

  const members = group.members.map((m) => ({ userId: m.user.id, name: m.user.name }));
  const isAdmin = group.members.some((m) => m.userId === currentUserId && m.role === "ADMIN");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="text-monochrome-400 hover:text-black transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <span className="text-3xl shrink-0">{group.emoji}</span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-monochrome-900 truncate">{group.groupName}</h1>
            <p className="text-xs sm:text-sm text-monochrome-400 truncate">
              {members.length} member{members.length !== 1 ? "s" : ""}
              {group.expenses.length > 0 && ` · ${group.expenses.length} expense${group.expenses.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn-secondary btn-sm flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:border-red-200"
            onClick={handleLeaveGroup}
            disabled={leaving}
          >
            <UserMinus size={14} />
            {leaving ? "Leaving..." : "Leave"}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setExpenseModalOpen(true)}>
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BalanceSummary
            balances={group.balances}
            currentUserId={currentUserId}
            onSettle={setSettleTarget}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-monochrome-900">Expenses</h2>
          {group.expenses.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-monochrome-400">No expenses yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3 slide-in-stagger">
              {group.expenses.map((exp) => (
                <div key={exp.id} className="card p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-monochrome-900">{exp.description}</h3>
                    <span className="font-mono font-semibold text-monochrome-900">
                      {fmt(exp.totalAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-monochrome-400 mb-3">
                    {exp.payer.name} paid · {new Date(exp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    · {exp.splitMethod} split
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.splits.map((s) => {
                      const isPayer = s.userId === exp.payer.id;
                      return (
                        <span
                          key={s.userId}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            isPayer
                              ? "bg-monochrome-900 text-white"
                              : "bg-monochrome-100 text-monochrome-600"
                          }`}
                        >
                          {s.user.name}: {fmt(s.amount)}
                          {s.percentage != null && ` (${s.percentage}%)`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {group.settlements.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-monochrome-900 mt-6">Settlements</h2>
              <div className="space-y-2 slide-in-stagger">
                {group.settlements.map((s) => (
                  <div key={s.id} className="card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold shrink-0">
                        {s.settler.name.charAt(0)}
                      </div>
                      <span className="text-monochrome-700 font-medium truncate">{s.settler.name}</span>
                      <span className="text-monochrome-400 shrink-0">paid</span>
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold shrink-0">
                        {s.receiver.name.charAt(0)}
                      </div>
                      <span className="text-monochrome-700 font-medium truncate">{s.receiver.name}</span>
                      <span className="text-xs text-monochrome-400 bg-monochrome-100 px-1.5 py-0.5 rounded shrink-0">
                        {s.method}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-medium text-emerald-600 shrink-0">
                      {fmt(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={fetchGroup}
        groupId={group.id}
        members={members}
        currentUserId={currentUserId}
      />

      {settleTarget && (
        <SettleModal
          open={true}
          onClose={() => setSettleTarget(null)}
          onSaved={fetchGroup}
          groupId={group.id}
          debtorId={settleTarget.userId}
          debtorName={settleTarget.name}
          amount={settleTarget.balance}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
