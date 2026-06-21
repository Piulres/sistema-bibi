"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  portal: "prestador" | "interno" | "pj" | "beneficiario";
  title: string;
  subtitle: string;
  accent: string;
  demoEmail: string;
  demoPassword: string;
};

export default function LoginForm({
  portal,
  title,
  subtitle,
  accent,
  demoEmail,
  demoPassword,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no login");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Voltar
        </Link>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${accent}`} />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Demo: <span className="font-mono">{demoEmail}</span> / senha{" "}
            <span className="font-mono">{demoPassword}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
