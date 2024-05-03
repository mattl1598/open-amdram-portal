const navItems = [
	{title: "Home", link: "/", class: ""},
	{title: "Blog", link: "/blog", class: ""},
	{title: "Past Shows", link: "/past-shows", class: ""},
	{title: "Auditions", link: "/auditions", class: ""},
	{title: "About Us", link: "/about-us", class: ""},
	{title: "Members", link: "/members", class: ""},
	{title: "Search", link: "/search", class: "search", icon: "search"},
]

const memberNavItems = [
	{title: "Dashboard", link: "/members/dashboard", class: "", icon: "dashboard"},
	{title: "Shows", link: "/members/shows", class: "", icon: "drama"},
	{title: "Manage Blog", link: "/members/manage-blog", class: "", icon: "blog_icon"},
	{title: "Get Subs", link: "/members/get_subs", class: "", icon: "membership"},
	{title: "Manage Bookings", link: "/members/bookings", class: "", icon: "ticket"},
	{title: "Admin Tools", link: "/members/admin", class: "", icon: "admin"},
	{title: "Member Docs", link: "/members/docs", class: "", icon: "note"},
	{title: "Account Settings", link: "/members/account_settings", class: "", icon: "person"},
	{title: "Help & Feedback", link: "", class: "", icon: "help"},
	{title: "Logout", link: "/members/logout", class: "", icon: "logout"},
]

const navRoot = ReactDOM.createRoot(document.getElementById('nav'))
navRoot.render(<Nav navItems={navItems} memberNavItems={memberNavItems} siteName={siteName}/>)

function Nav({navItems, siteName}) {
	const navList = []
	const memberNavList = []
	const gapRef = React.useRef()
	const [mobileNav, setMobileNav] = React.useState(false)
	const [expanded, setExpanded] = React.useState(false)

	for (let i=0; i<navItems.length; i++) {
		let is_active = navItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
		navList.push(
			<NavItem item={navItems[i]} is_active={is_active} mobileNav={mobileNav}></NavItem>
		)
	}
	for (let i=0; i<memberNavItems.length; i++) {
		let is_active = memberNavItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
		memberNavList.push(
			<NavItem item={memberNavItems[i]} is_active={is_active} mobileNav={mobileNav}></NavItem>
		)
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
			<div className={"member-nav"}>
				{memberNavList}
			</div>
		</div>
	)
}

function NavItem({item, is_active, mobileNav}) {
	if (item.icon !== undefined) {
		return (
			<a href={item.link}
			   className={is_active ? `${item.class} active` : `${item.class}`}
			   style={{width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth - document.body.clientWidth : 0}px)`}}
			>
				<Icon icon={item.icon}></Icon>
				<h3 className={"mobile"}>{item.title}</h3>
			</a>
		)
	} else {
		return (
			<a href={item.link}
			   className={is_active ? `${item.class} active` : `${item.class}`}
			   style={{width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth - document.body.clientWidth : 0}px)`}}
			>
				<h3>{item.title}</h3>
			</a>
		)
	}

}