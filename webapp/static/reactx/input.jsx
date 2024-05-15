function Input({type="text", id, onInput, value="", label=""}) {
	return (
		<div className={"react-fancy-input"}>
			<input id={id} name={id} type={type} placeholder=" " defaultValue={value} onInput={onInput}></input>
			<label htmlFor={id}>{label}</label>
		</div>
	)
}