"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { scorePassword, getPasswordStrengthLabel } from "@/lib/password-strength";
import { SECURITY_QUESTIONS } from "@/data/security-questions";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [currencyCode, setCurrencyCode] = useState("INR");

  const [questions, setQuestions] = useState([
    { questionText: "", answer: "" },
    { questionText: "", answer: "" },
    { questionText: "", answer: "" },
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const passwordScore = scorePassword(password);
  const passwordsMatch = password === confirmPassword;

  function canProceedStep1(): boolean {
    return (
      name.trim().length >= 2 &&
      email.includes("@") &&
      password.length >= 8 &&
      passwordScore >= 50 &&
      passwordsMatch
    );
  }

  function canProceedStep2(): boolean {
    return parseInt(age) >= 13 && parseInt(age) <= 100 && gender !== "";
  }

  function canProceedStep3(): boolean {
    const uniqueQuestions = new Set(questions.map((q) => q.questionText));
    if (uniqueQuestions.size !== 3) return false;
    return questions.every((q) => q.questionText && q.answer.trim().length >= 2);
  }

  async function handleStep1() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), name, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setUserId(data.userId);
      setStep(2);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    setError("");
    setLoading(true);

    try {
      const res1 = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: parseInt(age), gender, currencyCode }),
      });

      if (!res1.ok) {
        const data = await res1.json();
        setError(data.error || "Profile update failed");
        return;
      }

      const res2 = await fetch("/api/auth/security-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      if (!res2.ok) {
        const data = await res2.json();
        setError(data.error || "Security questions failed");
        return;
      }

      // Auto-login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          rememberMe: false,
        }),
      });

      if (!loginRes.ok) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const availableQuestions = SECURITY_QUESTIONS.filter(
    (q) => !questions.some((sq) => sq.questionText === q)
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-monochrome-900">◆ WealthWise</h1>
          <p className="text-monochrome-500 mt-2">Create your account</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${
                  s < step
                    ? "bg-black text-white border-black"
                    : s === step
                    ? "border-black text-black"
                    : "border-monochrome-300 text-monochrome-400"
                }`}
              >
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-px ${
                    s < step ? "bg-black" : "bg-monochrome-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Credentials */}
        {step === 1 && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-monochrome-900">
              Account Credentials
            </h2>

            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                placeholder="Alex Demo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-monochrome-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${passwordScore}%`,
                        background:
                          passwordScore < 50
                            ? "#404040"
                            : passwordScore < 75
                            ? "#262626"
                            : "#000000",
                      }}
                    />
                  </div>
                  <p className="text-xs text-monochrome-500 mt-1">
                    Strength: {getPasswordStrengthLabel(passwordScore)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
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
                <p
                  className={`text-xs mt-1 ${
                    passwordsMatch ? "text-monochrome-500" : "text-black font-medium"
                  }`}
                >
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
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
              disabled={!canProceedStep1() || loading}
              onClick={handleStep1}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? "Creating..." : "Continue"}
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-monochrome-900">
              Personal Profile
            </h2>
            <p className="text-sm text-monochrome-500">
              Used to personalise your financial insights
            </p>

            <div>
              <label className="label">Age</label>
              <input
                type="number"
                className="input"
                placeholder="28"
                min={13}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {["male", "female", "non-binary", "prefer_not_to_say"].map(
                  (g) => (
                    <button
                      key={g}
                      type="button"
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        gender === g
                          ? "bg-black text-white border-black"
                          : "border-monochrome-200 text-monochrome-600 hover:bg-monochrome-100"
                      }`}
                      onClick={() => setGender(g)}
                    >
                      {g === "non-binary"
                        ? "Non-binary"
                        : g === "prefer_not_to_say"
                        ? "Prefer not to say"
                        : g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="label">Default Currency</label>
              <select
                className="input"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              >
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
                <option value="GBP">£ GBP — British Pound</option>
                <option value="JPY">¥ JPY — Japanese Yen</option>
                <option value="AED">د.إ AED — UAE Dirham</option>
                <option value="SGD">S$ SGD — Singapore Dollar</option>
                <option value="AUD">A$ AUD — Australian Dollar</option>
                <option value="CAD">C$ CAD — Canadian Dollar</option>
                <option value="CHF">Fr. CHF — Swiss Franc</option>
              </select>
            </div>

            {error && (
              <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <button
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={!canProceedStep2()}
                onClick={() => setStep(3)}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security Questions */}
        {step === 3 && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-monochrome-900">
              Security Questions
            </h2>
            <p className="text-sm text-monochrome-500">
              Used to recover your account without email
            </p>

            {questions.map((q, i) => (
              <div key={i}>
                <label className="label">Question {i + 1}</label>
                <select
                  className="input mb-2"
                  value={q.questionText}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[i] = { ...updated[i], questionText: e.target.value };
                    setQuestions(updated);
                  }}
                >
                  <option value="">Select a question</option>
                  {(i === 0
                    ? SECURITY_QUESTIONS
                    : SECURITY_QUESTIONS.filter(
                        (sq) =>
                          !questions
                            .slice(0, i)
                            .some((qq) => qq.questionText === sq)
                      )
                  ).map((sq) => (
                    <option key={sq} value={sq}>
                      {sq}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Your answer"
                  value={q.answer}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[i] = { ...updated[i], answer: e.target.value };
                    setQuestions(updated);
                  }}
                />
              </div>
            ))}

            {error && (
              <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <button
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={!canProceedStep3() || loading}
                onClick={handleStep3}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {loading ? "Creating..." : "Create My Account"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-monochrome-500">
          Already have an account?{" "}
          <Link href="/login" className="text-monochrome-900 font-medium underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
