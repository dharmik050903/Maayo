import { useState, useEffect, useRef } from 'react'

export default function AnimatedCounter({ 
  end, 
  duration = 2000, 
  start = 0, 
  suffix = '', 
  prefix = '',
  className = '',
  delay = 0 
}) {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const counterRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (counterRef.current) {
      observer.observe(counterRef.current)
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const startValue = start
    const endValue = end

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      
      setCount(Math.floor(currentValue))

      if (progress < 1) {
        intervalRef.current = requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }

    // Add delay before starting animation
    const timeoutId = setTimeout(() => {
      animate()
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current)
      }
    }
  }, [isVisible, end, duration, start, delay])

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div ref={counterRef} className={`font-bold text-2xl ${className}`}>
      {prefix}{formatNumber(count)}{suffix}
    </div>
  )
}
