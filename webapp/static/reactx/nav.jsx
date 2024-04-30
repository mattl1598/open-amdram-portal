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
	const gapRef = React.createRef()
	let mobileNav = false

	for (let i=0; i<navItems.length; i++) {
		let is_active = navItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
		if (navItems[i].class === "search") {
			navList.push(
				<a href={navItems[i].link} className={is_active? `${navItems[i].class} active`: `${navItems[i].class}`}>
					<Icon icon={"search"}></Icon>
				</a>
			)
		} else {
			navList.push(
				<a href={navItems[i].link} className={is_active? `${navItems[i].class} active`: `${navItems[i].class}`}>
					<h3>{navItems[i].title}</h3>
				</a>
			)
		}
	}
	// console.log("Gap size: ", gapRef.current.width)

	// React.useEffect(() => {
	// 	if (gapRef) {
	// 		console.log("Gap size (effect): ", gapRef.current.offsetWidth)
	// 		mobileNav = !gapRef.current.offsetWidth;
	// 	}
	// }, [gapRef, mobileNav])

	React.useLayoutEffect(() => {
		if (gapRef) {
			console.log("Gap size (effect): ", gapRef.current.offsetWidth)
			mobileNav = !gapRef.current.offsetWidth
			if (gapWidth !== gapRef.current.offsetWidth) {
				setGapWidth(gapRef.current.offsetWidth)
			}
			// forceRender();
		}
	}, [gapRef, mobileNav, gapWidth, setGapWidth])

	function updateWidth() {
		mobileNav = !gapRef.current.offsetWidth;
	}



// TODO: load correct site title
	return (
		<div id={"title-bar"} className={"title-bar"} onResize={updateWidth}>
			<div className={"title"}>
				<a href={"/"} title={"Home"}>
					<Icon icon={"siteLogo"}></Icon>
					<h1>{siteName}</h1>
				</a>
			</div>
			<div ref={gapRef} className={"gap"}></div>
			<div className={"nav"}>
				{ navList }
				<a className={`hamburger ${mobileNav ? "show" : "hide"}`}>
					<svg className="expand-icon collapsed search" id="menu-icon" viewBox="0 0 70 70"
					     preserveAspectRatio="xMidYMin">
						<path className="line one" d="m 15 19 l 45 0"></path>
						<path className="line two" d="m 15 35 l 45 0"></path>
						<path className="line three" d="m 15 51 l 45 0"></path>
					</svg>
				</a>
			</div>
		</div>
	)
}