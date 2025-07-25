const sidebarItemsTest = [
	{type: "simple", title: "Tickets Available", icon: "ticket", link: "/tickets", linkText: "Purchase Tickets", target: "_blank"},
	{type: "socials", title: "Socials: ", socials: [
		{type: "social", linkText: "Newsletter Signup", class: "other", icon: "email_icon", link: "https://squareup.com/customer-programs/enroll/vWioYW6NwGxi/marketing"},
		{type: "social", linkText: "Facebook", class: "facebook", icon: "fb_icon", link: "https://www.facebook.com/silchplayers/"},
		{type: "social", linkText: "Twitter", class: "twitter", icon: "tw_icon", link: "https://twitter.com/silchplayers"},
		{type: "social", linkText: "Instagram", class: "instagram", icon: "ig_icon", link: "https://www.instagram.com/silchesterplayers"}
	]},
	{type: "simple", title: "Latest Blog: May 2023", icon: "blog_icon", link: "/testreact/blog", linkText: "Preparations, Preparations", target: "_self"},
]

function Sidebar({sidebarItems=sidebarItemsTest, extras=[], show=true}) {
	let items = []
	for (let i=0; i<extras.length; i++) {
		items.push(<SidebarItem key={`extras[${i}]`} raw={extras[i]}></SidebarItem>)
	}
	for (let i=0; i<sidebarItems.length; i++) {
		if (sidebarItems[i].type === "raw") {
			items.push(<SidebarItem key={i} raw={sidebarItems[i].raw}></SidebarItem>)
		} else {
			items.push(<SidebarItem key={i} item={sidebarItems[i]}></SidebarItem>)
		}
	}
	if (show) {
		return (
			<div className={"sidebar m"}>
				{items}
			</div>
		)
	} else {
		return (<React.Fragment></React.Fragment>)
	}
}

function SidebarItem({item={type: "raw"}, raw=<div/>}) {
	if (item.type === "simple") {
		return (
			<div className="generic_link">
				<h2>{item.title}</h2>
				<Link className={"generic_link"} href={item.link} target={item.target}>
					<span className="icon"><Icon icon={item.icon}></Icon></span>
					<span className="text">{item.linkText}</span>
				</Link>
			</div>
		)
	}
	if (item.type === "simple_photos") {
		return (
			<div className="generic_link">
				<h2>{item.title}</h2>
				<Link className={"generic_link"} href={item.link} target={item.target}>
					<span className="icon"><Icon icon={item.icon}></Icon></span>
					<span className="text">{item.linkText}</span>
				</Link>
				{/*todo fix this v*/}
				{/*<Carousel5 photos={item.photos} showTitle={item.linkText}></Carousel5>*/}
			</div>
		)
	}
	if (item.type === "socials") {
		let socials = []
		for (let i = 0; i<item.socials.length; i++) {
			socials.push(<SidebarItem key={i} item={item.socials[i]}></SidebarItem>)
		}
		return (
			<div className="socials">
				<h2>{item.title}</h2>
				{socials}
			</div>
		)
	}
	if (item.type === "social") {
		let link
		if (RegExp("^https://|^http://").test(item.link)) {
			link = item.link
		} else {
			link = `https://${item.link}`
		}
		return (
			<Link href={link} className={item.class} target={"_blank"}>
				<span className="icon"><Icon icon={item.icon}></Icon></span>
				<span className="text">{item.linkText}</span>
			</Link>
		)
	}
	if (item.type === "raw") {
		return (
			<div className="">
				{raw}
			</div>
		)
	}
}