import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database'
import { toast } from 'sonner'

const avatarBucket = 'avatars'
const provinceOptions = ['Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten', 'DI Yogyakarta', 'Bali']

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [nik, setNik] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [province, setProvince] = useState('')
  const [university, setUniversity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError(null)

      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        if (!cancelled) {
          setError('User belum login.')
          setLoading(false)
        }
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, nik, date_of_birth, province, university, updated_at')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) {
        return
      }

      if (profileError) {
        setError(profileError.message)
        toast.error(profileError.message)
        setLoading(false)
        return
      }

      if (data) {
        const profileData = data as ProfileRow
        setFullName(profileData.full_name ?? '')
        setNik(profileData.nik ?? '')
        setDateOfBirth(profileData.date_of_birth ?? '')
        setProvince(profileData.province ?? '')
        setUniversity(profileData.university ?? '')
        setAvatarUrl(profileData.avatar_url ?? '')
      }

      setLoading(false)
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const previewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }

    return avatarUrl
  }, [avatarUrl, file])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      setError('User belum login.')
      setSaving(false)
      return
    }

    let nextAvatarUrl = avatarUrl

    if (file) {
      const fileExt = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.id}/${Date.now()}.${fileExt}`
      const uploadResult = await supabase.storage.from(avatarBucket).upload(filePath, file, {
        upsert: true,
      })

      if (uploadResult.error) {
        setError(uploadResult.error.message)
        toast.error(uploadResult.error.message)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage.from(avatarBucket).getPublicUrl(filePath)
      nextAvatarUrl = publicUrlData.publicUrl
      toast.success('Foto profil berhasil diunggah.')
    }

    const { error: updateError } = await (supabase.from('profiles') as any).upsert({
      id: user.id,
      full_name: fullName,
      avatar_url: nextAvatarUrl,
      nik,
      date_of_birth: dateOfBirth || null,
      province: province || null,
      university,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      setError(updateError.message)
      toast.error(updateError.message)
      setSaving(false)
      return
    }

    setAvatarUrl(nextAvatarUrl)
    setFile(null)
    setSuccess('Profil berhasil diperbarui.')
    toast.success('Profil berhasil diperbarui.')
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_var(--color-broken-white)_0%,_var(--color-light-grey)_100%)] px-4 py-10 text-ash sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-light-grey bg-white/80 px-4 py-2 text-sm font-semibold text-ash/80 transition-all hover:bg-white hover:text-ash hover:shadow-sm"
          >
            <span aria-hidden="true">←</span>
            Kembali ke Beranda
          </Link>
        </div>

        <div className="rounded-3xl border border-light-grey bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-oren">
            Profile Management
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight tracking-[-0.04em] text-navy sm:text-4xl">
            Profil Awardee
          </h1>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <form className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-light-grey bg-butter/10 p-5 text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-navy/5 shadow-[0_16px_40px_rgba(28,73,153,0.12)]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold uppercase tracking-[0.2em] text-navy">
                      Avatar
                    </span>
                  )}
                </div>
                <label className="mt-5 block text-sm font-medium text-ash cursor-pointer hover:text-oren transition" htmlFor="avatar-file">
                  Unggah foto profil
                </label>
                <input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="mt-2 w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-ash" htmlFor="full-name">
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-light-grey px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 bg-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-ash" htmlFor="nik">
                    NIK
                  </label>
                  <input
                    id="nik"
                    type="text"
                    value={nik}
                    onChange={(event) => setNik(event.target.value)}
                    placeholder="Contoh: 3174xxxxxxxxxxxx"
                    className="mt-2 w-full rounded-2xl border border-light-grey px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ash" htmlFor="date-of-birth">
                    Tanggal Lahir
                  </label>
                  <input
                    id="date-of-birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-light-grey px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ash" htmlFor="province">
                    Asal Provinsi
                  </label>
                  <select
                    id="province"
                    value={province}
                    onChange={(event) => setProvince(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 cursor-pointer"
                  >
                    <option value="">Pilih provinsi</option>
                    {provinceOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-ash" htmlFor="university">
                    Asal Perguruan Tinggi / Universitas
                  </label>
                  <input
                    id="university"
                    type="text"
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    placeholder="Contoh: Universitas Indonesia"
                    className="mt-2 w-full rounded-2xl border border-light-grey px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 bg-white"
                  />
                </div>
              </div>

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade-in">
                  {success}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </main>
  )
}

export default ProfilePage
