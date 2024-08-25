function SquareCard({cardFor = "membership", formRef}) {
	const context = React.useContext(app)
	const cardContainerRef = React.createRef(null)
	const [statusStyle, setStatusStyle] = React.useState({})
	const [statusClassName, setStatusClassName] = React.useState("")
	const verfTokenRef = React.useRef(0)
	const cardNonceRef = React.useRef(0)
	const cardJsonRef = React.useRef(0)
	const [verfToken, setVerfToken] = React.useState("")
	const [cardNonce, setCardNonce] = React.useState("")
	const [cardJson, setCardJson] = React.useState("")
	const pendingRef = React.createRef(null)

	const [card, setCard] = React.useState(undefined)

	if (!window.Square) {
		throw new Error('Square.js failed to load properly')
	}

	let appId = context.siteJson.square.appId
	let locationId
	if (cardFor === "membership") {
		locationId = context.siteJson.square.membershipLocationId
	}

	const payments = window.Square.payments(appId, locationId)

	React.useEffect(() => {
		payments.card().then((c) => {
			c.attach(cardContainerRef.current)
			setCard(c)
		})
	}, [])

	function handleCardStoreSubmit(onSuccess) {
		console.log("CARD STORE")
		card.tokenize().then((tokenResult) => {
			if (tokenResult.status === 'OK') {
				console.log("TOKEN OK")
				console.log(tokenResult)
				let verificationDetails = {
					billingContact: {
						postalcode: tokenResult.details.billing.postalcode,
						countryCode: 'GB',
					},
					intent: 'STORE',
				}
				payments.verifyBuyer(
					tokenResult.token,
					verificationDetails
				).then((verificationResult)=>{
					console.log(verificationResult)
					console.log(verificationResult.token)
					displayPaymentResults('SUCCESS')
					let cardDetails = {
						"card_brand": tokenResult.details.card.brand,
						"exp_month": tokenResult.details.card.expMonth,
						"exp_year": tokenResult.details.card.expYear,
						"last_4": tokenResult.details.card.last4,
						"billing_address": {
							"postal_code": tokenResult.details.billing.postalCode
						}
					}
					cardJsonRef.current.value = JSON.stringify(cardDetails)
					cardNonceRef.current.value = tokenResult.token
					verfTokenRef.current.value = verificationResult.token
					// ReactDOM.flushSync(() => {
					// 	setCardNonce(tokenResult.token)
					// 	setVerfToken(verificationResult.token)
					// 	setCardJson(JSON.stringify(tokenResult.details.card))
					// })
				}).then(()=>{
					console.log("ONSUCCESS")
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
				})
			} else {
				console.log("TOKEN FAIL")
				let errorMessage = `Tokenization failed-status: ${tokenResult.status}`;
				if (tokenResult.errors) {
					errorMessage += ` and errors: ${JSON.stringify(
					tokenResult.errors
					)}`;
				}
				throw new Error(errorMessage);
			}
		})
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
	}

	function handlePaymentButtonClick(event) {
		function onSuccess() {
			console.log("ON SUCCESS INNER")
			pendingRef.current.classList.remove("pending")
			console.log("ON SUCCESS INNER2")
			formRef.current.requestSubmit()
		}
		pendingRef.current.classList.add("pending")
		if (cardFor === "membership") {
			handleCardStoreSubmit(onSuccess)
		}
	}

	return (
		<div ref={pendingRef} className={`sub_form`}>
			<div className={"form"}>
				<div id="google-pay-button"></div>
				<div ref={cardContainerRef} id="card-container"></div>
				<Input type={"button"} className="card_pay_button" id="card-button" onClick={(e) => {
					handlePaymentButtonClick(e)
				}}>
					<h3>Pay with card</h3>
				</Input>
				<div id="payment-status-container" style={statusStyle} className={statusClassName}></div>

				<Input type={"hidden"} inputRef={verfTokenRef} id={"verfToken"}></Input>
				<Input type={"hidden"} inputRef={cardNonceRef} id={"cardNonce"}></Input>
				<Input type={"hidden"} inputRef={cardJsonRef} id={"cardJson"}></Input>
			</div>
			<div className="loader"></div>
		</div>
	)
}