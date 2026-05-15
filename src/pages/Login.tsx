import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    navigate('/profile', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eef4fb_0%,_#ffffff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(0,51,102,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-[#003366] p-8 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">
              Awardee Access
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Login Responden
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
              Masuk untuk melanjutkan survei atau memperbarui profil awardee.
            </p>
          </section>

          <section className="p-8 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#003366]">
              Masuk ke Akun
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Gunakan email dan password yang terdaftar.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
                  placeholder="awardee@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? 'Memproses...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold text-[#003366] hover:text-[#F97316]">
                Daftar di sini
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

export default Login
