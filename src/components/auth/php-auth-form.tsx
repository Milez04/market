"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppLogo } from "@/components/ui/shell";
import { phpRequest, storeSession, type PhpUser } from "@/lib/php-api";

type AuthResponse = {
  user: PhpUser;
  token: string;
};

export function PhpAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";

  async function submitAuth(formData: FormData) {
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const data = await phpRequest<AuthResponse>(`/auth/${mode}.php`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      storeSession(data.user, data.token);
      toast.success(isLogin ? "Logged in" : "Account created");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef0f4] px-4 py-10">
      <motion.div
        className="absolute left-[18%] top-[16%] h-56 w-56 rounded-full bg-teal-300/30 blur-3xl"
        animate={{ y: [0, 24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[14%] right-[18%] h-64 w-64 rounded-full bg-violet-300/30 blur-3xl"
        animate={{ y: [0, -22, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38 }}
      >
        <Card className="border-0 bg-white/95 shadow-2xl shadow-slate-300/70 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-5">
              <AppLogo />
            </div>
            <CardTitle className="text-3xl">{isLogin ? "Login" : "Register"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submitAuth} className="grid gap-4">
              {!isLogin && (
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="h-12 pl-9" name="name" placeholder="Name" required />
                </div>
              )}
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="h-12 pl-9" name="email" type="email" placeholder="Email" required />
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="h-12 pl-9" name="password" type="password" placeholder="Password" minLength={isLogin ? undefined : 6} required />
              </div>
              <Button className="h-12" variant="accent">
                {isLogin ? "Login" : <><UserPlus className="h-4 w-4" /> Create account</>}
              </Button>
            </form>
            <div className="mt-5 text-center text-sm text-slate-500">
              {isLogin ? (
                <span>No account? <Link className="font-semibold text-slate-950" href="/auth/register">Register</Link></span>
              ) : (
                <span>Already have an account? <Link className="font-semibold text-slate-950" href="/auth/login">Login</Link></span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
