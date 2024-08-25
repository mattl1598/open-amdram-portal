function AdminSettings({content, refresh}) {
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
				refresh()
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}
	let subs = []

	for (let i=0; i<(content.subs || []).length; i++) {
		let sub = content.subs[i]
		subs.push(
			<div key={i} className={"sub"} style={{order: sub.amount}}>
				<div className="type">
					<h3 className={""}>{sub.name}</h3>
				</div>
				<div className={"rate"}>
					<strong>Rate: </strong>
					<span className={"rate"}>£{(sub.amount/100).toFixed(2)}</span>
				</div>
				<div className={"billing"}>
					<strong>Period: </strong>
					<span className="period">{sub.period}</span>
				</div>
			</div>
		)
	}

	return (
		<div className="content">
			<h1>{content.title}</h1>
			<div className="form_container two">
				<form action="/members/api/admin/admin_settings/site_settings" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className="form">
						<h2>Site Settings</h2>
						<span className="msg"></span>
						<Input type={"text"} id={"site-name"} label="Site Name" value={content.settings.siteName}></Input>
						<Input type={"select"} id={"tickets-active"} label="Enable Tickets" value={content.settings.ticketsActive}>
							<option value="0">Off</option>
							<option value="1">On</option>
						</Input>
						<Input type={"text"} id={"tickets-link"} label={"Tickets URL"} value={content.settings.ticketsLink}></Input>
						<Input type={"text"} id={"tickets-hero-photo"} label={"Tickets Hero Photo"} value={content.settings.ticketsHeroPhoto}></Input>
						<Input type={"text"} id={"socials"} label={"Social Links (comma seperated)"} value={content.settings.socials}></Input>
						<Input type={"textarea"} id={"about"} label={"About Us Content (Markdown)"} value={content.settings.about}></Input>
						<Input type={"text"} id={"maps-url"} label={"Google Maps URL"} value={content.settings.mapsURL}></Input>
						<Input type={"submit"} id={"submit"} value={"Save Settings"}></Input>
					</div>
					<div className="loader"></div>
				</form>

				<form className={"subs"} action="/members/api/admin/admin_settings/subs/add_new_plan" onSubmit={(e) => {
					handleFormSubmit(e)
				}}>
					<div className="form">
						<h2>Subs Options</h2>
						<span className="msg"></span>
						<div className="subs">
							{subs}
						</div>
						<details>
							<summary>Add New Subs Level</summary>
							<Input type={"text"} id={"levelName"} label={"Level Name"}></Input>
							<Input type={"number"} id={"amount"} label={"Amount"}></Input>
							<Input type={"select"} id={"period"} label={"Period"}>
								<option value="yearly">Yearly</option>
							</Input>
							<Input type={"select"} id={"renewal_month"} label={"Renewal Month (for yearly)"}>
								<option value="01">January</option>
								<option value="02">February</option>
								<option value="03">March</option>
								<option value="04">April</option>
								<option value="05">May</option>
								<option value="06">June</option>
								<option value="07">July</option>
								<option value="08">August</option>
								<option value="09">September</option>
								<option value="10">October</option>
								<option value="11">November</option>
								<option value="12">December</option>
							</Input>
							<Input type={"submit"} id={"submit"} value={"Add Subs Level"}></Input>
						</details>
					</div>
					<div className="loader"></div>
				</form>
			</div>
		</div>
	)
}