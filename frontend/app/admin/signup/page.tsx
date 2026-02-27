"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Card, Input, Label, Button } from "@/components/ui";

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      setError("Phone is required");
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
    const res = await adminApi.signup({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
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
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Admin Sign Up</h1>
        <p className="mb-6 text-slate-600">Create an admin account</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label required>Name</Label>
            <Input variant="amber" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin name" required />
          </div>
          <div>
            <Label required>Email</Label>
            <Input variant="amber" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div>
            <Label required>Phone No</Label>
            <Input variant="amber" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" required />
          </div>
          <div>
            <Label required>Password</Label>
            <Input variant="amber" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div>
            <Label required>Confirm Password</Label>
            <Input variant="amber" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primaryAmber" disabled={loading} className="w-full py-3">
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Already have an account?{" "}
          <Link href="/admin/login" className="font-medium text-amber-600 hover:underline">Login</Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:underline">Back to home</Link>
        </p>
      </Card>
    </div>
  );
}
