function Input(
	{
		type="text", id, inputRef,
		onInput, onChange, onClick,
		value, label="", required=false,
		stateful=false, children,
		className, form="", maxLength=null
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
	if (maxLength !== null) {
		opts.maxLength = maxLength
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

function Select({id, children, placeholder, selected, setSelected, options=[], optgroups=[], create=true, maxItems=200, selectOnTab=false, closeAfterSelect=false}) {
	const ref = React.useRef(null)
	const currentSelection = React.useRef(selected ? [...selected] : [])

	React.useEffect(()=>{
		let tomSelectOptions ={
			maxItems: maxItems,
			allowEmptyOption: true,
			hidePlaceholder: true,
			openOnFocus: false,
			hideSelected: true,
			closeAfterSelect: closeAfterSelect,
			items: currentSelection,
			options: options,
			optgroups: optgroups,
			optgroupField: "group",
			create: create,
			selectOnTab: selectOnTab,
			sortField: [{field:'$order'},{field:'$score'}],
			onItemAdd: function(){
				this.setTextboxValue('');
				this.refreshOptions();
				if (maxItems === 1) {
					this.blur();
					this.close();
				}
			},
			plugins: ['change_listener'],
			// onInitialize: onInit,
			onChange: handleChange
		}
		// if (sortField !== null) {
		// 	tomSelectOptions.sortField = [...sortField]
		// }

		new TomSelect(`#${id}`, tomSelectOptions)
	}, [])

	React.useEffect(() => {
		let temp = [...selected]
		ref.current.tomselect.clearOptions()
		ref.current.tomselect.addOptions(options)
		ref.current.tomselect.refreshOptions()
		ref.current.tomselect.refreshItems()

		ref.current.value = selected
		let newEvent = document.createEvent('HTMLEvents');
		newEvent.initEvent('change', false, true);
		ref.current.dispatchEvent(newEvent);

		ref.current.tomselect.setValue(temp, true)
		setSelected(temp)
	}, [options])

	function handleChange(value) {
		if (value !== currentSelection) {
			// currentSelection = value
			setSelected(value)
		}
	}

	React.useEffect(()=>{
		if (!(selected.length === currentSelection.length && JSON.stringify(selected) === JSON.stringify(currentSelection))) {
			ref.current.value = selected
			let newEvent = document.createEvent('HTMLEvents');
			newEvent.initEvent('change', false, true);
			ref.current.dispatchEvent(newEvent);
		}
	}, [selected])

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

// function SingleSelect({id, children, placeholder, selected, setSelected, options=[], optgroups=[], create=true, selectOnTab=false}) {
// 	const ref = React.useRef(null)
//
// 	React.useEffect(()=>{
// 		let tomSelectOptions ={
// 			maxItems: 1,
// 			allowEmptyOption: true,
// 			hidePlaceholder: true,
// 			openOnFocus: false,
// 			hideSelected: true,
// 			closeAfterSelect: true,
// 			items: selected,
// 			options: options,
// 			optgroups: optgroups,
// 			optgroupField: "group",
// 			create: create,
// 			selectOnTab: selectOnTab,
// 			sortField: [{field:'$order'},{field:'$score'}],
// 			plugins: ['change_listener'],
// 			onChange: handleChange
// 		}
//
// 		const tomSelect = new TomSelect(`#${id}`, tomSelectOptions)
//
// 		return () => {
// 			tomSelect.destroy()
// 		}
// 	}, [])
//
// 	React.useEffect(()=>{
// 		if (!ref.current || !ref.current.tomselect) {
// 			return
// 		}
//
// 		ref.current.tomselect.clearOptions()
// 		ref.current.tomselect.addOptions(options)
// 		ref.current.tomselect.refreshOptions()
// 		ref.current.tomselect.refreshItems()
// 		ref.current.tomselect.setValue(selected, true)
// 	}, [options])
//
// 	function handleChange(value) {
// 		if (value !== selected && value !== "") {
// 			setSelected(value)
// 		}
// 	}
//
// 	return (
// 		<select name="" id={id} ref={ref}
// 	        placeholder={placeholder}
// 		>
// 			{children}
// 		</select>
// 	)
// }

function MultiSelect({id, className, selected, setSelected, options=[], optgroups=[], create=true}) {
	const [optionLookup, setOptionLookup] = React.useState({})
	const [search, setSearch] = React.useState("")
	const [displayOptions, setDisplayOptions] = React.useState([])
	const [optionSelect, setOptionSelect] = React.useState(0)

	React.useEffect(()=>{
		let tempOptionsLookup = {}
		for (let x=0; x<options.length; x++) {
			tempOptionsLookup[options[x].value] = options[x].text
		}
		setOptionLookup(tempOptionsLookup)
	}, [options])

	React.useEffect(()=>{
		// console.log(selected)
	}, [selected])

	function addOption(e) {
		setSelected([...selected, e.target.dataset.value])
	}

	function handleKeyDown(e) {
		if (e.key === "Backspace" && e.target.value === "") {
			e.preventDefault()
			if (selected.length > 0) {
				setSelected(selected.slice(0, -1))
			}
		}
		if (e.key === "ArrowDown") {
			e.preventDefault()
			setOptionSelect((prev) => Math.min(prev + 1, displayOptions.length - 1))
		}
		if (e.key === "ArrowUp") {
			e.preventDefault()
			setOptionSelect((prev) => Math.max(prev - 1, 0))
		}
		if (e.key === "Enter") {
			e.preventDefault()
			if (displayOptions.length > 0 && displayOptions[optionSelect]) {
				if (displayOptions[optionSelect].create) {
					if (typeof(create) === "function") {
						let newID = create(search).value
						if (newID !== null) {
							setSelected([...selected, newID])
							setSearch("")
							setOptionSelect(0)
						}
					} else if (create === true) {
						setSelected([...selected, search])
						setSearch("")
						setOptionSelect(0)
					}
				} else {
					setSelected([...selected, displayOptions[optionSelect].value])
					setSearch("")
					setOptionSelect(0)
				}
			}
		}
		if (e.key === "Tab") {
			if (search === "") {
				// Allow default tab behavior to next input
				return
			}
			if (displayOptions.length > 0 && displayOptions[optionSelect]) {
				if (!displayOptions[optionSelect].create) {
					e.preventDefault()
					setSelected([...selected, displayOptions[optionSelect].value])
					setSearch("")
					setOptionSelect(0)
				}
			}
		}
	}

	function matchesSearchTerms(text, search) {
		const words = text.toLowerCase().split(/\s+/);
		const terms = search.toLowerCase().trim().split(/\s+/);

		let wordIndex = 0;

		for (const term of terms) {
			let found = false;

			while (wordIndex < words.length) {
				if (words[wordIndex].startsWith(term)) {
					found = true;
					wordIndex++;
					break;
				}

				wordIndex++;
			}

			if (!found) {
				return false;
			}
		}

		return true;
	}

	React.useEffect(()=>{
		let temp = [
			...options.filter((option) => {
				let returnFlag = true
				if (selected.includes(option.value)) returnFlag = false
				if (search.length > 0) {
					if (option.text.toLowerCase().includes(search.toLowerCase())) {

					} else if (matchesSearchTerms(option.text, search)) {

					} else {
						returnFlag = false
					}

				}
				if (returnFlag) return (option)
			})
		]
		if (search.length > 0 && (typeof(create) === "function" || create === true)) {
			temp.push({
					create: true,
					text: "Add "+search,
				})
		}
		setDisplayOptions(
			temp
		)
	}, [search])

	return (
		<div className={`multi select ${className || ""}`}>
			<select name={id} id={id} tabIndex={-1}></select>
			<label htmlFor={`${id}_input`} className="input">
				{selected.map((option, index) => <div className={"selected"} key={index}>{optionLookup[option]}</div>)}
				<input id={`${id}_input`} type="text" onKeyDown={handleKeyDown} value={search} onChange={(e)=>{setSearch(e.target.value)}}/>
			</label>
			<div className="dropdown">
				{displayOptions.map((option, index) => {
					if (index === optionSelect) {
						className = "option hover"
					} else {
						className = "option"
					}
					return (<div className={className} key={index} data-value={option.value} onMouseDown={addOption}>{option.text}</div>)
				})}
			</div>
		</div>
	)
}

function SingleSelect({id, className, selected, setSelected, options=[], optgroups=[], create=true}) {
	const [optionLookup, setOptionLookup] = React.useState({})
	const [search, setSearch] = React.useState("")
	const [displayOptions, setDisplayOptions] = React.useState([])
	const [optionSelect, setOptionSelect] = React.useState(0)

	React.useEffect(()=>{
		let tempOptionsLookup = {}
		for (let x=0; x<options.length; x++) {
			tempOptionsLookup[options[x].value] = options[x].text
		}
		setOptionLookup(tempOptionsLookup)
	}, [options])

	React.useEffect(()=>{
		// console.log(selected)
	}, [selected])

	function addOption(e) {
		setSelected([...selected, e.target.dataset.value])
	}

	function handleKeyDown(e) {
		if (e.key === "Backspace" && e.target.value === "") {
			e.preventDefault()
			if (selected.length > 0) {
				setSelected("")
			}
		}
		if (e.key === "ArrowDown") {
			e.preventDefault()
			setOptionSelect((prev) => Math.min(prev + 1, displayOptions.length - 1))
		}
		if (e.key === "ArrowUp") {
			e.preventDefault()
			setOptionSelect((prev) => Math.max(prev - 1, 0))
		}
		if (e.key === "Enter") {
			e.preventDefault()
			if (displayOptions.length > 0 && displayOptions[optionSelect]) {
				if (displayOptions[optionSelect].create) {
					if (typeof(create) === "function") {
						let newID = create(search).value
						if (newID !== null) {
							setSelected(newID)
							setSearch("")
							setOptionSelect(0)
						}
					} else if (create === true) {
						setSelected(search)
						setSearch("")
						setOptionSelect(0)
					}
				} else {
					setSelected(displayOptions[optionSelect].value)
					setSearch("")
					setOptionSelect(0)
				}
			}
		}
		if (e.key === "Tab") {
			if (search === "") {
				// Allow default tab behavior to next input
				return
			}
			if (displayOptions.length > 0 && displayOptions[optionSelect]) {
				if (!displayOptions[optionSelect].create) {
					e.preventDefault()
					setSelected(displayOptions[optionSelect].value)
					setSearch("")
					setOptionSelect(0)
				}
			}
		}
	}

	React.useEffect(() => {
		let temp = [
			...options.filter((option) => {
				let returnFlag = true
				if (selected.includes(option.value)) returnFlag = false
				if (search.length > 0) if (!option.text.toLowerCase().includes(search.toLowerCase())) returnFlag = false
				if (returnFlag) return (option)
			})
		]
		if (search.length > 0 && (typeof(create) === "function" || create === true)) {
			temp.push({
					create: true,
					text: "Add "+search,
				})
		}
		setDisplayOptions(
			temp
		)
	}, [search, options])

	return (
		<div className={`multi select ${className || ""}`}>
			<select name={id} id={id} tabIndex={-1}></select>
			<label htmlFor={`${id}_input`} className="input">
				{
					selected ?
						<div className={"selected"} key={-1}>{optionLookup[selected]}</div>
					:
						""
				}
				<input id={`${id}_input`} type="text" onKeyDown={handleKeyDown} value={search} onChange={(e)=>{if (!selected) setSearch(e.target.value)}}/>
			</label>
			<div className="dropdown">
				{
					!selected ?
						displayOptions.map((option, index) => {
							if (index === optionSelect) {
								className = "option hover"
							} else {
								className = "option"
							}
							return (<div className={className} key={index} data-value={option.value} onMouseDown={addOption}>{option.text}</div>)
						})
					: ""
				}
			</div>
		</div>
	)
}