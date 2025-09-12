export default function PasswordRequirements({ password, show = false }) {
  if (!show) return null

  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      text: 'At least 1 uppercase (A–Z)',
      met: /[A-Z]/.test(password)
    },
    {
      text: 'At least 1 lowercase (a–z)',
      met: /[a-z]/.test(password)
    },
    {
      text: 'At least 1 digit (0–9)',
      met: /\d/.test(password)
    },
    {
      text: 'At least 1 special character (@, $, !, %, *, ?, &)',
      met: /[@$!%*?&]/.test(password)
    }
  ]

  const allMet = requirements.every(req => req.met)

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm font-medium text-graphite mb-2">Password Requirements:</div>
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              req.met ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {req.met && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
      {allMet && (
        <div className="mt-2 text-sm text-green-600 font-medium">
          ✅ Password meets all requirements
        </div>
      )}
    </div>
  )
}
