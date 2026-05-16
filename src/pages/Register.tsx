import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      toast.error(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess('Pendaftaran berhasil. Silakan login untuk melanjutkan.')
    toast.success('Pendaftaran berhasil. Silakan login untuk melanjutkan.')
    setLoading(false)
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-[#D97843] text-white">
      <div className="relative hidden w-1/2 items-center justify-center bg-[#F5F5F5] lg:flex">
        <img src="/login-image.png" alt="LPDP Awardee" className="h-screen w-full object-cover" />
      </div>

      <div className="relative flex w-full items-center justify-center bg-[#D97843] px-8 py-12 lg:w-1/2">
        <div className="absolute right-0 top-0 h-full w-full bg-[#E08450] opacity-60 [clip-path:polygon(100%_0,100%_100%,40%_100%)]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex items-center justify-center">
            <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-3xl bg-white/15 px-3 ring-1 ring-white/20">
              <img src="/logo_lpdp.png" alt="LPDP" className="h-full w-full object-contain" />
            </div>
          </div>

          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-[#242428]/80">
            Awardee Registration
          </p>
          <h1 className="mb-12 text-center text-3xl font-bold text-[#242428]">Sign Up</h1>

          <p className="mb-6 text-center text-sm leading-6 text-white/85">
            Pendaftaran hanya untuk responden LPDP. Profil akan dibuat otomatis setelah sign up.
          </p>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-[#242428]" htmlFor="full-name">
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
                  placeholder="Nama lengkap awardee"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#242428]" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
                  placeholder="awardee@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#242428]" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[#242428] py-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Mendaftar...' : 'Register'}
              </button>
            </form>
          )}

          <p className="mt-10 text-center text-white">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold underline underline-offset-4">
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default Register
