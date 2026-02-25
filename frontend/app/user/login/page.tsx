"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { userApi, settingsApi } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import type { LoginSettings } from "@/lib/types";

const defaultLoginSettings: LoginSettings = {
  loginIdentifier: "email",
  loginMethod: "password",
};

export default function UserLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/user/dashboard";
  const cart = useCart();
  const [loginSettings, setLoginSettings] = useState<LoginSettings>(defaultLoginSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    settingsApi.getLogin().then((res) => {
      setLoadingSettings(false);
      if (res.data?.data) {
        const d = res.data.data;
        setLoginSettings({
          loginIdentifier: d.loginIdentifier === "phone" ? "phone" : "email",
          loginMethod: d.loginMethod === "otp" ? "otp" : "password",
        });
      }
    });
  }, []);

  const isEmail = loginSettings.loginIdentifier === "email";
  const isOtp = loginSettings.loginMethod === "otp";
  const identifier = isEmail ? email.trim() : phone.trim();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier) {
      setError(isEmail ? "Email is required" : "Phone is required");
      return;
    }
    setLoading(true);
    const res = await userApi.requestOtp({
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
    });
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setOtpRequested(true);
      setError("");
    }
  };

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier) {
      setError(isEmail ? "Email is required" : "Phone is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    const res = await userApi.loginPassword({
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
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
      router.push(redirectTo.startsWith("/") ? redirectTo : "/user/dashboard");
    }
  };

  const handleLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier) {
      setError(isEmail ? "Email is required" : "Phone is required");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    const res = await userApi.loginOtp({
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      otp,
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
      router.push(redirectTo.startsWith("/") ? redirectTo : "/user/dashboard");
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Login</h1>
        <p className="mb-6 text-slate-600">Sign in to your account</p>

        {isOtp && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            OTP login is enabled. You will receive a one-time code to sign in.
          </div>
        )}

        <form
          onSubmit={isOtp ? (otpRequested ? handleLoginOtp : handleRequestOtp) : handleLoginPassword}
          className="space-y-4"
        >
          {isEmail ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="+1234567890"
              />
            </div>
          )}

          {!isOtp && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {isOtp && otpRequested && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="000000"
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter the 6-digit code sent to your {isEmail ? "email" : "phone"}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isOtp
                ? otpRequested
                  ? "Verify & Login"
                  : "Send OTP"
                : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/user/signup" className="font-medium text-emerald-600 hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
