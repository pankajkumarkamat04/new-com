"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";

export default function UserLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    const res = await userApi.loginPassword({ email: email.trim(), password });
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userType", "user");
      router.push("/user/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">User Login</h1>
        <p className="mb-6 text-slate-600">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/user/signup" className="font-medium text-emerald-600 hover:underline">Sign up</Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
