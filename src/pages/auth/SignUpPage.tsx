import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import FormField from '../../components/forms/FormField'

function SignUpPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validateForm = () => {
    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi.')
      return false
    }
    if (!email) {
      toast.error('Email wajib diisi.')
      return false
    }
    if (!password) {
      toast.error('Password wajib diisi.')
      return false
    }
    if (password.length < 8) {
      toast.error('Password minimal 8 karakter.')
      return false
    }
    if (password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak sama.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

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
            Awardee Registration
          </p>
          <h1 className="mb-12 text-center text-3xl font-bold text-[#242428]">
            Sign Up
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Full Name"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

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

            <FormField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

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
              className="mt-6 w-full rounded-xl bg-[#242428] py-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Mendaftar...' : 'Sign Up'}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-10 text-center text-white font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
