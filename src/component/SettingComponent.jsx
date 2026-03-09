export const CheckboxField = ({ label, id, name, checked, onChange }) => (
  <div className="d-flex justify-content-between w-100 align-items-center mb-1 mt-2">
    <label htmlFor={id} className="px-2">
      {label}
    </label>
    <input
      type="checkbox"
      className="custom-checkbox"
      id={id}
      name={name}
      checked={!!checked}
      onChange={onChange}
    />
  </div>
);

export const SelectField = ({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
}) => (
  <div className="d-flex justify-content-between w-100 align-items-center">
    <label htmlFor={id} className="px-2">
      {label}
    </label>
    <select
      className="form-select no-scroll-bar w-50"
      id={id}
      name={name}
      value={value}
      onChange={onChange}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  </div>
);

export const SelectChannelParameters = ({
  value,
  onChange,
  options,
  isDisabled = false,
}) => (
  <select
    className="form-select"
    value={value}
    onChange={onChange}
    disabled={isDisabled}
  >
    {options.map((opt, i) => (
      <option key={i} value={opt.value ?? opt}>
        {opt.label ?? opt}
      </option>
    ))}
  </select>
);

export const InputChannelParameters = ({
  value,
  onChange,
  isDisabled = false,
  max = null,
}) => {
  const handleChange = (e) => {
    const v = e.target.value;
    if (/^\d*$/.test(v)) {
      const num = v === "" ? 0 : Number(v);
      onChange(num);
    }
  };

  return (
    <input
      type="text"
      className="form-control"
      value={value ?? 0}
      maxLength={max}
      onChange={handleChange}
      disabled={isDisabled}
    />
  );
};
