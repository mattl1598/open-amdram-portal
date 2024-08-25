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

	return (
		<div className="content">
			<h1>{content.title}</h1>
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
					{/*Form/table goes here*/}
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
			</Tabs>
		</div>
	)
}