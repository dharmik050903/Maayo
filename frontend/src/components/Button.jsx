import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false, 
  disabled = false,
  className = '', 
  ...props 
}) {
  const { t } = useComprehensiveTranslation()
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'accent':
        return 'btn-accent'
      case 'secondary':
        return 'btn-secondary'
      case 'success':
        return 'btn-success'
      case 'warning':
        return 'btn-warning'
      case 'danger':
        return 'btn-danger'
      case 'outline':
        return 'btn-outline'
      case 'ghost':
        return 'btn-ghost'
      default:
        return 'btn-primary'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-3 py-1.5 text-xs'
      case 'sm':
        return 'px-4 py-2 text-sm'
      case 'lg':
        return 'px-8 py-4 text-lg'
      case 'xl':
        return 'px-10 py-5 text-xl'
      default:
        return 'px-6 py-3 text-base'
    }
  }

  const isDisabled = disabled || loading

  return (
    <button 
      className={`${getVariantClasses()} ${getSizeClasses()} disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none hover-lift ${className}`} 
      disabled={isDisabled} 
      {...props}
    >
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
          {t('loading')}
        </span>
      ) : (
        children
      )}
    </button>
  )
}