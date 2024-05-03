const navItems = [
	{title: "Home", link: "/", class: ""},
	{title: "Blog", link: "/blog", class: ""},
	{title: "Past Shows", link: "/past-shows", class: ""},
	{title: "Auditions", link: "/auditions", class: ""},
	{title: "About Us", link: "/about-us", class: ""},
	{title: "Members", link: "/members", class: ""},
	{title: "Search", link: "/search", class: "search"},
]

const navRoot = ReactDOM.createRoot(document.getElementById('nav'))
navRoot.render(<Nav navItems={navItems} siteName={siteName}/>)

function Nav({navItems, siteName}) {
	const [_, forceRender] = React.useReducer((newVal) => newVal + 1, 0);
	const [gapWidth, setGapWidth] = React.useState(0);
	const navList = []
	const gapRef = React.useRef()
	const [mobileNav, setMobileNav] = React.useState(false)
	const [expanded, setExpanded] = React.useState(false)

	for (let i=0; i<navItems.length; i++) {
		let is_active = navItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
		if (navItems[i].class === "search") {
			navList.push(
				<a href={navItems[i].link}
				   className={is_active ? `${navItems[i].class} active` : `${navItems[i].class}`}
				   style={{width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth - document.body.clientWidth : 0}px)`}}
				>
					<Icon icon={"search"}></Icon>
					<h3 class={"mobile"}>{navItems[i].title}</h3>
				</a>
			)
		} else {
			navList.push(
				<a href={navItems[i].link}
				   className={is_active? `${navItems[i].class} active`: `${navItems[i].class}`}
			        style={{width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth-document.body.clientWidth : 0}px)`}}
				>
					<h3>{navItems[i].title}</h3>
				</a>
			)
		}
	}

	React.useEffect(() => {
	    function handleResize() {
			if (gapRef) {
				if (mobileNav !== !gapRef.current.offsetWidth) {
					setMobileNav(!gapRef.current.offsetWidth)
				}
			}
		}
	    window.addEventListener('resize', handleResize)
		handleResize()
	})

	function expand(e) {
		e.preventDefault()
		setExpanded(!expanded)
	}

// TODO: load correct site title
	return (
		<div id={"react-nav"} className={"react-nav"}>
			<div className={"title"}>
				<a href={"/"} className={"title"} title={"Home"}>
					<Icon icon={"siteLogo"}></Icon>
					<h1>{siteName}</h1>
				</a>
			</div>
			<div className={"full-nav"}>
				<div ref={gapRef} className={"gap"}></div>
				<div className={"nav"}>
					{navList}
				</div>
			</div>
			<div className={`hamburger ${mobileNav ? "show" : "hide"}`} onClick={(e) => {expand(e)}}>
				<a className={`hamburger`}>
					<svg className={`expand-icon search ${mobileNav && expanded ? "" : "collapsed"}`} id="menu-icon" viewBox="0 0 70 70"
					     preserveAspectRatio="xMidYMin">
						<path className="line one" d="m 15 19 l 45 0"></path>
						<path className="line two" d="m 15 35 l 45 0"></path>
						<path className="line three" d="m 15 51 l 45 0"></path>
					</svg>
				</a>
			</div>
			<div className={`mobile-nav ${mobileNav && expanded ? "show" : "hide"}`}>
				{navList}
			</div>
		</div>
	)
}