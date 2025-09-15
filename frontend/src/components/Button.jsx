export default function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'accent':
        return 'btn-accent'
      case 'secondary':
        return 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-graphite bg-gray-100 hover:bg-gray-200 transition'
      case 'danger':
        return 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-white bg-coral hover:bg-coral/90 transition'
      default:
        return 'btn-primary'
    }
  }

  return (
    <button className={`${getVariantClasses()} disabled:opacity-60 ${className}`} disabled={loading} {...props}>
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}