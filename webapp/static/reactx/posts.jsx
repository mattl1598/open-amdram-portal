
function Link({href, className, children, style, target="_self"}) {
	function click(e) {
		if (document.querySelector("#app")) {
			if (target === "_self") {
				e.preventDefault()
				let input = document.querySelector('#historyState')
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
				  window.HTMLInputElement.prototype,
				  'value').set;
				nativeInputValueSetter.call(input, href);
				const event = new Event('input', { bubbles: true });
				input.dispatchEvent(event);
				document.getElementById("historyState").value = href
			}
		}
	}

	return (
		<a
			className={className}
			href={href}
			onClick={(e) => {click(e)}}
			style={style}
			target={target}
		>
			{children}
		</a>
	)
}

function Frontpage({nextShow, children}) {
	return (
		<React.Fragment>
			<div class="next_show">
				<h2>Our Next Show</h2>
				<h1>{nextShow.show_title}</h1>
				<h3>{nextShow.show_subtitle}</h3>
			</div>
			<hr/>
			{children}
		</React.Fragment>
	)
}

function Post({content}) {
	return (
		<div className="content">
			<h1>{content.title}</h1>
			<Markdown className={"post_content"} content={content.content}></Markdown>
		</div>
	)
}

function BlogPost({content}) {
	function goToBlogs() {
		location.href='/blog';
	}

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
		posts.push(
			<React.Fragment>
				<Link className="link" href={`/blog/${postKeys[i]}`}>
					<b>{post.title}</b>
					{` - ${post.date} - by ${post.author}`}
				</Link>
				<hr/>
			</React.Fragment>
		)
	}
	let pathSplit = window.location.pathname.split("/")
	if (pathSplit.length > 2) {
		return (
			<BlogPost content={postsObject[pathSplit[2]]}></BlogPost>
		)
	} else {
		return (
			<div className="content">
				<h1>{content.title}</h1>
				<div className="all-posts">
					<hr/>
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

function Redirect({url, text}) {
	return (
		<div className="content">
			<h3>You will be redirected to the {text.toLowerCase()} in 5 seconds. If this doesn't work, press the button below</h3>
			<button type="button" className="quick-button" onClick={() => {window.location.href=`${url}`}}>
				Go to {text}
			</button>
			<meta httpEquiv="refresh" content={`0;url=${url}`}/>
		</div>
	)
}