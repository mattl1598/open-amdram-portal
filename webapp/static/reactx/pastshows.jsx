// TODO LIST
// TODO: loading bar on link click? + more error catching in router.js

function ListShows({content}) {
	const [displayMode, setDisplayMode] = React.useState(content.default_layout ? content.default_layout : "cards")
	let shows = []
	// console.log(displayMode)
	for (let i = 0; i < content.shows.length; i++) {
		shows.push(
			<ShowListItem key={i} item={content.shows[i]}></ShowListItem>
		)
	}
	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className={`${displayMode}_mode`} id="past_shows">
				<div className={"header"}>
					<h3 className="image"></h3>
					<h3 className="show_title">Show</h3>
					<h3 className="season">Season</h3>
					<h3 className="genre">Genre</h3>
					<h3 className="cast">Cast Roles</h3>
					<h3 className="crew">Crew Roles</h3>
				</div>
				{shows}
			</div>
		</div>
	)
}

function ShowListItem({item}) {
	return (
		<Link className={"link"} href={`/past-shows/${item.id}/${item.title.replace(' ', '_')}`}>
			<div className="image">
				<img className={"programme"} src={item.programme} alt={`${item.title} programme cover`}/>
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
						""
				}
				{
					content.videos.length ?
						<Tab title={"Videos"}>
							<Gallery key={"videos"} imageLinks={content.videos} type={"videos"}></Gallery>
						</Tab>
					:
						""
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