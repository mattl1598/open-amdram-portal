function formToJson(formData) {
	let obj = {};
	formData.forEach((value, key) => {
		if (obj[key]) {
			// If the key already exists, convert it to an array and add the new value
			if (!Array.isArray(obj[key])) {
				obj[key] = [obj[key]];
			}
			obj[key].push(value);
		} else {
			// Otherwise, assign the value
			obj[key] = value;
		}
	});
	return obj;
}

function insert(list, position, item) {
	let listA = [...list.slice(0, position)];
	let listB = [...list.slice(position)];
	return [...listA, item, ...listB];
}


function EditShow({content, refresh}) {
	const context = React.useContext(app)
	function handleFormSubmit(e) {
		let form = e.target
		form.classList.add("pending")
		e.preventDefault()
		let formData = new FormData(form)
		fetch(form.action, {
			headers: {
				'Content-Type': 'application/json',
			},
			method: "POST",
			body: JSON.stringify({
				showID: content.showDetails.id,
				showDetails: formToJson(formData),
				roles: getRoles(),
			})
		}).then((response) => {
			return response.json()
		}).then((data) => {
			if (data.code === 200) {
				form.reset()
				context.functions.refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}

	if (!content.showDetails) {
		content.showDetails = {
			title: "",
			subtitle: "",
			date: Date.now(),
			season: "",
			genre: "",
			author: "",
			show_type: "",
			programme: "",
			banner: "",
			noda_review: "",
			radio_audio: "",
			text_blob: ""
		}
	}



	if (!content.showOptions) {
		content.showOptions = {
			genres: [],
			seasons: [],
			showTypes: []
		}
	}

	let genreOptions = [
		<option key={""} value={""}></option>
	]
	for (let i=0; i<content.showOptions.genres.length; i++) {
		let val = content.showOptions.genres[i]
		if (val !== "") {
			genreOptions.push(<option key={val} value={val}>{val}</option>)
		}
	}

	let seasonOptions = [
		<option key={""} value={""}></option>
	]
	for (let i=0; i<content.showOptions.seasons.length; i++) {
		let val = content.showOptions.seasons[i]
		if (val !== "") {
			seasonOptions.push(<option key={val} value={val}>{val}</option>)
		}
	}
	let showTypeOptions = [
		<option key={""} value={""}></option>
	]
	for (let i=0; i<content.showOptions.showTypes.length; i++) {
		let val = content.showOptions.showTypes[i]
		if (val !== "") {
			showTypeOptions.push(<option key={val} value={val}>{val}</option>)
		}
	}

	const [bannerPreview, setBannerPreview] = React.useState(content.showDetails.banner)
	const [programmePreview, setProgrammePreview] = React.useState(content.showDetails.programme)

	const [memberOptions, setMemberOptions] = React.useState([])

	const [castRefs, setCastRefs] = React.useState([])
	const [castList, setCastList] = React.useState([])
	const [crewRefs, setCrewRefs] = React.useState([])
	const [crewList, setCrewList] = React.useState([])

	const [toBeAdded, setToBeAdded] = React.useState([])

	function refreshMemberOptions() {
		fetch("/members/api/get_members", {
			method: "GET",
			headers: {
				'Content-Type': 'application/json',
			}
		})
			.then(response => response.json())
			.then(data => {
				if (Array.isArray(data)) {
					setMemberOptions(data);
				} else {
					console.error("Unexpected response format:", data);
				}
			})
			.catch(err => console.error("Failed to fetch members:", err));
	}

	React.useEffect(() => {
		refreshMemberOptions();
		let tempCastRefs = []
		let tempCastRoles = []
		let tempCrewRefs = []
		let tempCrewRoles = []
		for (let i=0; i<content.currentRoles.length; i++) {
			let item = content.currentRoles[i]
			let newRef = React.createRef()
			let newRole = {
				key: i, ref: newRef,
				id: `${item.cast_or_crew}${{"cast": tempCastRoles.length, "crew": tempCrewRoles.length}[item.cast_or_crew] + 1}`,
				defaultMembers: item.members, defaultRoleName: item.role,
				cast_or_crew: item.cast_or_crew
			}
			if (item.cast_or_crew === "cast") {
				tempCastRefs.push(newRef)
				tempCastRoles.push(newRole)
			} else {
				tempCrewRefs.push(newRef)
				tempCrewRoles.push(newRole)
			}
		}
		setCastRefs(tempCastRefs)
		setCastList(tempCastRoles)
		setCrewRefs(tempCrewRefs)
		setCrewList(tempCrewRoles)
	}, [])

	function addRowBelow(cast_or_crew, position) {
		setToBeAdded([{cast_or_crew: cast_or_crew, position: position}])
	}

	React.useEffect(() => {
		if (toBeAdded.length) {
			addRoleSubForm(undefined, toBeAdded[0].cast_or_crew, toBeAdded[0].position)
			setToBeAdded([])
		}
	}, [toBeAdded])


	function addRoleSubForm(e, cast_or_crew, position) {
		if (e !== undefined) {
			e.preventDefault()
		}
		// let tempRefs = []
		let tempList = []
		if (cast_or_crew === "cast") {
			// tempRefs = [...castRefs]
			tempList = [...castList]
			let newRef = React.createRef()
			let newForm = {
				key: Date.now(), ref: newRef,
				id: `${cast_or_crew}${tempList.length + 1}`,
				cast_or_crew: cast_or_crew
			}
			// tempRefs = insert(tempRefs, position, newRef)
			tempList = insert(tempList, position, newForm)
			// setCastRefs(tempRefs)
			setCastList(tempList)
		} else {
			// tempRefs = [...crewRefs]
			tempList = [...crewList]

			let newRef = React.createRef()
			// TODO: add role options and tomselect for crew roles
			let newForm = {
				key: Date.now(), ref: newRef,
				id: `${cast_or_crew}${tempList.length + 1}`,
				cast_or_crew: cast_or_crew
			}
			// tempRefs.splice(position, 0, newRef)
			tempList.splice(
				position, 0, newForm
			)
			// setCrewRefs(tempRefs)
			setCrewList(tempList)
		}
		// TODO: set focus on newest role field
	}

	function getRoles(e=undefined) {
		if (e !== undefined) {
			e.preventDefault()
		}
		let output = []
		for (let i=0; i<castList.length; i++) {
			let msl = castList[i].ref.current.getMSLJson()
			if (msl !== null) {
				output.push(msl)
			}
		}
		for (let i=0; i<crewList.length; i++) {
			let msl = crewList[i].ref.current.getMSLJson()
			if (msl !== null) {
				output.push(msl)
			}
		}
		return output
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<form action={`/members/api/manage_shows`} onSubmit={handleFormSubmit}>
				<div className="form show_form">
					<span className="msg"></span>
					<div className="details">
						<Input type={"text"} id={"title"} label={"Title"} value={content.showDetails.title}></Input>
						<Input type={"text"} id={"subtitle"} label={"Subtitle"} value={content.showDetails.subtitle}></Input>
						<Input type={"date"} id={"date"} label={"Last Performance Date"} value={content.showDetails.date.split("T")[0]}></Input>
						<Input type={"select"} id={"season"} label={"Season"} value={content.showDetails.season}>{seasonOptions}</Input>
						<Input type={"select"} id={"genre"} label={"Genre"} value={content.showDetails.genre}>{genreOptions}</Input>
						<Input type={"select"} id={"show_type"} label={"Show Type"} value={content.showDetails.show_type}>{showTypeOptions}</Input>
						<Input type={"text"} id={"author"} label={"Author"} value={content.showDetails.author}></Input>
						<Input type={"text"} id={"banner"} label={"Banner Image"} value={content.showDetails.banner} onChange={(e)=>{setBannerPreview(e.target.value)}}></Input>
						<img className={"banner_preview"} src={bannerPreview} alt={"banner preview"}/>
						<Input type={"text"} id={"noda_review"} label={"NODA Review"} value={content.showDetails.noda_review}></Input>
						<Input type={"text"} id={"radio_audio"} label={"Radio Audio"} value={content.showDetails.radio_audio}></Input>
					</div>
					<div className="blob">
						<Input type={"text"} id={"programme"} label={"Programme Cover"} value={content.showDetails.programme} onChange={(e)=>{setProgrammePreview(e.target.value)}}></Input>
						<img className={"programme_preview"} src={programmePreview} alt={"programme preview"}/>
						<Input type={"text"} id={"text_blob"} label={"Text Blob"} value={content.showDetails.text_blob}></Input>
						<h2><Link href={`/members/manage_shows/photos/${content.showDetails.id}/${content.showDetails.title}`}>Manage Photos</Link></h2>
					</div>
					<div className="save">
						<Input type={"submit"} value={"Save"}></Input>
					</div>
					<div className="cast">
						<h2>Cast <a href="#" onClick={(e) => {addRoleSubForm(e, "cast", 0)}}>+</a></h2>
						<div>
							{
								castList.map((x)=>{
									return <RoleSubForm
										key={x.key} ref={x.ref} id={x.id}
										defaultMembers={x.defaultMembers} defaultRoleName={x.defaultRoleName}
										cast_or_crew={x.cast_or_crew} showID={content.showDetails.id} addRowBelow={addRowBelow}
										memberOptions={memberOptions} setMemberOptions={setMemberOptions}
									></RoleSubForm>
								})
							}
						</div>
					</div>
					<div className="crew">
						<h2>Crew <a href="#" onClick={(e) => {addRoleSubForm(e, "crew", 0)}}>+</a></h2>
						<div>
							{
								crewList.map((x)=>{
									return <RoleSubForm
										key={x.key} ref={x.ref} id={x.id}
										defaultMembers={x.defaultMembers} defaultRoleName={x.defaultRoleName}
										cast_or_crew={x.cast_or_crew} showID={content.showDetails.id} addRowBelow={addRowBelow}
										memberOptions={memberOptions} setMemberOptions={setMemberOptions}
									></RoleSubForm>
								})
							}
						</div>
					</div>
					<a href="#" onClick={(e)=>{console.log(getRoles(e))}}>test</a>
				</div>
				<div className="loader"></div>
			</form>
			<form action="" id={"MSL"}></form>
		</div>
	);
}
const RoleSubForm = React.forwardRef(function RoleSubForm({
										id,
										defaultRoleName = "",
										defaultMembers = [],
										showID = "",
										memberOptions = [],
										setMemberOptions,
										cast_or_crew,
										addRowBelow
                                      }, ref) {
	const [role, setRole] = React.useState(defaultRoleName)
	const [members, setMembers] = React.useState(defaultMembers)
	const subFormRef = React.createRef()

	React.useImperativeHandle(ref, () => ({
	    getMSLJson() {
	      return getMSLJson()
	    }
	}))

	function getIndex() {
		let fiberKey = Object.keys(subFormRef.current)[0]
		return subFormRef.current[fiberKey].return.index
	}

	function getMSLJson() {
		if (role && members.length) {
			return {
				showID: showID,
				role: role,
				cast_or_crew: cast_or_crew,
				members: members,
				orderVal: getIndex(),
			}
		} else {
			return null
		}
	}

	function addNewMember(name) {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/members/api/add_member", false); // false makes the request synchronous
		xhr.setRequestHeader("Content-Type", "application/json");

		let response = null;
		try {
			xhr.send(JSON.stringify({name: name}));

			if (xhr.status === 200) {
				const data = JSON.parse(xhr.responseText);
				if (data.code === 200 && data.newMember) {
					setMemberOptions(data.members)
					return {value: data.newMember.id, text: data.newMember.name} // Return the newMember item
				} else if (data.code === 400) {
					displayAlerts([{title: "Error", content: data.msg}]);
				} else {
					console.error("Unexpected response:", data);
				}
			} else {
				console.error("Request failed with status:", xhr.status);
			}
		} catch (err) {
			console.error("Failed to send request:", err);
		}
		return null; // Return null if the operation was unsuccessful
	}

	function addRow() {
		let pos = getIndex() + 1
		addRowBelow(cast_or_crew, pos)
	}

	return (
		<div className={"role_sub_form"} ref={subFormRef}>
			<Icon onClick={()=>{console.log(getIndex())}}>drag_indicator</Icon>
			<Input id={id} form={"MSL"} type={"text"} label={"Role"} value={role} stateful={true} onChange={(e)=>{setRole(e.target.value)}}></Input>
			<div className="members">
				<label htmlFor={`member${id}`} className={"membersLabel"}>Members</label>
				<Select id={`member${id}`} selected={members} setSelected={setMembers} options={memberOptions} create={addNewMember}></Select>
			</div>
			<div className="hover_right"></div>
			<Icon onClick={addRow} tabIndex={0}>splitscreen_add</Icon>
		</div>
	)
})

function PastShowPhotos({content}) {
	return (
		<div className={"content"}>
			<Tabs>
				<Tab title={"Photo Manager"}>
					<PhotoManager content={content}></PhotoManager>
				</Tab>
				<Tab title={"FaceDetection"}>
					<FaceDetection content={content}></FaceDetection>
				</Tab>
			</Tabs>
		</div>
	)
}

function PhotoManager({content}) {
	const context = React.useContext(app)
	const [images, setImages] = React.useState([])
	const [isDragging, setIsDragging] = React.useState("")
	const [resetter, setResetter] = React.useState(0)

	function handleFormSubmit(e) {
		let form = e.target
		form.classList.add("pending")
		e.preventDefault()
		let formData = new FormData(form)
		fetch(form.action, {
			method: "POST",
			body: formData
		}).then((response) => {
			return response.json()
		}).then((data) => {
			if (data.code === 200) {
				form.reset()
				context.functions.refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}

	React.useEffect(()=>{
		let tempImages = []
		for (let i = 0; i < content.photos.length; i++) {
			let im = content.photos[i]
			tempImages.push({
				id: im.id,
				src: `/photo_new/${im.id}?lowres`,
				order_value: im.order_value,
				rWidth: im.rWidth,
				rHeight: im.rHeight,
				width: im.width,
				height: im.height,
				alt: im.filename,
				featured: im.featured,
			})
		}
		setImages(tempImages)
	}, [content, resetter])

	function handleDragStart(e, index) {
		e.dataTransfer.setData("text/plain", `${index}`)
		setIsDragging("dragging")
	}

	function handleDragEnd(e) {
		setIsDragging("")
	}

	function handleDrop(e, dropIndex) {
		e.preventDefault()
		let photoIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
		if (dropIndex !== photoIndex && dropIndex !== photoIndex+1) {
			let tempImages = [...images]
			let image = tempImages[photoIndex]
			tempImages.splice(photoIndex, 1); // Remove the image at photoIndex
			tempImages.splice(dropIndex, 0, image); // Insert the removed image back into images at dropIndex
			setImages(tempImages)
		}
	}

	function MultipleFileForm({showID}) {
		const [multipleFiles, setMultipleFiles] = React.useState([])
		const formRef = React.useRef()
		const progressRef = React.useRef()
		const etaRef = React.useRef()
		const filesRef = React.useRef()

		function handleMultipleFileSelect(e) {
			setMultipleFiles([...e.target.files])
		}
		function uploadImage(e, file) {
			let formData = new FormData()
			formData.append('file', file)
			formData.append('show_id', showID)
			// return new Promise(resolve => setTimeout(resolve, 700));
			return fetch(e.target.form.action, {
				method: "POST",
				body: formData
			}).then((response) => {
				return response.json()
			})
		}

		async function handleMultipleFileUpload(e, files) {
			e.preventDefault()
			formRef.current.classList.add("pending")
			let times = []
			for (let i = 0; i < files.length; i++) {
				let start = performance.now()
				if (times.length) {
					let avgTime = times.reduce((a,b) => a + b) / (times.length * 1000.0)
					etaRef.current.innerHTML = `~${((files.length - times.length) * avgTime).toFixed(1)} seconds`
				} else {
					etaRef.current.innerHTML = "∞"
				}
				let json = await uploadImage(e, files[i]);
				// if (json.code === 200) {
				// 	success.push(files[i])
				// } else {
				// 	failure.push(files[i])
				// }
				progressRef.current.value = i;
				times.push(performance.now()-start)
			}
			setMultipleFiles([])
			filesRef.current.value = ""
			context.functions.refresh()
			formRef.current.classList.remove("pending")
		}

		return (
			<div className={"multiFileFormContainer"}>
				<form action="/members/api/upload_show_image" ref={formRef} className={`multiFileForm`} method={"POST"}>
					<div className="form">
						<input type="file" ref={filesRef} multiple={true} accept="image/*"
						       defaultValue={multipleFiles} onChange={handleMultipleFileSelect}/>
						<Input type={"submit"} onClick={(e) => {
							handleMultipleFileUpload(e, multipleFiles)
						}} value={"Submit"}></Input>
					</div>
					<div className="loader"></div>
				</form>
				<div className="progress">
					<progress ref={progressRef} max={multipleFiles.length} value={0}></progress>
					<span className={"eta"} ref={etaRef}>∞</span>
				</div>
			</div>
		)
	}

	function apply() {
		let dataImages = []
		for (let i = 0; i < images.length; i++) {
			dataImages.push({
				id: images[i].id,
				order_value: i,
				featured: images[i].featured
			})
		}
		fetch("/members/api/set_show_images_order",{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(dataImages),
		}).then((response) => {
			return response.json()
		}).then((data) => {
			if (data.code === 200) {
				reset()
			}
		})
	}

	function reset() {
		context.functions.refresh()
		setResetter(resetter + 1)
	}

	function featuredToggle(index) {
		let tempImages = [...images]
		tempImages[index].featured = !tempImages[index].featured
		setImages(tempImages)
	}

	return (
		<React.Fragment>
			<h1>{content.title.replaceAll("_", " ")}</h1>
			<div className="photo_form">
				<Tabs>
					<Tab title={"Single Upload"}>
						<form action="/members/api/upload_show_image" method={"POST"} onSubmit={handleFormSubmit}>
							<div className="form">
								<span className="msg"></span><br/>
								{/* TODO: change file input to react file input */}
								<input type="file" name={"file"} accept="image/*" />
								<input type="hidden" name={"show_id"} value={content.showID}/>
								<Input type="submit" value="Upload"/>
							</div>
							<div className="loader"></div>
						</form>
					</Tab>
					<Tab title={"Bulk Upload"}>
						<MultipleFileForm showID={content.showID}></MultipleFileForm>
					</Tab>
				</Tabs>
			</div>
			<div className="buttons">
				<Input type={"button"} onClick={apply}>Apply</Input>
				<Input type={"button"} onClick={reset}>Reset</Input>
			</div>
			<div className={`manage_show_images ${isDragging}`}>
				{images.map((item, index) => (
					<div className={"arrange"} key={index}>
						<div className={"droppable"}
							onDragOver={(e)=>{e.preventDefault()}}
							onDrop={(e)=>{handleDrop(e, index)}}
						></div>
						<div draggable={true} className={"draggable"}
							onDragStart={(e)=>{handleDragStart(e, index)}}
							onDragEnd={handleDragEnd}
						>
							<img draggable={false} src={item.src} alt={item.alt} width={item.rWidth} height={item.rHeight}/>
							<Icon className={item.featured ? "fill" : ""} onClick={()=>{featuredToggle(index)}}>star</Icon>
						</div>
					</div>
				))}
				<div className={"droppable"}
					onDragOver={(e)=>{e.preventDefault()}}
					onDrop={(e)=>{handleDrop(e, images.length)}}
				></div>
			</div>
		</React.Fragment>
	)
}