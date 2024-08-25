function Tabs({children}) {
	const [currentTabTitle, setCurrentTabTitle] = React.useState(children[0].props.title)
	const [currentTabContent, setCurrentTabContent] = React.useState(children[0])
	const [currentOtherTabsContent, setCurrentOtherTabsContent] = React.useState([])
	let tab_titles = []
	let tabs = {}
	for (let i = 0; i < children.length; i++) {
		let child = children[i]
		if (child.props !== undefined && child.props.title !== undefined){
			let classname = "tab_name"
			if (child.props.title === currentTabTitle) {
				classname = "tab_name active"
			}
			tab_titles.push(
				<div key={child.props.title} onClick={()=>{handleTabClick(child.props.title)}} className={classname}>
					<h2>{child.props.title}</h2>
				</div>
			)
			tabs[child.props.title] = child
		}
	}

	function handleTabClick(newTitle) {
		setCurrentTabTitle(newTitle)
		setCurrentTabContent(tabs[newTitle])
		let tempOtherTabs = []
		for (let i = 0; i < tab_titles.length; i++) {
			let tab_title = tab_titles[i]
			if (tab_title !== newTitle) {
				tempOtherTabs.push(tabs[tab_title])
			}
		}
		setCurrentOtherTabsContent(tempOtherTabs)
	}

	if (children.length) {
		return (
			<div className="tabs_container">
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

function Tab({title, children}) {
	return (
		<div className="tab_content">
			{children}
		</div>
	)
}
