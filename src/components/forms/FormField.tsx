import React from 'react'

interface FormFieldProps {
  label: string
  type?: string
  placeholder?: string
  name: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  error?: string
  options?: string[]
  min?: string | number
  max?: string | number
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  name,
  value,
  onChange,
  error,
  options = [],
  min,
  max,
}) => {
  return (
    <div className="w-full">
      {/* LABEL */}
      <label className="mb-2 block text-left text-md font-semibold text-white">
        {label}
      </label>

      {/* SELECT */}
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-transparent bg-white px-4 py-2 text-md text-[#2B2B2B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]"
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <>
          {/* INPUT */}
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            className={`w-full rounded-xl border px-4 py-2 text-md bg-white text-[#2B2B2B] placeholder:text-gray-500 placeholder:italic focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-transparent focus:ring-[#242428]'
            }`}
          />

          {/* ERROR */}
          {error && (
            <p className="mt-1 text-left text-sm italic text-white">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default FormField
