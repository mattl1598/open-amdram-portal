async function initializeCard(payments) {
	const card = await payments.card();
	await card.attach('#card-container');
	return card;
}

function getNewIdempotencyKey() {
	fetch('/api/new_idemp')
		.then(response => {
			// Check if the response status is OK (200)
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			// Parse the response body as JSON
			return response.json();
		})
		.then(data => {
			// Access the 'new_key' value from the JSON response
			const newKey = data.new_key;
			// You can now use 'newKey' as needed
			console.log('Value of new_key:', newKey);
			// If you need to save it to a variable, you can do so here
			paymentIdempotencyKey = newKey;
		})
		.catch(error => {
			console.error('There was a problem with the fetch operation:', error);
		});
}

function buildPaymentRequest(payments) {
	return payments.paymentRequest({
		countryCode: 'GB',
		currencyCode: 'GBP',
		total: {
			amount: '1.00',
			label: 'Total',
		},
	});
}

async function initializeGooglePay(payments) {
	const paymentRequest = buildPaymentRequest(payments)

	const googlePay = await payments.googlePay(paymentRequest);
	await googlePay.attach('#google-pay-button');

	return googlePay;
}

function verifyBuyer(payments, token) {
	let level = form.querySelector('#membership_type').value
	return fetch(`/api/members/subs_amount/${level}`)
	.then(response => {
		// Check if the response status is OK (200)
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		// Parse the response body as JSON
		return response.text();
	})
	.then(data => {
		console.log(token)
		const verificationDetails = {
			amount: data,
			billingContact: {
				givenName: firstname,
				familyName: lastname,
				email: email,
				phone: form.querySelector('#phone_number').value,
				postalcode: postalcode,
				countryCode: 'GB',
			},
			currencyCode: 'GBP',
			intent: 'CHARGE',
		};

		console.log(verificationDetails)

		return payments.verifyBuyer(
			token,
			verificationDetails
		).then(verificationResults => {
			console.log(verificationResults)
			console.log(verificationResults.userChallenged)
			console.log(verificationResults.token)
			return verificationResults.token;
		})
	})
}

document.addEventListener('DOMContentLoaded', async function () {
	if (!window.Square) {
		throw new Error('Square.js failed to load properly');
	}
	const payments = window.Square.payments(appId, locationId);
	console.log(payments.setLocale('en-GB'))
	let card;
	try {
		card = await initializeCard(payments);
	} catch (e) {
		console.error('Initializing Card failed', e);
		return;
	}

	let googlePay;
	try {
		googlePay = await initializeGooglePay(payments);
	} catch (e) {
		console.error('Initializing Google Pay failed', e);
		// There are a number of reason why Google Pay might not be supported.
		// (e.g. Browser Support, Device Support, Account). Therefore you
		// should handle initialization failures, while still loading other
		// applicable payment methods.
	}

	function onError(e) {
		waiting.classList.add("hidden")
		console.error(e.message);
		let error_code
		try {
			let body = JSON.parse(e.message)
			error_code = body.errors[0].code
		} catch (ee) {
			error_code = ""
		}
		displayPaymentResults('FAILURE', error_code);
		console.error(e.message);
		getNewIdempotencyKey();
		cardButton.disabled = false;
	}

	async function handlePaymentMethodSubmission(event, paymentMethod) {
		event.preventDefault();

		try {
			// disable the submit button as we await tokenization and make a
			// payment request.
			cardButton.disabled = true;
			waiting.classList.remove("hidden")
			console.log("Tokenize")
			const token = await tokenize(paymentMethod);

			postalcode = token.details.billing.postalcode
			console.log("postalcode: " + postalcode)
			console.log("token: " + token.token)
			console.log("SCA")
			verifyBuyer(
				payments,
				token.token
			).then(verifiedToken => {
				console.log("Payment")
				createPayment(
					token.token,
					verifiedToken
				).then(paymentResults => {
					waiting.classList.remove("wait")
					displayPaymentResults('SUCCESS');
					console.debug('Payment Success', paymentResults);
					setTimeout(function() {
						window.location.href = '/members/dashboard'
					}, 1000);
				}).catch(error => {
					onError(error)
				})
			}).catch(error => {
				onError(error)
			})
		} catch (e) {
			onError(e)
		}
	}

	const cardButton = document.getElementById('card-button');
	const waiting = document.querySelector("#waiting")
	cardButton.addEventListener('click', async function (event) {
		await handlePaymentMethodSubmission(event, card);
	});
});

// Call this function to send a payment token, buyer name, and other details
// to the project server code so that a payment can be created with
// Payments API
async function createPayment(token, verification_token) {
	// let form = document.querySelector('#form')
	const body = JSON.stringify({
		"source_id": token,
		"verification_token": verification_token,
		"order_idempotency_key": orderIdempotencyKey,
		"payment_idempotency_key": paymentIdempotencyKey,
		"level": form.querySelector('#membership_type').value,
		"phone": form.querySelector('#phone_number').value,
		"e_con_name": form.querySelector('#e_con_name').value,
		"e_con_phone": form.querySelector('#e_con_phone').value
	});
	console.log(body)
	const paymentResponse = await fetch('/api/members/subs_payment', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body,
	});
	if (paymentResponse.ok) {
		let json = paymentResponse.json()
		console.log(json)
		return json;
	}
	const errorBody = await paymentResponse.text();
	throw new Error(errorBody);
}

// This function tokenizes a payment method.
// The ‘error’ thrown from this async function denotes a failed tokenization,
// which is due to buyer error (such as an expired card). It's up to the
// developer to handle the error and provide the buyer the chance to fix
// their mistakes.
async function tokenize(paymentMethod) {
	const tokenResult = await paymentMethod.tokenize();
	if (tokenResult.status === 'OK') {
		return tokenResult;
	} else {
		let errorMessage = `Tokenization failed-status: ${tokenResult.status}`;
		if (tokenResult.errors) {
			errorMessage += ` and errors: ${JSON.stringify(
			tokenResult.errors
			)}`;
		}
		throw new Error(errorMessage);
	}
}

 // Helper method for displaying the Payment Status on the screen.
 // status is either SUCCESS or FAILURE;
function displayPaymentResults(status, code="") {
	console.log("Payment Results: " + status)
	const statusContainer = document.getElementById(
	'payment-status-container'
	);
	if (status === 'SUCCESS') {
		statusContainer.classList = ""
		statusContainer.classList.add('is-success');
	} else {
		console.log("Error: " + code)
		statusContainer.classList = ""
		statusContainer.classList.add('is-failure');
		if (code) {
			statusContainer.classList.add(code);
		}
	}
	statusContainer.style.visibility = 'visible';
}


const card_number_regex = /^[0-9]{16}$/g
const card_expiry_regex = /^[0-3][0-9]\/[0-9]{2}$/g
const card_cvv_regex = /^[0-9]{3,4}$/g
const card_postcode_regex = /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i

function payByCard() {
	let form_valid = true
	// check membership form is complete
	form_valid &= Boolean(document.querySelector('select#membership_type').value)
	form_valid &= Boolean(document.querySelector('input#phone_number').value)
	form_valid &= Boolean(document.querySelector('input#e_con_name').value)
	form_valid &= Boolean(document.querySelector('input#e_con_phone').value)

	// check card details are entered
	form_valid &= Boolean(document.querySelector('input#card_number').value)
	form_valid &= Boolean(document.querySelector('input#card_expiry').value)
	form_valid &= Boolean(document.querySelector('input#card_cvv').value)
	form_valid &= Boolean(document.querySelector('input#card_postcode').value)

	// check card details match expected formats
	form_valid &= card_number_regex.test(document.querySelector('input#card_number').value)
	form_valid &= card_expiry_regex.test(document.querySelector('input#card_expiry').value)
	form_valid &= card_cvv_regex.test(document.querySelector('input#card_cvv').value)
	form_valid &= card_postcode_regex.test(document.querySelector('input#card_postcode').value)

	if (!form_valid) {
		displayAlerts({title:"Form Incomplete", content: "Please fill out all fields."})
	} else {
		// process payment
		console.log("doPayment")
	}
}