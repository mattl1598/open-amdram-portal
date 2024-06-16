function Input({type="text", id, onInput, value="", label="", required=false}) {
	const opts = {}
	if (type !== "password") {
		opts.placeholder = " "
	}
	return (
		<div className={"react-fancy-input"}>
			<input id={id} name={id} type={type} {...opts} defaultValue={value} value={value} onInput={onInput} required={required}></input>
			{label ? <label htmlFor={id}>{label}</label> : ""}
		</div>
	)
}