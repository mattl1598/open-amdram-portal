function SidebarCart({}) {
	const context = React.useContext(app)
	const [tickets, setTickets] = React.useState({})

	const [localCart, setLocalCart] = React.useState({})

	React.useEffect(() => {
		fetch("/tickets/stock", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(response => {
			return response.json()
		}).then(data => {
			setTickets(data.performances)
		})
	}, [])

	React.useEffect(()=>{
		setLocalCart(context.ticketsCart)
	}, [context.ticketsCart])

	let ticketsIDs = Object.keys(tickets).sort((a, b) => tickets[a].date > tickets[b].date ? 1 : -1)

	let pricing = {
		Adult: 1200,
		Child: 1000
	}
	let cartItems = []
	let total = 0
	let tempCart = Object.values(context.ticketsCart)
	if (ticketsIDs.length) {
		for (let i=0; i < tempCart.length; i++) {
			let item = tempCart[i]
			if (item.type === "tickets") {
				let tempTickets = []
				let count = 0
				for (const [key, value] of Object.entries(item.tickets)) {
					let type = key
					if (value > 1 && key === "Child") {
						type = "Children"
					} else if (value > 1) {
						type = `${key}s`
					}
					if (value) {
						tempTickets.push(
							<span>{type}: {value}</span>
						)
					}
					total += pricing[key] * value
					count += int(value)
				}
				if (count) {
					cartItems.push(
						<div key={`cartItem${i}`} className="cartItem" style={{'--i': ticketsIDs.indexOf(item.id), '--count': ticketsIDs.length}}>
							<TicketImage
								image={tickets[item.id].image}
								date={tickets[item.id].date}
								hue={(ticketsIDs.indexOf(item.id) * 360) / (ticketsIDs.length + 1)}
								count={count}
							></TicketImage>
							<React.Fragment>
								{/*<div className="ticketImage">*/}
								{/*	<img src={tickets[item.id].image} alt=""/>*/}
								{/*	<div className="image_cover">*/}
								{/*		<div className="upperTwoThirds">*/}
								{/*			<svg viewBox={"0 0 100 100"} preserveAspectRatio={"xMidYMid slice"}>*/}
								{/*				<circle cx={"12.5%"} cy={"12.5%"} r={"10%"}></circle>*/}
								{/*				<circle className={"colour"} cx={"12.5%"} cy={"12.5%"} r={"10%"}></circle>*/}
								{/*				<text className={"count"}*/}
								{/*				      x={"12.5%"} y={"12.5%"} fontSize={"80%"}*/}
								{/*				      fontWeight={"bold"} dominantBaseline={"central"}*/}
								{/*				      textAnchor={"middle"}*/}
								{/*				>{count}</text>*/}
								{/*			</svg>*/}
								{/*		</div>*/}
								{/*		<div className={"lowerThirdBG"}></div>*/}
								{/*		<div className="lowerThirdContent">*/}
								{/*			<svg viewBox={"0 0 100 100"} preserveAspectRatio={"xMidYMid slice"}>*/}
								{/*				<text className={"date"}*/}
								{/*					x={"2.5%"} y={"50.5%"} fontSize={"60%"}*/}
								{/*					lengthAdjust={"spacingAndGlyphs"} textLength={"95%"}*/}
								{/*					fontWeight={"bold"} dominantBaseline={"middle"}*/}
								{/*				>{datetimeFormatter(tickets[item.id].date)}</text>*/}
								{/*			</svg>*/}
								{/*			/!*<h2>{datetimeFormatter(tickets[item.id].date)}</h2>*!/*/}
								{/*		</div>*/}
								{/*	</div>*/}
								{/*</div>*/}
							</React.Fragment>
							<h3 className="title">{tickets[item.id].title}</h3>
							<h3 className="date">{datetimeFormatter(tickets[item.id].date)}</h3>
							<h4 className="tickets">
								{tempTickets}
							</h4>
						</div>
					)
				}
			}
		}
	}

	if (cartItems.length) {
		return (
			<div className="sidebarCart">
				<h2 className={"title"}>Shopping Cart</h2>
				<div className="cart">
					{cartItems}
				</div>
				<Link href={"/tickets/checkout"}><h3 className={"checkout button"}>Checkout</h3></Link>
				<h3 className={"total button"}>Total: £{(total/100).toFixed(2)}</h3>
			</div>
		)
	} else {
		return (
			<React.Fragment></React.Fragment>
		)
	}
}

function datetimeFormatter(date) {
	const datetime = new Date(date)
	const day = ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"][datetime.getDay()]
	const ord = n => n>3&&n<21?"th":n%10==1?"st":n%10==2?"nd":n%10==3?"rd":"th"
	const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][datetime.getMonth()]
	const ampm = datetime.getHours() >= 12 ? "pm" : "am"

	return `${day} ${datetime.getDate()}${ord(datetime.getDate())} ${month} - ${datetime.getHours()%12}:${datetime.getMinutes()}${ampm}`
}

function TicketItem({id, title, pricing, image, date, i, count, setActive, isActive = false, tickets}) {
	const [classString, setClassString] = React.useState("")
	const context = React.useContext(app)

	const selfRef = React.useRef(null)

	let layout = tickets[id].layout
	const maxSeats = layout.fullWidth * layout.rowCount - layout.hiddenSeats.length - Object.keys(tickets[id].seat_assignments).length - layout.newSeats

	const [quantities, setQuantities] = React.useState({
		Adult: 0,
		Child: 0,
	})

	// Calculate how many seats are already in the cart for this performance
	function seatsInCart() {
		const cartEntry = context.ticketsCart[id]
		if (!cartEntry) return 0
		return Object.values(cartEntry.tickets).reduce((acc, cur) => acc + int(cur), 0)
	}

	// Remaining seats available (max minus what's already in cart)
	function remainingSeats() {
		return maxSeats - seatsInCart()
	}

	function addToCart() {
		const formCount = Object.values(quantities).reduce((acc, cur) => acc + int(cur), 0)
		if (formCount === 0) return
		if (formCount > remainingSeats()) return

		setClassString("progress")
		setTimeout(()=>{
			setClassString("progress added")
			let tempCart = {...context.ticketsCart}
			if (Object.keys(tempCart).includes(id)) {
				for (const [key, value] of Object.entries(quantities)) {
					tempCart[id].tickets[key] = int(value) + int(tempCart[id].tickets[key])
				}
			} else {
				tempCart[id] = {
					id: id,
					type: "tickets",
					tickets: {
						...quantities
					}
				}
			}
			context.functions.setTicketsCart(tempCart)
			for (const key of Object.keys(quantities)) {
				quantities[key] = 0
			}
		}, 1000)
		setTimeout(()=>{
			reset()
		}, 3000)
	}

	function reset() {
		setClassString("")
	}

	function quanChange(type, value) {
		const newValue = int(value)
		const otherTotal = Object.entries(quantities)
			.filter(([key]) => key !== type)
			.reduce((acc, [, val]) => acc + int(val), 0)
		const clampedValue = Math.max(0, Math.min(newValue, remainingSeats() - otherTotal))
		setQuantities({...quantities, [type]: clampedValue})
	}

	function TicketQuantity({type}) {
		function change(change) {
			const newValue = int(quantities[type]) + change;
			const otherTotal = Object.entries(quantities)
				.filter(([key]) => key !== type)
				.reduce((acc, [, val]) => acc + int(val), 0)
			const clampedValue = Math.max(0, Math.min(newValue, remainingSeats() - otherTotal));
			quanChange(type, clampedValue)
		}

		return (
			<div key={type} className={`quantityForm ${type}`}>
				<label htmlFor={type}>
					<div className="type">{type}: </div>
					<div className="price">£{(pricing[type]/100).toFixed(2)}</div>
				</label>
				<Input id={type} type="number" defaultValue={quantities[type]} value={quantities[type]} onChange={(e) => quanChange(type, e.target.value)} stateful={true}/>
				<div className="step">
					<Icon onClick={()=>{change(+1)}}>stat_1</Icon>
					<Icon onClick={()=>{change(-1)}}>stat_minus_1</Icon>
				</div>
			</div>
		)
	}

	let formCount = Object.values(quantities).reduce((acc, cur) => acc + cur, 0)

	function makeActive() {
		if (!isActive) {
			setActive(id)
		}
	}
	function makeInActive() {
		setActive("")
	}

	if (selfRef.current && isActive) {
		selfRef.current.scrollIntoView({behavior: "smooth", block: "start"})
	}

	return (
		<div ref={selfRef} className={`ticketItem ${isActive ? "active": ""}`} style={{'--i': i, '--count': count}} onClick={makeActive}>
			<img src={image} alt={title}></img>
			<div className="image_cover">
				<div className={"lowerThirdBG"}></div>
				<div className="lowerThirdContent">
					<svg viewBox={"0 0 100 100"} preserveAspectRatio={"xMidYMid slice"}>
						<text
							x={"2.5%"} y={"50.5%"} fontSize={"60%"}
							lengthAdjust={"spacingAndGlyphs"} textLength={"95%"}
							fontWeight={"bold"} dominantBaseline={"middle"}
						>{datetimeFormatter(date)}</text>
					</svg>
				</div>
			</div>

			<h2 className={"title"}>{title}{isActive ? ` - ${datetimeFormatter(date)}` : "" }</h2>
			<h3 className={"date"}>{datetimeFormatter(date)}</h3>
			<p className={"price"}>Adult: £12, Child: £10</p>
			<div className="form">
				<div className="desc">
					Some description text or any extra information that might be desired. <br/>
					Leave any seating requests in the box at checkout.
					{/*This performance is at the Calleva Arms, over the road from our usual venue of Silchester Village Hall. <br/>*/}
					{/*Seating is first-come first-serve, no reservations. <br/>*/}
					{/*In 1941, the German physicist Werner Heisenberg made a strange trip to Copenhagen to see his Danish counterpart, Niels Bohr. They were old friends that had revolutionised atomic physics in the 1920s with their work on quantum mechanics and the uncertainty principle. But now the world had changed, and the two men were on opposite sides in a world war. The meeting was fraught with danger and embarrassment, and ended in disaster. In this play Heisenberg meets Bohr and his wife Margrethe once again, to look for answers about what happened, and to work out how we can ever know why we do the things we do.*/}
				</div>
				<div className="quantities">
					{
						Object.keys(quantities).map((type) => TicketQuantity({type}))
					}
				</div>
				<div className="buttons">
					<div className={`button addToCart ${classString} ${formCount === 0 || formCount > remainingSeats() ? "disabled" : ""}`} onClick={addToCart}>
						<h3 className={"callToAction"}>{ remainingSeats() ? `Add to Cart${formCount ? ` - ${formCount}` : ""}` : "No Seats Available" }</h3>
						<Icon className={"progressWheel"}>progress_activity</Icon>
						<div className="successState">
							<Icon className={"check"}>check</Icon>
						</div>
					</div>
					<div className="button close" onClick={makeInActive}>
						<Icon>close</Icon>
					</div>
				</div>
			</div>
		</div>
	)
}

function TicketStore({ticketsActive}) {
	const context = React.useContext(app)
	// ticketsActive = context.siteJson.tickets_active === "1"
	ticketsActive = true

	const [tickets, setTickets] = React.useState({})
	const [activeTicket, setActiveTicket] = React.useState("")

	React.useEffect(() => {
		fetch("/tickets/stock", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(response => {
			return response.json()
		}).then(data => {
			setTickets(data.performances)
		})
	}, [])

	let ticketsIDs = Object.keys(tickets).sort((a, b) => tickets[a].date > tickets[b].date ? 1 : -1)

	return (
		<div className="content">
			<div className="store">
				<div className="title">
					<h1 className={"titleText"}>Store</h1>
					{
						countTickets(context.ticketsCart) ?
							<h2 className={"cart"}><Link href="/tickets/checkout"><span>Cart</span><Icon>shopping_cart</Icon></Link></h2>
						:
							<React.Fragment></React.Fragment>
					}
				</div>
				{
					ticketsActive ?
					<div className="tickets">
						{ticketsIDs.map((ticket, i) => {
							return <TicketItem key={i} i={i} count={ticketsIDs.length} isActive={ticket === activeTicket} setActive={setActiveTicket} {...tickets[ticket]} tickets={tickets}></TicketItem>
						})}
					</div> : <React.Fragment></React.Fragment>
				}
			</div>
		</div>
	)
}

function TicketImage({image, perfID, date, hue, count=0}) {
	const canvasRef = React.useRef(null)
	React.useEffect(() => {
		if (canvasRef.current) {
			let img = document.createElement("img")
			img.src = image
			img.onload = () => {
				// console.log(img)
				let ctx = canvasRef.current.getContext("2d")
				ctx.drawImage(img, 0, 0, 700, 700)

				ctx.fillStyle = "black"
				ctx.fillRect(0, 600, 700, 700)
				ctx.fillStyle = `hsla(${hue}, 100%, 70%, 50%)`
				ctx.fillRect(0, 600, 700, 700)

				ctx.fillStyle = "white"
				ctx.font = "bold 68px Roboto"
				ctx.textAlign = "center"
				ctx.textBaseline = "middle"
				ctx.fillText(datetimeFormatter(date), 350, 658, 680)

				if (count > 0) {
					ctx.fillStyle = `black`
					ctx.beginPath()
					ctx.arc(75, 75, 50, 0, 2 * Math.PI)
					ctx.fill()
					ctx.fillStyle = `hsla(${hue}, 100%, 70.2%, 50%)`
					ctx.beginPath()
					ctx.arc(75, 75, 50, 0, 2 * Math.PI)
					ctx.fill()

					ctx.fillStyle = "white"
					ctx.font = "bold 80px Roboto"
					ctx.textAlign = "center"
					ctx.textBaseline = "middle"
					ctx.fillText(count, 75, 82.5)

					// 813735 82100a
				}
			}
		}
	}, [canvasRef])

	return (
		<div className="ticketImage">
			<canvas ref={canvasRef} perfID={perfID} width="700" height="700"></canvas>
		</div>
	)
}

function countTickets(cart) {
	let count = 0
	for (const ticket of Object.values(cart)) {
		for (const [type, quantity] of Object.entries(ticket.tickets)) {
			if (type !== "Programmes") {
				count += quantity
			}
		}
	}
	return count
}

function Checkout({ticketsCart}) {
	const context = React.useContext(app)
	const [tickets, setTickets] = React.useState({})
	const [localCart, setLocalCart] = React.useState({})

	let ticketsIDs = Object.keys(tickets).sort((a, b) => tickets[a].date > tickets[b].date ? 1 : -1)
	let images = {}

	React.useEffect(() => {
		fetch("/tickets/stock", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(response => {
			return response.json()
		}).then(data => {
			setTickets(data.performances)
		})
	}, [])

	function increment(e, perfID, type, amount) {
		e.preventDefault()
		let tempCart = {...localCart}
		let layout = tickets[perfID].layout
		let maxSeats = layout.fullWidth * layout.rowCount - layout.hiddenSeats.length - Object.keys(tickets[perfID].seat_assignments).length - layout.newSeats
		if (tempCart[perfID].tickets[type] < maxSeats) {
			tempCart[perfID].tickets[type] += amount
		} else {
			alert("No more seats available for this show")
		}
		context.functions.setTicketsCart(tempCart)
	}

	function remove(e, perfID, type) {
		e.preventDefault()
		let tempCart = {...localCart}
		if (tempCart[perfID].tickets[type] > 0) {
			tempCart[perfID].tickets[type] = 0
		}
		context.functions.setTicketsCart(tempCart)
	}

	React.useEffect(()=>{
		setLocalCart(context.ticketsCart)
	}, [context.ticketsCart])

	let total = 0
	let totalQuantity = 0
	let checkoutCart = []
	if (Object.keys(tickets).length !== 0) {
		for (const ticket of Object.keys(localCart)) {
			let performance = tickets[localCart[ticket].id]
			let date = new Date(performance.date)
			let subtotal = 0
			for (const [type, quantity] of Object.entries(localCart[ticket].tickets)) {
				subtotal = quantity*performance.pricing[type]
				total += subtotal
				totalQuantity += quantity
				if (quantity > 0) {
					checkoutCart.push(
						<div className={"checkoutRow"}>
							<TicketImage image={performance.image} perfID={performance.id} date={performance.date} hue={ticketsIDs.indexOf(performance.id)/ticketsIDs.length}></TicketImage>
							<div className={"checkoutRowText"}><span className={"title"}>{performance.title}</span><span>{datetimeFormatter(date)}</span><span>{type}</span></div>
							<div className={"quantity"}>x{quantity}</div>
							<div className={"subtotal"}>£{(subtotal/100).toFixed(2)}</div>
							<div className={"edit"}>
								<a href="" onClick={(e)=>{increment(e, performance.id, type, 1)}}>+1</a>
								<a href="" onClick={(e)=>{increment(e, performance.id, type, -1)}}>-1</a>
								<a href="" onClick={(e)=>{remove(e, performance.id, type)}}>Remove All</a>
							</div>
						</div>
					)
				}
			}
		}
	}

	if (checkoutCart.length === 0 && countTickets(context.ticketsCart) === 0) {
		context.functions.setPath("/tickets")
	}

	if (Object.keys(tickets).length !== 0) {
		return (
			<div className="content">
				<div className="checkout">
					<h1>Checkout</h1>
					<div id={"checkoutCart"} className="cart">
						{checkoutCart}
						<div className="checkoutRow total">
							<div className="checkoutRowText total">Total:</div>
							<div className="quantity total">x{totalQuantity}</div>
							<div className="subtotal">£{(total/100).toFixed(2)}</div>
						</div>
					</div>
					<StorePayment amount={total} cart={localCart}></StorePayment>
				</div>
			</div>
		)
	} else {
		return (<div className={"loading"}></div>)
	}
}

function StorePayment({amount = 0, cart}) {
	const context = React.useContext(app)
	const appId = context.siteJson.square.appId
	const locationId = context.siteJson.square.webstoreLocationId
	const payments = window.Square.payments(appId, locationId)
	const cardContainerRef = React.createRef(null)
	const [statusStyle, setStatusStyle] = React.useState({})
	const [statusClassName, setStatusClassName] = React.useState("")
	const [card, setCard] = React.useState(undefined)
	const pendingRef = React.createRef(null)
	const statusContainer = React.createRef(null)
	const verfTokenRef = React.useRef(null)
	const cardNonceRef = React.useRef(null)
	const cardJsonRef = React.useRef(null)
	const [msg, setMsg] = React.useState("")

	React.useEffect(() => {
		payments.card().then((c) => {
			c.attach(cardContainerRef.current)
			setCard(c)
		})
	}, [])
	//
	// if (document.querySelector("#checkoutCart")) {
	// 	document.querySelector("#checkoutCart").querySelectorAll("canvas").forEach((canvas) => {
	// 		console.log(canvas.getAttribute("perfID"))
	// 	})
	// }

	function handlePaymentButtonClick(e) {
		function onSuccess() {
			console.log("ON SUCCESS INNER")
			pendingRef.current.classList.remove("pending")
			console.log("ON SUCCESS INNER2")
			pendingRef.current.requestSubmit()
		}

		function onError() {
			pendingRef.current.classList.remove("pending")
		}

		pendingRef.current.classList.add("pending")
		try {
            card.tokenize().then((result) => {
		        if (result.status === 'OK') {
			        console.log(`Payment token is ${result.token}`);
					let cardDetails = {
						"card_brand": result.details.card.brand,
						"exp_month": result.details.card.expMonth,
						"exp_year": result.details.card.expYear,
						"last_4": result.details.card.last4,
						"billing_address": {
							"postal_code": result.details.billing.postalCode
						}
					}
					payments.verifyBuyer(
						result.token,
						{
							amount: (amount/100).toFixed(2),
							currencyCode: 'GBP',
							billingContact: {
								postalCode: result.details.billing.postalCode,
								countryCode: 'GB'
							},
							intent: 'CHARGE',
						}
					).then((verificationResult) => {
						cardJsonRef.current.value = JSON.stringify(cardDetails)
						cardNonceRef.current.value = result.token
						verfTokenRef.current.value = verificationResult.token

				        // statusContainer.current.innerHTML = "Payment Successful";
						setStatusStyle({visibility: "visible"})
				        onSuccess()
					}).catch(error => {
						console.error(error.message)
						let error_code
						try {
							let body = JSON.parse(e.message)
							error_code = body.errors[0].code
						} catch (e) {
							error_code = ""
						}
						displayPaymentResults('FAILURE', error_code);
						onError()
					})

		        } else {
					let errorMessage = `Tokenization failed with status: ${result.status}`;
					if (result.errors) {
			            errorMessage += ` and errors: ${JSON.stringify(
			              result.errors
			            )}`;
					}
					onError()
		            throw new Error(errorMessage);
		        }
            });
        } catch (e) {
	        console.error(e);
	        statusContainer.current.innerHTML = "Payment Failed";
			onError()
		}
	}

	function displayPaymentResults(status, code) {
		console.log("Payment Results: " + status)
		let newClassList = []
		if (status === 'SUCCESS') {
			newClassList.push('is-success')
		} else {
			console.log("Error: " + code)
			newClassList.push('is-failure');
			if (code) {
				newClassList.push(code)
			}
		}
		setStatusClassName(newClassList.join(" "))
		setStatusStyle({
			visibility: 'visible'
		})
		// statusContainer.current.innerHTML = code
	}

	function handlePaymentSubmit(e) {
		e.preventDefault()
		setMsg("")
		// if (document.querySelector("#checkoutCart")) {
		// 	document.querySelector("#checkoutCart").querySelectorAll("canvas").forEach((canvas) => {
		// 		console.log(canvas.perfID)
		// 	})
		// }

		let formData = new FormData(e.target)
		fetch(e.target.action, {
			headers: {
				'Content-Type': 'application/json',
			},
			method: "POST",
			body: JSON.stringify({
				items: cart,
				form: formToJson(formData)
			})
		}).then((resp)=>{
			return resp.json()
		}).then((data)=>{
			if (data.status === "success") {
				displayPaymentResults('SUCCESS', data.msg)
				context.functions.setPath(`/tickets/checkout/success?id=${data.receipt_id}&host=${data.receipt_host}`)
			} else {
				displayPaymentResults('FAILURE', data.msg)
				setMsg(data.msg)
			}
		})
	}

	return (
		<form action={"/tickets/checkout/payment"} onSubmit={handlePaymentSubmit} ref={pendingRef} className={`payment form`}>
			<div className="form">
				<Input id={"notes"} type={"textarea"} label={"Notes - Seating Requests etc"}></Input>
				<hr/>
				<Input id={"name"} type={"text"} label={"Name *"} required={true}></Input>
				<Input id={"phone"} type={"text"} label={"Phone Number *"} required={true}></Input>
				<Input id={"email"} type={"text"} label={"Email *"} required={true}></Input>
				<div ref={cardContainerRef} id="card-container"></div>
				<div ref={statusContainer} id="payment-status-container" style={statusStyle} className={statusClassName}></div>
				<div className="msg">{msg}</div>
				<Input type={"button"} className="card_pay_button" id="card-button" onClick={(e) => {
					handlePaymentButtonClick(e)
				}}>
					<h3>Pay with card - £{(amount/100).toFixed(2)}</h3>
				</Input>

				<Input type={"hidden"} inputRef={verfTokenRef} id={"verf_token"}></Input>
				<Input type={"hidden"} inputRef={cardNonceRef} id={"payment_token"}></Input>
				<Input type={"hidden"} inputRef={cardJsonRef} id={"card_json"}></Input>
			</div>
			<div className="loader"></div>
		</form>
	)
}

function CheckoutSuccess({}) {
	const [receiptId, setReceiptId] = React.useState("")
	const context = React.useContext(app)


	React.useEffect(() => {
		context.functions.setTicketsCart({})
		const urlParams = new URLSearchParams(window.location.search)
		const receipt = urlParams.get('id')
		if (receipt) {
			setReceiptId(receipt)
		}
	}, [])

	return (
		<div className="content payment_success">
			<h1>Payment Successful</h1>
			<p>Thank you for your order. Your receipt will be sent to your email shortly.</p>
			<p>
				Please collect your tickets at the door.
				Doors open 30 minutes before the show starts.
				No need to bring your receipt, just give your name at the desk.
			</p>
		</div>
	)
}