function Login({content}) {
	const context = React.useContext(app)
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
			// console.log("CODE: ", data.code)
			if (data.code === 200) {
				form.reset()
				context.functions.refresh(true)
			}
			form.querySelector("span.msg").innerHTML = data.msg
			form.classList.remove("pending")
		})
	}

	return (
		<div className={"content"}>
			<h1>{content.title}</h1>
			<Tabs>
				<Tab title={"Login"}>
					<div className={"login_form"}>
						<form action="/members" onSubmit={(e) => {
							handleFormSubmit(e)
						}}>
							<div className="form">
								<Input key={"login_email"} id={"email"} label={"Email"} required={true}></Input>
								<Input key={"login_password"} type={"password"} id={"password"} label={"Password"} required={true}></Input>
								<span className="msg"></span>
								<Input key={"login_submit"} type={"submit"} value={"Login"}></Input>
							</div>
							<div className="loader"></div>
						</form>
					</div>
				</Tab>
				<Tab title={"Register"}>
					<div className="login_form">
						<form action="/members/api/register">
							<div className="form">
								<Input key={"register_firstname"} id={"firstname"} label={"First Name"} required={true}></Input>
								<Input key={"register_lastname"} id={"lastname"} label={"Last Name"} required={true}></Input>
								<Input key={"register_email"} id={"email"} label={"Email"} required={true}></Input>
								<Input key={"register_password"} type={"password"} id={"password"} label={"Password"} required={true}></Input>
								<Input key={"register_confirm_password"} type={"password"} id={"confirm_password"} label={"Confirm Password"} required={true}></Input>
								<span className="msg"></span>
								<Input key={"register_submit"} type={"submit"} value={"Register"}></Input>
							</div>
							<div className="loader"></div>
						</form>
					</div>
				</Tab>
			</Tabs>
			<Files title={"Members Documents"} files={content.files}></Files>
		</div>
	)
}