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
	console.log(content)
	// content = testResults

	function handleInput(e) {
		setSearchTerm(e.target.value)
	}

	React.useEffect(()=> {
		let tempResults = []
		if (searchTerm) {
			content.items.filter((item) => {
				if (Object.values(item).join(" ").toLowerCase().includes(searchTerm.toLowerCase())) {
					tempResults.push(<SearchResult item={item}></SearchResult>)
				}
			})
		}
		setResults(tempResults)
	}, [searchTerm])

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<Input label={"Search"} type="text" onInput={(e) => {handleInput(e)}}/>
			<h2>Results</h2>
			<div className="results">
				{results}
			</div>
		</div>
	)
}

function SearchResult({item}) {

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
		<Link className={"result"} href={item.href}>
			<Icon icon={iconMap[item.type]}></Icon>
			{capitalize(item.type)}: {item.title}
		</Link>
	)
}