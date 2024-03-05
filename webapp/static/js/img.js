document.addEventListener('DOMContentLoaded', function() {
	let image_elements = document.querySelectorAll("img")
	for (let elem of image_elements) {
		console.log(elem.id)
		elem.addEventListener('error', function(){
			console.log("test")
			elem.src = elem.src + "?refresh"
		}, {once: true})
	}
}, false)
