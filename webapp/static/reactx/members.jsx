function Dashboard({content}) {
	let posts = []
	let shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

	for (let i=0; i<content.posts.length; i++) {
		let post = content.posts[i]
		let date = new Date(post.date)
		let link = `/members/${post.type}/${post.id}${post.type==="file"?"/"+post.title.replaceAll(" ", "_"):""}`
		let content_string = post.content
		if (post.type === "file") {
			content_string = ""
		}
		posts.push(
			<Link key={i} className={"post"} href={link}>
				<span className="date">{date.getDate()}&nbsp;{shortMonths[date.getMonth()]}<br/>{date.getFullYear()}</span>
				{/*<Icon icon={post.icon} timeline={"up"}></Icon>*/}
				<Icon icon={"msg"} timeline={"up"}></Icon>
				<div className="text">
					{ post.show_title ? <span className="show">{post.show_title}</span> : "" }
					<span className="title"><h3>{post.title}</h3></span>
					<span className="text"><span>{content_string}</span></span>
				</div>
			</Link>
		)
	}

	return (
		<div className={"content"}>
			<h1>{content.title}</h1>
			<div className={"timeline"}>
				<a href="" className="post heading">
					<span className="date"></span>
					<Icon icon={"circle"} timeline={"down"}></Icon>
					<div className={"text"}>
						<span className="title"><h2>Recent</h2></span>
					</div>
				</a>
				{posts}
			</div>
		</div>
	)
}

function MarkdownEditor({initialMarkdown="", initialTitle="", initialType="", initialDate="", show_title, show_id, post_id, modal=false, backCallback}) {
	const mdeRef = React.useRef(0)
	const formRef = React.useRef(0)
	React.useEffect(() => {
		const easyMDE = new EasyMDE({element: mdeRef.current})
	}, [])

	function handleBack(e, refresh=false) {
		e.preventDefault()
		if (modal) {
			backCallback(refresh)
		} else {
			history.back()
		}
	}

	function handleSubmit(e) {
		e.preventDefault()
		let formData = new FormData(formRef.current)
		if (!post_id) {
			fetch(`/members/api/new_post/${show_id}`, {
				method: "POST",
				body: formData
			}).then((response) => {
				return response.json()
			}).then((data) => {
				if (data.code === 200) {
					handleBack(e, true)
				}
			})
		}
	}

	return (
		<div className={"content"}>
			<form action="" onSubmit={handleSubmit} ref={formRef}>
				<h3 className={"details"}>
					<a href={""} onClick={(e) => {
						handleBack(e)
					}}>
						◀ Back
					</a>
					<span>
						{show_title}
					</span>
					<span>
						{""}
					</span>
				</h3>
				<div className="react-fancy-input">
					<input type="text" name="title" placeholder=" " defaultValue={initialTitle}></input>
					<label htmlFor="title">Title</label>
				</div>
				<div className="react-fancy-input">
					<select name="type" defaultValue={initialType}>
						<option value="public">Public</option>
						<option value="auditions">Auditions</option>
						<option value="private">Private</option>
					</select>
					<label htmlFor="type">Post Type</label>
				</div>
				<div className="react-fancy-input">
					<input type="date" name="date" id="date" defaultValue={initialDate} required></input>
					<label htmlFor="type">Publish Date</label>
				</div>
				<br/>
				<textarea ref={mdeRef} id="wysiwyg" name="content" defaultValue={initialMarkdown}></textarea>

				<div className="react-fancy-input">
					<input type="submit" value={"Submit"}></input>
				</div>
			</form>
		</div>
	)
}

function Shows({content}) {
	let shows = []
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	for (let i = 0; i < content.shows.length; i++) {
		let show = content.shows[i]
		let date = new Date(show.date)
		let image
		if (show.image) {
			image = <img src={show.image} alt={show.title + " programme cover"}/>
		} else {
			image = <Icon icon={"siteLogo"}></Icon>
		}
		shows.push(
			<Link key={i} href={show.url} title={show.title} className={"show"}>
				<div>{image}</div>
				<div className="details">
					<span className="title">{show.title}</span>
					<span>{show.season} {date.getFullYear()}</span>
					<span>{show.directors.join(", ")}</span>
				</div>
			</Link>
		)
	}

	return(
		<div className="content">
			<h2>{content.title}</h2>
			{shows}
		</div>
	)
}

function Show({content, refresh}) {
	let posts = []
	let files = []
	let shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	const context = React.useContext(app)
	const uploadRef = React.useRef(0)
	const [uploadFiles, setUploadFiles] = React.useState([])
	const [postEditor, setPostEditor] = React.useState(false)
	const handleClick = React.useCallback(() => uploadRef.current.click(), []);

	if (content.posts) {
		for (let i=0; i<content.posts.length; i++) {
			let post = content.posts[i]
			let date = new Date(post.date)
			let link = `/members/${post.type}/${post.id}${post.type==="file"?"/"+post.title.replaceAll(" ", "_"):""}`
			let content_string = post.content
			if (post.type === "file") {
				content_string = ""
			}
			posts.push(
				<Link key={i} className={"post"} href={link}>
					<span className="date">{date.getDate()}&nbsp;{shortMonths[date.getMonth()]}<br/>{date.getFullYear()}</span>
					{/*<Icon icon={post.icon} timeline={"up"}></Icon>*/}
					<Icon icon={"msg"} timeline={"up"}></Icon>
					<div className="text">
						{ post.show_title ? <span className="show">{post.show_title}</span> : "" }
						<span className="title"><h3>{post.title}</h3></span>
						<span className="text"><span>{content_string}</span></span>
					</div>
				</Link>
			)
		}
	}

	if (content.files) {
		for (let i=0; i<content.files.length; i++) {
			let file = content.files[i]
			let link = `/members/file/${file.id}/${file.title.replaceAll(" ", "_")}`
			files.push(
				<div key={i} className={"file"} id={file.id}>
					<div className="loader"></div>
					<Link href={link} className={"icon"}><Icon icon={"pdf"}></Icon></Link>
					<Link href={link} className="filetext"><span className="title"><h4>{file.title}</h4></span></Link>
					{
						context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ?
						<button type={"button"} onClick={(event) => handleFileDelete(event,`${file.id}`)} className="delete"><span className="delete">Delete?</span></button>
							: ""
					}
				</div>
			)
		}
	}

	function handleFileDrop(event) {
        console.log("File(s) dropped");
		event.preventDefault();
		uploadRef.current.files = event.dataTransfer.files;
		let files = [];
		// Use DataTransfer interface to access the file(s)
		[...event.dataTransfer.files].forEach((file, i) => {
			console.log(`… file[${i}].name = ${file.name}`);
			files.push(<span key={i}>{file.name}</span>)
		});
		setUploadFiles([...files])
	}

	function handleFileSelect() {
		let files = [];
		[...uploadRef.current.files].forEach((file, i) => {
			files.push(<span key={i}>{file.name}</span>)
		});
		setUploadFiles([...files])
	}

	function handleUpload(event) {
		event.preventDefault()
		let formData = new FormData(uploadRef.current.form)
		uploadRef.current.form.classList.toggle("pending")
		fetch(`/members/api/upload_file/${content.id}`, {
			method: "POST",
			body: formData
		}).then((response) => {
			return response.json()
		}).then((data) => {
			console.log(data)
			uploadRef.current.form.reset()
			setUploadFiles([])
			refresh(content.requestURL)
			uploadRef.current.form.classList.toggle("pending")
		})
	}

	function handleFileDelete(event, file_id) {
		event.preventDefault()
		document.getElementById(file_id).classList.toggle("pending")
		fetch(`/members/api/delete_file/${file_id}`, {
			method: "GET"
		}).then((response) => {
			return response.json()
		}).then((data) => {
			refresh(content.requestURL)
			document.getElementById(file_id).classList.toggle("pending")
		})
	}

	function handleNewPostClick(event) {
		event.preventDefault()
		setPostEditor(true)
	}

	function editorBackCallback(doRefresh) {
		if (doRefresh) {
			refresh(content.requestURL)
		}
		setPostEditor(false)
	}

	if (postEditor) {
		return (
			<MarkdownEditor show_id={content.id} show_title={content.title} modal={true} backCallback={editorBackCallback}></MarkdownEditor>
		)
	} else {
		return (
			<div className={"content"}>
				<h1>{content.title}</h1>
				{
					context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ?
					<details>
						<summary>Manage Show (Click to show)</summary>
						<div className="manage">
							<div className="form">
								<h3>Emergency Contacts</h3>
								<p>Warning: This is for genuine emergency use only. <br/>All access will be logged and reported to the devs and committee.</p>
								<div className="fancy-input no-margin">
									<a className={"button"}  href={`/members/emergency_contacts/${content.id}`}
									   onClick={() => {return confirm('Are you sure? Continuing will report this access to the devs and committee.')}}>
										Access Emergency Contacts
									</a>
								</div>
							</div>
						</div>
					</details>
					: ""
				}
				<div className="files">
					{
						context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ?
						<form className={"file"} onSubmit={(e) => {handleUpload(e)}} method={"post"} encType="multipart/form-data">
							<div className="loader"></div>
							<label htmlFor="file" className={"icon"} onClick={handleClick}
							       onDragOver={(e) => {e.preventDefault()}}
							       onDrop={(e) => {handleFileDrop(e)}}
							>
								<Icon icon={"add"}></Icon>
								<h4>Add new file</h4>
							</label>
							<input ref={uploadRef} className={"filetext"} onChange={handleFileSelect} type="file" name={"files"} multiple required></input>
							<div className="filetext" onClick={handleClick}
							     onDragOver={(e) => {e.preventDefault()}}
							     onDrop={(e) => {handleFileDrop(e)}}
							>
								{uploadFiles.length ? uploadFiles : "No Files Selected"}
							</div>
							<input className={"delete"} type="submit" value="Upload"/>
						</form>
						: ""
					}
					{files}
				</div>
				<div className={"timeline"}>
					<a href="" className="post heading">
						<span className="date"></span>
						<Icon icon={"circle"} timeline={"down"}></Icon>
						<div className={"text"}>
							<span className="title"><h2>Posts</h2></span>
						</div>
					</a>
					{
						context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ?
						<Link className={"post"} href={""} onClick={(e) => {handleNewPostClick(e)}}>
							<span className="date"></span>
							<Icon icon={"add"} timeline={"up"}></Icon>
							<div className="text">
								<span className="title"><h3>Write a new post</h3></span>
								<span className="text"><span>Click here</span></span>
							</div>
						</Link>
						: ""
					}
					{posts}
				</div>
			</div>
		)
	}
}

function AccountSettings({content, refresh}) {
	let subs_info = []
	let subs_options = []
	let active_subs = []

	const levelRef = React.createRef(null)
	let [subsDetails, setSubsDetails] = React.useState("")
	let [showSubsForm, setShowSubsForm] = React.useState(false)
	let [is_for_dependent, set_is_for_dependent] = React.useState("NO")
	let subsFormRef = React.createRef(null)

	for (let i=0; i<(content.subs.options||[]).length; i++) {
		let option = content.subs.options[i]
		if (option.enabled) {
			let opts = {}
			if (option.desc) {
				opts.title = option.desc
			}
			subs_info.push(
				<li key={i} {...opts} style={{order: option.amount}}><strong>{option.name}: </strong>£{(option.amount/100).toFixed(2)} {option.period}</li>
			)

			let details
			if (option.period === "yearly") {
				let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
				details = `Yearly subscription. Starts now, always renews on 1st ${months[parseInt(option.renewal_month, 10)-1]}`
			} else {
				details = ""
			}

			subs_options.push(
				<option key={i} value={option.id} data-details={details} style={{order: option.amount}}>
					{option.name} - £{(option.amount/100).toFixed(2)} {option.period}
				</option>
			)
		}
	}

	for (let i=0; i<(content.subs.options||[]).length; i++) {
		let sub = content.subs.active[i]
		active_subs.push(
			<div key={i} className={"sub_form"} id={sub.id}>
				<div className="sub form">
					<div className="type">
						<h3 className={""}>{sub.plan_name}</h3>
					</div>
					<div className="name">
						<strong>Name:</strong>
						<span>{sub.name}</span>
					</div>
					<div className={"rate"}>
						<strong>Rate: </strong>
						<span className={"rate"}>£{(sub.plan_amount/100).toFixed(2)}</span>
						<span className="period">{sub.plan_period}</span>
					</div>
					<div className={"billing"}>
						<strong>Last Billed:</strong>
						<span className={"last_billed"}>1st June 2024</span>
						<span className={"cancel"}>
							<a href={`/members/api/account_settings/cancel_subscription/${sub.id}`} onClick={(e) => {handleSubCancel(e, sub.id)}}>
								Cancel
							</a>
						</span>
						<span className="msg"></span>
					</div>
				</div>
				<div className="loader"></div>
			</div>
		)
	}

	function handleSubCancel(e, sub_id) {
		e.preventDefault()
		let sub = document.querySelector(`#${sub_id}`)
		sub.classList.add("pending")
		fetch(e.target.href, {
			method: "GET"
		}).then((response) => {
			return response.json()
		}).then((data) => {
			if (data.code === 200) {
				sub.classList.remove("pending")
				refresh()
			}
			sub.querySelector("span.msg").innerHTML = data.msg
			sub.classList.remove("pending")
		})
	}

	function handleFormSubmit(e) {
		let form = e.target
		form.classList.add("pending")
		e.preventDefault()
		console.log(e)
		console.log(form)
		let formData = new FormData(form)
		fetch(form.action, {
			method: "POST",
			body: formData
		}).then((response) => {
			return response.json()
		}).then((data) => {
			console.log("CODE: ", data.code)
			if (data.code === 200) {
				console.log("SUCCESS")
				form.reset()
				setShowSubsForm(false)
				refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}

	function showSubsFormFunction(e) {
		e.preventDefault(e)
		setShowSubsForm(!showSubsForm)
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className="form_container three">
				<form className={"subs"} ref={subsFormRef} action="/members/api/account_settings/start_subscription" onSubmit={(e)=>{handleFormSubmit(e)}}>
					<div className="form">
						<h2>Manage Membership</h2>
						<div className="options">
							<ul>
								{subs_info}
							</ul>
						</div>
						<h3>Active Subs</h3>
						<div className="subs">
							{active_subs}
						</div>
						{
							showSubsForm ?
								<React.Fragment>
									<div className={"new_subs_form"}>
										<div className={"heading"}>
											<h3>Add New Subscription</h3>
											<span className={"close"} onClick={(e) => {
												showSubsFormFunction(e)
											}}>×</span>
										</div>
										<Input inputRef={levelRef} type={"select"} value={""} id={"subs_level"}
										       label={"Membership Level"} onChange={(e) => {
											setSubsDetails(e.target.selectedOptions[0].dataset.details)
										}}>
											<option value="" disabled>Select a membership...</option>
											{subs_options}
										</Input>
										<div>{subsDetails}</div>
										<Input type={"select"} label={"Who is the subscription for?"}
										       onChange={(e) => set_is_for_dependent(e.target.value)}
										       value={is_for_dependent} stateful={true}
										       id={"sub_for"}>
											<option value={"SELF"}>Myself</option>
											<option value={"OTHER"}>Someone else</option>
										</Input>
										{
											is_for_dependent === "OTHER" ?
												<React.Fragment>
													<Input type={"text"} id={"name"} label={"Name"}></Input>
													<Input type={"text"} id={"phone_number"}
													       label={"Phone Number"}></Input>
													<Input type={"text"} id={"e_con_name"}
													       label={"Emergency Contact Name"}></Input>
													<Input type={"text"} id={"e_con_phone"}
													       label={"Emergency Contact Phone"}></Input>
												</React.Fragment>
												: ""
										}
										<SquareCard formRef={subsFormRef}></SquareCard>
										<span className="msg"></span>
									</div>
								</React.Fragment>
								: <Input type={"submit"} name={"submit"} value={"Add New Subscription"}
								         onClick={(e) => {showSubsFormFunction(e)}}>
								</Input>
						}

					</div>
					<div className={"loader"}></div>
				</form>

				<form action="/members/api/account_settings/change_password" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className={"form"}>
						<h2>Change Password</h2>
						<span className="msg"></span>
						<Input type={"password"} label={"Current Password"} id={"old_password"}
						       required={true}></Input>
						<Input type={"password"} label={"New Password"} id={"new_password"} required={true}></Input>
						<Input type={"password"} label={"Confirm New Password"} id={"confirm_new_password"}
						       required={true}></Input>
						<Input type={"submit"} name={"submit"} value={"Change Password"}></Input>
					</div>
					<div className="loader"></div>
				</form>
				<form action="/members/api/account_settings/update_profile" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className={"form"}>
						<h2>Update Profile</h2>
						<span className="msg"></span>
						<Input type={"text"} label={"First Name"} id={"firstname"} required={true}
						       value={content.update_profile.firstname}></Input>
						<Input type={"text"} label={"Last Name"} id={"lastname"} required={true}
						       value={content.update_profile.lastname}></Input>
						<Input type={"submit"} name={"submit"} value={"Update Profile"}></Input>
					</div>
					<div className="loader"></div>
				</form>
				<form action="/members/api/account_settings/update_contact_details" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className={"form"}>
						<h2>Update Contact Details</h2>
						<span className="msg"></span>
						<Input type={"text"} label={"Phone Number"} id={"phone_number"} required={true}
						       value={content.update_contact_details.phone_number}></Input>
						<Input type={"submit"} name={"submit"} value={"Update Contact Details"}></Input>
					</div>
					<div className="loader"></div>
				</form>
				<form action="/members/api/account_settings/emergency_contact" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className={"form"}>
						<h2>Emergency Contact</h2>
						<span className="msg"></span>
						<Input type={"text"} label={"Contact Name"} id={"e_con_name"} required={true}
						       value={content.emergency_contact.name}></Input>
						<Input type={"text"} label={"Phone Number"} id={"e_con_phone"} required={true}
						       value={content.emergency_contact.number}></Input>
						<Input type={"submit"} name={"submit"} value={"Update Contact Details"}></Input>
					</div>
					<div className="loader"></div>
				</form>
				<form action="/members/api/account_settings/two_factor" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className={"form"}>
						<h2>Two Factor Setup</h2>
						<span className="msg"></span>
						{
							!content.two_factor.enabled ?
								<React.Fragment>
									<QRCode data={content.two_factor.provisioning_qr}></QRCode>
									<Input type={"text"} label={"OTP Code"} id={"otp_code"} required={true}></Input>
									<Input type={"submit"} name={"submit"} value={"Enable Two Factor"}></Input>
								</React.Fragment>
								: <h3>Two Factor Authentication is already setup.</h3>
						}

					</div>
					<div className="loader"></div>
				</form>
			</div>
		</div>
	)
}