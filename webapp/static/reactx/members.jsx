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
	let shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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

	return (
		<div className={"content"}>
			<h1>{content.show.title}</h1>
			{

			}
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