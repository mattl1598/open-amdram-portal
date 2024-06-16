const navItems = [
	{title: "Home", link: "/", class: ""},
	{title: "Blog", link: "/blog", class: ""},
	{title: "Past Shows", link: "/past-shows", class: ""},
	{title: "Auditions", link: "/auditions", class: ""},
	{title: "About Us", link: "/about-us", class: ""},
	{title: "Members", link: "/members", class: "", show_member_nav: true},
	{title: "Search", link: "/search", class: "search", icon: "search"},
]

const memberNavItems = [
	{title: "Dashboard", link: "/members/dashboard", class: "", icon: "dashboard"},
	{title: "Shows", link: "/members/shows", class: "", icon: "drama"},
	{title: "Manage Blog", link: "/members/manage-blog", class: "", icon: "blog_icon"},
	{title: "Get Subs", link: "/members/get_subs", class: "", icon: "membership"},
	{title: "Manage Bookings", link: "/members/bookings", class: "", icon: "ticket"},
	{title: "Admin Tools", link: "/members/admin", class: "", icon: "admin", subNav: [
		{title: "Manage Media", link: "/members/admin/manage_media"},
		{title: "Manage Shows", link: "/members/admin/manage-shows"},
		{title: "Add Show Photos", link: "/members/admin/set_show_photos"},
		{title: "Add New Members", link: "/members/admin/add-show-member"},
		{title: "Manage Users", link: "/members/admin/manage_users"},
		{title: "Admin Settings", link: "/members/admin/admin_settings"},
	]},
	{title: "Member Docs", link: "/members/docs", class: "", icon: "note"},
	{title: "Account Settings", link: "/members/account_settings", class: "", icon: "person"},
	{title: "Help & Feedback", link: "", class: "", icon: "help", subNav: [
		{title: "Feedback Form", link: "/members/feedback_form"},
		{title: "Help Docs", link: "https://github.com/mattl1598/open-amdram-portal/wiki"},
	]},
	{title: "Logout", link: "/members/logout", class: "", icon: "logout"},
]

if (document.getElementById('nav') && !document.getElementById('app')) {
	const navRoot = ReactDOM.createRoot(document.getElementById('nav'))
	navRoot.render(<Nav navItems={navItems} memberNavItems={memberNavItems} siteName={siteName}/>)
}


function Nav({navItems, siteName, children}) {
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

	for (let i=0; i<navItems.length; i++) {
		let is_active = navItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
		navList.push(
			<NavItem item={navItems[i]} is_active={is_active} mobileNav={mobileNav}></NavItem>
		)
		if (is_active && navItems[i].show_member_nav) {
			showMemberNav = true
		}
	}

	if (showMemberNav) {
		for (let i=0; i<memberNavItems.length; i++) {
			let is_active = memberNavItems[i].link.split("/")[2] === window.location.pathname.split("/")[2] && window.location.pathname.split("/").length>2;
			if (mobileNav) {
				if (is_active) {
					defaultMemberValue = memberNavItems[i].link
				}
				memberNavList.push(
					<NavItem item={memberNavItems[i]} is_active={is_active} mobileNav={mobileNav} memberNav={true}></NavItem>
				)
			} else {
				memberNavList.push(
					<NavItem item={memberNavItems[i]} is_active={is_active} mobileNav={mobileNav} memberNav={true}></NavItem>
				)
			}
			if (is_active && (memberNavItems[i].subNav !== undefined)) {
				defaultMemberValue = memberNavItems[i].link
				memberNavSubList.push(
						<NavItem item={memberNavItems[i]} mobileNav={mobileNav} memberNav={true}></NavItem>
				)
				for (let j = 0; j < memberNavItems[i].subNav.length; j++) {
					let sub_is_active = (memberNavItems[i].subNav[j].link.split("/")[3] === window.location.pathname.split("/")[3]) && window.location.pathname.split("/").length>3
					if (sub_is_active) {
						defaultMemberValue = memberNavItems[i].subNav[j].link
						console.log(defaultSubValue)
					}
					if (mobileNav) {
						memberNavSubList.push(
							<NavItem item={memberNavItems[i].subNav[j]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></NavItem>
						)
					} else {
						memberNavSubList.push(<NavItem item={memberNavItems[i].subNav[j]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></NavItem>)
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
		window.location.href = memberNavSelectRef.current.value
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
			<div className="main-outer">
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
			subNavList.push(<MemberNavItem item={item.subNav[i]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></MemberNavItem>)
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


function NavItem({item, is_active, mobileNav, memberNav = false}) {
	let style = {width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth - document.body.clientWidth : 0}px)`}
	if (memberNav) {
		style = {}
	}
	let subNavList = []
	if (item.subNav !== undefined && !mobileNav) {
		for (let i = 0; i < item.subNav.length; i++) {
			let sub_is_active = (item.subNav[i].link.split("/")[3] === window.location.pathname.split("/")[3])  && window.location.pathname.split("/").length>3
			subNavList.push(<li><NavItem item={item.subNav[i]} is_active={sub_is_active} mobileNav={mobileNav} memberNav={true}></NavItem></li>)
		}
	} else if (item.subNav !== undefined && mobileNav) {
		for (let i = 0; i < item.subNav.length; i++) {
			subNavList.push(<NavItem item={item.subNav[i]} is_active={false} mobileNav={mobileNav} memberNav={true}></NavItem>)
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
				   style={style}
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
				   style={style}
				>
					<h3>{item.title}</h3>
				</Link>
				{subNav}
			</React.Fragment>
		)
	}
}