function confirm_delete(args) {
	if (confirm("Are you sure you want to delete this?")) {
		window.location.href += args
	}
}

function select_media(element) {
	let data = element.querySelector("data").dataset

	let info = document.querySelector("#info")
	info.classList.remove("greyed")

	info.querySelector("#filename").innerHTML = data.name
	info.querySelector("#url").innerHTML = data.url
	info.querySelector("#image").src = data.url
	info.querySelector("#delete").onclick = () => confirm_delete(`?delete=${data.id}`)
}

function copy_me(id) {
	  let copyText = document.querySelector(`#${id}`).innerHTML;

	   // Copy the text inside the text field
	  // noinspection JSIgnoredPromiseFromCall
	navigator.clipboard.writeText(copyText);
}