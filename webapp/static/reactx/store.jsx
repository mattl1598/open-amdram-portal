function SidebarCart() {
	const context = React.useContext(app)
	let pricing = {
		Adult: 1200,
		Child: 1000
	}
	let cart = [
		{
			type: "tickets",
			name: "Death by Design",
			performance: "Saturday 19th September 2025",
			tickets: {
				Adult: 2,
				Child: 1
			}
		}
	]
	let cartItems = []
	let total = 0
	for (let i=0; i < cart.length; i++) {
		let item = cart[i]
		if (item.type === "tickets") {
			let tickets = []
			for (const [key, value] of Object.entries(item.tickets)) {
				let type = key
				if (value > 1 && key === "Child") {
					type = "Children"
				} else if (value > 1) {
					type = `${key}s`
				}
				tickets.push(
					<span>{type}: {value}</span>
				)
				total += pricing[key] * value
			}
			cartItems.push(
				<div key={`cartItem${i}`} className="cartItem">
					<h3 className="showName">{item.name}</h3>
					<h3 className="performance">{item.performance}</h3>
					<h4 className="tickets">
						{tickets}
					</h4>
				</div>
			)
		}
	}
	if (cart.length) {
		return (
			<div className="sidebarCart">
				<h2 className={"title"}>Shopping Cart</h2>
				<div className="cart">
					{cartItems}
				</div>
				<Link href={"/store/checkout"}><h3 className={"checkout button"}>Checkout</h3></Link>
				<h3 className={"total button"}>Total: £{(total/100).toFixed(2)}</h3>
			</div>
		)
	} else {
		return (
			<React.Fragment></React.Fragment>
		)
	}
}

function Cart() {

}