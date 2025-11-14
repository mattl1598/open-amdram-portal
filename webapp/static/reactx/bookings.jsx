const ords = {1: 'st', 2: 'nd', 3: 'rd'}

function getPerfDateString(perf_datetime) {
	let datetime = new Date(perf_datetime)
	let weekday = datetime.toDateString().slice(0, 3)
	let day = datetime.getDate()
	let ord_suffix = day < 31 ? ords[day % 20] || "th" : "st"
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
	const [historicSales, setHistoricSales] = React.useState(<div><h3>Please select a show...</h3></div>)
	const [redrawInt, setRedrawInt] = React.useState(0)

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
		}).finally(() => {
			form.classList.remove("pending")
			setRedrawInt(redrawInt + 1)
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

	function getHistoricSales(e) {
		let form = e.target
		form.classList.add("pending")
		let formData = {}
		for (let [key, value] of (new FormData(form)).entries()) {
			formData[key] = value
			console.log(key, value);
       }
		e.preventDefault()
		fetch('/members/api/bookings/historic_sales', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData),
		})
		.then(response => response.json()).then(data => {
			if (data.code === 200) {
				displayAlerts([{title: `Success`, content: data.msg}])
				setHistoricSales(renderHistoricSales(data.results))
			} else {
				console.error('Error:', data.msg);
				displayAlerts([{title: `Error: ${data.code}`, content: data.msg}])
			}
		})
		.catch(error => {
			console.error('Request error:', error);
		}).finally(() => {
			form.classList.remove("pending")
			setRedrawInt(redrawInt + 1)
		});
	}

	function monthStringToInt(month) {
	    const months = [
	        "jan", "feb", "mar", "apr", "may", "jun",
	        "jul", "aug", "sep", "oct", "nov", "dec"
	    ];
	    // Normalize input to lowercase and search in the array
		const searchStr = month.toLowerCase().substring(0,3);
	    const index = months.indexOf(searchStr);
	    // Add 1 because arrays are zero-based
	    return index >= 0 ? index + 1 : null; // Return null if not found
	}

	function renderHistoricSales(results) {
		let tickets = []
		let ticketsTotal = 0
		let quantityTotal = 0
		let discountTotal = 0
		let keys = Object.keys(results.sums)
		for (let i=0; i<keys.length; i++) {
			let [_, date, type] = keys[i].split(' - ')
			let [__, day, month, time] = date.split(" ")
			day = day.replace(/[^0-9 ]/g, "")
			if (date.slice(-2) === "pm") {
				time = String(parseInt(time.replace(/[^0-9 ]/g, "")) + 1200)
			}
			let sortValue = parseInt([
				String(monthStringToInt(month)).padStart(2, "0"),
				day.padStart(2, "0"),
				time.padStart(4, "0"),
				type.charCodeAt(0)
			].join(""))
			let obj = {
				sortValue: sortValue,
				date: date,
				type: type,
				sales: results.sums[keys[i]],
			}
			tickets.push(obj)
		}
		tickets.sort((a,b)=>{return a.sortValue-b.sortValue})
		let rows = []
		let dupDateCount = 1
		for (let i=tickets.length-1; i>=0; i--) {
			let salesKeys = Object.keys(tickets[i].sales)
			for (let j=0; j<salesKeys.length; j++) {
				let price = salesKeys[j] / 100.0
				let quantity = tickets[i].sales[salesKeys[j]].amount
				let discounts = tickets[i].sales[salesKeys[j]].discounts / 100.0
				let subtotal = parseInt(price)*parseInt(quantity)
				ticketsTotal = ticketsTotal + subtotal
				discountTotal = discountTotal + discounts
				quantityTotal = quantityTotal + quantity
				let total = subtotal - discounts
				let row = <tr></tr>
				if (i !== 0 && tickets[i].date === tickets[i-1].date) {
					row = <tr>
						<td>{tickets[i].type}</td>
						<td>{quantity}</td>
						<td>£{price}</td>
						<td>£{subtotal}</td>
						<td>£{discounts}</td>
						<td>£{total}</td>
					</tr>
					dupDateCount++
				} else {
					row = <tr>
						<td rowSpan={dupDateCount}>{tickets[i].date}</td>
						<td>{tickets[i].type}</td>
						<td>{quantity}</td>
						<td>£{price.toFixed(2)}</td>
						<td>£{subtotal.toFixed(2)}</td>
						<td>£{discounts.toFixed(2)}</td>
						<td>£{total.toFixed(2)}</td>
					</tr>
					dupDateCount = 1
				}

				rows.unshift(row)
			}
		}

		let grandTotal = ticketsTotal - discountTotal

		return <div>
			<h2>{results.showTitle}</h2>
			<h3>Tickets</h3>
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th>Quantity</th>
						<th>Price</th>
						<th>SubTotal</th>
						<th>Discounts</th>
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					{rows}
				</tbody>
				<tfoot>
					<tr>
						<th>Total:</th>
						<th></th>
						<th>{quantityTotal}</th>
						<th></th>
						<th>£{ticketsTotal.toFixed(2)}</th>
						<th>£{discountTotal.toFixed(2)}</th>
						<th>£{grandTotal.toFixed(2)}</th>
					</tr>
				</tfoot>
			</table>
			<h3>Tickets Totals</h3>
			<table>
				<tbody>
					<tr><th>Card</th><td>£{(results.totals.paid/100).toFixed(2)}</td></tr>
					<tr><th>Cash</th><td>£{(results.totals.cash/100).toFixed(2)}</td></tr>
					<tr><th>Refunds</th><td>£{(results.totals.actual_refunds/100).toFixed(2)}</td></tr>
					{
						results.totals.expected_refunds !== results.totals.actual_refunds ?
							<tr><th>Expected Refunds</th><td>£{(results.totals.expected_refunds/100).toFixed(2)}</td></tr>
						:
							<React.Fragment></React.Fragment>
					}
					<tr><th>Fees</th><td>£{(results.totals.fees/100).toFixed(2)}</td></tr>
					<tr><th>Total</th><td>£{(results.totals.net/100).toFixed(2)}</td></tr>
				</tbody>
			</table>

			<h3>Front of House</h3>
			<table>
				<tbody>
					<tr><th>Card Payments</th><td>£{(results.foh_totals.paid / 100).toFixed(2)}</td></tr>
					<tr><th>Card Fees</th><td>£{(results.foh_totals.fees / 100).toFixed(2)}</td></tr>
					<tr><th>Refunds</th><td>£{(results.foh_totals.refunds / 100).toFixed(2)}</td></tr>
					<tr><th>Cash</th><td>£{(results.foh_totals.cash / 100).toFixed(2)}</td></tr>
					<tr><th>Total</th><td>£{(results.foh_totals.net / 100).toFixed(2)}</td></tr>
				</tbody>
			</table>
		</div>
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<h3>{mods.length}</h3>
			<Tabs redrawInt={redrawInt}>
				<Tab title={"Performances"} redrawInt={redrawInt}>
					<h2>Performances: </h2>
					<ul>
						{performances}
					</ul>
					<h3>Total: {seats_sat}/{seats_total}</h3>
				</Tab>
				<Tab title={"Modify Bookings"} redrawInt={redrawInt}>
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
				<Tab title={"Manage Performances"} redrawInt={redrawInt}>
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
				<Tab title={"Historic Sales"} redrawInt={redrawInt}>
					<form method="POST" onSubmit={(e)=>{getHistoricSales(e)}} name={"historic_sales"}>
						<div className="loader"></div>
						<div className="form">
							<span className="msg"></span>
							<select defaultValue={""} name={"showID"}>
								<option value="" disabled>Select Show...</option>
								{show_options}
							</select>
							<input type="submit" value={"Submit"}/>
							<div className="data">
								{historicSales}
							</div>
						</div>
					</form>
				</Tab>
			</Tabs>
		</div>
	)
}