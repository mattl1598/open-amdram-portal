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
			<Link className={"post"} href={link}>
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
			<Link href={show.url} title={show.title} className={"show"}>
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

function Show({content}) {
	let posts = []
	let files = []
	let shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	const context = React.useContext(app)
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
				<Link className={"post"} href={link}>
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
				<div className={"file"} href={link}>
					<Icon icon={"pdf"}></Icon>
					<div className="text">
						<span className="title"><h3>{file.title}</h3></span>
					</div>
				</div>
			)
		}
	}

	return (
		<div className={"content"}>
			<h1>{content.title}</h1>
			{
				context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ?
				<details>
					<summary>Manage Show (Click to show)</summary>
					<div className="manage">
						<form action={`/members/upload_file/${content.show.id}`} method="post" encType="multipart/form-data">
							<h3>Add Files</h3>
							<div className="fancy-input no-margin">
								<input type={"file"} name={"file"} required></input>
							</div>
							<div className="fancy-input no-margin">
								<input type={"submit"} value={"Upload"}></input>
							</div>
						</form>
						<div className="form">
							<h3>New Announcement</h3>
							<div className="fancy-input no-margin">
								<a className="button" href={`/members/new_post/${content.show.id}`}>
								Create New Post
								</a>
							</div>
						</div>
						<div className="form">
							<h3>Emergency Contacts</h3>
							<p>Warning: This is for genuine emergency use only. <br/>All access will be logged and reported to the devs and committee.</p>
							<div className="fancy-input no-margin">
								<a className="button" href={`/members/emergency_contacts/${content.show.id}`}
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
				{posts}
			</div>
		</div>
)
}