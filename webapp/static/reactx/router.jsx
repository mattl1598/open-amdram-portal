const appRoot = ReactDOM.createRoot(document.getElementById('app'))
appRoot.render(
	<App></App>
)

const app = React.createContext()

function App() {
	let defaultPostPath = document.querySelector("#app").dataset.path
	const [memberNavItemsToShow, setMemberNavItemsToShow] = React.useState({})
	const [postJson, setPostJson] = React.useState(document.querySelector("#app").dataset.data || "{}")
	const [content, setContent] = React.useState([]);
	const [cart, setCart] = React.useState([])
	const [sidebarData, setSidebarData] = React.useState([]);
	const [sidebarExtras, setSidebarExtras] = React.useState([]);
	const [showSidebar, setShowSidebar] = React.useState(true)
	const [siteJson, setSiteJson] = React.useState({})
	const [pathState, setPathState] = React.useState(window.location.pathname)
	const [pathHistory, setPathHistory] = React.useState([window.location.pathname])
	const [pathIncrementer, setPathIncrementer] = React.useState(0)
	const [popstateEvents, setPopstateEvents] = React.useState([])

	const CART_TTL = 24 * 60 * 60 * 1000 // 24 hours
	// const CART_TTL = 1 * 1 * 60 * 1000 // 1 minute

	function loadCart() {
		try {
			const raw = localStorage.getItem("ticketsCart")
			if (!raw) return {}

			const parsed = JSON.parse(raw)
			if (!parsed.savedAt || !parsed.cart) return {}

			if (Date.now() - parsed.savedAt > CART_TTL) {
				localStorage.removeItem("ticketsCart")
				return {}
			}

			return parsed.cart
		} catch {
			return {}
		}
	}

	const [ticketsCart, setTicketsCart] = React.useState(loadCart)

	React.useEffect(() => {
		localStorage.setItem(
			"ticketsCart",
			JSON.stringify({
				savedAt: Date.now(),
				cart: ticketsCart
			})
		)
	}, [ticketsCart])

	let path = window.location.pathname


	React.useEffect(() => {
		if (popstateEvents.length) {
		    const debounceTimer = setTimeout(() => {
				let event = popstateEvents[0]
				setPathState(window.location.pathname)
				setPathIncrementer(pathIncrementer + 1)
				setPopstateEvents([])
		    }, 500);

		    return () => clearTimeout(debounceTimer);
		}
	}, [popstateEvents]);

	React.useEffect(() => {
		if (!window.history.state) {
			window.history.replaceState("", "", pathState)
		}
		getSiteJson()
	}, [])

	React.useEffect(() => {
		if (pathState !== pathHistory[-1]) {
			let tempHistory = [...pathHistory]
			tempHistory.push(pathState)
			setPathHistory(tempHistory)
		}
		let data = []
		// TICKETS
		if (siteJson.tickets_active === "1") {
			data.push({
				type: "simple",
				title: `${siteJson.next_show.title} - Tickets Available`,
				icon: "ticket",
				link: "/tickets",
				linkText: "Purchase Tickets",
				target: "_blank"
			})
		}
		data.push({type: "cart"}) // TODO: move up

		// copenhagen tickets
		const currentDate = new Date().getTime()
		if (currentDate < Date.parse("2026-02-24T19:30:00Z")) {
			data.push({
				type: "simple",
				title: "Copenhagen - A Silchester Players Special",
				icon: "ticket",
				link: "https://silchester-players.square.site/shop/copenhagen-a-silchester-players-special/G3TCW5JOXYQ3LQY7BPQGD4KR",
				linkText: "Copenhagen - Tickets Available",
				target: "_blank"
			})
		}

		// AUDITIONS
		const auditions_date = Date.parse(siteJson.auditions_date)
		if (siteJson.show_auditions && auditions_date > currentDate) {
			data.push({
				type: "simple",
				title: `${siteJson.show_auditions} - Auditions`,
				icon: "theater_comedy",
				link: "/auditions",
				linkText: "See Full Details",
				target: "_self"
			})
		}

		// MEMBER DOCS
		if (RegExp("^/members/", "i").test(pathState) && siteJson.memberDocs) {
			data.push({type: "raw", raw: <Post content={siteJson.memberDocs}></Post>})
		}

		// CONTACT FORM
		if (RegExp("^/(about|auditions)", "i").test(pathState)) {
			// console.log("CONTACT FORM")
			data.push({type: "raw", raw: <ContactForm></ContactForm>})
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
		if (siteJson.memberNavItemsToShow){
			setMemberNavItemsToShow({
				...siteJson.memberNavItemsToShow
			})
		}
		setSidebarData([
			...data,
		])
	}, [siteJson, pathState, pathIncrementer])

	React.useEffect(() => {
		if (["/", "/auditions", "/about-us", "/search", "/past-shows", "/members", "/members/logout"].includes(pathState)) {
			getPostJson(pathState+"?"+window.location.search.replace("?","")+"&react")
		} else if ([
			"/members/get_sums", "/members/dashboard",
			"/members/account_settings", "/members/admin/admin_settings",
			"/members/bookings"
		].includes(pathState)) {
			getPostJson(pathState+"?"+window.location.search.replace("?","")+"&react")
		} else if (RegExp("^/blog", "i").test(pathState)) {
			getPostJson("/blog?react")
		} else if (RegExp("^/post/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		} else if (RegExp("^/past-shows/([A-Za-z0-9-_]{15,16})/.+", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		} else if (RegExp("^/past-shows/member/([A-Za-z0-9-_]{15,16})/.+", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		} else if (RegExp("^(/members/|/)file/([A-Za-z0-9-_]{15,16})/(.+)", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		} else if (RegExp("^(/members/|/)post/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		} else if (RegExp("^/members/bookings/seating/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		} else if (path === "/members/docs") {
			getPostJson(pathState+`?react`)
		} else if (path === "/members/shows") {
			if (siteJson.members_recent_shows) {
				setPostJson({
					type: "members_shows",
					title: "Shows:",
					shows: siteJson.members_recent_shows
				})
			}
		} else if (RegExp("^/members/show/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
			getPostJson(pathState+`?react`)
		// } else if (path === "/tickets") {
		// 	// TODO: NEW TICKETS GO HERE
		// 	getPostJson(pathState + `?react`)
		} else if (path === "/tickets") {
			setPostJson({
				type: "ticket_store",
				title: "Tickets Store",
			})
			// getPostJson(pathState + `?react`)
		} else if (path === "/tickets/cart") {
			setPostJson({
				type: "ticket_cart",
				title: "Tickets Cart",
			})
		} else if (path === "/tickets/checkout") {
			setPostJson({
				type: "ticket_checkout",
				title: "Tickets Checkout",
			})
		} else if (path.split("?")[0] === "/tickets/checkout/success") {
			setPostJson({
				type: "ticket_success",
				title: "Purchase Successful",
			})
		} else {
			getPostJson(pathState + `?react`)
		}
	}, [pathState, pathIncrementer, siteJson])

	React.useEffect(() => {
		if (Object.keys(siteJson).length) {
			let tempContent = []
			let tempSidebarExtras = []
			setShowSidebar(true)

			// Post type
			if (postJson.type === "post") {
				tempContent.push(<Post key={tempContent.length} content={postJson}></Post>)
			} else if (postJson.type === "blog_post") {
				tempContent.push(<BlogPost key={tempContent.length} content={postJson}></BlogPost>)
			} else if (postJson.type === "blogs") {
				tempContent.push(<BlogPostList key={tempContent.length} content={postJson}></BlogPostList>)
			} else if(postJson.type === "map_post") {
				tempContent.push(<Post key={tempContent.length} content={postJson}></Post>)
				tempSidebarExtras.push(<MapEmbed key={tempSidebarExtras.length} url={postJson.maps_url}></MapEmbed>)
			} else if(postJson.type === "search") {
				tempContent.push(<Search key={tempContent.length} content={postJson}></Search>)
			} else if(postJson.type === "prize_draw") {
				tempContent.push(<PrizeDraw key={tempContent.length}></PrizeDraw>)
			} else if(postJson.type === "list_shows") {
				tempContent.push(<ListShows key={tempContent.length} content={postJson}></ListShows>)
			} else if(postJson.type === "past_show") {
				tempContent.push(<ShowPage key={tempContent.length} content={postJson}></ShowPage>)
			} else if(postJson.type === "file_page") {
				tempContent.push(<FilePage key={tempContent.length} content={postJson}></FilePage>)
			} else if(postJson.type === "login") {
				tempContent.push(<Login key={tempContent.length} content={postJson}></Login>)
			} else if(postJson.type === "error") {
				tempContent.push(<ErrorComponent key={tempContent.length} content={postJson}></ErrorComponent>)
			} else if(postJson.type === "dashboard") {
				tempContent.push(<Dashboard key={tempContent.length} content={postJson}></Dashboard>)
			} else if(postJson.type === "members_shows") {
				tempContent.push(<Shows key={tempContent.length} content={postJson}></Shows>)
			} else if(postJson.type === "members_show") {
				tempContent.push(<Show key={tempContent.length} content={postJson} refresh={getPostJson}></Show>)
			} else if(postJson.type === "account_settings") {
				tempContent.push(<AccountSettings key={tempContent.length} content={postJson} refresh={()=>getPostJson(pathState)}></AccountSettings>)
			} else if(postJson.type === "admin_settings") {
				tempContent.push(<AdminSettings key={tempContent.length} content={postJson} refresh={()=>getPostJson(pathState)}></AdminSettings>)
			} else if(postJson.type === "manage_media") {
				tempContent.push(<ManageMedia key={tempContent.length} content={postJson} refresh={()=>getPostJson(pathState)}></ManageMedia>)
			} else if(postJson.type === "edit_show") {
				tempContent.push(<EditShow key={tempContent.length} content={postJson} refresh={()=>getPostJson(pathState)}></EditShow>)
			} else if(postJson.type === "manage_show_photos") {
				tempContent.push(<PastShowPhotos key={tempContent.length} content={postJson} refresh={()=>getPostJson(pathState)}></PastShowPhotos>)
			} else if(postJson.type === "show_photos_form") {
				tempContent.push(<ShowPhotosForm key={tempContent.length} content={postJson} refresh={()=>getPostJson(pathState)}></ShowPhotosForm>)
			} else if(postJson.type === "accounting") {
				tempContent.push(<Accounting key={tempContent.length} content={postJson}></Accounting>)
			} else if(postJson.type === "get_subs") {
				tempContent.push(<GetSubs key={tempContent.length} content={postJson}></GetSubs>)
			} else if(postJson.type === "bookings") {
				tempContent.push(<ManageBookings key={tempContent.length} content={postJson}></ManageBookings>)
			} else if(postJson.type === "seating") {
				setShowSidebar(false)
				tempContent.push(<SeatingPlanner key={tempContent.length} content={postJson}></SeatingPlanner>)
			} else if(postJson.type === "ticket_store") {
				tempContent.push(<TicketStore key={tempContent.length} ticketsActive={siteJson.tickets_active}></TicketStore>)
			} else if(postJson.type === "ticket_checkout") {
				tempContent.push(<Checkout key={tempContent.length} ticketsActive={siteJson.tickets_active}></Checkout>)
			} else if(postJson.type === "ticket_success") {
				tempContent.push(<CheckoutSuccess key={tempContent.length} ticketsActive={siteJson.tickets_active}></CheckoutSuccess>)
			} else if(postJson.type === "error") {
				tempContent.push(<Post key={tempContent.length} content={postJson}></Post>)
			} else if (postJson.type === "redirect") {
				if (postJson.reloadSiteData) {
					getSiteJson()
				}
				if (postJson.url.includes(window.location.origin) || !postJson.url.includes("http")) {
					window.history.pushState("", "", postJson.url)
					setPathState(postJson.url)
				} else {
					tempContent.push(<Redirect key={tempContent.length} url={postJson.url} text={postJson.text}></Redirect>)
				}
			}

			// FRONTPAGE
			if (postJson.frontpage) {
				tempContent = [
					<Frontpage nextShow={siteJson.next_show} key={siteJson.next_show.title}>
						{tempContent}
					</Frontpage>
				]
			}
			// console.log("redraw content")
			setContent(tempContent)
			setSidebarExtras(tempSidebarExtras)
		}
	}, [postJson, siteJson])

	function setPath(newPath) {
		setPathState(newPath)
		setPathIncrementer(pathIncrementer + 1)
		window.history.pushState("", "", newPath)
	}

	function getPostJson(url) {
		// console.log("GET POST JSON")
		// console.log(url)
		if (defaultPostPath !== url) {
			const response = fetch(url)
			.then(response => response.json())
		    .then(data => {
				setPostJson({...data, requestURL: url, requestTime: Date.now()})
		    })
		}
	}

	function refresh(withSiteData=false) {
		if (withSiteData) {
			getSiteJson()
			setPathIncrementer(pathIncrementer+1)
		} else {
			getPostJson(pathState)
			setPathIncrementer(pathIncrementer+1)
		}
	}

	function getSiteJson() {
		const response = fetch("/sitedata")
		.then(response => response.json())
	    .then(data => {
			setSiteJson({...data})
	    })
	}

	window.addEventListener('popstate', (event) => {
		setPopstateEvents([...popstateEvents, event])
	})

	return (
		<app.Provider value={{siteJson, ticketsCart, functions: {setPath, refresh, setTicketsCart}}}>
			<AlertsContainer></AlertsContainer>
			<Nav navItems={navItems} memberNavItemsToShow={memberNavItemsToShow} siteName={siteJson.site_name} logoSVG={siteJson.logoSVG}>
				<div className={"main-section"}>
					<div className={"banner"} id={"banner"}></div>
					{content}
					<Sidebar show={showSidebar} sidebarItems={sidebarData} extras={sidebarExtras}></Sidebar>
				</div>
			</Nav>
		</app.Provider>
	)
}
