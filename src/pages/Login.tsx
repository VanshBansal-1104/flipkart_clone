import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiLogin, apiRegister } from "@/lib/authApi";
import { useAuthStore } from "@/store/authStore";
import { clearStoredAddress } from "@/lib/checkoutStorage";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("register") === "1" ? "register" : "login";
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      const { token, user } = await apiLogin(values.email, values.password);
      clearStoredAddress();
      setAuth(token, user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const { token, user } = await apiRegister(values.email, values.password, values.name);
      clearStoredAddress();
      setAuth(token, user);
      toast.success("Account created!");
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Header />

      <main className="max-w-[440px] mx-auto px-4 py-10 sm:py-14">
        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-semibold text-[#212121] tracking-tight">
              {tab === "login" ? "Login" : "Create account"}
            </CardTitle>
            <CardDescription className="text-[#878787] text-sm">
              {tab === "login"
                ? "Get access to your Orders, Wishlist and recommendations"
                : "Sign up with your email to start shopping"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <div className="flex rounded-full bg-[#f0f2f5] p-1">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                  tab === "login" ? "bg-white text-[#2874f0] shadow-sm" : "text-[#878787]"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                  tab === "register" ? "bg-white text-[#2874f0] shadow-sm" : "text-[#878787]"
                }`}
              >
                Sign up
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#212121] text-sm font-medium">
                    Email
                  </Label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#212121] placeholder:text-[#9e9e9e] focus:border-[#2874f0] focus:outline-none transition-colors"
                    placeholder="Enter email"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#212121] text-sm font-medium">
                    Password
                  </Label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#212121] placeholder:text-[#9e9e9e] focus:border-[#2874f0] focus:outline-none transition-colors"
                    placeholder="Enter password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#FFE500] py-3.5 text-base font-bold text-[#212121] hover:bg-[#e6cf00] active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm"
                >
                  {loading ? "Please wait…" : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#212121] text-sm font-medium">
                    Name <span className="text-[#878787] font-normal">(optional)</span>
                  </Label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#212121] placeholder:text-[#9e9e9e] focus:border-[#2874f0] focus:outline-none transition-colors"
                    placeholder="Your name"
                    {...registerForm.register("name")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[#212121] text-sm font-medium">
                    Email
                  </Label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#212121] placeholder:text-[#9e9e9e] focus:border-[#2874f0] focus:outline-none transition-colors"
                    placeholder="Enter email"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[#212121] text-sm font-medium">
                    Password
                  </Label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#212121] placeholder:text-[#9e9e9e] focus:border-[#2874f0] focus:outline-none transition-colors"
                    placeholder="At least 6 characters"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#FFE500] py-3.5 text-base font-bold text-[#212121] hover:bg-[#e6cf00] active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm"
                >
                  {loading ? "Please wait…" : "Continue"}
                </button>
              </form>
            )}

            <p className="text-center text-xs text-[#878787] leading-relaxed">
              By continuing, you agree to Flipkart&apos;s{" "}
              <a href="#" className="text-[#2874f0] font-medium">
                Terms of Use
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#2874f0] font-medium">
                Privacy Policy
              </a>
              .
            </p>

            <p className="text-center text-sm">
              <Link to="/" className="text-[#2874f0] font-semibold hover:underline">
                ← Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;
