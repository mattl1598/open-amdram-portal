const testResults = {
	type: "search",
	title: "Search",
	items: [
		{type: "blog", href: "/blog/kTeNqg0P46DVjKs", title: "Another Coat of Paint"},
		{type: "show", href: "/past-shows/3XhG5bvzFbsSKzp/Rapunzel", title: "Rapunzel"},
		{type: "member", href: "/past-shows/u/r5zwBgKQjl7Kesy/Tim-Oliver", title: "Tim Oliver"},
		{type: "post", href: "/post/ALYOCGlZ6PTCGSh", title: "Tim Oliver"},
	]
}

function Search({content=testResults}) {
	const [searchTerm, setSearchTerm] = React.useState("")
	const [results, setResults] = React.useState([])
	// content = testResults

	function handleInput(e) {
		setSearchTerm(e.target.value)
	}

	React.useEffect(()=> {
		let tempResults = []
		if (searchTerm) {
			let searchTerms = searchTerm.toLowerCase().split(",")
			content.items.filter((item) => {
				let searchable = [item.title, item.type].join(" ").toLowerCase()
				let searchIndexes = []
				searchTerms.filter((term) => {
					let index = searchable.indexOf(term)
					if (index > -1) {
						searchIndexes.push(index)
					}
				})
				if (searchIndexes.length) {
					let order = Math.hypot(...searchIndexes)*(1 + searchTerms.length - searchIndexes.length)
					tempResults.push(<SearchResult item={item} order={order}></SearchResult>)
				}
			})
		}
		setResults(tempResults)
	}, [searchTerm])

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<Input label={"Search"} className={"search"} type="text" onInput={(e) => {handleInput(e)}}/>
			<h2>Results ({results.length})</h2>
			<div className="results">
				{results}
			</div>
		</div>
	)
}

function SearchResult({item, order}) {

	let iconMap = {
		blog: "blog_icon",
		show: "drama",
		member: "person",
		post: "note"
	}

	function capitalize(s) {
		return s[0].toUpperCase() + s.slice(1)
	}
	return (
		<Link className={"result"} href={item.href} style={{order: order}}>
			<Icon icon={iconMap[item.type]}></Icon>
			{capitalize(item.type)}: {item.title}
		</Link>
	)
}