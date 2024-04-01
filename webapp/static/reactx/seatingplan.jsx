let initialAssignment = {"A9": 1,"A10": 0,"A8": 1}
let initialHiddenSeats = ["A6", "A7", "I1", "I12", "I6", "I7"]

const DummyOrders= {
	0: {
		name: "Chris P. Bacon",
		seats: 3,
		note: "Aisle seat for my husbands bad leg please",
		adults: 3,
		children: 0
	},
	1: {
		name: "Justin Case",
		seats: 4,
		note: "",
		adults: 3,
		children: 1
	},
	2: {
		name: "Carol Singer",
		seats: 2,
		note: "",
		adults: 2,
		children: 0
	},
}

const rootElem = document.getElementById('seating-plan')

const root = ReactDOM.createRoot(rootElem)
const layout = JSON.parse(rootElem.dataset.layout)
const initialAssignments = JSON.parse(rootElem.dataset.assignments)
root.render(<SeatingPlan defaultRowCount={layout.rowCount} showName={rootElem.dataset.showname} date={rootElem.dataset.date} initialAssignment={initialAssignments} initialHiddenSeats={layout.hiddenSeats}></SeatingPlan>)

const itemCounter = (value, index) => {
    return value.filter((x) => x == index).length
}

function SeatingPlan({defaultRowCount, initialAssignment, initialHiddenSeats, date, showName}) {
	const [rowCount, setRowCount] = React.useState(defaultRowCount)
	const [assignments, setAssignments] = React.useState(initialAssignment)
	let seatCounter = 0;
	let rows = []
	let assignedOrders = []
	let unassignedOrders = []
	const fullWidth = 12

	const [hiddenSeats, setHiddenSeats] = React.useState(initialHiddenSeats)
	const [orders, setOrders] = React.useState({})
	// const orders = {...DummyOrders}

	React.useEffect(() =>{
		getOrders()
		new TomSelect("#hiddenSeatSelect", {
			maxItems: 200,
			allowEmptyOption: true,
			hidePlaceholder: false,
			items:hiddenSeats,
			onItemAdd: function(){
				this.setTextboxValue('');
				this.refreshOptions();
			},
		})
	}, [])

	function save() {
		const response = fetch("/members/bookings/seating",{
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			headers: {
				"Content-Type": "application/json",
		    },
			body: JSON.stringify({
				layout: {rowCount: rowCount, hiddenSeats: hiddenSeats},
				assignments: assignments
			})
		}).then(() => {
			displayAlerts([{title: "Saved!", content: ""}])
		}).catch((e) => {
			displayAlerts([{title: "Something went wrong.", content: e}])
		})
	}

	function getOrders() {
		console.log(`${showName}/${date}`)
		fetch(`/members/api/orders/${showName}/${date}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				mode: "same-origin",
				cache: "no-cache",
		    },
		}).then((response) => {
			response.json().then((orders_api) => {
				let newOrders = {}
				for (let i=0; i<orders_api.length; i++) {
					console.log(i)
					let order = orders_api[i]
					console.log(order)
					newOrders[order.ref] = {
						name: order.name,
						seats: order.tickets_count,
						note: order.note,
						adults: order.tickets.Adult !== undefined ? order.tickets.Adult : 0,
						children: order.tickets.Children !== undefined ? order.tickets.Children : 0
					}
				}
				console.log(newOrders)
				setOrders({
					...newOrders
				})
			})
		})
	}

	function reportNewAssignment(seatNumber, orderID, oldSeat="") {
		let failFlag = false;
		let newAssignments = {...assignments}

		if (oldSeat !== "" || orderID === undefined) {
			delete newAssignments[oldSeat !== "" ? oldSeat : seatNumber]
		}
		if (orderID !== undefined) {
			if (oldSeat !== "" || itemCounter(Object.values(assignments), orderID) < orders[orderID].seats) {
				newAssignments[seatNumber] = orderID
			} else {
				displayAlerts([{title: "No Seats Remaining", content: "You have already assigned all the seats for this order."}])
				failFlag = true;
			}
		}

		setAssignments(
			{
				...newAssignments
			}
		)
	}

	for (let i = 0; i<rowCount; i++) {
		let rowLetter = String.fromCharCode(65 + i)
		let innerAisleSeats = (0 < i && i < rowCount-1)
		let outerAisleSeats = i < rowCount-1
		let seatsInRow = fullWidth - 2*(!innerAisleSeats*1 + !outerAisleSeats*1)
		seatCounter = seatCounter + seatsInRow

		rows.push(
			<Row
				key={rowLetter}
				rowLetter={rowLetter}
				fullWidth={fullWidth}
				hasInsideAisleSeats={innerAisleSeats}
				hasOutsideAisleSeats={outerAisleSeats}
				assignments={assignments}
				reportNewAssignmentPlan={reportNewAssignment}
				orders={orders}
				hiddenSeats={hiddenSeats}
			>
			</Row>
		)
	}

	for (let [order_id, order] of Object.entries(orders)) {
		let seats_assigned = itemCounter(Object.values(assignments), order_id)
		let newOrder = <Order key={"order"+order_id} order_id={order_id} order={order} seats_assigned={seats_assigned}></Order>
		if (seats_assigned < order.seats) {
			unassignedOrders.push(newOrder)
		} else {
			assignedOrders.push(newOrder)
		}
	}

	let seatOptions = []

	for (let row=0; row<rowCount; row++) {
		let letter = String.fromCharCode(65 + row)
		for (let seat=1; seat<=fullWidth; seat++) {
			let seatNumber = `${letter}${seat}`
			seatOptions.push(
				<option value={seatNumber}>{seatNumber}</option>
			)
		}
	}

	function handleHiddenSeatSelect(e) {
		let newHiddenSeats = e.target.tomselect.getValue(0)
		setHiddenSeats([...newHiddenSeats])
	}

	return (
		<div className={"seating-planner"}>
			<div className={"controls"}>
				<div className={"rows"}>
					<h2>Show Date: {date}</h2>
					<h2>Rows: <strong onClick={() => setRowCount(rowCount - 1)}>-</strong> {rowCount} <strong
						onClick={() => setRowCount(rowCount + 1)}>+</strong></h2>
				</div>
				{/*<input type="number" value={rowCount} onChange={(e) => setRowCount(e.target.value)}/>*/}
				<select id={"hiddenSeatSelect"} onChange={(e) => handleHiddenSeatSelect(e)} placeholder="Select seats to hide">
					{seatOptions}
				</select>
				<div>
					<h2>Assigned: {Object.keys(assignments).length}/{seatCounter}</h2>
					<a href="#" onClick={save} className={"button"}>Save</a>
				</div>
			</div>
			<div className={"seats-container"}>
				{rows}
			</div>
			<div className={"orders"}>
				<h2>New Orders:</h2>
				{unassignedOrders}
				<h2>Seated Orders:</h2>
				{assignedOrders}
			</div>
		</div>
	)
}

function Order({order_id, order, seats_assigned}) {

	function handleDragStart(e, data) {
		e.dataTransfer.setData("text/plain", `new,,${data}`);
	}
	let classname = "order"
	if (order.seats === seats_assigned) {
		classname = classname + " seated"
	}
	if (order.note) {
		classname = classname + " has_note"
	}

	return (
		<div className={classname} data-order-id={order_id} draggable={true} onDragStart={(e) => handleDragStart(e, `${order_id}`)}>
			<h2 className={"num"}><span>{order.seats - seats_assigned}</span></h2>
			<h3 className={"name"}>{order.name}</h3>
			<span className={"seats"}><span className={"bold"}></span>Adult: {order.adults}, Child: {order.children}</span>
			<span className={"note"} title={order.note}>{order.note}</span>
		</div>
	)
}

function Row({
		rowLetter, fullWidth,
		hasInsideAisleSeats = true, hasOutsideAisleSeats=true,
		assignments, reportNewAssignmentPlan, orders, hiddenSeats
}) {

	function reportNewAssignmentRow(seatNum, orderID, oldSeat) {
		reportNewAssignmentPlan(seatNum, orderID, oldSeat)
	}

	let seats = []
	let seatCount = 0
	const innerAisleSeatNums = [6,7]
	const outerAisleSeatNums = [1,12]
	for (let i = 1; i<=fullWidth; i++) {
		// let seatExists = (!(innerAisleSeatNums.includes(i))||hasInsideAisleSeats) && (!(outerAisleSeatNums.includes(i))||hasOutsideAisleSeats)
		let seatExists = !hiddenSeats.includes(`${rowLetter}${i}`)
		if (seatExists) {seatCount++}
		seats.push(
			<Seat
				key={`${rowLetter}${i}`}
				rowLetter={rowLetter}
				seatNumber={i}
				exists={seatExists}
				order_id={assignments[`${rowLetter}${i}`]}
				assignments={assignments}
				reportNewAssignmentRow={reportNewAssignmentRow}
				orders={orders}
			></Seat>
		)

		if (i === fullWidth/2) {
			for (let i=0; i<2; i++) {
				seats.push(
					<Seat
						key={`${rowLetter}aisle${i}`}
						rowLetter={rowLetter}
						seatNumber={"aisle"}
						exists={false}
					></Seat>
				)
			}
		}
	}

	function handleDragOver(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	return (
		<div className={"row"} style={{gridTemplateColumns: `repeat(${fullWidth + 2}, 1fr)`}} onDragOver={(e) => handleDragOver(e)}>
			{ seats }
		</div>
	)
}

function Seat({rowLetter, seatNumber, exists=true, order_id, assignments, reportNewAssignmentRow, orders}) {

	function handleDragStart(e) {
		e.dataTransfer.setData("text/plain", `move,${rowLetter}${seatNumber},${order_id}`)
	}

	// function handleDragEnd() {
	// 	handleRemove()
	// }

	function handleDrop(e) {
		let [type, arg, order_num] = e.dataTransfer.getData("text/plain").split(',')
		if (type === "move") {
			reportNewAssignmentRow(`${rowLetter}${seatNumber}`, order_num, arg)
		} else {
			reportNewAssignmentRow(`${rowLetter}${seatNumber}`, order_num)
		}
	}

	function handleRemove() {
		reportNewAssignmentRow(`${rowLetter}${seatNumber}`, undefined)
	}

	function handleDragOver(e) {
		e.stopPropagation();
		e.preventDefault();
	}
	let joins = ""
	if (seatNumber !== "aisle"){
		if (parseInt(assignments[`${rowLetter}${parseInt(seatNumber, 10)-1}`], 10) === parseInt(order_id,10)) {
			joins = joins + " join-left"
		}
		if (parseInt(assignments[`${rowLetter}${parseInt(seatNumber, 10)+1}`], 10) === parseInt(order_id,10)) {
			joins = joins + " join-right"
		}
	}


	if (exists) {
		// seats++
		return (
			<div draggable
			     onDragStart={(e) => handleDragStart(e)}
			     className={order_id !== undefined ? `seat assigned ${joins}` : "seat"}
			     onDrop={(e) => handleDrop(e)}
			     onDragOver={(e) => handleDragOver(e)}
			>
				<span className={"seatNum"}>{rowLetter}{seatNumber}</span>
				<span className={"name"}>{order_id !== undefined ? orders[order_id].name : null}</span>
				<span className={"remove"} onClick={handleRemove}>×</span>
				<span className={"bg"}></span>
			</div>
		)
	} else {
		return (
			<div className={`seat nonexistent ${seatNumber}`}></div>
		)
	}
}