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
			body: JSON.stringify(formToJson(formData))
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

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<form action={`/members/api/manage_shows/${content.showDetails.id}`} onSubmit={handleFormSubmit}>
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
					</div>
					<div className="save">
						<Input type={"submit"} value={"Save"}></Input>
					</div>
					<div className="cast">

					</div>
					<div className="crew">

					</div>
				</div>
				<div className="loader"></div>
			</form>
		</div>
	);
}