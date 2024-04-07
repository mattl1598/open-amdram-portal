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
root.render(<SeatingPlan defaultRowCount={layout.rowCount} showName={rootElem.dataset.showname} authors={rootElem.dataset.authors} date={rootElem.dataset.date} initialAssignment={initialAssignments} initialHiddenSeats={layout.hiddenSeats}></SeatingPlan>)

const itemCounter = (value, index) => {
    return value.filter((x) => x == index).length
}

function int(str) {
	if (str === undefined) {
		return undefined
	}
	return parseInt(str, 10)
}

function SeatingPlan({defaultRowCount, initialAssignment, initialHiddenSeats, date, showName, authors}) {
	const [rowCount, setRowCount] = React.useState(defaultRowCount)
	const [assignments, setAssignments] = React.useState(initialAssignment)
	const [previewAssignments, setPreviewAssignments] = React.useState({})
	let rows = []
	let assignedOrders = []
	let unassignedOrders = []
	const fullWidth = 12

	const [hiddenSeats, setHiddenSeats] = React.useState(initialHiddenSeats)
	const [orders, setOrders] = React.useState({})
	const [soldSeatCount, setSoldSeatCount] = React.useState(0)
	const [dragResize, setDragResize] = React.useState("")
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

	function fourColour() {
		let highestColourNum = 0
		let colourMap = {}

		let reverseAssignments = {}
		for (let i=0; i<rowCount; i++) {
			for (let j=1; j<=fullWidth; j++) {
				let seat = `${String.fromCharCode(65 + i)}${j}`
				let order_id = int(assignments[seat])
				if (order_id !== undefined) {
					if (reverseAssignments[order_id] === undefined) {
						reverseAssignments[order_id] = [seat]
					} else {
						reverseAssignments[order_id].push(seat)
					}
				}
			}
		}

		for (let i=0; i<Object.keys(reverseAssignments).length; i++) {
			let neighbourOrders = []
			let targetOrderID = int(Object.keys(reverseAssignments)[i])
			for (let j=0; j<reverseAssignments[targetOrderID].length; j++) {
				let seats = reverseAssignments[targetOrderID]
				let letterVal = seats[j].charCodeAt(0)
				let number = int(seats[j].substring(1))

				if (letterVal > 65) {
					//up
					let tempSeat = `${String.fromCharCode(letterVal-1)}${number}`
					let temp = int(assignments[tempSeat])
					if (![targetOrderID, undefined].includes(temp)) {
						neighbourOrders.push(temp)
					}
				}
				if (number > 1) {
					//left
					let tempSeat = `${String.fromCharCode(letterVal)}${number-1}`
					let temp = int(assignments[tempSeat])
					if (![targetOrderID, undefined].includes(temp)) {
						neighbourOrders.push(temp)
					}
				}
				if (letterVal < 65 + rowCount - 1) {
					// down
					let tempSeat = `${String.fromCharCode(letterVal+1)}${number}`
					let temp = int(assignments[tempSeat])
					if (![targetOrderID, undefined].includes(temp)) {
						neighbourOrders.push(temp)
					}
				}
				if (number < fullWidth) {
					// right
					let tempSeat = `${String.fromCharCode(letterVal)}${number+1}`
					let temp = int(assignments[tempSeat])
					if (![targetOrderID, undefined].includes(temp)) {
						neighbourOrders.push(temp)
					}
				}
			}
			let neighbourColourIDs = []
			for (let x = 0; x < neighbourOrders.length; x++) {
				neighbourColourIDs.push(colourMap[neighbourOrders[x]])
			}
			let existingNonNeighbourColours = Object.values(colourMap).filter((x) => !neighbourColourIDs.includes(x))
			let newColour = existingNonNeighbourColours.toSorted()[0]
			// console.log(orders[target_order_id].name, target_order_id, left_order_id, newColour)
			colourMap[targetOrderID] = newColour !== undefined ? newColour : highestColourNum++
		}

		// console.log("map", colourMap)
		let colourIDs = [...new Set(Object.values(colourMap))]
		// console.log("ids", colourIDs)
		let colours = {}
		for (let i = 0; i<colourIDs.length; i++) {
			colours[colourIDs[i]] = `${360*i/colourIDs.length}`
		}
		return [colours, colourMap, reverseAssignments]
	}

	const [colours, colourMap, reverseAssignments] = fourColour()

	function save() {
		let newSeats = 0;
		for (let i=0; i<unassignedOrders.length; i++) {
			newSeats += unassignedOrders[i].props.order.seats - itemCounter(Object.values(assignments), unassignedOrders[i].order_id)
		}
		const response = fetch(window.location.pathname,{
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			headers: {
				"Content-Type": "application/json",
		    },
			body: JSON.stringify({
				layout: {rowCount: rowCount, hiddenSeats: hiddenSeats, newSeats: newSeats},
				assignments: assignments
			})
		}).then(() => {
			displayAlerts([{title: "Saved!", content: ""}])
			return false
		}).catch((e) => {
			displayAlerts([{title: "Something went wrong.", content: e}])
			return false
		})
	}

	function getOrders() {
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
				let seats = 0
				for (let i=0; i<orders_api.length; i++) {
					let order = orders_api[i]
					seats = seats + order.tickets_count
					newOrders[order.ref] = {
						name: order.name,
						seats: order.tickets_count,
						note: order.note,
						adults: order.tickets.Adult !== undefined ? order.tickets.Adult : 0,
						children: order.tickets.Children !== undefined ? order.tickets.Children : 0
					}
				}
				setOrders({
					...newOrders
				})
				setSoldSeatCount(seats)
			})
		})
	}

	function reportNewAssignment(seatNumber, orderID, oldSeat="") {
		let failFlag = false;
		let newAssignments = {...assignments}

		if (typeof(seatNumber) === typeof([]) && typeof(orderID) === typeof([])) {
			for (let i=0; i<seatNumber.length; i++) {
				if (orderID[i] === "" || orderID[i] === undefined) {
					delete newAssignments[seatNumber[i]]
				} else {
					newAssignments[seatNumber[i]] = orderID[i]
				}
			}
		} else if (typeof(seatNumber) === typeof([])) {
			let alreadyAssignedCount = itemCounter(Object.values(assignments), orderID)
			for (let i=0; i<seatNumber.length; i++) {
				if (orderID === undefined || alreadyAssignedCount + i < orders[orderID].seats) {
					newAssignments[seatNumber[i]] = orderID
				} else {
					displayAlerts([{title: "No Seats Remaining", content: "You have already assigned all the seats for this order."}])
					failFlag = true;
				}
			}
		} else {
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
				previewAssignments={previewAssignments}
				setPreviewAssignments={setPreviewAssignments}
				dragResize={dragResize}
				setDragResize={setDragResize}
				colours={colours}
				colourMap={colourMap}
			>
			</Row>
		)
	}

	let tickets = []

	for (let [order_id, order] of Object.entries(orders)) {
		let seats_assigned = itemCounter(Object.values(assignments), order_id)
		let newOrder = <Order key={"order"+order_id} order_id={order_id} order={order} seats_assigned={seats_assigned}></Order>
		let seats = reverseAssignments[order_id] !== undefined ? reverseAssignments[order_id]: []
		let newTicket = <Ticket
			groupName={siteName} showDate={date}
			showName={showName} authors={authors}
			name={order.name} seats={seats}
		></Ticket>
		tickets.push(newTicket)
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
					<h2>Assigned: {Object.values(assignments).filter(Boolean).length}/{fullWidth*rowCount - hiddenSeats.length}</h2>
					<a href="#" onClick={save} className={"button"}>Save</a>
				</div>
			</div>
			<div className={"seats-container"}>
				{rows}
			</div>
			<div className={"orders"}>
				<h2 className={"order-summary"}>Orders: {unassignedOrders.length+assignedOrders.length} - Seats: {soldSeatCount}</h2>
				<h2>New Orders:</h2>
				{unassignedOrders}
				<h2>Seated Orders:</h2>
				{assignedOrders}
			</div>

			<div className={"tickets"}>
				{tickets}
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
		assignments, reportNewAssignmentPlan, orders, hiddenSeats,
		previewAssignments, setPreviewAssignments, dragResize, setDragResize,
		colours, colourMap
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
				fullWidth={fullWidth}
				order_id={assignments[`${rowLetter}${i}`]}
				assignments={assignments}
				reportNewAssignmentRow={reportNewAssignmentRow}
				orders={orders}
				previewAssignments={previewAssignments}
				setPreviewAssignments={setPreviewAssignments}
				dragResize={dragResize}
				setDragResize={setDragResize}
				colours={colours}
				colourMap={colourMap}
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

function Seat({
				rowLetter, seatNumber,
				exists=true, fullWidth,
				order_id, orders,
				assignments, reportNewAssignmentRow,
				previewAssignments, setPreviewAssignments,
				dragResize, setDragResize,
				colours, colourMap
}) {
	function handleDragStart(e) {
		if (e.target.className.includes("resize")) {
			e.dataTransfer.setData("text/plain", `resize,${e.target.dataset.direction},${order_id}`)
			setDragResize(`${e.target.dataset.direction},${order_id}`);
		} else {
			e.dataTransfer.setData("text/plain", `move,${rowLetter}${seatNumber},${order_id}`)
		}
	}

	function handleDrop(e) {
		let [type, arg, order_num] = e.dataTransfer.getData("text/plain").split(',')
		if (type === "move") {
			reportNewAssignmentRow(`${rowLetter}${seatNumber}`, order_num, arg)
		} else if (type !== "resize") {
			reportNewAssignmentRow(`${rowLetter}${seatNumber}`, order_num)
		}
	}

	function handleRemove(e) {
		if (!e.shiftKey) {
			reportNewAssignmentRow(`${rowLetter}${seatNumber}`, undefined)
		} else {
			let seatGroup = []
			for (let i = 1; i <=fullWidth; i++) {
				if (parseInt(assignments[`${rowLetter}${i}`],10) === order_id) {
					seatGroup.push(`${rowLetter}${i}`)
				} else if (i < seatNumber) {
					seatGroup = [`${rowLetter}${seatNumber}`]
				} else {
					break
				}
			}
			reportNewAssignmentRow(seatGroup, undefined)
		}
	}

	function handleDragOver(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	function handleDragEnter(e) {
		if (e.target.nodeName === "DIV" && dragResize !== "" && e.pageX !== 0) {
			let [dir, order_num] = dragResize.split(',')
			let seatString = `${rowLetter}${seatNumber}`
			let previewCopy = {...previewAssignments}
			if (e.target.dataset.order_id === order_num) {
				previewCopy[seatString] = ""
			} else {
				previewCopy[seatString] = parseInt(order_num, 10)
			}
			setPreviewAssignments(previewCopy)
		}
	}
	// todo: change to by mouse position for improved reliability
	function handleDragLeave(e) {
		if (e.relatedTarget !== null && e.target.nodeName === "DIV" && e.relatedTarget.className.includes("resize") && dragResize !== "") {
			let [dir, order_num] = dragResize.split(',')
			let sameDir = e.relatedTarget.className.includes(dir)
			if (!sameDir) {
				let seatString = `${rowLetter}${seatNumber}`
				let previewCopy = {...previewAssignments}
				if (e.target.dataset.order_id === order_num) {
					previewCopy[seatString] = ""
				} else {
					delete previewCopy[seatString]
				}
				setPreviewAssignments(previewCopy)
			}
		}
	}

	function handleDragEnd(e) {
		if (dragResize !== "") {
			let [dir, order_num] = dragResize.split(',')
			// reportNewAssignmentRow(Object.keys(previewAssignments), order_num)
			reportNewAssignmentRow(Object.keys(previewAssignments), Object.values(previewAssignments))
		}
		setPreviewAssignments({})
		setDragResize("");
	}

	let joins = ""

	if (exists) {
		let name
		if (order_id !== undefined) {
			name = orders[order_id] !== undefined ? orders[order_id].name : <div className={"loader"}></div>
		} else {
			name = ""
		}

		let previewName = undefined
		if (previewAssignments[`${rowLetter}${seatNumber}`] === "") {
			previewName = ""
		} else if (previewAssignments[`${rowLetter}${seatNumber}`] !== undefined) {
			previewName = orders[previewAssignments[`${rowLetter}${seatNumber}`]].name
		}
		name = previewName !== undefined ? previewName : name

		let style = {}
		if (colours[colourMap[parseInt(order_id,10)]] !== undefined) {
			let hue = colours[colourMap[parseInt(order_id,10)]]
			style={backgroundColor: `hsl(${hue}deg 100% 65% / 40%)`}
		}

		if (parseInt(assignments[`${rowLetter}${parseInt(seatNumber, 10)-1}`], 10) === parseInt(order_id,10)) {
			joins = joins + " join-left"
			if (colours[colourMap[parseInt(order_id,10)]] !== undefined) {
				let hue = colours[colourMap[parseInt(order_id,10)]]
				style.boxShadow = `hsl(${hue}deg 100% 65% / 40%) calc(-.5rem + -3px) 0`
			}
		}
		if (parseInt(assignments[`${rowLetter}${parseInt(seatNumber, 10)+1}`], 10) === parseInt(order_id,10)) {
			joins = joins + " join-right"
		}



		return (
			<div draggable={order_id !== undefined}
			     onDragStart={(e) => handleDragStart(e)}
			     className={order_id !== undefined ? `seat assigned ${joins}` : "seat"}
			     onDrop={(e) => handleDrop(e)}
			     onDragOver={(e) => handleDragOver(e)}
			     onDragEnter={(e) => handleDragEnter(e)}
			     onDragLeave={(e) => handleDragLeave(e)}
			     onDragEnd={(e) => handleDragEnd(e)}
			     data-order_id={order_id}
			>
				<span className={"resize left"} data-direction="left" draggable={order_id !== undefined} onDragStart={(e) => handleDragStart(e)}></span>
				<span className={"seatNum"} style={style}>{rowLetter}{seatNumber}</span>
				<span className={"name"} >{name}</span>
				<span className={"remove"} onClick={(e)=>handleRemove(e)}>×</span>
				<span className={"resize right"} data-direction="right" draggable={order_id !== undefined}></span>
			</div>
		)
	} else {
		return (
			<div className={`seat nonexistent ${seatNumber}`}></div>
		)
	}
}

function Ticket({groupName, showName, authors, showDate, name, seats}) {
	console.log("seats: ", seats)
	console.log("seats type: ", typeof(seats))
	let shortSeats = []
	let temp = ""

	for (let i=0; i<seats.length; i++) {
		if (temp === "") {
			temp = seats[i]
		}
		let row = seats[i][0]
		let seat = int(seats[i].substring(1))
		let next_seat = `${row}${seat+1}`
		if (i < seats.length-1) {
			if (next_seat !== seats[i+1]) {
				if (temp !== seats[i]) {
					shortSeats.push(`${temp}-${seats[i]}`)
				} else {
					shortSeats.push(temp)
				}
				temp = ""
			}
		} else {
			if (temp !== seats[i]) {
				if (temp !== seats[i]) {
					shortSeats.push(`${temp}-${seats[i]}`)
				} else {
					shortSeats.push(temp)
				}
				temp = ""
			}
		}
	}

	return (
		<div className={"ticket"}>
			<div className={"logo"}><Icon icon={"siteLogo"}></Icon></div>
			<div className={"group-presents"}>{groupName} presents</div>
			<div className={"show"}><h1>{showName}</h1></div>
			<div className={"authors"}>by {authors}</div>
			<div className={"date"}><h3>{showDate}</h3></div>
			<div className={"name"}>Name: <span className={"bold"}>{name}</span></div>
			<div className={"seats"}>Seats ({seats.length}): <span className={"bold"}>{shortSeats.join(" ")}</span></div>
		</div>
	)
}