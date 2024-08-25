
function Link({href, className, children, style, title="", target="_self", onClick=handleClick, alsoOnClick}) {
	const context = React.useContext(app)
	function handleClick(e) {
		if (alsoOnClick !== undefined) {
			alsoOnClick()
		}
		if (target !== "_blank") {
			e.preventDefault()
			context.functions.setPath(href)
		}
	}

	return (
		<a
			className={className}
			href={href}
			onClick={(e) => {onClick(e)}}
			style={style}
			target={target}
			title={title}
		>
			{children}
		</a>
	)
}

function Frontpage({nextShow, children}) {
	return (
		<div className={"content"} key={getID()}>
			<div className="next_show" key={getID()}>
				{
					nextShow.banner ?
					ReactDOM.createPortal(
					    [<Link key={getID()} href="/tickets"><Image key={"banner1"} i={"banner"} src={nextShow.banner}></Image></Link>],
					    document.querySelector("#banner")
					) : ""
				}
				<h2 key={getID()}>Our Next Show</h2>
				<h1 key={getID()}>{nextShow.title}</h1>
				<h3 key={getID()}>{nextShow.subtitle}</h3>
				<hr key={getID()}/>
			</div>
			{children}
		</div>
	)
}

function Files({title, files}) {
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
				{ fileTags }
			</div>
		)
	}
}

function Post({content}) {
	let date = new Date(content.date)
	function handleBack(e) {
		e.preventDefault()
		history.back()
	}

	return (
		<div className="content" key={getID()}>
			{
				content.date && content.show_title ?
					<h3 className={"details"} key={getID()}><a href={""} onClick={(e) => {handleBack(e)}}>◀  Back</a><span>{content.show_title}</span><span>{date.toLocaleString().slice(0, -3)}</span></h3>
				: ""
			}
			<h1 key={getID()}>{content.title}</h1>
			<Markdown key={getID()} className={"post_content"} content={content.content}></Markdown>
			{
				content.files ?
					<Files key={getID()} title={content.files_title} files={content.files}></Files>
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
		<iframe style={{border: 0}} src={url}
		        height="450" frameBorder="0" allowFullScreen="allowfullscreen">
		</iframe>
	)
}

function Redirect({url, text="the destination"}) {
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