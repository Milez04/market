"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppLogo } from "@/components/ui/shell";
import { getStoredUser, phpRequest, storeSession, type PhpUser } from "@/lib/php-api";

export default function ProfilePage() {
  const [user, setUser] = useState<PhpUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  async function saveProfile(formData: FormData) {
    if (!user) return;
    try {
      const data = await phpRequest<{ user: PhpUser }>("/auth/update-profile.php", {
        method: "POST",
        body: JSON.stringify({ name: String(formData.get("name") ?? "") }),
      });
      storeSession(data.user, localStorage.getItem("cardforge.php.token") ?? "");
      setUser(data.user);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#eef0f4] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <AppLogo />
          <Button asChild variant="secondary"><Link href="/"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        </div>
        <Card className="border-0 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Profile edit</CardTitle>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Button asChild variant="accent"><Link href="/auth/login">Login</Link></Button>
            ) : (
              <form action={saveProfile} className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Name
                  <Input name="name" defaultValue={user.name} required />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Email
                  <Input defaultValue={user.email} disabled />
                </label>
                <Button variant="accent"><Save className="h-4 w-4" /> Save profile</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
