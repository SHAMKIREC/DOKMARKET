export default function RespondentNameInput({ value, onChange, placeholder, style }) {
  return (
    <div>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        style={style}
        autoComplete="organization"
      />
      <p style={{ color: "#fbbf24", fontSize: "0.72rem", marginTop: 5 }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 5 }}></i>
        Подсказки временно недоступны, заполните данные вручную
      </p>
    </div>
  );
}
