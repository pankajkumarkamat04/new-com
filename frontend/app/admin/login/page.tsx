"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Card, Input, Label, Button } from "@/components/ui";

export default function AdminLoginPage() {
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
    const res = await adminApi.loginPassword({ email: email.trim(), password });
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userType", "admin");
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <Card className="w-full max-w-md p-8 shadow-lg" padding="none">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Admin Login</h1>
        <p className="mb-6 text-slate-600">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label required>Email</Label>
            <Input variant="amber" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div>
            <Label required>Password</Label>
            <Input variant="amber" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primaryAmber" disabled={loading} className="w-full py-3">
            {loading ? "Please wait..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/admin/signup" className="font-medium text-amber-600 hover:underline">Sign up</Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:underline">Back to home</Link>
        </p>
      </Card>
    </div>
  );
}
