import Logo from '../components/Logo'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-brand-gradient text-white p-10 items-end">
        <div className="space-y-6 max-w-md">
          <Logo theme="light" />
          <h2 className="text-3xl font-semibold">Build with trust</h2>
          <p className="text-white/80">Secure, modern, and minimal. Designed for confidence and speed.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12 bg-base">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden"><Logo theme="dark" /></div>
          <div className="card p-6 md:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-graphite">{title}</h1>
              {subtitle && <p className="text-coolgray mt-1">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}


