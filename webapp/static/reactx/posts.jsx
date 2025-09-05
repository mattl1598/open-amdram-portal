// function handleClick(e) {
// 	if (alsoOnClick !== undefined) {
// 		alsoOnClick()
// 	}
// 	if (target !== "_blank") {
// 		e.preventDefault()
// 		context.functions.setPath(href)
// 	}
// }
function Link({href, className, children, style, title="", target="_self", onClick="null", alsoOnClick="null"}) {
	const context = React.useContext(app)
	function handleClick(e) {
		if (alsoOnClick !== "null") {
			alsoOnClick()
		}
		if (onClick !== "null") {
			onClick(e)
		} else if (target !== "_blank") {
			e.preventDefault()
			context.functions.setPath(href)
		}
	}

	return (
		<a
			className={className}
			href={href}
			onClick={(e) => {handleClick(e)}}
			style={style}
			target={target}
			title={title}
		>
			{children}
		</a>
	)
}

function ErrorComponent({content}) {
	return (
		<div className="content">
			<div className="error">
				<h2>Error {content.title}</h2>
				<p>{content.message || "An unexpected error occurred. Please try again later."}</p>
			</div>
		</div>
	);
}

function Frontpage({nextShow, children}) {
	return (
		<div className={"content"} key={`content_${nextShow.title}`}>
			<div className="next_show" key={`next_show_${nextShow.title}`}>
				{
					nextShow.banner ?
					ReactDOM.createPortal(
					    [<Link key={"tickets_banner"} href="/tickets"><Image key={"banner1"} i={"banner"} src={nextShow.banner}></Image></Link>],
					    document.querySelector("#banner")
					) : ""
				}
				<h2>Our Next Show</h2>
				<h1>{nextShow.title}</h1>
				<h3>{nextShow.subtitle}</h3>
				<hr/>
			</div>
			{children}
		</div>
	)
}

function Files({title, files, children}) {
	if (files !== undefined && files.length > 0) {
		let fileTags = []

		if (files) {
			let file_route = "/file"
			if (RegExp("^/members/", "i").test(window.location.pathname)) {
				file_route = "/members/file"
			}
			for (let i=0; i<files.length; i++) {
				fileTags.push(
					<Link key={files[i].id} href={`${file_route}/${files[i].id}/${files[i].name.replaceAll(" ", "_")}`} className={"file"}>
						<Icon icon={"pdf"} timeline={"up"}></Icon>
						<div className="text">
							<span className="title"><h3>{files[i].name}</h3></span>
							<span className="text"><span>PDF file</span></span>
						</div>
					</Link>
				)
			}
		}

		return (
			<div className={"timeline"}>
				<span className="file heading">
					<Icon icon={"circle"} timeline={"down"}></Icon>
					<h2>{title ? title : "Files"}</h2>
				</span>
				{ children }
				{ fileTags }
			</div>
		)
	}
}

function File({id, href, children, subtext, fileType="file", icon="pdf", target="_self"}) {
	return (
		<Link key={id} href={href} className={fileType} target={target}>
			<Icon icon={icon} timeline={"up"}></Icon>
			<div className="text">
				<span className="title"><h3>{children}</h3></span>
				<span className="text"><span>{subtext}</span></span>
			</div>
		</Link>
	)
}

function Post({content}) {
	let date = new Date(content.date)
	function handleBack(e) {
		e.preventDefault()
		history.back()
	}

	return (
		<div className="content" key={`post_${content.title}`}>
			{
				content.date && content.show_title ?
					<h3 className={"details"}><a href={""} onClick={(e) => {handleBack(e)}}>◀  Back</a><span>{content.show_title}</span><span>{date.toLocaleString().slice(0, -3)}</span></h3>
				: ""
			}
			{
				content.frontpage && content.show_title === content.title ?
					"" :
					<h1>{content.title}</h1>
			}
			<Markdown className={"post_content"} content={content.content}></Markdown>
			{
				content.files ?
					<Files title={content.files_title} files={content.files}></Files>
					: ""
			}
		</div>
	)
}

function FilePage({content}) {
	let date = new Date(content.date)
	function handleBack(e) {
		e.preventDefault()
		history.back()
	}
	return (
		<div className="content filepage">
			{
				content.date && content.show_title ?
					<h3 className={"details"}><a href={""} onClick={(e) => {handleBack(e)}}>◀  Back</a><span>{content.show_title}</span><span>{date.toLocaleString().slice(0, -3)}</span></h3>
				: ""
			}
			<h1>{content.title.replaceAll("_", " ")}</h1>
			<object data={content.url}>
				<h4>File preview not supported on your device. See Download link below.</h4>
				<a href={content.url} target="_blank"><h3>Download File</h3></a>
			</object>
			<a href={content.url} target="_blank"><h3>Download File</h3></a>
		</div>
	)
}

function BlogPost({content}) {
	return (
		<div className="content">
			<div className="flex-container">
				<div className="top-bar">
					<Link href={"/blog"} className="svg-button">
						<svg viewBox="0 0 10 20" fillOpacity="0">
							<path d="m 10 0 l -10 10 l 10 10"></path>
						</svg>
						<div className="label">
							<h3>Back</h3>
							<p>to all posts</p>
						</div>
					</Link>
					<h1 className={"post-title"}>{content.title}</h1>
					<div style={{textAlign: 'right', margin: "auto"}}>
						<h2>{content.date}</h2>
						{content.author}
					</div>
				</div>
				<div className="post-content">
					<Markdown className={"post_content"} content={content.content}></Markdown>
				</div>
			</div>
		</div>
	)
}

function BlogPostList({content}) {
	let postsObject = content.posts
	let posts = []
	let postKeys = Object.keys(postsObject)
	for (let i=0; i<postKeys.length; i++) {
		let post = postsObject[postKeys[i]]
		let style = {order: post.dateInt}
		posts.push(
			<Link key={i} className="link hr_after" href={`/blog/${postKeys[i]}`} style={style}>
				<b>{post.title}</b>
				{` - ${post.date} - by ${post.author}`}
			</Link>
		)
	}
	let pathSplit = window.location.pathname.split("/")
	if (pathSplit.length > 2 && postKeys.includes(pathSplit[2])) {
		return (
			<BlogPost content={postsObject[pathSplit[2]]}></BlogPost>
		)
	} else if (pathSplit.length > 2) {
		return <BlogPost content={{title: "404 Not Found", content: "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."}}></BlogPost>
	} else {
		return (
			<div className="content">
				<h1>{content.title}</h1>
				<div className="all-posts">
					{posts}
				</div>
			</div>
		)
	}
}

function MapEmbed({url}) {
	return (
		<div className="map">
			<iframe style={{border: 0}} src={url}
			        height="450" frameBorder="0" allowFullScreen="allowfullscreen">
			</iframe>
		</div>
	)
}

function ContactForm({}) {
	function handleSubmit(e) {
		let form = e.target
		form.classList.add("pending")
		e.preventDefault()
		let formData = new FormData(form);
		fetch(e.target.action, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				name: formData.get('name'),
				contact: formData.get('contact'),
				subject: formData.get('subject'),
				message: formData.get('message'),
			})
		}).then((response) => {
			return response.json()
		}).then((data) => {
			if (data.code === 200) {
				form.reset();
				displayAlerts({title: "Success", content: 'Your message has been sent successfully!'});
			} else {
				displayAlerts({title: "Error", content: data.msg});
			}
			form.querySelector("span.msg").innerHTML = data.msg
		}).finally(()=> {
			form.classList.remove("pending")
		})
		.catch(error => {
			console.error('Error:', error);
			alert('An unexpected error occurred. Please try again later.');
		});
	}
	return (
		<div className="contact-form" id={"contactform"}>
			<h2>Contact Us</h2>
			<form action="/api/contact" method={"POST"} onSubmit={(e) => {handleSubmit(e)}}>
				<div className="form">
					<span className="msg"></span>
					<Input type={"text"} id={"name"} label={"Name"} required={true}></Input>
					<Input type={"text"} id={"contact"} label={"Contact Email or Number"} required={true}></Input>
					<Input type={"select"} id={"subject"} label={"Subject"} defaultValue={""} required={true}>
						<option value=""></option>
						<option value="Joining the group">Joining the group</option>
						<option value="Tickets">Tickets</option>
						<option value="Group Bookings">Group Bookings</option>
						<option value="Other">Other</option>
					</Input>
					<Input type={"textarea"} id={"message"} label={"Message"} required={true}></Input>
					<Input type={"submit"} value={"Submit"}></Input>
				</div>
				<div className="loader"></div>
			</form>
		</div>
	)
}

function PrizeDraw({}) {
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
			// console.log("CODE: ", data.code)
			if (data.code === 200) {
				form.reset()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.querySelector("div.form").classList.add("hidden")
			form.classList.remove("pending")
		})
	}
	
	function handlePhoneChange(e) {
		e.target.value = e.target.value.replace(/\D/g, '')
	}

	return (
		<div className="content">
			<h1>Prize Draw</h1>
			<p>Enter your details for a change to win 2 tickets to see our next show, <b>Death by Design</b>, a comedy murder mystery.</p>
			<p>By entering the draw, you agree to join our audience email newsletter for about upcoming shows.</p>
			<form action="/api/prizeDraw" onSubmit={handleFormSubmit}>
				<h2 style={{textAlign: "center"}}><span className="msg"></span></h2>
				<div className="form">
					<Input type={"text"} id={"name"} maxLength={50} label={"Name"} required={true}></Input>
					<Input type={"text"} id={"email"} maxLength={120} label={"Email"} required={true}></Input>
					<Input type={"text"} id={"phone_number"} onChange={handlePhoneChange} maxLength={13} label={"Phone Number"} required={true}></Input>
					<Input type={"submit"} value={"Submit"}></Input>
				</div>
				<div className="loader"></div>
			</form>
		</div>
	)
}

function Redirect({url, text = "the destination"}) {
	return (
		<div className="content">
			<h3>You will be redirected to {text.toLowerCase()} in 5 seconds. If this doesn't work, press the button below</h3>
			<button type="button" className="quick-button" onClick={() => {window.location.href=`${url}`}}>
				Go to {text}
			</button>
			<meta httpEquiv="refresh" content={`0;url=${url}`}/>
		</div>
	)
}