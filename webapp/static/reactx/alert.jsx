const alertsRoot = ReactDOM.createRoot(document.getElementById('alerts'))

if (globalInitialAlerts === undefined) {
	alertsRoot.render(<AlertsContainer/>)
} else {
	alertsRoot.render(<AlertsContainer initialAlerts={globalInitialAlerts}/>)
}

function displayAlerts(obj) {
	let newValue = JSON.stringify(obj)
	let input = document.querySelector('#AlertsContainerInput')
	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
	  window.HTMLInputElement.prototype,
	  'value').set;
	nativeInputValueSetter.call(input, newValue);
	const event = new Event('input', { bubbles: true });
	input.dispatchEvent(event);
}

function AlertsContainer({ initialAlerts = [] }) {
	let initialObj = {}
	let initialLength = 0
	if (initialAlerts) {
		for (let i= 0; i < initialAlerts.length; i++) {
			initialObj[i] = { title: initialAlerts[i].title, content: initialAlerts[i].content }
			initialLength++
		}
	}
	const [obj, setObj] = React.useState(initialObj);
	const [counter, setCounter] = React.useState(initialLength);

	function addNewAlert(key, title, content) {
		let newAlert = {}
		// let newKey = id(Date.now().toString())
		newAlert[key] = { title: title, content: content }
		setObj(obj => ({ ...obj, ...newAlert }))
	}

	function handleNewAlerts(event) {
		console.log("alert?!")
		let newAlerts = JSON.parse(event.target.value)
		for (let i = 0; i < newAlerts.length; i++) {
			addNewAlert(counter + i, newAlerts[i].title, newAlerts[i].content)
		}
		setCounter(counter + newAlerts.length)
		event.target.value = ""
	}

	function handleAlertClose(id) {
		let copy = { ...obj }
		delete copy[id]
        setObj(obj => ({ ...copy }));
	}

	function getAlerts() {
		let alerts = []
		let entries = Object.entries(obj)
		for (let i = 0; i < entries.length; i++) {
			let [key, value] = entries[i]
			alerts.push(
				<Alert key={key} title={value.title} content={value.content} onAnimationEnd={() => {handleAlertClose(key)}}/>
			)
		}
		return alerts
	}

	return (
		<div>
			{getAlerts()}
			<input id="AlertsContainerInput" onChange={handleNewAlerts} hidden/>
		</div>
	)
}

function Alert({ title, content, onAnimationEnd }) {

	function handleBubble(event) {
		event.stopPropagation()
	}

	return (
		<div className="alert" onAnimationEnd={onAnimationEnd}>
			<div>
				<h2>{title}</h2>
				<p>
					{content}
				</p>
			</div>
			<div className="progress" onAnimationEnd={handleBubble}></div>
		</div>
	)
}