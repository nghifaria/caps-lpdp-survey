import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database'
import { toast } from 'sonner'
import FormField from '../../components/forms/FormField'

type UserRole = Database['public']['Tables']['profiles']['Row']['role']

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
    navigate(role === 'admin' ? '/admin' : '/', { replace: true })
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* LEFT SIDE */}
      <div className="relative hidden w-1/2 items-center justify-center bg-[#F5F5F5] lg:flex">
        <img
          src="/login-image.png"
          alt="LPDP Awardee"
          className="h-screen w-full object-cover"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="relative flex w-full items-center justify-center bg-[#D97843] px-8 py-12 lg:w-1/2">
        {/* Decorative Shape */}
        <div className="absolute right-0 top-0 h-full w-full bg-[#E08450] opacity-60 [clip-path:polygon(100%_0,100%_100%,40%_100%)]" />

        {/* Form Container */}
        <div className="relative z-10 w-full max-w-md">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-[#242428]/80">
            Unified Access
          </p>
          <h1 className="mb-12 text-center text-3xl font-bold text-[#242428]">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FormField
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#242428] py-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-10 text-center text-white font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold underline underline-offset-4">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
