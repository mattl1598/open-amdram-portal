function AdminSettings({content, refresh}) {
	const context = React.useContext(app)
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
				refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}
	let subs = []

	for (let i=0; i<(content.subs || []).length; i++) {
		let sub = content.subs[i]
		subs.push(
			<div key={i} className={"sub"} style={{order: sub.amount}}>
				<div className="type">
					<h3 className={""}>{sub.name}</h3>
				</div>
				<div className={"rate"}>
					<strong>Rate: </strong>
					<span className={"rate"}>£{(sub.amount/100).toFixed(2)}</span>
				</div>
				<div className={"billing"}>
					<strong>Period: </strong>
					<span className="period">{sub.period}</span>
				</div>
			</div>
		)
	}
	let show_options = []
	console.log(context.siteJson)
	for (let i=0; i<context.siteJson.mostRecentMemberShows.length; i++) {
		console.log(context.siteJson.mostRecentMemberShows[i].title)
		show_options.push(
			<option value={context.siteJson.mostRecentMemberShows[i].title}>{context.siteJson.mostRecentMemberShows[i].title}</option>
		)
	}
	console.log(show_options)

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className="form_container two">
				<form action="/members/api/admin/admin_settings/site_settings" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className="form">
						<h2>Site Settings</h2>
						<span className="msg"></span>
						<Input type={"text"} id={"site-name"} label="Site Name" value={content.settings.siteName}></Input>
						<Input type={"select"} id={"tickets-active"} label="Enable Tickets" value={content.settings.ticketsActive}>
							<option value="0">Off</option>
							<option value="1">On</option>
						</Input>
						<Input type={"select"} id={"show_auditions"} label="Set Show for Auditions" value={content.settings.show_auditions}>
							<option value="">None Selected...</option>
							{show_options}
						</Input>
						<Input type={"datetime-local"} id={"auditions_date"} label={"Auditions Date"} value={content.settings.auditions_date}></Input>
						<Input type={"text"} id={"tickets-link"} label={"Tickets URL"} value={content.settings.ticketsLink}></Input>
						<Input type={"text"} id={"tickets-hero-photo"} label={"Tickets Hero Photo"} value={content.settings.ticketsHeroPhoto}></Input>
						<Input type={"text"} id={"socials"} label={"Social Links (comma seperated)"} value={content.settings.socials}></Input>
						<Input type={"textarea"} id={"about"} label={"About Us Content (Markdown)"} value={content.settings.about}></Input>
						<Input type={"text"} id={"maps-url"} label={"Google Maps URL"} value={content.settings.mapsURL}></Input>
						<Input type={"submit"} id={"submit"} value={"Save Settings"}></Input>
					</div>
					<div className="loader"></div>
				</form>

				<form className={"subs"} action="/members/api/admin/admin_settings/subs/add_new_plan" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className="form">
						<h2>Subs Options</h2>
						<span className="msg"></span>
						<div className="subs">
							{subs}
						</div>
						<details>
							<summary>Add New Subs Level</summary>
							<Input type={"text"} id={"levelName"} label={"Level Name"}></Input>
							<Input type={"number"} id={"amount"} label={"Amount"}></Input>
							<Input type={"select"} id={"period"} label={"Period"}>
								<option value="yearly">Yearly</option>
							</Input>
							<Input type={"select"} id={"renewal_month"} label={"Renewal Month (for yearly)"}>
								<option value="01">January</option>
								<option value="02">February</option>
								<option value="03">March</option>
								<option value="04">April</option>
								<option value="05">May</option>
								<option value="06">June</option>
								<option value="07">July</option>
								<option value="08">August</option>
								<option value="09">September</option>
								<option value="10">October</option>
								<option value="11">November</option>
								<option value="12">December</option>
							</Input>
							<Input type={"submit"} id={"submit"} value={"Add Subs Level"}></Input>
						</details>
					</div>
					<div className="loader"></div>
				</form>
			</div>
		</div>
	)
}

function ManageMedia({content}) {
	const context = React.useContext(app)

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

	function copyMe(id) {
		navigator.clipboard.writeText((document.getElementById(id).innerHTML))
	}

	function clearDetails() {
		setSelectedID(null)
		// setSelectedUID("")
		setSelectedURL("")
		setSelectedSRC("")
		setSelectedTitle("")
	}

	// TODO: Delete button functionality (+ API)

	const [selectedID, setSelectedID] = React.useState(null)
	const [selectedUID, setSelectedUID] = React.useState("")
	const [selectedURL, setSelectedURL] = React.useState("")
	const [selectedSRC, setSelectedSRC] = React.useState("")
	const [selectedTitle, setSelectedTitle] = React.useState("")

	React.useEffect(()=>{
		if (selectedID != null) {
			setSelectedUID(content.media[selectedID][0])
			setSelectedURL(`/media/${content.media[selectedID][0]}/${content.media[selectedID][2]}`)
			setSelectedSRC(content.media[selectedID][1])
			setSelectedTitle(content.media[selectedID][2])
			document.querySelector("#deleteForm").querySelector("span.msg").innerHTML = ""
		}
	}, [selectedID])

	let mediaItems = []
	if (content.media) {
		for (let i=0; i < content.media.length; i++) {
			let image = content.media[i]
			mediaItems.push(
				<div key={i} className="media_item" onClick={()=>{setSelectedID(i)}}>
					<Image src={`${image[1]}?lowres`} alt={image[0]} title={ image[2] } width="200" height="200"/>
				</div>
			)
		}
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className="container">
				<div className="details">
					<div className="upload">
						<h3>Upload New Item</h3>
						<form action="/members/api/manage_media/upload" onSubmit={handleFormSubmit} method="POST"
						      encType="multipart/form-data">
							<div className="form">
								<span className="msg"></span><br/>
								<input type="file" name="fileElem" id="fileElem"/>
								<button type="submit">Upload</button>
							</div>
							<div className="loader"></div>
						</form>
						<hr/>
					</div>
					<div id="info" className={selectedID != null ? "" : "greyed"}>
						<h3>Items Details</h3>
						<div className="item_name">Filename: <span className="box scroll" id="filename">{selectedID != null ? selectedTitle : "Please select an item..."}</span>
						</div>
						<div className="url">Media URL: <span className="box scroll"
						                                       id="url">{selectedID != null ? selectedURL : "Please select an item..."}</span>
							<button type="button" onClick={()=>{copyMe('url')}}>Copy</button>
						</div>
						<div>Preview: <br/>
							<div className="image box"><img id="image" src={selectedSRC} alt=""/></div>
						</div>
						<form action="/members/api/manage_media/delete" id={"deleteForm"} onSubmit={handleFormSubmit} method="POST">
							<div className="form">
								<span className="msg"></span><br/>
								<input type="hidden" name={"id"} value={selectedUID}/>
								<input type="submit" value={"Delete"} onClick={clearDetails}/>
							</div>
							<div className="loader"></div>
							{/*<button type="button" id="delete" className="delete" onClick={deleteMe}>Delete</button>*/}
						</form>
						<form action="/members/api/manage_media/modernise" id={"moderniseForm"} onSubmit={handleFormSubmit} method="POST">
							<div className="form">
								<span className="msg"></span><br/>
								<input type="hidden" name={"id"} value={selectedUID}/>
								<input type="hidden" name={"filename"} value={selectedTitle}/>
								<input type="submit" value={"Modernise"}/>
							</div>
							<div className="loader"></div>
						</form>
					</div>
				</div>
				<div className="media_items">
					{mediaItems}
				</div>
			</div>
		</div>
	)
}

function ShowPhotosForm({content}) {
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
				refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}

	let album_options = []
	let show_options = []
	for (let i = 0; i < content.albums.length; i++) {
		album_options.push(<option key={content.albums[i][0]}
		                           value={content.albums[i][0]}>{content.albums[i][1]}</option>)
	}
	for (let i = 0; i < content.shows.length; i++) {
		show_options.push(<option key={content.shows[i].id} value={content.shows[i].id}>{content.shows[i].date.substring(0,4)} - {content.shows[i].title}</option>)
	}
	return (
		<div className="content">
			<h1>{content.title}</h1>
			<form action="/members/api/admin/set_show_photos" onSubmit={(e) => {
				handleFormSubmit(e)
			}}>
				<span className="msg"></span>
				<label htmlFor="album">Album: </label>
				<select name="album" id="album">
					{album_options}
				</select><br/>
				<label htmlFor="show">Show: </label>
				<select name="show" id="show">
					{show_options}
				</select><br/>
				<input type="submit"/>
			</form>
		</div>
	)
}