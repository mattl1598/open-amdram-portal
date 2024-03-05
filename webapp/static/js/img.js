document.addEventListener('DOMContentLoaded', function() {
	let image_elements = document.querySelectorAll("img")
	for (let elem of image_elements) {
		elem.addEventListener('error', function(){
			elem.src = elem.src + "?refresh"
		}, {once: true})
	}
}, false)
