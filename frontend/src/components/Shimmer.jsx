export default function Shimmer({ className = "", lines = 1, height = "h-4" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

export function FormShimmer() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Form title shimmer */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      {/* Form fields shimmer */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Button shimmer */}
      <div className="flex justify-end">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )
}

export function PageShimmer() {
  return (
    <div className="min-h-screen grid md:grid-cols-2 animate-pulse">
      {/* Left Side - Brand Section Shimmer */}
      <div className="hidden md:flex bg-gray-200 p-10 items-center justify-center">
        <div className="space-y-8 max-w-md text-center">
          <div className="flex justify-center">
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-300 rounded w-3/4 mx-auto"></div>
            <div className="h-6 bg-gray-300 rounded w-full"></div>
            <div className="h-6 bg-gray-300 rounded w-5/6 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Shimmer */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden text-center">
            <div className="w-20 h-8 bg-gray-200 rounded mx-auto"></div>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <FormShimmer />
          </div>
        </div>
      </div>
    </div>
  )
}
