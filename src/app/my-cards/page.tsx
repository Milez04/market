"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/ui/shell";
import { getStoredUser, phpRequest, type PhpProject } from "@/lib/php-api";

export default function MyCardsPage() {
  const [projects, setProjects] = useState<PhpProject[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getStoredUser()));
    phpRequest<{ projects: PhpProject[] }>("/projects/list.php")
      .then((data) => setProjects(data.projects))
      .catch(() => setProjects([]));
  }, []);

  async function deleteProject(project: PhpProject) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;
    try {
      await phpRequest("/projects/delete.php", {
        method: "DELETE",
        body: JSON.stringify({ id: project.id }),
      });
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Card could not be deleted");
    }
  }

  return (
    <main className="min-h-screen bg-[#eef0f4] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <AppLogo />
          <div className="flex gap-2">
            <Button asChild variant="secondary"><Link href="/"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
            <Button asChild variant="accent"><Link href="/designer/new"><Plus className="h-4 w-4" /> New card</Link></Button>
          </div>
        </div>
        <Card className="border-0 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">My cards</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!loggedIn && <Button asChild variant="accent"><Link href="/auth/login">Login</Link></Button>}
            {loggedIn && projects.length === 0 && <p className="text-sm text-slate-500">No saved card projects yet.</p>}
            {projects.map((project) => (
              <div key={project.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-4 rounded-xl border p-3 transition hover:bg-slate-50">
                <div className="h-14 rounded-lg bg-slate-100 bg-cover bg-center" style={{ backgroundImage: project.preview ? `url("${project.preview}")` : undefined }} />
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-sm text-slate-500">Updated {project.updated_at ?? "now"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/designer/${project.id}`}>Open</Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void deleteProject(project)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
