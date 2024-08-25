function Input(
	{
		type="text", id, inputRef,
		onInput, onChange, onClick,
		value, label="", required=false,
		stateful=false, children,
		className
	}
	) {
	const opts = {}
	if (type !== "password") {
		opts.placeholder = " "
	}
	if (type === "submit" || stateful === true) {
		opts.value = value
	} else {
		opts.defaultValue = value
	}
	if (type === "textarea") {
		return (
			<div className={"react-fancy-input"}>
				<textarea ref={inputRef} name={id} {...opts} onInput={onInput} onChange={onChange} required={required}></textarea>
				{label ? <label htmlFor={id}>{label}</label> : ""}
			</div>
		)
	} else if (type === "button") {
		return (
			<div className="react-fancy-input">
				<button type={"button"} id={id} className={className} onClick={onClick}>{children}</button>
			</div>
		)
	} else if (type === "select") {
		return (
			<div className={"react-fancy-input"}>
				<select ref={inputRef} id={id} name={id} {...opts} onInput={onInput} onChange={onChange} onClick={onClick} required={required}>
					{children}
				</select>
				{label ? <label htmlFor={id}>{label}</label> : ""}
			</div>
		)
	} else {
		return (
			<div className={"react-fancy-input"}>
				<input ref={inputRef} className={className} id={id} name={id} type={type} {...opts} onInput={onInput} onChange={onChange} onClick={onClick} required={required}></input>
				{label ? <label htmlFor={id}>{label}</label> : ""}
			</div>
		)
	}
}