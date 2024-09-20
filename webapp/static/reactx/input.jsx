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

function Select({id, children, placeholder, selected, setSelected}) {
	React.useEffect(()=>{
		new TomSelect(`#${id}`, {
			maxItems: 200,
			allowEmptyOption: true,
			hidePlaceholder: false,
			items: selected,
			onItemAdd: function(){
				this.setTextboxValue('');
				this.refreshOptions();
			},
		})
	}, [])
	function handleChange(e) {
		let values = e.target.tomselect.getValue(0)
		setSelected([...values])
	}
	return (
		<select name="" id={id}
	        placeholder={placeholder}
	        onChange={handleChange}
		>
			{children}
		</select>
	)
}

function Range({min, max, lowerVal, lowerValSetter, higherVal, higherValSetter}) {
	function handleLowerChange(e) {
		lowerValSetter(e.target.value*-1)
	}
	function handleHigherChange(e) {
		higherValSetter(e.target.value*1)
	}
	let halfwayA = Math.ceil((higherVal - lowerVal) / 2)
	let halfwayB = Math.floor((higherVal - lowerVal) / 2)
	let halfwayYearA = halfwayA + lowerVal
	let halfwayYearB = halfwayB + lowerVal

	return (
		<div className="dual_range">
			{lowerVal}-{higherVal}
			<div className="sliders">
				<div className="lower" style={{flexGrow: halfwayYearA - min}}>
					<input type="range" className={"lower"}
					       min={(halfwayYearA) * -1} max={min * -1} step={1} value={lowerVal * -1}
					       onChange={handleLowerChange}
					/>
					<meter min={(halfwayYearA+1) * -1} max={min * -1} value={lowerVal * -1}/>
				</div>
				<div className="higher" style={{flexGrow: max - halfwayYearB}}>
					<input type="range" className={"higher"}
					       max={max} min={halfwayYearB} step={1} value={higherVal}
					       onChange={handleHigherChange}
					/>
					<meter min={halfwayYearB-1} max={max} value={higherVal}/>
				</div>
			</div>
		</div>
	)
}