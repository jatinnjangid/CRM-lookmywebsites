import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Plane, Lock, User, Shield, UserCheck, AlertCircle } from "lucide-react";
import { login, getAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
  const [dynamicHints, setDynamicHints] = useState<
    { label: string; username: string; password: string; accessRole?: string }[]
  >([]);

  const loadDynamicHints = async () => {
    try {
      const { data } = await supabase.from("employees").select("*");
      if (data) {
        const parsedData = data.map((emp: any) => {
          if (typeof emp.description === "string" && emp.description.includes("_isMeta")) {
            try {
              const parsed = JSON.parse(emp.description);
              if (parsed._isMeta) {
                return { ...emp, profile_details: parsed.profile_details };
              }
            } catch (e) { }
          }
          return emp;
        });

        const hints = parsedData
          .filter((emp: any) => {
            const status = (emp.status || "").trim().toLowerCase();
            const isTerminatedOrInactive = status === "terminated" || status === "inactive";
            return !isTerminatedOrInactive && emp.name;
          })
          .map((emp: any) => {
            const firstName = (emp.name || "").trim().split(" ")[0].toLowerCase();
            const empIdClean = (emp.id || "").trim().toLowerCase();
            const emailUser = (emp.email || "").split("@")[0].trim().toLowerCase();

            const username = (
              emp.profile_details?.username ||
              emp.username ||
              firstName ||
              emailUser ||
              empIdClean
            ).trim();

            const password = (
              emp.profile_details?.password ||
              emp.password ||
              firstName ||
              empIdClean ||
              "123456"
            );

            return {
              label: emp.name,
              username,
              password,
              accessRole: emp.accessRole,
            };
          });
        setDynamicHints(hints);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDynamicHints();
  }, []);

  // Reload hints whenever the role tab switches
  useEffect(() => {
    loadDynamicHints();
  }, [role]);

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
    const isAllowed = role === "admin" ? user.role === "admin" : (user.role === "employee" || user.role === "manager");
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

  const hintUsers = role === "admin"
    ? dynamicHints.filter(h => h.accessRole === "Admin" || h.username === "admin")
    : dynamicHints.filter(h => h.accessRole !== "Admin" && h.username !== "admin");
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center lg:justify-between px-6 lg:px-32 overflow-hidden bg-background">
      {/* Full-screen Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/40 lg:bg-black/20" />


      {/* Absolute Logo */}
      <div className="absolute top-8 left-6 lg:left-12 z-20">
        <img
          src={logoImg}
          alt="LookMyHolidays"
          className="h-16 md:h-24 w-auto drop-shadow-lg"
        />
      </div>

      {/* Left side text (Hidden on small screens) */}
      <div className="hidden lg:flex relative z-10 flex-col max-w-lg select-none mt-12">
        <h1 className="text-5xl lg:text-[4.2rem] font-extrabold leading-[1.05] text-white uppercase font-display drop-shadow-xl">
          TRAVEL<br />BEYOND<br /><span className="text-[#c4f042]">EXPECTATIONS</span>
        </h1>
        <p className="mt-6 text-[15px] text-white/90 font-medium leading-relaxed max-w-sm drop-shadow-md">
          Unlock the world. Let your wanderlust lead you to your dream destinations.
        </p>
      </div>

      {/* Right side form card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[32px] bg-[#425568]/40 p-10 backdrop-blur-xl border border-white/10 shadow-2xl">

        {/* Role Selector */}
        <div className="mb-8 flex rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setError("");
              setUsername("");
              setPassword("");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${role === "admin"
              ? "bg-white text-gray-900 shadow-md scale-100"
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
              ? "bg-white text-gray-900 shadow-md scale-100"
              : "text-white/70 hover:text-white scale-95"
              }`}
          >
            <UserCheck className={`h-3.5 w-3.5 ${role === "employee" ? "text-gray-900" : "opacity-70"}`} />
            Employee
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-white drop-shadow-sm tracking-wide">
              Username
            </label>
            <Input
              id="login-username"
              placeholder={role === "admin" ? "Enter admin username" : "Enter employee username"}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="h-12 w-full rounded-xl bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 border-0 focus-visible:ring-2 focus-visible:ring-[#c4f042] transition-shadow shadow-inner"
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-white drop-shadow-sm tracking-wide">
              Password
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-xl bg-white pl-4 pr-10 text-[15px] text-gray-900 placeholder:text-gray-400 border-0 focus-visible:ring-2 focus-visible:ring-[#c4f042] transition-shadow shadow-inner"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="pt-1 text-right">
              <a href="#" className="text-[11px] font-semibold text-white/90 hover:text-[#c4f042] transition-colors drop-shadow-sm">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200 animate-in fade-in duration-300 backdrop-blur-md">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="leading-tight">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            id="login-submit-btn"
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full h-12 mt-4 rounded-xl bg-[#c4f042] hover:bg-[#b5e032] text-gray-900 font-bold text-[15px] shadow-[0_0_20px_rgba(196,240,66,0.3)] transition-all active:scale-[0.98] border-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/30 border-t-gray-900" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 mt-8 opacity-60">
            <div className="flex-1 h-px bg-white" />
            <span className="text-[11px] font-medium text-white uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white" />
          </div>

          {/* Social Buttons */}
          <div className="mt-6">
            <button type="button" className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Google
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-white/80">
            Don't have an account? <a href="#" className="font-bold text-white hover:underline transition-colors drop-shadow-sm">Sign Up</a>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 w-full text-center z-20 pointer-events-none">
        <p className="text-sm font-medium text-white/70 drop-shadow-md">
          Designed and deployed by Jatin Jangid
        </p>
      </div>
    </div>
  );
}
