import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  UserCheck,
  AlertCircle,
  Plane,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { login, getAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImg from "../assets/Logo.svg";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "employee">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go to CRM
  useEffect(() => {
    if (getAuth()) navigate({ to: "/crm" });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { user, error: loginError } = await login(username, password);
    if (!user) {
      setError(loginError || "Invalid username or password. Please try again.");
      setLoading(false);
      return;
    }
    const isAllowed =
      role === "admin"
        ? user.role === "admin"
        : user.role === "employee" || user.role === "manager";
    if (!isAllowed) {
      setError(
        role === "admin"
          ? "This account is an Employee account. Please select Employee role."
          : "This account is an Admin account. Please select Admin role.",
      );
      setLoading(false);
      return;
    }
    navigate({ to: "/crm" });
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center lg:justify-between px-6 lg:px-20 xl:px-28 overflow-hidden bg-background">
      {/* Full-screen Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/40 lg:bg-black/20" />

      {/* Top Left Logo - exactly aligned horizontally with the hero column */}
      <div className="absolute top-6 sm:top-8 lg:top-10 left-6 lg:left-20 xl:left-28 z-20 flex flex-col items-start">
        <img
          src={logoImg}
          alt="LookMyHolidays"
          className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto drop-shadow-xl"
        />
        <div className="-mt-2 sm:-mt-3 md:-mt-4 lg:-mt-5 flex items-center gap-2 text-[10px] sm:text-[11px] md:text-[12px] font-bold tracking-[0.22em] sm:tracking-[0.28em] text-[#334e68] uppercase select-none drop-shadow-xs pl-0.5">
          <span>TRAVEL</span>
          <span className="text-[#334e68]/60 font-normal">|</span>
          <span>EXPLORE</span>
          <span className="text-[#334e68]/60 font-normal">|</span>
          <span>DISCOVER</span>
        </div>
      </div>

      {/* Left side hero content (Visible on larger screens) */}
      <div className="hidden lg:flex relative z-10 flex-col items-start max-w-xl select-none pt-28 xl:pt-32 pb-8">

        {/* Subtitle tag with horizontal line */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold tracking-[0.25em] text-white/95 uppercase drop-shadow-md">
            YOUR TRAVEL PARTNER
          </span>
          <div className="h-[2px] w-12 bg-[#c4f042]" />
        </div>

        {/* Big Heading */}
        <h1 className="text-5xl xl:text-6xl 2xl:text-[4.2rem] font-extrabold leading-[1.05] text-white uppercase font-display drop-shadow-2xl tracking-tight">
          TRAVEL
          <br />
          BEYOND
          <br />
          <span className="text-[#c4f042]">EXPECTATIONS</span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-[15px] xl:text-base text-white/95 font-medium leading-relaxed max-w-md drop-shadow-md">
          Unlock the world. Let your wanderlust lead you to your dream destinations.
        </p>

        {/* 3 Feature Badges */}
        <div className="mt-10 flex items-center gap-6 xl:gap-8 flex-wrap">
          {/* 1. Exclusive Packages */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
              <Plane className="h-5 w-5 -rotate-45" />
            </div>
            <span className="text-xs font-bold text-white drop-shadow-sm leading-tight">
              Exclusive
              <br />
              Packages
            </span>
          </div>

          {/* 2. Trusted Destinations */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-white drop-shadow-sm leading-tight">
              Trusted
              <br />
              Destinations
            </span>
          </div>

          {/* 3. Safe & Reliable Travel */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-white drop-shadow-sm leading-tight">
              Safe & Reliable
              <br />
              Travel
            </span>
          </div>
        </div>
      </div>

      {/* Right side form card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[36px] bg-[#3a4d5e]/40 p-8 sm:p-10 backdrop-blur-2xl border border-white/20 shadow-2xl mt-12 lg:mt-0">

        {/* Role Selector */}
        <div className="mb-6 flex rounded-2xl bg-black/20 p-1 backdrop-blur-md border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setError("");
              setUsername("");
              setPassword("");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${role === "admin"
                ? "bg-[#c4f042] text-gray-900 shadow-md scale-100"
                : "text-white/70 hover:text-white scale-95"
              }`}
          >
            <Shield className={`h-3.5 w-3.5 ${role === "admin" ? "text-gray-900" : "opacity-70"}`} />
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("employee");
              setError("");
              setUsername("");
              setPassword("");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${role === "employee"
                ? "bg-[#c4f042] text-gray-900 shadow-md scale-100"
                : "text-white/70 hover:text-white scale-95"
              }`}
          >
            <UserCheck className={`h-3.5 w-3.5 ${role === "employee" ? "text-gray-900" : "opacity-70"}`} />
            Employee
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-white drop-shadow-sm tracking-wide">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="login-username"
                placeholder={role === "admin" ? "Enter admin username" : "Enter employee username"}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-2xl bg-white pl-10 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 border-0 focus-visible:ring-2 focus-visible:ring-[#c4f042] transition-shadow shadow-inner"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-white drop-shadow-sm tracking-wide">
                Password
              </label>
              <a
                href="#"
                className="text-[11px] font-semibold text-white/80 hover:text-[#c4f042] transition-colors drop-shadow-sm"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="login-password"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-2xl bg-white pl-10 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 border-0 focus-visible:ring-2 focus-visible:ring-[#c4f042] transition-shadow shadow-inner"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200 animate-in fade-in duration-300 backdrop-blur-md">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="leading-tight">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            id="login-submit-btn"
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full h-12 mt-3 rounded-2xl bg-[#c4f042] hover:bg-[#b5e032] text-gray-900 font-bold text-[15px] shadow-[0_0_20px_rgba(196,240,66,0.35)] transition-all active:scale-[0.98] border-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/30 border-t-gray-900" />
                Signing in…
              </span>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5 opacity-60">
            <div className="flex-1 h-px bg-white/40" />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-white/40" />
          </div>

          {/* Social Buttons */}
          <div>
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-white text-gray-900 font-semibold text-xs hover:bg-gray-100 transition-colors shadow-md active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-white/80">
            Don't have an account?{" "}
            <a
              href="#"
              className="font-bold text-[#c4f042] hover:underline transition-colors drop-shadow-sm"
            >
              Sign Up
            </a>
          </div>
        </form>
      </div>

      {/* Footer - Preserved Name */}
      <div className="absolute bottom-6 left-0 right-0 w-full text-center z-20 pointer-events-none">
        <p className="text-sm font-medium text-white/70 drop-shadow-md">
          Designed and deployed by Jatin Jangid
        </p>
      </div>
    </div>
  );
}
