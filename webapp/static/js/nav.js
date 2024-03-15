function setMobile() {
	let nav = document.querySelector("#title-tape-measure")
	let content_width = 0
	for (let i=0; i<nav.children.length; i++) {
		content_width += nav.children[i].offsetWidth
	}
	let empty_space = nav.offsetWidth - content_width
	// console.log(empty_space)
	if (empty_space < 0) {
		document.querySelector("#html").classList.add("mobile")
	} else {
		document.querySelector("#html").classList.remove("mobile")
	}
}

function expand() {
	document.querySelector("#mobile-nav").classList.toggle("collapsed")
	document.querySelector("#body").classList.toggle("noscroll")
}

window.addEventListener("resize", setMobile)

function reloadCss(){
    var links = document.getElementsByTagName("link");
    for (var cl in links)
    {
        var link = links[cl];
        if (link.rel === "stylesheet")
            link.href += "";
    }
}
