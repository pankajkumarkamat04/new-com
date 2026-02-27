"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

const PHONE_COUNTRY_OPTIONS: { dial: string; name: string; code: string }[] = [
  { dial: "+91", name: "India", code: "IN" },
  { dial: "+1", name: "US/Canada", code: "US" },
  { dial: "+44", name: "UK", code: "GB" },
  { dial: "+971", name: "UAE", code: "AE" },
  { dial: "+61", name: "Australia", code: "AU" },
  { dial: "+81", name: "Japan", code: "JP" },
  { dial: "+86", name: "China", code: "CN" },
  { dial: "+65", name: "Singapore", code: "SG" },
  { dial: "+92", name: "Pakistan", code: "PK" },
  { dial: "+880", name: "Bangladesh", code: "BD" },
  { dial: "+977", name: "Nepal", code: "NP" },
  { dial: "+94", name: "Sri Lanka", code: "LK" },
  { dial: "+966", name: "Saudi Arabia", code: "SA" },
  { dial: "+49", name: "Germany", code: "DE" },
  { dial: "+33", name: "France", code: "FR" },
];

function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  return digits.slice(0, 10);
}

export default function UserSignupPage() {
  const router = useRouter();
  const cart = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryDial, setPhoneCountryDial] = useState("+91");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!phone.trim()) {
      setError("Mobile number is required");
      return;
    }
    if (phone.length !== 10) {
      setError("Enter valid 10-digit mobile number (no country code or leading zero)");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await userApi.signup({
      name: name.trim(),
      email: email.trim(),
      phone,
      password,
    });
    setLoading(false);
    const data = res.data as { token?: string } | undefined;
    if (res.error) setError(res.error);
    else if (data?.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userType", "user");
      if (typeof cart.mergeGuestCartThenRefresh === "function") {
        await cart.mergeGuestCartThenRefresh();
      }
      router.push("/user/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">User Sign Up</h1>
        <p className="mb-6 text-slate-600">Create an account</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Mobile No</label>
            <div className="flex gap-2">
              <select
                value={phoneCountryDial}
                onChange={(e) => setPhoneCountryDial(e.target.value)}
                className="w-24 flex-shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {PHONE_COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.dial}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(normalizePhoneDigits(e.target.value))}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="10-digit number"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Already have an account?{" "}
          <Link href="/user/login" className="font-medium text-emerald-600 hover:underline">Login</Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
