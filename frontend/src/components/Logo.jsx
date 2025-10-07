export default function Logo({ theme = 'light' }) {
  const textClass = theme === 'light' ? 'text-white' : 'text-graphite'
  return (
    <div className="flex items-center gap-3 select-none hover-scale">
      <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center border-0 outline-none shadow-lg">
        {/* Reference the logo from the public directory with an absolute path */}
        <img src="/MaayoLogo.jpg" alt="Maayo Logo" className="w-full h-full object-cover rounded-xl" />
      </div>
      <span className={`text-2xl font-bold ${textClass}`}>Maayo</span>
    </div>
  )
}
