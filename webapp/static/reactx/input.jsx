function Input(
	{
		type="text", id, inputRef,
		onInput, onChange, onClick,
		value, label="", required=false,
		stateful=false, children,
		className, form=""
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
	if (form !== "") {
		opts.form = form
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

function Select({id, children, placeholder, selected, setSelected, options=[], optgroups=[], create=true, maxItems=200}) {
	const ref = React.createRef()
	let currentSelection = [...selected]
	function onInit() {
		setTimeout(()=>{
			document.getElementById(id).tomselect.blur()
			document.getElementById(id).tomselect.close()
		}, 100)
	}
	React.useEffect(()=>{
		new TomSelect(`#${id}`, {
			maxItems: maxItems,
			allowEmptyOption: true,
			hidePlaceholder: true,
			openOnFocus: false,
			hideSelected: true,
			closeAfterSelect: maxItems === 1,
			items: currentSelection,
			options: options,
			optgroups: optgroups,
			optgroupField: "group",
			create: create,
			onItemAdd: function(){
				this.setTextboxValue('');
				this.refreshOptions();
				if (maxItems === 1) {
					this.blur();
					this.close();
				}
			},
	        onChange: handleChange,
			onInitialize: onInit,

		})
	}, [])

	React.useEffect(() => {
		let tempSelected = [...currentSelection];
		ref.current.tomselect.clearOptions()
		ref.current.tomselect.addOptions(options)
		ref.current.tomselect.refreshOptions()
		ref.current.tomselect.refreshItems()
		setSelected([...tempSelected])
	}, [options])

	React.useEffect(()=>{
		if (currentSelection !== selected) {
			ref.current.tomselect.setValue(selected, true)
			currentSelection = selected
		}
	}, [selected])

	function handleChange(e) {
		if (e !== currentSelection) {
			currentSelection = [...e]
			setSelected([...e])
		}
	}
	return (
		<select name="" id={id} ref={ref}
	        placeholder={placeholder}
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