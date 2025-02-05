// TODO LIST
// TODO: loading bar on link click? + more error catching in router.js
const alphaNum = RegExp("[^A-Za-z0-9 ]", "g")
const hasSetDiff = typeof((new Set()).difference) === 'function'

function emp(string) {
	if (string) {
		return string
	} else {
		return ""
	}
}

function ListShows({content}) {
	let yearMin = Infinity
	let yearMax = -Infinity

	for (let i = 0; i < content.shows.length; i++) {
		let showYear = (new Date(content.shows[i].date)).getFullYear()
		if (showYear > yearMax) {
			yearMax = showYear
		}
		if (showYear < yearMin) {
			yearMin = showYear
		}
	}

	const [displayMode, setDisplayMode] = React.useState(content.default_layout ? content.default_layout : "cards")
	const [expandSearch, setExpandSearch] = React.useState(false)
	const [expandFilterMenu, setExpandFilterMenu] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")
	const [sortMode, setSortMode] = React.useState("time_ascending")
	const [genreFilter, setGenreFilter] = React.useState([])
	const [seasonFilter, setSeasonFilter] = React.useState([])
	const [memberFilter, setMemberFilter] = React.useState([])
	const [lowerYearFilter, setLowerYearFilter] = React.useState(yearMin)
	const [higherYearFilter, setHigherYearFilter] = React.useState(yearMax)
	let memberOptions = []
	let genreOptions = new Set()
	let seasonOptions = new Set()
	const sortSelectRef = React.createRef()
	let sortingModes = {
		time_ascending: {reverse: true, order_property: "date", text: "Date (New to Old)", icon: "sort_clock_ascending"},
		time_descending: {reverse: false, order_property: "date", text: "Date (Old to New)", icon: "sort_clock_descending"},
		alphabetical_ascending: {reverse: false, order_property: "title", text: "Title (A to Z)", icon: "sort_alphabetical_ascending"},
		alphabetical_descending: {reverse: true, order_property: "title", text: "Title (Z to A)", icon: "sort_alphabetical_descending"},
		results_ascending: {reverse: true, order_property: "relevance", text: "Relevance (Most to Least)", icon: "sort_ascending"},
		results_descending: {reverse: false, order_property: "relevance", text: "Relevance (Least to Most)", icon: "sort_descending"},
	}
	let shows = {}
	// console.log(displayMode)
	if (searchTerm.length) {
		for (let i = 0; i < content.shows.length; i++) {
			content.shows[i].route = ["/past-shows", "/members/manage_shows"][1*(content.admin || false)]
			let key = 0
			let date = new Date(content.shows[i].date)
			let dateArr = [
				date.toLocaleString('default', { month: 'long' }).toLowerCase(),
				`${date.getFullYear()}`,
			]
			let contentTerms = [
				...emp(content.shows[i].title).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i),
				...emp(content.shows[i].genre).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i),
				...emp(content.shows[i].season).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i),
				...dateArr,
			].reduce(function (arr, value, index, input) {
				let incr_amount = 1-(index/input.length)
				for (let j=1; j<=value.length; j++) {
					arr[value] ? arr[value.slice(0,j)] += incr_amount * (j/value.length) : arr[value.slice(0,j)] = incr_amount * (j/value.length)
				}
				return arr
			    // return (
			    //     arr[value] ? arr[value] = arr[value] + 1-index/input.length : (arr[value] = 1-index/input.length),
			    //     arr
			    // );
			}, {});

			let searchTerms = emp(searchTerm).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i)

			for (let j=0; j<searchTerms.length; j++) {
				key += (contentTerms[searchTerms[j]] || -10000 ) * (searchTerms.length - j)
			}
			if (key > 0) {
				key = `${key.toFixed(18)}${content.shows[i].id}`
				if (Object.keys(shows).includes(key)) {
					key += content.shows[i].date
				}
				shows[key] = <ShowListItem key={i} item={content.shows[i]}></ShowListItem>
			}
		}
	} else {
		let memberFilteredShows = new Set(content.shows.map((show)=>{return show.id}));
		for (let i=0; i<memberFilter.length; i++) {
			let thisMembersShows = new Set(content.members[memberFilter[i]].shows)
			memberFilteredShows = memberFilteredShows.intersection(thisMembersShows)
		}

		for (let i = 0; i < content.shows.length; i++) {
			content.shows[i].route = ["/past-shows", "/members/manage_shows"][1*(content.admin || false)]
			let key = content.shows[i][sortingModes[sortMode].order_property] || ""
			if (Object.keys(shows).includes(key)) {
				key += content.shows[i].date
			}
			let showThis = true
			if (content.shows[i].genre) {
				genreOptions.add(content.shows[i].genre)
			}
			if (content.shows[i].season) {
				seasonOptions.add(content.shows[i].season)
			}
			showThis *= (!memberFilter.length || memberFilteredShows.has(content.shows[i].id))
			showThis *= (!genreFilter.length || genreFilter.includes(content.shows[i].genre))
			showThis *= (!seasonFilter.length || seasonFilter.includes(content.shows[i].season))
			let year = (new Date(content.shows[i].date)).getFullYear()
			showThis *= (lowerYearFilter <= year && year <= higherYearFilter)
			if (showThis) {
				shows[key] = <ShowListItem key={i} item={content.shows[i]}></ShowListItem>
			}
		}
	}
	if (content.members) { // fix for listing shows for a single member
		let memberKeys = Object.keys(content.members)
		for (let i=0; i<memberKeys.length; i++) {
			let key = memberKeys[i]
			memberOptions.push(<option key={key} value={key}>{content.members[key].name}</option>)
		}
	}

	let sortOptions = []
	let sortKeys = Object.keys(sortingModes)
	for (let i=0; i<sortKeys.length; i++) {
		sortOptions.push(<option key={i} value={sortKeys[i]}>{sortingModes[sortKeys[i]].text}</option>)
	}

	function handleSortChange(e) {
		setSortMode(e.target.value)
	}

	function resetYearsFilter() {
		setLowerYearFilter(yearMin)
		setHigherYearFilter(yearMax)
	}
	function removeGenreFilter(item) {
		let index = genreFilter.indexOf(item);
		if (index > -1) {
			genreFilter.splice(index, 1);
		}
		setGenreFilter([...genreFilter])
	}
	function removeMemberFilter(item) {
		let index = memberFilter.indexOf(item);
		if (index > -1) {
			memberFilter.splice(index, 1);
		}
		setMemberFilter([...memberFilter])
	}
	function removeSeasonFilter(item) {
		let index = seasonFilter.indexOf(item);
		if (index > -1) {
			seasonFilter.splice(index, 1);
		}
		setSeasonFilter([...seasonFilter])
	}

	let showChildren = Object.entries(shows).sort().map((a)=>{return a[1]})
	if (sortingModes[sortMode].reverse) {
		showChildren.reverse()
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className={`filtering ${expandFilterMenu ? "show_filter_menu" : ""}`}>
				<div className="search">
					<Icon icon={"search"} onClick={() => {
						setExpandSearch(true);
						setSortMode("results_ascending");
					}}></Icon>
					<div className={`searchbox ${expandSearch}`}>
						<input type="search" onChange={(e) => {
							setSearchTerm(e.target.value)
						}} value={searchTerm}/>
						<Icon icon={"cross"} className={"cross"} onClick={() => {
							setExpandSearch(false);
							setSearchTerm("");
							setSortMode("time_ascending");
						}}></Icon>
					</div>
				</div>
				<div className="sort">
					<label htmlFor="sortMode" onClick={() => {
						sortSelectRef.current.showPicker()
					}}>
						<Icon icon={sortingModes[sortMode].icon}></Icon>
						<span>Sort:&nbsp;</span>
						<select ref={sortSelectRef} onChange={handleSortChange} name="sortMode" id="sortMode"
						        value={sortMode} onClick={(e)=>{e.stopPropagation()}}>
							{sortOptions}
						</select>
					</label>
				</div>
				<div className="filter" onClick={()=>{setExpandFilterMenu(!expandFilterMenu)}}>
					<Icon icon={"filter"}></Icon>
					<span>Filters
						{
							genreFilter.length||seasonFilter.length||lowerYearFilter>yearMin||higherYearFilter>yearMax ?
							` (${genreFilter.length+seasonFilter.length+(lowerYearFilter>yearMin||higherYearFilter>yearMax)} Applied)`
							: ""
						}
					</span>
				</div>
				<div className="filters">
					{
						memberFilter.length ?
							memberFilter.map((val)=>{return (<div className={"member"} onClick={()=>{removeMemberFilter(val)}}>{content.members[val].name}</div>)})
							: ""
					}
					{
						genreFilter.length ?
							genreFilter.map((val)=>{return (<div className={"genre"} onClick={()=>{removeGenreFilter(val)}}>{val}</div>)})
							: ""
					}{
						seasonFilter.length ?
							seasonFilter.map((val)=>{return (<div className={"season"} onClick={()=>{removeSeasonFilter(val)}}>{val}</div>)})
							: ""
					}{
						lowerYearFilter > yearMin || higherYearFilter < yearMax?
							<div className={"year"} onClick={resetYearsFilter}>{lowerYearFilter} - {higherYearFilter}</div>
							: ""
					}
				</div>
				<div className="filter_menu">
					<ul>
						{
							hasSetDiff ?
							<li>
								Members:
								<Select id={"member_filter"} selected={memberFilter} setSelected={setMemberFilter} placeholder={"Filter by Members..."}>
									{memberOptions}
								</Select>
							</li> :
							<React.Fragment></React.Fragment>
						}
						<li>
							Genres:
							<Select id={"genre_filter"} selected={genreFilter} setSelected={setGenreFilter} placeholder={"Filter by Genre..."}>
								{[...genreOptions].map((val)=>{return <option value={val} key={val}>{val}</option>})}
							</Select>
						</li>
						<li>
							Seasons:
							<Select id={"season_filter"} selected={seasonFilter} setSelected={setSeasonFilter} placeholder={"Filter by Season..."}>
								{[...seasonOptions].map((val)=>{return <option value={val} key={val}>{val}</option>})}
							</Select>
						</li>
						<li>
							Years:
							<Range min={yearMin} max={yearMax} lowerVal={lowerYearFilter} higherVal={higherYearFilter} lowerValSetter={setLowerYearFilter} higherValSetter={setHigherYearFilter}></Range>
						</li>
					</ul>
				</div>
				<div className="resultsCount">
					{showChildren.length} results found.
				</div>
			</div>
			<div className={`${displayMode}_mode`} id="past_shows">
				<div className={"header"}>
					<h3 className="image"></h3>
					<h3 className="show_title">Show</h3>
					<h3 className="season">Season</h3>
					<h3 className="genre">Genre</h3>
					<h3 className="cast">Cast Roles</h3>
					<h3 className="crew">Crew Roles</h3>
				</div>
				{showChildren}
			</div>
		</div>
	)
}

function ShowListItem({item, order_prop}) {
	return (
		<Link className={"link"} href={`${item.route}/${item.id}/${item.title.replace(' ', '_')}`} order={item[order_prop]}>
			<div className="image">
				<Image className={"programme"} src={item.programme} alt={`${item.title} programme cover`}/>
			</div>
			<div className="show_title">
				<h3>{item.title}</h3>
			</div>
			<div className="season">{item.season} {new Date(item.date).getFullYear()}</div>
			<div className="genre">{item.genre}</div>
			<div className="cast">{item.cast}</div>
			<div className="crew">{item.crew}</div>
		</Link>
	)
}

function ShowPage({content}) {
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	let dateObj = new Date(content.show.date)
	const parser = new DOMParser()
	let [nodaReview, setNodaReview] = React.useState(<div className='loader'></div>)
	// let [nodaReview, setNodaReview] = React.useState(parser.parseFromString("<div class='selectMe'><div class='loader'></div></div>", "text/html").querySelector(".selectMe"))
	let [gotNodaReview, setGotNodaReview] = React.useState(false)
	let directors = []
	let producers = []
	let cast = {}
	let castRows = []
	for (let i=0; i<content.cast.length; i++) {
		if (cast[`${content.cast[i].order}${content.cast[i].role}`]) {
			cast[`${content.cast[i].order}${content.cast[i].role}`] = [...cast[`${content.cast[i].order}${content.cast[i].role}`], content.cast[i]]
		} else {
			cast[`${content.cast[i].order}${content.cast[i].role}`] = [content.cast[i]]
		}
	}
	let castKeys = Object.keys(cast)
	for (let i=0; i<castKeys.length; i++) {
		let names = []
		for (let j=0; j<cast[castKeys[i]].length; j++) {
			names.push(<Link key={`cast${j}`} href={`/past-shows/member/${cast[castKeys[i]][j].id}/${cast[castKeys[i]][j].name}`}>{cast[castKeys[i]][j].name}</Link>)
			names.push(<br key={`castBreak${j}`}/>)
		}
		castRows.push(
			<tr key={`castTable${i}`}>
				<td>{cast[castKeys[i]][0].role}</td>
				<td>{names}</td>
			</tr>
		)
	}
	let crew = {}
	let crewRows = []
	for (let i=0; i<content.crew.length; i++) {
		if (crew[`${content.crew[i].order}${content.crew[i].role}`]) {
			crew[`${content.crew[i].order}${content.crew[i].role}`] = [...crew[`${content.crew[i].order}${content.crew[i].role}`], content.crew[i]]
		} else {
			crew[`${content.crew[i].order}${content.crew[i].role}`] = [content.crew[i]]
		}
	}
	let crewKeys = Object.keys(crew)
	for (let i=0; i<crewKeys.length; i++) {
		let names = []
		for (let j=0; j<crew[crewKeys[i]].length; j++) {
			let link = <Link key={`crew${j}`} href={`/past-shows/member/${crew[crewKeys[i]][j].id}/${crew[crewKeys[i]][j].name.replace(' ', '_')}`}>{crew[crewKeys[i]][j].name}</Link>
			names.push(link)
			names.push(<br key={`crewBreak${j}`}/>)
			if (crew[crewKeys[i]][0].role === "Director") {
				let newLink = React.cloneElement(link, { key: `director${j}`, className: "director"});
				directors.push(newLink)
			} else if (crew[crewKeys[i]][0].role === "Producer") {
				let newLink = React.cloneElement(link, { key: `producer${j}`, className: "producer"});
				producers.push(newLink)
			}
		}
		crewRows.push(
			<tr key={`castTable${i}`}>
				<td>{crew[crewKeys[i]][0].role}</td>
				<td>{names}</td>
			</tr>
		)
	}

	function getNODAReport() {
		if (content.show.noda_review && !gotNodaReview) {
			fetch("/cors", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({url: content.show.noda_review}),
			})
				// .then((data) => {return data.body})
				.then((data) => {return data.text()})
				.then((data) => {
					let domObject = parser.parseFromString(data, "text/html")
					let queryResults = domObject.querySelectorAll('.page_subheading, .page_content')
					let temp = []
					let styleRegex = RegExp(` style="[^"]+">`, "g")
					for (let i = 0; i < queryResults.length; i++) {
						let html = String(queryResults[i].innerHTML)
						html = html.replaceAll(styleRegex, ">")
						temp.push(<div key={`noda${i}`} dangerouslySetInnerHTML={{__html: html}}></div>)
					}
					setNodaReview(<React.Fragment>{temp}</React.Fragment>)
					setGotNodaReview(true)
				})
		}
	}

	return (
		<div className="content">
			<div className="details-outer">
				<h1>{content.title}</h1>
				<div className="details-inner">
					<div className="details-cover">
						<Image src={content.show.programme} alt={`${content.show.title} programme cover`}
						       className="programme"/>
					</div>
					<div className="details-text">
						<h3>{content.show.season} - {months[dateObj.getMonth()]} {dateObj.getFullYear()}</h3>
						<p>Type: {content.show.show_type} {content.show.genre}</p>
						<p className={"directors_producers"}>Directed by: {directors}</p>
						<p className={"directors_producers"}>Produced by: {producers}</p>
						<p>Written by: {content.show.author}</p>
						{
							content.show.radio_audio ?
								<audio src={content.show.radio_audio} controls></audio>
								:
								<React.Fragment></React.Fragment>
						}
						<Markdown content={content.show.text_blob}></Markdown>
						{
							content.show.noda_review ?
								<details>
									<summary onClick={getNODAReport}>NODA Review</summary>
									<div>{nodaReview}</div>
								</details>
								:
								<React.Fragment></React.Fragment>
						}

					</div>
				</div>
			</div>

			<Tabs>
				{
					content.photos.length ?
						<Tab title={"Photos"}>
							<Gallery key={"photos"} imageLinks={content.photos}></Gallery>
						</Tab>
						:
						<React.Fragment></React.Fragment>
				}
				{
					content.videos.length ?
						<Tab title={"Videos"}>
							<Gallery key={"videos"} imageLinks={content.videos} type={"videos"}></Gallery>
						</Tab>
						:
						<React.Fragment></React.Fragment>
				}
			</Tabs>

			<div className="cast_crew">
				<div className="cast">
					<h3>Cast:</h3>
					<table className={"roles_table"}>
						<tbody>
						{castRows}
						</tbody>
					</table>
				</div>
				<div className="crew">
					<h3>Crew:</h3>
					<table className={"roles_table"}>
						<tbody>
						{crewRows}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}