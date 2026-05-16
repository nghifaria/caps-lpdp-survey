import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { toast } from 'sonner'

type UserRole = Database['public']['Tables']['profiles']['Row']['role']

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
      toast.error(signInError.message)
      setLoading(false)
      return
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      const message = 'Gagal memuat data pengguna setelah login.'
      setError(message)
      toast.error(message)
      setLoading(false)
      return
    }

    const { data: profileData, error: profileError } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle()) as {
      data: { role: UserRole } | null
      error: { message: string } | null
    }

    if (profileError) {
      setError(profileError.message)
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    const role: UserRole = profileData?.role ?? 'awardee'

    toast.success('Login berhasil.')
    navigate(role === 'admin' ? '/admin/dashboard' : '/', { replace: true })
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
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white/15 ring-1 ring-white/20">
              <img src="/logo_lpdp.png" alt="LPDP" className="h-full w-full object-cover" />
            </div>
          </div>

          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-[#242428]/80">
            Unified Access
          </p>
          <h1 className="mb-12 text-center text-3xl font-bold text-[#242428]">Login</h1>

          <p className="mb-6 text-center text-sm leading-6 text-white/85">
            Gunakan email dan password yang terdaftar. Admin akan diarahkan ke dashboard, awardee ke beranda survei.
          </p>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-[#242428]" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
                  placeholder="awardee@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#242428]" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
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

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[#242428] py-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Memproses...' : 'Login'}
              </button>
            </form>
          )}

          <p className="mt-10 text-center text-white">
            Belum punya akun?{' '}
            <Link to="/register" className="font-bold underline underline-offset-4">
              Sign Up
            </Link>
          </p>

          <p className="mt-4 text-center text-xs leading-6 text-white/75">
            Setelah login, sistem akan membaca role dari profil dan mengarahkan Anda secara otomatis.
          </p>
        </div>
      </div>
    </main>
  )
}

export default Login
