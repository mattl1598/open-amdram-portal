// TODO LIST
// TODO: loading bar on link click? + more error catching in router.js
const alphaNum = RegExp("[^A-Za-z0-9 ]", "g")

function emp(string) {
	if (string) {
		return string
	} else {
		return ""
	}
}

function ListShows({content}) {
	const [displayMode, setDisplayMode] = React.useState(content.default_layout ? content.default_layout : "cards")
	const [expandSearch, setExpandSearch] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")
	const [sortMode, setSortMode] = React.useState("time_ascending")
	const [genreFilter, setGenreFilter] = React.useState([])
	const [seasonFilter, setSeasonFilter] = React.useState([])
	const [lowerYearFilter, setLowerYearFilter] = React.useState(1976)
	const [higherYearFilter, setHigherYearFilter] = React.useState(2024)
	let genreOptions = []
	let seasonOptions = []
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
				shows[key] = <ShowListItem key={i} item={content.shows[i]}></ShowListItem>
			}
		}
	} else {
		for (let i = 0; i < content.shows.length; i++) {
			let key = content.shows[i][sortingModes[sortMode].order_property] || ""
			if (Object.keys(shows).includes(key)) {
				key += content.shows[i].date
			}
			let showThis = true
			if (content.shows[i].genre) {
				genreOptions.push(<option value={content.shows[i].genre}>{content.shows[i].genre}</option>)
			}
			if (content.shows[i].season) {
				seasonOptions.push(<option value={content.shows[i].season}>{content.shows[i].season}</option>)
			}
			showThis *= (!genreFilter.length || genreFilter.includes(content.shows[i].genre))
			showThis *= (!seasonFilter.length || seasonFilter.includes(content.shows[i].season))
			let year = (new Date(content.shows[i].date)).getFullYear()
			showThis *= (lowerYearFilter <= year && year <= higherYearFilter)
			if (showThis) {
				shows[key] = <ShowListItem key={i} item={content.shows[i]}></ShowListItem>
			}
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
	let showChildren = Object.values(Object.fromEntries(Object.entries(shows).sort()))
	if (sortingModes[sortMode].reverse) {
		showChildren.reverse()
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className="filtering">
				<div className="search">
					<Icon icon={"search"} onClick={() => {
						setExpandSearch(true);
						setSortMode("results_ascending");
					}}></Icon>
					<div className={`searchbox ${expandSearch}`}>
						<input type="search" onChange={(e) => {
							setSearchTerm(e.target.value)
						}} value={searchTerm}/>
						<Icon icon={"cross"} onClick={() => {
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
						        value={sortMode}>
							{sortOptions}
						</select>
					</label>
				</div>
				<div className="filter">
					<Icon icon={"filter"}></Icon>
					<span>Filter</span>
				</div>
				{
					genreFilter.length ?
						<div className={"filters genres"}>
							{genreFilter.map((val)=>{return (<div>{val}</div>)})}
						</div>
						: ""
				}{
					seasonFilter.length ?
						<div className={"filters seasons"}>
							{seasonFilter.map((val)=>{return (<div>{val}</div>)})}
						</div>
						: ""
				}
				<div className="filter_menu">
					<ul>
						{/*<li>*/}
						{/*	Members: <input type="text"/>*/}
						{/*</li>*/}
						<li>
							Genres:
							<Select id={"genre_filter"} selected={genreFilter} setSelected={setGenreFilter} placeholder={"Filter by Genre..."}>
								{genreOptions}
							</Select>
						</li>
						<li>
							Seasons:
							<Select id={"season_filter"} selected={seasonFilter} setSelected={setSeasonFilter} placeholder={"Filter by Season..."}>
								{seasonOptions}
							</Select>
						</li>
						<li>
							Years:
							<Range min={1976} max={2024} lowerVal={lowerYearFilter} higherVal={higherYearFilter} lowerValSetter={setLowerYearFilter} higherValSetter={setHigherYearFilter}></Range>
						</li>
					</ul>
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
		<Link className={"link"} href={`/past-shows/${item.id}/${item.title.replace(' ', '_')}`} order={item[order_prop]}>
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
	let [nodaReview, setNodaReview] = React.useState(parser.parseFromString("<div class='selectMe'><div class='loader'></div></div>", "text/html").querySelector(".selectMe"))
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
					setNodaReview(domObject.querySelector('.page_content:has(h2)'))
					setGotNodaReview(true)
				})
		}
	}

	return (
		<div className="content">
			<div className="details-outer">
				<div className="details-text">
					<h1>{content.title}</h1>
					<h3>{content.show.season} - {months[dateObj.getMonth()]} {dateObj.getFullYear()}</h3>
					<span>Type: {content.show.show_type} {content.show.genre}</span>
					<span className={"directors_producers"}>Directed by: {directors}</span>
					<span className={"directors_producers"}>Produced by: {producers}</span>
					<span>Written by: {content.show.author}</span>
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
								<div dangerouslySetInnerHTML={{__html: String(nodaReview.innerHTML)}}></div>
							</details>
						:
							<React.Fragment></React.Fragment>
					}

				</div>
				<div className="details-cover">
					<Image src={content.show.programme} alt={`${content.show.title} programme cover`}
					     className="programme"/>
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