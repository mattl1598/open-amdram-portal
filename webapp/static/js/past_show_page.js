let currentPhoto = 1

function galleryIncr(n) {
	document.querySelector("#photo"+currentPhoto).classList.add("img-hidden")
	currentPhoto = currentPhoto + n
	if (currentPhoto > photoMax) {currentPhoto = 1}
	if (currentPhoto < 1) {currentPhoto = photoMax}
	loadImg(currentPhoto, n)
	document.querySelector("#photo"+currentPhoto).classList.remove("img-hidden")
	document.querySelector("#photocount").innerHTML = currentPhoto
}

function loadImg(id, n) {
	id += 2*n
	if (id > photoMax) {id = id - photoMax}
	if (id < 1) {id = photoMax + id}
	let toLoad = document.querySelector('#photo'+id)
	if (toLoad.src === ""){
		toLoad.src = toLoad.dataset.dataSrc
	}
}