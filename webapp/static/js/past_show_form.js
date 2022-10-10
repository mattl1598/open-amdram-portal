function swapRows(element, role_type, dir) {
	let startInt = parseInt(element.parentElement.id.replace(role_type, ""))

	let rowA = document.querySelector(`#${role_type}${startInt}`)
	let rowB = document.querySelector(`#${role_type}${startInt+dir}`)

	if (role_type === "cast") {
		let roleA = rowA.querySelector(`#${role_type}_roles${startInt}`)
		let roleB = rowB.querySelector(`#${role_type}_roles${startInt+dir}`)

		let scratch = roleA.value

		roleA.value = roleB.value
		roleB.value = scratch
	} else {
		let roleA = rowA.querySelector(`#${role_type}_roles${startInt}`).tomselect
		let roleB = rowB.querySelector(`#${role_type}_roles${startInt+dir}`).tomselect

		let scratch = roleA.getValue()

		roleA.setValue(roleB.getValue())
		roleB.setValue(scratch)
	}

	let membersA = rowA.querySelector(`#${role_type}_members${startInt}`).tomselect
	let membersB = rowB.querySelector(`#${role_type}_members${startInt+dir}`).tomselect

	let A = [...membersA.getValue()]
	let B = [...membersB.getValue()]

	membersA.clear(true)
	membersB.clear(true)

	console.log(A)
	console.log(B)

	membersA.setValue(B)
	membersB.setValue(A)
}



function addCast(prefill_role="", members=[]) {
	let val = document.querySelector("#cast_count").value
	val++
	document.querySelector("#cast_count").value = val
	var temp = document.querySelector("#cast-template")
	var clon = temp.content.cloneNode(true)

	clon.querySelector("#casttemplate").id = "cast"+val
	clon.querySelector("#cast_rolestemplate").name = "cast_roles"+val
	clon.querySelector("#cast_rolestemplate").value = prefill_role
	clon.querySelector("#cast_rolestemplate").id = "cast_roles"+val
	clon.querySelector("#cast_roles_labeltemplate").for = "cast_roles"+val
	clon.querySelector("#cast_roles_labeltemplate").id = "cast_roles_label"+val
	clon.querySelector("#cast_memberstemplate").name = "cast_members"+val+"[]"
	clon.querySelector("#cast_memberstemplate").id = "cast_members"+val

	document.querySelector("#cast-entries").appendChild(clon)

	new TomSelect("#cast_members"+val,{
		maxItems: 20,
		allowEmptyOption: true,
		hideSelected: true,
		items:members,
		hidePlaceholder:true,
		create: true,
		onItemAdd: function(){
			this.setTextboxValue('')
			this.refreshOptions()
		}
	})
}

function addCrew(prefill_role="", members=[]) {
	let val = document.querySelector("#crew_count").value
	val++
	document.querySelector("#crew_count").value = val
	var temp = document.querySelector("#crew-template")
	var clon = temp.content.cloneNode(true);

	clon.querySelector("#crewtemplate").id = "crew"+val
	clon.querySelector("#crew_rolestemplate").name = "crew_roles"+val
	clon.querySelector("#crew_rolestemplate").id = "crew_roles"+val
	clon.querySelector("#crew_memberstemplate").name = "crew_members"+val+"[]"
	clon.querySelector("#crew_memberstemplate").id = "crew_members"+val

	document.querySelector("#crew-entries").appendChild(clon)

	new TomSelect("#crew_members"+val,{
		maxItems: 20,
		allowEmptyOption: true,
		hideSelected: true,
		items:members,
		hidePlaceholder:true,
		create: true,
		onItemAdd: function(){
			this.setTextboxValue('');
			this.refreshOptions();
		}
	})
	new TomSelect("#crew_roles"+val,{
		items:[prefill_role],
		options: crew_roles,
		maxItems: 1,
		valueField: 'value',
		labelField: 'value',
		searchField: 'value',
		create: true
	})
}

document.addEventListener('DOMContentLoaded', function() {
	for (const [key, value] of Object.entries(prefill_json)) {
		if (key === "cast") {
			for (const [role, members] of Object.entries(value)) {
				addCast(role, members)
			}
		} else if (key === "crew") {
			for (const [role, members] of Object.entries(value)) {
				addCrew(role, members)
			}
		}
	}
	const easyMDE = new EasyMDE({ element: document.querySelector("#wysiwyg") });
}, false)
