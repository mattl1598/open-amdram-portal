const textarea = document.getElementById("wysiwyg");

// handle dragstart event on draggable elements
document.addEventListener("dragstart", function(event) {
	event.dataTransfer.setData("text", event.target.dataset.imgtext);
});

// handle drop event on textarea
textarea.addEventListener("drop", function(event) {
	event.preventDefault();
	const text = event.dataTransfer.getData("text");
	textarea.value += text;
});

// handle dragover event on textarea to allow dropping
textarea.addEventListener("dragover", function(event) {
	event.preventDefault();
});


const input = document.getElementById("new_photo");
const spinner = document.getElementById("new_photo_loader");
const parentDiv = input.parentNode.parentNode;
const template_div = document.getElementById("new_photo_div");
const template_img = document.getElementById("new_photo_img");

function upload_photo() {
	spinner.classList.remove("hide")
	setTimeout(function() {
		let file = input.files[0]
		let formData = new FormData()
		formData.append("fileElem", file)

		// Use Fetch API to make a POST request to the API endpoint
		fetch("/members/manage_media?api=true", {
			method: "POST",
			body: formData
		})
			.then(response => response.json())
			.then(data =>
				{
					if (data.success) {
						// create a new element with the returned text
						let newElement = document.createElement("div")
						newElement.dataset.imgtext = `![${data.filename}](${data.url})`
						newElement.classList.add("draggable")
						newElement.draggable = true
						let img = document.createElement("img")
						img.draggable = false
						img.src = `${data.url}`
						img.alt = `${data.filename}`
						img.title = `${data.filename}`
						newElement.appendChild(img)
						// append new element after the parent div
						parentDiv.parentNode.insertBefore(newElement, parentDiv.nextSibling)
					} else {
						alert("Upload failed")
					}
				}
			)
			.then(function() {
				input.value = ""
				spinner.classList.add("hide")
			})
			.catch(error => console.error(error));
	}, 20)

}