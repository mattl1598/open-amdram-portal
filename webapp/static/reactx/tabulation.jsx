function Tabs({redrawInt=0, children}) {
	const [currentTabTitle, setCurrentTabTitle] = React.useState(children[0].props.title)
	const [tab_titles, setTabTitles] = React.useState([])

	React.useEffect(()=>{
		let temp_tab_titles = []
		for (let i = 0; i < children.length; i++) {
			let child = children[i]
			if (child.props !== undefined && child.props.title !== undefined){
				let classname = "tab_name"
				if (child.props.title === currentTabTitle) {
					classname = "tab_name active"
				}
				temp_tab_titles.push(
					<div key={child.props.title} onClick={()=>{handleTabClick(child.props.title)}} className={classname}>
						<h2>{child.props.title}</h2>
					</div>
				)
			}
		}
		setTabTitles(temp_tab_titles)
	}, [children, currentTabTitle, redrawInt])


	function handleTabClick(newTitle) {
		setCurrentTabTitle(newTitle)
	}

	// Derive current tab content directly from children — never stale
	const currentTabContent = children.find(
		child => child.props && child.props.title === currentTabTitle
	)

	// Derive other tabs content directly from children
	const currentOtherTabsContent = children.filter(
		child => child.props && child.props.title !== currentTabTitle
	)

	if (children.length) {
		return (
			<div className="tabs_container" data-redraw={redrawInt}>
				<div className="tab_titles">
					{tab_titles}
				</div>
				<div className="current_tab">
					{currentTabContent}
				</div>
				<div className={"other_tabs"}>
					{currentOtherTabsContent}
				</div>
			</div>
		)
	}
}

function Tab({title, children, redrawInt=0}) {
	const [internalRedrawInt, setInternalRedrawInt] = React.useState(0)

	React.useEffect(()=>{
		setInternalRedrawInt(internalRedrawInt+redrawInt+1)
	}, [redrawInt, children])

	return (
		<div className="tab_content" data-redraw={internalRedrawInt}>
			{children}
		</div>
	)
}
