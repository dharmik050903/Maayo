export default function Input({ label, type = 'text', name, placeholder, required = false, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-semibold text-graphite">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      )}
      <input className="input" type={type} name={name} placeholder={placeholder} {...props} />
    </label>
  )
}


