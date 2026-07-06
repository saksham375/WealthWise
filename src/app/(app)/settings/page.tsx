"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Key, Shield, User, Settings2, Trash2, AlertTriangle, Calendar, Diamond, Eye, EyeOff, Check } from "lucide-react";
import { scorePassword, getPasswordStrengthLabel } from "@/lib/password-strength";
import { SECURITY_QUESTIONS } from "@/data/security-questions";
import ImportExportCard from "@/components/settings/ImportExportCard";
import CategoryManager from "@/components/settings/CategoryManager";
import Toggle from "@/components/ui/Toggle";
import { useUserStore } from "@/store/userStore";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  avatarPath: string | null;
  currencyCode: string;
  showCents: boolean;
  numberFormat: string;
  createdAt: string;
}

interface SecurityQuestion {
  id: string;
  questionText: string;
}

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

const NUMBER_FORMATS = [
  { value: "indian", label: "Indian (1,23,456)" },
  { value: "international", label: "International (123,456)" },
];

export default function SettingsPage() {
  const setPreferences = useUserStore((s) => s.setPreferences);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const [currencyCode, setCurrencyCode] = useState("INR");
  const [numberFormat, setNumberFormat] = useState("indian");
  const [showCents, setShowCents] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);

  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [sq1, setSq1] = useState({ question: "", answer: "" });
  const [sq2, setSq2] = useState({ question: "", answer: "" });
  const [sq3, setSq3] = useState({ question: "", answer: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name);
        setAge(data.age.toString());
        setGender(data.gender);
        setCurrencyCode(data.currencyCode);
        setNumberFormat(data.numberFormat);
        setShowCents(data.showCents);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function fetchSecurityQuestions() {
    try {
      const res = await fetch("/api/settings/security-questions");
      if (res.ok) {
        const data = await res.json();
        setSecurityQuestions(data);
        if (data.length === 3) {
          setSq1((p) => ({ ...p, question: data[0].questionText }));
          setSq2((p) => ({ ...p, question: data[1].questionText }));
          setSq3((p) => ({ ...p, question: data[2].questionText }));
        }
      }
    } catch {}
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      }),
      fetch("/api/settings/security-questions").then((r) => {
        if (!r.ok) return [];
        return r.json();
      }),
    ]).then(([profileData, sqData]) => {
      setProfile(profileData);
      setName(profileData.name);
      setAge(profileData.age?.toString() ?? "");
      setGender(profileData.gender);
      setCurrencyCode(profileData.currencyCode);
      setNumberFormat(profileData.numberFormat);
      setShowCents(profileData.showCents);
      setSecurityQuestions(sqData);
      if (sqData.length === 3) {
        setSq1((p) => ({ ...p, question: sqData[0].questionText }));
        setSq2((p) => ({ ...p, question: sqData[1].questionText }));
        setSq3((p) => ({ ...p, question: sqData[2].questionText }));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileMsg("");
    setProfileError("");
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, currencyCode, numberFormat, showCents }),
      });
      if (res.ok) {
        setProfileMsg("Profile updated successfully");
        const refreshed = await fetch("/api/users/me").then((r) => r.json());
        setProfile(refreshed);
        setPreferences({ currencyCode, showCents, numberFormat });
      } else {
        const d = await res.json();
        setProfileError(d.error);
      }
    } catch {
      setProfileError("Connection error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    setPasswordMsg("");
    setPasswordError("");
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordMsg("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const d = await res.json();
        setPasswordError(d.error);
      }
    } catch {
      setPasswordError("Connection error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSaveSecurityQuestions() {
    if (!sq1.question || !sq1.answer || !sq2.question || !sq2.answer || !sq3.question || !sq3.answer) {
      setSecurityError("All 3 questions and answers are required");
      return;
    }
    const questions = [sq1, sq2, sq3].map((sq) => ({
      questionText: sq.question,
      answer: sq.answer,
    }));
    const unique = new Set(questions.map((q) => q.questionText));
    if (unique.size !== 3) {
      setSecurityError("All 3 questions must be different");
      return;
    }
    setSavingSecurity(true);
    setSecurityMsg("");
    setSecurityError("");
    try {
      const res = await fetch("/api/settings/security-questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) {
        setSecurityMsg("Security questions updated successfully");
        const refreshed = await fetch("/api/settings/security-questions").then((r) => r.json());
        setSecurityQuestions(refreshed);
        if (refreshed.length === 3) {
          setSq1((p) => ({ ...p, question: refreshed[0].questionText }));
          setSq2((p) => ({ ...p, question: refreshed[1].questionText }));
          setSq3((p) => ({ ...p, question: refreshed[2].questionText }));
        }
      } else {
        const d = await res.json();
        setSecurityError(d.error);
      }
    } catch {
      setSecurityError("Connection error");
    } finally {
      setSavingSecurity(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      await fetch("/api/transactions", { method: "DELETE" });
      window.location.href = "/login";
    } catch {}
  }

  const pwdScore = scorePassword(newPassword);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="h-8 w-32 skeleton rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-4 animate-pulse">
              <div className="h-4 w-24 skeleton rounded" />
              <div className="space-y-3">
                <div className="h-3 w-full skeleton rounded" />
                <div className="h-3 w-3/4 skeleton rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-monochrome-900">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-min">

        {/* ── Profile & Preferences (merged) ── */}
        <div className="bento-card md:col-span-2 lg:col-span-2 p-0 overflow-hidden" style={{ animationDelay: "0.05s" }}>
          {/* Hero area */}
          <div className="bg-monochrome-50 px-6 py-5 border-b border-monochrome-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold shrink-0">
                {profile?.name?.charAt(0) ?? "?"}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-monochrome-900 truncate">{profile?.name ?? "—"}</h2>
                <p className="text-sm text-monochrome-500 truncate">{profile?.email ?? "—"}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={12} className="text-monochrome-400" />
                  <span className="text-xs text-monochrome-400">
                    Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Left column — personal info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-monochrome-400 uppercase tracking-wider">Personal Info</h3>
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Age</label>
                    <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={150} />
                  </div>
                  <div>
                    <label className="label">Gender</label>
                    <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right column — preferences */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-monochrome-400 uppercase tracking-wider">Preferences</h3>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Number Format</label>
                  <select className="input" value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)}>
                    {NUMBER_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <Toggle
                  checked={showCents}
                  onChange={setShowCents}
                  label="Show cents"
                  description="Display ₹1,234.00 instead of ₹1,234"
                  icon={<span className="text-xs font-mono font-bold">¢</span>}
                />
              </div>
            </div>

            {/* Messages + save */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-monochrome-100">
              <div>
                {profileMsg && <p className="text-sm text-monochrome-600">{profileMsg}</p>}
                {profileError && <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{profileError}</p>}
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={handleSaveProfile} disabled={savingProfile || !name}>
                {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="bento-card md:col-span-2 lg:col-span-2" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 pb-3 border-b border-monochrome-100">
            <div className="w-8 h-8 rounded-full bg-monochrome-100 flex items-center justify-center">
              <Key size={16} className="text-monochrome-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-monochrome-900">Change Password</h2>
              <p className="text-xs text-monochrome-400">Update your account password</p>
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? "text" : "password"}
                  className="input pr-9"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-monochrome-400 hover:text-monochrome-700"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                >
                  {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNewPwd ? "text" : "password"}
                  className="input pr-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-monochrome-400 hover:text-monochrome-700"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                >
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-monochrome-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pwdScore < 25 ? "bg-black w-1/4" : pwdScore < 50 ? "bg-monochrome-600 w-2/4" : pwdScore < 75 ? "bg-monochrome-800 w-3/4" : "bg-black w-full"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-monochrome-400 font-medium shrink-0">{getPasswordStrengthLabel(pwdScore)}</span>
                  </div>
                  <ul className="text-[11px] text-monochrome-400 space-y-0.5 pl-1">
                    <li className={newPassword.length >= 8 ? "text-monochrome-700" : ""}>{newPassword.length >= 8 ? "✓" : "○"} At least 8 characters</li>
                    <li className={/[A-Z]/.test(newPassword) ? "text-monochrome-700" : ""}>{/[A-Z]/.test(newPassword) ? "✓" : "○"} One uppercase letter</li>
                    <li className={/[0-9]/.test(newPassword) ? "text-monochrome-700" : ""}>{/[0-9]/.test(newPassword) ? "✓" : "○"} One number</li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className={`input ${confirmPassword && newPassword !== confirmPassword ? "border-black" : ""}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-black mt-1">Passwords do not match</p>
              )}
            </div>
            {passwordMsg && <p className="text-sm text-monochrome-600">{passwordMsg}</p>}
            {passwordError && <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{passwordError}</p>}
            <div className="flex justify-end pt-1">
              <button className="btn-primary flex items-center gap-2" onClick={handleSavePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
                {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* ── Security Questions ── */}
        <div className="bento-card md:col-span-2 lg:col-span-2" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3 pb-3 border-b border-monochrome-100">
            <div className="w-8 h-8 rounded-full bg-monochrome-100 flex items-center justify-center">
              <Shield size={16} className="text-monochrome-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-monochrome-900">
                Security Questions {securityQuestions.length > 0 && <span className="text-xs text-monochrome-400 font-normal ml-1">({securityQuestions.length} set)</span>}
              </h2>
              <p className="text-xs text-monochrome-400">Used to verify your identity if you forget your password</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[sq1, sq2, sq3].map((sq, i) => {
              const setter = i === 0 ? setSq1 : i === 1 ? setSq2 : setSq3;
              return (
                <div key={i} className="space-y-1.5 p-3 rounded-lg border border-monochrome-100 bg-monochrome-50/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="text-[11px] font-semibold text-monochrome-600">Question {i + 1}</span>
                  </div>
                  <select
                    className="input text-xs"
                    value={sq.question}
                    onChange={(e) => setter((p) => ({ ...p, question: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Answer ${i + 1}`}
                    value={sq.answer}
                    onChange={(e) => setter((p) => ({ ...p, answer: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>
          {securityMsg && <p className="text-sm text-monochrome-600">{securityMsg}</p>}
          {securityError && <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{securityError}</p>}
          <div className="flex justify-end pt-1">
            <button className="btn-primary flex items-center gap-2" onClick={handleSaveSecurityQuestions} disabled={savingSecurity}>
              {savingSecurity ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Questions
            </button>
          </div>
        </div>

        {/* ── Account / Danger Zone ── */}
        <div className="md:col-span-2 lg:col-span-2 card border-2 border-black overflow-hidden" style={{ animationDelay: "0.2s" }}>
          <div className="bg-black px-5 py-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-white" />
            <h2 className="text-sm font-bold text-white">Danger Zone</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-monochrome-100 flex items-center justify-center shrink-0">
                <User size={16} className="text-monochrome-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-monochrome-900">{profile?.name ?? "—"}</p>
                <p className="text-xs text-monochrome-500">{profile?.email ?? "—"}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-monochrome-400" />
                    <span className="text-xs text-monochrome-400">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-monochrome-800" />
                    <span className="text-xs text-monochrome-500 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-monochrome-100">
              {!showDeleteConfirm ? (
                <button className="btn-danger flex items-center gap-2" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} />
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-start gap-2 p-3 bg-monochrome-50 border border-monochrome-200 rounded-md">
                    <AlertTriangle size={16} className="text-black shrink-0 mt-0.5" />
                    <p className="text-sm text-monochrome-800 font-medium">
                      This action is permanent and cannot be undone. All your data will be lost.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button className="btn-danger" onClick={handleDeleteAccount}>Confirm Delete</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Import/Export + Add Category (merged 4-col) ── */}
        <div className="md:col-span-2 lg:col-span-4" style={{ animationDelay: "0.25s" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ImportExportCard />
            <CategoryManager />
          </div>
        </div>

      </div>
    </div>
  );
}
