function Login({content}) {
	return (
		<div className={"content"}>
			<h1>{content.title}</h1>
			<div className={"login_form"}>
				<form action="">
					<Input id={"email"} label={"Email"} required={true}></Input>
					<Input type={"password"} id={"password"} label={"Password"} required={true}></Input>
					<Input type={"submit"} value={"Login"}></Input>
				</form>
			</div>
			<Files title={"Members Documents"} files={content.files}></Files>
		</div>
	)
}