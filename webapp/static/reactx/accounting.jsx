function Accounting({content}) {
	if (content.sub_type === "full_year_overview") {
		const [subsJson, setSubsJson] = React.useState({})
		const [ticketsJson, setTicketsJson] = React.useState([])

		let accounted = {
			total: 0,
			fees: 0,
			refunds: 0,
			net: 0
		}

		function renderTickets() {
			let tickets = []
			for (let i = 0; i < ticketsJson.length; i++) {
				accounted.total = accounted.total + ticketsJson[i].totals.total
				accounted.fees = accounted.fees + ticketsJson[i].totals.fees
				accounted.refunds = accounted.refunds + ticketsJson[i].totals.refunds
				accounted.net = accounted.net + ticketsJson[i].totals.net

				tickets.push(
					<tr>
						<td>{ticketsJson[i].title}</td>
						<td>£{ticketsJson[i].totals.total / 100.0}</td>
						<td>£{ticketsJson[i].totals.fees / 100.0}</td>
						<td>£{ticketsJson[i].totals.refunds / 100.0}</td>
						<td>£{ticketsJson[i].totals.net / 100.0}</td>
					</tr>
				)
			}
			return tickets
		}

		// GET SUBS
		React.useEffect(() => {
			const response = fetch(`/members/api/get_subs?startyear=${content.year}`)
				.then(response => response.json())
				.then(data => {
					setSubsJson({...data})
		    })
		}, [])

		// GET SHOWS
		React.useEffect(() => {
			// let shows = []
			for (let i=0; i<content.shows.length; i++) {
				const response = fetch(`/members/api/historic_sales?show_id=${content.shows[i].id}`)
				.then(response => response.json())
			    .then(data => {
				    data.title = content.shows[i].title
				    console.log(data)
				    console.log(ticketsJson)
				    setTicketsJson(a => [...a, data])
			    })
			}
		}, [])

		return (
			<div className="content">
				<h1>{content.title}</h1>
				<table className={"table"}>
					<thead>
						<tr>
							<th>Source</th>
							<th>Total</th>
							<th>Fees</th>
							<th>Refunds</th>
							<th>Net</th>
						</tr>
					</thead>
					<tbody>
						{
							subsJson.totals ?
								<tr>
									<td>Subs</td>
									<td>£{subsJson.totals.total/100.0}{[accounted.total = accounted.total + subsJson.totals.total, ""][1]}</td>
									<td>£{subsJson.totals.fees/100.0}{[accounted.fees = accounted.fees + subsJson.totals.fees, ""][1]}</td>
									<td>£{subsJson.totals.refunds/100.0}{[accounted.refunds = accounted.refunds + subsJson.totals.refunds, ""][1]}</td>
									<td>£{subsJson.totals.net/100.0}{[accounted.net = accounted.net + subsJson.totals.net, ""][1]}</td>
								</tr>
							: <React.Fragment></React.Fragment>
						}{
							ticketsJson.length ?
								renderTickets()
							: <React.Fragment></React.Fragment>
						}
						<tr>
							<td>Other (FOH)</td>
							<td>£{(content.totals.total_amounts - accounted.total)/100.0}</td>
							<td>£{(content.totals.total_fees - accounted.fees)/100.0}</td>
							<td>£{(content.totals.total_refund_amounts - accounted.refunds)/100.0}</td>
							<td>£{(content.totals.total_net - accounted.net)/100.0}</td>
						</tr>
						<tr>
							<td>Total</td>
							<td>£{content.totals.total_amounts/100.0}</td>
							<td>£{content.totals.total_fees/100.0}</td>
							<td>£{content.totals.total_refund_amounts/100.0}</td>
							<td>£{content.totals.total_net/100.0}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}


}