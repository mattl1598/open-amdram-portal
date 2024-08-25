const navItems = [
	{title: "Home", link: "/", class: ""},
	{title: "Blog", link: "/blog", class: ""},
	{title: "Past Shows", link: "/past-shows", class: ""},
	{title: "Auditions", link: "/auditions", class: ""},
	{title: "About Us", link: "/about-us", class: ""},
	{title: "Members", link: "/members", class: "", show_member_nav: true},
	{title: "Search", link: "/search", class: "search", icon: "search"},
]

const memberNavItemsMaster = {
	dashboard: {title: "Dashboard", link: "/members/dashboard", class: "", icon: "dashboard"},
	shows: {title: "Shows", link: "/members/shows", class: "", icon: "drama"},
	blog: {title: "Manage Blog", link: "/members/manage-blog", class: "", icon: "blog_icon"},
	get_subs: {title: "Get Subs", link: "/members/get_subs", class: "", icon: "membership"},
	bookings: {title: "Manage Bookings", link: "/members/bookings", class: "", icon: "ticket"},
	admin: {title: "Admin Tools", link: "/members/admin", class: "", icon: "admin", subNav: [
		{title: "Manage Media", link: "/members/admin/manage_media"},
		{title: "Manage Shows", link: "/members/admin/manage-shows"},
		{title: "Add Show Photos", link: "/members/admin/set_show_photos"},
		{title: "Add New Members", link: "/members/admin/add-show-member"},
		{title: "Manage Users", link: "/members/admin/manage_users"},
		{title: "Admin Settings", link: "/members/admin/admin_settings"},
	]},
	member_docs: {title: "Member Docs", link: "/members/docs", class: "", icon: "note"},
	account_settings: {title: "Account Settings", link: "/members/account_settings", class: "", icon: "person"},
	help: {title: "Help & Feedback", link: "", class: "", icon: "help", subNav: [
		{title: "Feedback Form", link: "/members/feedback_form"},
		{title: "Help Docs", link: "https://github.com/mattl1598/open-amdram-portal/wiki"},
	]},
	logout: {title: "Logout", link: "/members/logout", class: "", icon: "logout"},
}

if (document.getElementById('nav') && !document.getElementById('app')) {
	const navRoot = ReactDOM.createRoot(document.getElementById('nav'))
	navRoot.render(<Nav navItems={navItems} memberNavItems={memberNavItems} siteName={siteName}/>)
}

function Nav({navItems, siteName, logoSVG, memberNavItemsToShow, children}) {
	const context = React.useContext(app)
	const navList = []
	const memberNavList = []
	const memberNavSubList = []
	let memberNav, defaultMemberValue, defaultSubValue
	let showMemberNav = false
	const gapRef = React.useRef()
	const memberNavSelectRef = React.useRef()
	const [mobileNav, setMobileNav] = React.useState(false)
	// const [memberNav, setMemberNav] = React.useState(false)
	const [expanded, setExpanded] = React.useState(false)

	function closeMobileNav() {
		setExpanded(false)
	}

	if (navItems) {
		for (let i=0; i<navItems.length; i++) {
			let is_active = navItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
			navList.push(
				<NavItem key={i} item={navItems[i]} is_active={is_active} mobileNav={mobileNav} onClick={closeMobileNav}></NavItem>
			)
			if (is_active && navItems[i].show_member_nav && RegExp(`^${navItems[i].link}/`, "i").test(window.location.pathname)) {
				showMemberNav = true
			}
		}
	}

	if (showMemberNav && memberNavItemsToShow !== undefined) {
		for (let i=0; i<Object.keys(memberNavItemsMaster).length; i++) {
			let key = Object.keys(memberNavItemsMaster)[i]
			if (memberNavItemsToShow[key]) {
				let memberNavItem =  memberNavItemsMaster[key]
				if (key === "shows") {
					let subNav = []
					for (let j=0; j<context.siteJson.mostRecentMemberShows.length; j++) {
						let show = context.siteJson.mostRecentMemberShows[j]
						subNav.push({title: show.title, link: `/members/show/${show.id}`})
					}
					memberNavItem.subNav = subNav
				}
				let is_active = memberNavItem.link.split("/")[2] === window.location.pathname.split("/")[2] && window.location.pathname.split("/").length>2;
				if (mobileNav) {
					if (is_active) {
						defaultMemberValue = memberNavItem.link
					}
					memberNavList.push(
						<NavItem key={i} item={memberNavItem} is_active={is_active} mobileNav={mobileNav} memberNav={true}></NavItem>
					)
				} else {
					memberNavList.push(
						<NavItem key={i} item={memberNavItem} is_active={is_active} mobileNav={mobileNav} memberNav={true}></NavItem>
					)
				}
				if (is_active && (memberNavItem.subNav !== undefined)) {
					defaultMemberValue = memberNavItem.link
					memberNavSubList.push(
							<NavItem key={i} item={memberNavItem} mobileNav={mobileNav} memberNav={true}></NavItem>
					)
					for (let j = 0; j < memberNavItem.subNav.length; j++) {
						let sub_is_active = (memberNavItem.subNav[j].link.split("/")[3] === window.location.pathname.split("/")[3]) && window.location.pathname.split("/").length>3
						if (sub_is_active) {
							defaultMemberValue = memberNavItem.subNav[j].link
						}
						if (mobileNav) {
							memberNavSubList.push(
								<NavItem key={j} item={memberNavItem.subNav[j]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></NavItem>
							)
						} else {
							memberNavSubList.push(<NavItem key={j} item={memberNavItem.subNav[j]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></NavItem>)
						}
					}
				}
			}
		}
		let style = {width: `${mobileNav ? "calc(100dvw - " + (document.body.offsetWidth - document.body.clientWidth).toString() + "px)" : "fit-content"}`}
		if (mobileNav) {
			memberNav = (
				<div className={"members-nav-outer"}
				     style={style}>
					<select ref={memberNavSelectRef} className={"members-nav-main"} defaultValue={defaultMemberValue} style={style} onChange={handleMemberNavChange}>
						{memberNavList}
					</select>
					{/*<select className={`members-nav-sub ${mobileNav ? "" : "hide"}`} defaultValue={defaultSubValue}>*/}
					{/*	{memberNavSubList}*/}
					{/*</select>*/}
				</div>
			)
		} else {
			memberNav = (
				<div className={"members-nav-outer"}
				     style={{width: `${mobileNav ? "calc(100dvw - " + (document.body.offsetWidth - document.body.clientWidth).toString() + "px)" : "fit-content"}`}}>
					<div className={"members-nav-main"}>
						{memberNavList}
					</div>
				</div>
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

	function handleMemberNavChange(e) {
		e.preventDefault()
		context.functions.setPath(memberNavSelectRef.current.value)
	}

	return (
		<React.Fragment>
			<div id={"react-nav"} className={"react-nav"}>
				<div className={"title"}>
					<Link href={"/"} className={"title"} title={"Home"}>
						<Icon icon={"siteLogo"}></Icon>
						<h1>{siteName}</h1>
					</Link>
				</div>
				<div className={"full-nav"}>
					<div ref={gapRef} className={"gap"}></div>
					<div className={"nav"}>
						{navList}
					</div>
				</div>
				<div className={`hamburger ${mobileNav ? "show" : "hide"}`} onClick={(e) => {
					expand(e)
				}}>
					<a className={`hamburger`}>
						<svg className={`expand-icon search ${mobileNav && expanded ? "" : "collapsed"}`} id="menu-icon"
						     viewBox="0 0 70 70"
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
				{showMemberNav && mobileNav?
					memberNav
					: ""
				}
			</div>
			<div className={`main-outer ${mobileNav ? "mobile" : ""}`}>
				<div id="desktop_member_nav" className="portal-nav side">
				{showMemberNav && mobileNav?
					"" :
					memberNav
				}
				</div>
				{children}
			</div>
		</React.Fragment>
	)
}

function optionNavItem({item, is_active, mobileNav, memberNav = false}) {
	let subNavList = []
	if (item.subNav !== undefined) {
		for (let i = 0; i < item.subNav.length; i++) {
			let sub_is_active = (item.subNav[i].link.split("/")[3] === window.location.pathname.split("/")[3])  && window.location.pathname.split("/").length>3
			subNavList.push(<MemberNavItem key={i} item={item.subNav[i]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></MemberNavItem>)
		}
	}
	if (item.subNav !== undefined) {
		return (
			<optgroup label={item.title}>
				{subNavList}
			</optgroup>
		)
	} else {
		return (
			<option value={item.link}>{item.title}</option>
		)
	}
}


function NavItem({item, is_active, mobileNav, onClick, memberNav = false}) {
	let style = {width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth - document.body.clientWidth : 0}px)`}
	if (memberNav) {
		style = {}
	}
	let subNavList = []
	if (item.subNav !== undefined && !mobileNav) {
		for (let i = 0; i < item.subNav.length; i++) {
			let sub_is_active = (item.subNav[i].link.split("/")[3] === window.location.pathname.split("/")[3])  && window.location.pathname.split("/").length>3
			subNavList.push(<li key={getID()}><NavItem key={item.subNav[i].link} item={item.subNav[i]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></NavItem></li>)
		}
	} else if (item.subNav !== undefined && mobileNav) {
		for (let i = 0; i < item.subNav.length; i++) {
			subNavList.push(<NavItem key={item.subNav[i].link} item={item.subNav[i]} is_active={false} mobileNav={mobileNav} memberNav={true}></NavItem>)
		}
	}
	let subNav = ""
	if (subNavList.length > 0 && !mobileNav) {
		subNav = (
			<ul>
				{subNavList}
			</ul>
		)
	}

	if (memberNav && mobileNav) {
		if (subNavList.length > 0) {
			return (
				<optgroup label={item.title}>
					{subNavList}
				</optgroup>
			)
		} else {
			return (
				<option value={item.link}>{item.title}</option>
			)
		}
	}

	if (item.icon !== undefined) {
		return (
			<React.Fragment>
				<Link href={item.link}
				   className={is_active ? `${item.class} active` : `${item.class}`}
				   style={style} alsoOnClick={onClick}
				>
					<Icon icon={item.icon}></Icon>
					<h3 className={"mobile"}>{item.title}</h3>
				</Link>
				{subNav}
			</React.Fragment>
		)
	} else {
		return (
			<React.Fragment>
				<Link href={item.link}
				   className={is_active ? `${item.class} active` : `${item.class}`}
				   style={style} alsoOnClick={onClick}
				>
					<h3>{item.title}</h3>
				</Link>
				{subNav}
			</React.Fragment>
		)
	}
}