"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { scorePassword, getPasswordStrengthLabel } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<
    { id: string; questionText: string }[]
  >([]);
  const [answers, setAnswers] = useState<string[]>(["", ""]);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pwdScore = scorePassword(newPassword);

  async function handleInit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setUserId(data.userId);
      setQuestions(data.questions);
      setStep(2);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setResetToken(data.resetToken);
      setStep(3);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, resetToken, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-monochrome-900">◆ WealthWise</h1>
          <p className="text-monochrome-500 mt-2">Reset your password</p>
        </div>

        {step === 1 && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <p className="text-sm text-monochrome-600">
              Enter your email address to begin the password reset process.
            </p>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={!email.includes("@") || loading}
              onClick={handleInit}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? "Checking..." : "Continue"}
            </button>

            <p className="text-center text-sm text-monochrome-500">
              <Link href="/login" className="underline">
                Back to login
              </Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <p className="text-sm text-monochrome-600">
              Answer your security questions to verify your identity.
            </p>

            {questions.map((q, i) => (
              <div key={q.id}>
                <label className="label">{q.questionText}</label>
                <input
                  className="input"
                  placeholder="Your answer"
                  value={answers[i]}
                  onChange={(e) => {
                    const updated = [...answers];
                    updated[i] = e.target.value;
                    setAnswers(updated);
                  }}
                />
              </div>
            ))}

            {error && (
              <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={answers.some((a) => a.trim().length < 2) || loading}
              onClick={handleVerify}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? "Verifying..." : "Verify Answers"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <p className="text-sm text-monochrome-600">
              Choose a new password for your account.
            </p>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-monochrome-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-monochrome-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pwdScore < 25 ? "bg-black w-1/4" : pwdScore < 50 ? "bg-monochrome-600 w-2/4" : pwdScore < 75 ? "bg-monochrome-800 w-3/4" : "bg-black w-full"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-monochrome-400 font-medium">{getPasswordStrengthLabel(pwdScore)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-monochrome-400"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs mt-1 ${newPassword === confirmPassword ? "text-monochrome-500" : "text-black font-medium"}`}>
                  {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={
                newPassword.length < 8 ||
                newPassword !== confirmPassword ||
                loading
              }
              onClick={handleReset}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
