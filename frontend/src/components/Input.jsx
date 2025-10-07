import { useState } from 'react'

export default function Input({ 
  label, 
  type = 'text', 
  name, 
  placeholder, 
  required = false, 
  error = null,
  help = null,
  variant = 'default',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false)
  
  const getInputClasses = () => {
    const baseClasses = 'w-full border transition-all duration-300 focus:outline-none'
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    }
    
    // Variant classes
    const variantClasses = {
      default: error ? 'input-error' : 'input',
      success: 'input-success',
      error: 'input-error'
    }
    
    // Icon padding
    const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${iconClasses} ${className}`
  }

  const getLabelClasses = () => {
    return `form-label ${error ? 'text-error' : 'text-graphite'}`
  }

  return (
    <div className="form-group">
      {label && (
        <label className={getLabelClasses()}>
          {label} {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        
        <input 
          className={`${getInputClasses()} focus-ring ${className}`}
          type={type} 
          name={name} 
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props} 
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="form-error">{error}</p>
      )}
      
      {help && !error && (
        <p className="form-help">{help}</p>
      )}
    </div>
  )
}


