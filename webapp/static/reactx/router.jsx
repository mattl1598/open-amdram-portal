const testContent = {
	type: "post",
	title: "Black Coffee - Tickets Available Now",
	content: '![BlackCoffeeMay2024Poster3-1.webp](/media/C3W6eU5sEQvyAAe/BlackCoffeeMay2024Poster3-1.webp)\n\n[Test](/)'
}

const appRoot = ReactDOM.createRoot(document.getElementById('app'))
appRoot.render(
	<App></App>
)

function App() {
	let defaultPostData = document.querySelector("#app").dataset.data
	let defaultPostPath = document.querySelector("#app").dataset.path
	let defaultPost = {}
	if (defaultPostData) {
		defaultPost = JSON.parse(defaultPostData)
		// delete document.querySelector("#app").dataset.data
	}

	const [postJson, setPostJson] = React.useState(defaultPost)
	const [content, setContent] = React.useState([]);
	const [sidebarData, setSidebarData] = React.useState([]);
	const [sidebarExtras, setSidebarExtras] = React.useState([]);
	const [siteJson, setSiteJson] = React.useState({})
	const [historyState, setHistoryState] = React.useState("")
	let path = window.location.pathname

	function getPostJson(url) {
		if (defaultPostPath !== url) {
			const response = fetch(url)
			.then(response => response.json())
		    .then(data => {
				setPostJson({...data})
		    })
		}
	}

	function getSiteJson(url) {
		const response = fetch("/sitedata")
		.then(response => response.json())
	    .then(data => {
			setSiteJson({...data})
	    })
	}

	React.useEffect(() => {
		getSiteJson()
	}, [])

	React.useEffect(() => {
		let data = []
		// TICKETS
		if (siteJson.tickets_active === "1") {
			data.push({type: "simple", title: "Tickets Available", icon: "ticket", link: siteJson.tickets_link, linkText: "Purchase Tickets", target: "_blank"})
		}
		// SOCIALS
		if (siteJson.socials) {
			let socials = []
			let raw_socials = siteJson.socials.split(",")
			for (let i=0; i<raw_socials.length; i++) {
				if (raw_socials[i].includes("|")) {
					let [a,b] = raw_socials[i].split("|", 2)
					let icon = "other_icon"
					if (a.toLowerCase().includes("newsletter")) {
						icon = "email_icon"
					}
					socials.push({type: "social", linkText: decodeURIComponent(a), class: "other", icon: icon, link: b})
				} else if (raw_socials[i].includes("facebook")) {
					socials.push({type: "social", linkText: "Facebook", class: "facebook", icon: "fb_icon", link: raw_socials[i]})
				} else if (raw_socials[i].includes("twitter")) {
					socials.push({type: "social", linkText: "Twitter", class: "twitter", icon: "tw_icon", link: raw_socials[i]})
				} else if (raw_socials[i].includes("instagram")) {
					socials.push({type: "social", linkText: "Instagram", class: "instagram", icon: "ig_icon", link: raw_socials[i]})
				} else {
					const url = new URL(raw_socials[i]);
					const netloc = url.hostname;
					socials.push({type: "social", linkText: netloc, class: "other", icon: "other_icon", link: raw_socials[i]})
				}
			}
			if (socials.length > 0) {
				data.push({type: "socials", title: "Socials: ", socials: socials})
			}
		}
		// LAST SHOW
		if (siteJson.last_show) {
			data.push({
				type: siteJson.last_show.photos.length ? "simple_photos" : "simple", title: "Our Last Show", icon: "drama",
				link: siteJson.last_show.link, linkText: siteJson.last_show.title,
				photos: siteJson.last_show.photos
			})
		}
		// BLOG
		if (siteJson.latest_blog) {
			data.push({type: "simple", title: `Latest Blog: ${siteJson.latest_blog.date}`, icon: "drama", link: siteJson.latest_blog.link, linkText: siteJson.latest_blog.title})
		}

		setSidebarData([
			...data
		])
	}, [siteJson])

	React.useEffect(() => {
		if (["/", "/auditions", "/about-us", "/search"].includes(path)) {
			// FRONTPAGE
			// tempContent.push(<Post content={testContent}></Post>)
			// setPostJson({...testContent})
			getPostJson(path+"?react")
		} else if (RegExp("^/blog", "i").test(path)) {
			getPostJson("/blog?react")
		} else {
			window.location.href = path
		}
	}, [historyState])

	React.useEffect(() => {
		let tempContent = []
		let tempSidebarExtras = []
		if (postJson.type === "post") {
			tempContent.push(<Post content={postJson}></Post>)
		} else if (postJson.type === "blog_post") {
			tempContent.push(<BlogPost content={postJson}></BlogPost>)
		} else if (postJson.type === "blogs") {
			tempContent.push(<BlogPostList content={postJson}></BlogPostList>)
		} else if(postJson.type === "map_post") {
			tempContent.push(<Post content={postJson}></Post>)
			tempSidebarExtras.push(<MapEmbed url={postJson.maps_url}></MapEmbed>)
		} else if(postJson.type === "search") {
			tempContent.push(<Search content={postJson}></Search>)
		}
		setContent(tempContent)
		setSidebarExtras(tempSidebarExtras)
	}, [postJson])

	function handleHistoryStateChange(e) {
		e.preventDefault()
		window.history.pushState("", "", e.target.value)
		setHistoryState(e.target.value)
	}

	return (
		<React.Fragment>
			<input
				id={"historyState"}
				style={{display: "none"}}
		        value={historyState}
				onChange={(e)=> {handleHistoryStateChange(e)}}
			></input>
			<AlertsContainer></AlertsContainer>
			<Nav navItems={navItems} memberNavItems={memberNavItems} siteName={siteName}/>
			<div className="main-outer">
				<div className="main-section">
					{content}
					<Sidebar sidebarItems={sidebarData} extras={sidebarExtras}></Sidebar>
				</div>
			</div>
		</React.Fragment>
	)
}
