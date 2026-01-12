"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, LogIn } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        const msg =
          typeof result.error === 'string'
            ? result.error
            : result.error && typeof result.error === 'object' && 'message' in result.error
            ? (result.error as any).message
            : JSON.stringify(result.error);
        toast.error(msg);
      } else {
        toast.success("Connexion réussie");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Maison Luxe</p>
              <h1 className="text-3xl font-semibold text-slate-900">Connexion</h1>
            </div>
            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-900 text-white">
              <LogIn className="h-5 w-5" />
            </span>
          </div>

          <div className="space-y-3 mb-8">
            <button
              type="button"
              onClick={googleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 transition-colors disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path fill="#4285f4" d="M533.5 278.4c0-18.5-1.6-36.3-4.7-53.6H272v101.5h147.1c-6.4 34.6-26 63.9-55.3 83.6v69.5h89.3c52.2-48.1 82.4-118.8 82.4-201z"/>
                <path fill="#34a853" d="M272 544.3c74.7 0 137.5-24.7 183.3-67.1l-89.3-69.5c-24.9 16.7-56.7 26.6-94 26.6-72 0-133-48.6-154.8-114.3H27.2v71.6C71.8 486.8 165.5 544.3 272 544.3z"/>
                <path fill="#fbbc04" d="M117.2 330.0c-10.9-32.9-10.9-68 0-100.9V157.5H27.2c-39.7 79.6-39.7 173.5 0 253.1l90-80.6z"/>
                <path fill="#ea4335" d="M272 108.1c39.6 0 75.3 13.6 103.4 40.4l77.5-77.5C404.4 24.7 341.6 0 272 0 165.5 0 71.8 57.5 27.2 142.1l90 71.6C139 156.7 200 108.1 272 108.1z"/>
              </svg>
              Continuer avec Google
            </button>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>Email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600 text-center">
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>

        <div className="hidden lg:block rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg" aria-hidden />
      </div>
    </div>
  );
}
