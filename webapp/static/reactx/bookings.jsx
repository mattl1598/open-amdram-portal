const ords = {1: 'st', 2: 'nd', 3: 'rd'}

function getPerfDateString(perf_datetime) {
	let datetime = new Date(perf_datetime)
	let weekday = datetime.toDateString().slice(0, 3)
	let day = datetime.getDate()
	let ord_suffix = ords[day % 20] || "th"
	let month = datetime.toLocaleString('default', { month: 'short' })
	let hour = datetime.getHours()
	let mins = datetime.getMinutes()
	let ap_m = ["am", "pm"][{false: 0,true: 1}[hour > 12]]
	return `${weekday} ${day}${ord_suffix} ${month} ${hour % 12}:${mins}${ap_m}`
}

function ManageBookings({content}) {
	const context = React.useContext(app)
	let seats_sat = 0
	let seats_total = 0
	let performances = []
	// let mods = []
	const [mods, setMods] = React.useState([])
	let items = []
	let show_options = []

	for (let i=0; i<content.performances.length; i++) {
		let perf = content.performances[i]
		let sat = Object.values(perf.seat_assignments).length
		let seats = perf.layout.rowCount * 12 - perf.layout.hiddenSeats.length
		seats_sat += sat
		seats_total += seats
		performances.push(
			<li key={i}>
				<Link href={`/members/bookings/seating/${perf.id}`}>
					<h2>{getPerfDateString(perf.date)}</h2>
					<h3>Seats: {sat}/{seats} ({perf.layout.newSeats} new)</h3>
				</Link>
			</li>
		)
	}

	React.useEffect(()=>{
		let tempMods = []
		for (let i=0; i<content.mods.length; i++) {
			let mod = content.mods[i]
			tempMods.push(
				<tr key={i}>
					<td className={"info"} title={ mod.id }><Icon icon="important"></Icon></td>
					<td className={"center"}>{ mod.ref }</td>
					<td>{ mod.from_item || "" }</td>
					<td className={"center"}>{ mod.change_quantity }</td>
					<td className={"wide"}>{ mod.to_item }</td>
					<td>{ mod.note || "" }</td>
					<td className={"center"}><input type={"checkbox"} checked={mod.is_reservation ? "checked" : ""} readOnly={true} onClick={(e)=>{e.preventDefault()}}></input></td>
					<td className={"center"}><a onClick={(e)=>{deleteBookingMod(e, mod.id)}}>Delete</a></td>
				</tr>
			)
		}
		setMods([...tempMods])
	}, [content])

	for (let i=0; i<content.items.length; i++) {
		let item = content.items[i];
		items.push(<option key={i} value={ item }>{ item }</option>)
	}

	for (let i=0; i<content.past_shows.length; i++) {
		let show = content.past_shows[i]
		show_options.push(<option key={show.id} value={show.id} selected>{show.title}</option>)
	}

	function handleFormSubmit(e) {
		let form = e.target
		form.classList.add("pending")
		e.preventDefault()
		let formData = new FormData(form)
		fetch(form.action, {
			method: "POST",
			body: formData
		}).then((response) => {
			return response.json()
		}).then((data) => {
			if (data.code === 200) {
				form.reset()
				context.functions.refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}


	function deleteBookingMod(e, modId) {
		e.preventDefault()
		fetch('/members/api/bookings/delete_booking_mod', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({id: modId}),
		})
		.then(response => response.json())
		.then(data => {
			if (data.code === 200) {
				displayAlerts([{title: `Success`, content: data.msg}])
				context.functions.refresh(); // Refresh the content like in `handleFormSubmit`
			} else {
				console.error('Error deleting mod:', data.msg);
				displayAlerts([{title: `Error: ${data.code}`, content: data.msg}])
			}
		})
		.catch(error => {
			console.error('Request error:', error);
		});
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<h3>{mods.length}</h3>
			<Tabs>
				<Tab title={"Performances"}>
					<h2>Performances: </h2>
					<ul>
						{performances}
					</ul>
					<h3>Total: {seats_sat}/{seats_total}</h3>
				</Tab>
				<Tab title={"Modify Bookings"}>
					<h2>Modify Bookings: </h2>
					<table className={"mods"}>
						<thead>
						<tr>
							<td>ID</td>
							<td>Ref#</td>
							<td>From</td>
							<td>Quantity</td>
							<td>New Item</td>
							<td>Note</td>
							<td>Reserved?</td>
						</tr>
						</thead>
						<tbody>
						{mods}
						</tbody>
						<tfoot>
						<tr>
							<td></td>
							<td className="center"><input form="add_mod" type="number" name="ref_num"
							                              placeholder="#"/></td>
							<td className="wide">
								<datalist id="items_list">
									{items}
								</datalist>
								<input form="add_mod" type="text" list="items_list" name="from_item"
								       placeholder="From (Name or Item)"/>
							</td>
							<td className="center"><input form="add_mod" type="number" min="1"
							                              name="change_quantity" defaultValue="1"/></td>
							<td className="wide">
								<select form="add_mod" name="to_item" required defaultValue={""}>
									<option value="" disabled>...</option>
									{items}
								</select>
							</td>
							<td className="wide"><input form="add_mod" type="text" name="note"/></td>
							<td className="center"><input form="add_mod" type="checkbox" name="is_reservation"/>
							</td>
							<td className="center"><input form="add_mod" type="submit"/></td>
						</tr>
						</tfoot>
					</table>
					<form method="POST" action="/members/api/bookings/add_booking_mod" id="add_mod"
					      onSubmit={(e) => handleFormSubmit(e)}>
						<div className="form">
							<span className="msg"></span>
						</div>
						<div className="loader"></div>
					</form>
				</Tab>
				<Tab title={"Manage Performances"}>
					<h2>Add New Performance:</h2>
					<form action="/members/api/bookings/add_new_performance" onSubmit={(e) => handleFormSubmit(e)}>
						<div className="form">
							<span className="msg"></span>
							<Input id={"datetime"} type={"datetime-local"}></Input>
							<Input id={"submit"} type={"submit"} value={"Add"}></Input>
						</div>
						<div className="loader"></div>
					</form>
				</Tab>
				<Tab title={"Historic Sales"}>
					<select defaultValue={""}>
						<option value="" disabled>Select Show...</option>
						{show_options}
					</select>
				</Tab>
			</Tabs>
		</div>
	)
}