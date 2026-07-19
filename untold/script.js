let writingArea = document.getElementById('poem-form')
let poemText = document.getElementById('poem-text')
let submitButton = document.getElementById('submit')
let h1 = document.querySelector('h1')
let header = document.querySelector('header')
let h2 = document.querySelector('h2')
let modal = document.getElementById('modal')
let modalText = document.getElementById('modal-text')
let modalDelete = document.getElementById('delete')
let modalSave = document.getElementById('save')
let poemSection = document.getElementById('poems')
let infoButton = document.getElementById('info')
let infoModal = document.getElementById('info-modal')
let infoClose = document.getElementById('info-close')


// info button event listener
infoButton.addEventListener('click', () => {
	infoModal.classList.remove('hidden')
	infoModal.style.opacity = '0'
	requestAnimationFrame(() => {
		infoModal.style.opacity = '1'
	})
})

// info close button
infoClose.addEventListener('click', () => {
	infoModal.style.opacity = '0'
	infoModal.addEventListener('transitionend', () => {
		infoModal.classList.add('hidden')
	}, { once: true })
})

// main input event listener for textarea
// from stackoverflow (option 2): https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
// using scrollHeight in event listener to get the height of the text content and setting it as the height of the textarea
poemText.addEventListener('input', () => {
	// using 2rem as default height (--button-size in my css variables)
	poemText.style.height = '2rem'
	poemText.style.height = poemText.scrollHeight

	// let randomPoem = document.querySelector('.random-poem')
	let randomPoemsContainer = document.querySelector('#random-poems-container')
	// checking if the textarea has any text to change color of button
	if (poemText.value !== '') {
		// class that allows submission
		submitButton.classList.add('allow')

		// instead of just adding display none i wanted to fade them
		h2.style.opacity = '0'
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event 
		// to prevent things from fading and overlapping, i had to add an event listener that only adds class hidden on the end of the transition
		h2.addEventListener('transitionend', () => {
			// checking if opacity is 0 before adding display: none to it
			if (h2.style.opacity === '0') {
				h2.classList.add('hidden')
				header.classList.add('gradient')
				header.style.position = 'sticky'
			}
			// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#once
			// adding once: true to make event listener run once (otherwise the poems overlap/transition too quickly if you type and delete things from the main input)
		}, { once: true })

		// same thing for fading out random poem
		// randomPoem.style.opacity = '0'
		// randomPoem.addEventListener('transitionend', () => {
		// 	if (randomPoem.style.opacity === '0') {
		// 		randomPoem.classList.add('hidden')
		// 	}
		// }, { once: true })
		if (randomPoemsContainer) {
			randomPoemsContainer.style.opacity = '0'
			randomPoemsContainer.addEventListener('transitionend', () => {
				if (randomPoemsContainer.style.opacity === '0') {
					randomPoemsContainer.classList.add('hidden')
				}
			}, { once: true })
		}

	} else {
		submitButton.classList.remove('allow')
		nextPlaceholder()

		// fade in h2 and random poem (only if there is no saved poems)
		if (localStorage.length === 0) {
			h2.classList.remove('hidden')
			header.classList.remove('gradient')
			header.style.position = ''
			requestAnimationFrame(() => { 
				h2.style.opacity = '1' 
			})

			// randomPoem.classList.remove('hidden')
			// requestAnimationFrame(() => { 
			// 	randomPoem.style.opacity = '1' 
			// })
			if (randomPoemsContainer) {
				randomPoemsContainer.classList.remove('hidden')
				requestAnimationFrame(() => { 
					randomPoemsContainer.style.opacity = '1' 
				})
			}
		}
	}
})

// function to close modal
let closeModal = () => {
	modal.style.opacity = '0'
	document.body.style.overflow = ''
	modal.addEventListener('transitionend', () => {
		modal.classList.add('hidden')
		modal.style.opacity = '0'
		if (localStorage.length > 0) {
			poemSection.classList.remove('hidden')
		}
	}, { once: true })
}

// scroll to bottom when typing at the end of modal textarea
modalText.addEventListener('input', () => {
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/selectionStart
	// using position of the cursor (selectionstart) to see if its at the end to fix the weird issue where pseudo gradients cover the text as u type
	if (modalText.selectionStart === modalText.value.length) {
		modalText.scrollTop = modalText.scrollHeight
	}
})

// listener for save button
modalSave.addEventListener('click', () => {
	// removing it from localstorage if empty
	if (modalText.value === '') {
		localStorage.removeItem(currentPoemId)
	// otherwise update it with new text
	} else {
		let updatedLines = modalText.value.split('\n')
		localStorage.setItem(currentPoemId, JSON.stringify({ 
			text: updatedLines 
		}))
	}
	closeModal()
	displayPoems()
})

// listener for delete button
modalDelete.addEventListener('click', () => {
	// need to add another modal or pop up
	if (window.confirm('Are you sure you want to delete this masterpiece? This action cannot be undone.')) {
		localStorage.removeItem(currentPoemId)
		closeModal()
		displayPoems()
	}
})

// following the example from https://github.com/typography-interaction-2526/forms-params-storage

// function to retrieve poems from localstorage as an array
let retrievePoems = () => {
	// making an array with objects in it from localStorage
	let poems = []

	// using Object.keys() here instead of cycling through localStorage with a simple for loop (just thought this was a better way of doing it): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
	Object.keys(localStorage).forEach((key) => {
		// pushing object to array: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push

		// parsing through localStorage object
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse 
		let poemInfo = JSON.parse(localStorage.getItem(key))

		poems.push({
			id: key,
			// removing titles for now
			// title: poemInfo.title,
			text: poemInfo.text
		})
	})

	// checking
	// console.log(poems)
	// returning it so we can use it in displayPoems
	return poems
}

// boolean to check if textarea is empty
let clearInput = false

// adding clear boolean to prevent textarea input from being cleared when deleting poems
let displayPoems = (clearInput) => {
	// selecting poems
	let poemSections = document.querySelectorAll('.poem')

	// clearing them so we can 'refresh' the page basically with new poems upon submission/deleting
	poemSections.forEach(section => {
		section.remove()
	})

	// only clear the textarea when a new poem was just submitted (clearinput = true)
	if (clearInput === true) {
		document.getElementById('poem-text').value = ''
		// setting the input area height to default height
		document.getElementById('poem-text').style.height = '2rem'
	}

	if (localStorage.length === 0) {
		poemSection.classList.add('hidden')
		h2.classList.remove('hidden')
		header.classList.remove('gradient')
		header.style.position = ''
		// let randomPoem = document.querySelector('.random-poem')
		let randomPoemsContainer = document.querySelector('#random-poems-container')
		// if (randomPoem) {
		// 	randomPoem.classList.remove('hidden')
		// 	requestAnimationFrame(() => {
		// 		h2.style.opacity = '1'
		// 		randomPoem.style.opacity = '1'
		// 	})
		// }
		if (randomPoemsContainer) {
			randomPoemsContainer.classList.remove('hidden')
			requestAnimationFrame(() => {
				h2.style.opacity = '1'
				randomPoemsContainer.style.opacity = '1'
			})
		}
	}

	if (localStorage.length > 0) {
		poemSection.classList.remove('hidden')
		h2.classList.add('hidden')
		header.classList.add('gradient')
		header.style.position = 'sticky'
	}

	// running retrievePoems here so we have the new retrieved poems from localStorage
	let poems = retrievePoems()
	// checking
	// console.log(poems)
	// sorting poems by id in descending order so the most recent poem is at the top
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	poems.sort((a, b) => b.id - a.id)
	
	// creating an element for each poem
	poems.forEach((poem, index) => {
		let poemElement = document.createElement('section')
		poemElement.classList.add('poem')
		// console.log(poem.text)
		// making a loop to parse thru each line to display on a new line
		let lines = poem.text

		let preview = document.createElement('section')
		preview.classList.add('poem-preview')

		// slicing the lines to only show first 6
		let previewLines = lines.slice(0, 6)
		previewLines.forEach((line) => {
			let lineElement = document.createElement('p')
			lineElement.textContent = line
			preview.appendChild(lineElement)
		})

		// single line gets solid color instead of gradient
		if (previewLines.length === 1) {
			preview.classList.add('single-line')
		}

		poemElement.appendChild(preview)
		poemSection.appendChild(poemElement)
		// only animate the first poem (newest) when submitting
		if (clearInput === true && index === 0) {
			requestAnimationFrame(() => {
				poemElement.style.opacity = '1'
			})
		} else {
			poemElement.style.opacity = '1'
		}

		let expanded = document.createElement('textarea')
		expanded.classList.add('expanded')
		expanded.classList.add('hidden')
		// joining the separate lines into one text area string with breaks
		expanded.value = lines.join('\n')

		// event listener to show expanded view on click
		// preview.addEventListener('click', () => {
		// 	preview.classList.add('hidden')
		// 	expanded.classList.remove('hidden')
		// 	expanded.focus()
		// })

		preview.addEventListener('click', () => {
			openModal(poem.id, lines)
		})

		// making a modal instead, following the example from class/my last project
		let openModal = (poemId, lines) => {
			currentPoemId = poemId
			modalText.value = lines.join('\n')
			poemSection.classList.add('hidden')
			modal.classList.remove('hidden')
			document.body.style.overflow = 'hidden'
			// animating it to fade in
			requestAnimationFrame(() => { 
				modal.style.opacity = '1'
			})
			modalText.focus()
		}

		poemElement.appendChild(expanded)

		// CHANGING FROM USING INPUTS TO TEXTAREA + MAKING A PREVIEW/EXPANDED STATE
		// lines.forEach((line, id) => {
		// 	let lineElement = document.createElement('input')
		// 	lineElement.value = line

		// 	// event listener when the user clicks out of the input (after editing)
		// 	// IMPOORTANT: NEED TO CHANGE THIS TO BE ALL IN TEXTAREA FOR EASIER EDITING INSTEAD OF SEPARATE INPUTS !!!!!!!!!!
		// 	// https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event
		// 	lineElement.addEventListener('blur', (event) => {
		// 		lines[id] = lineElement.value
		// 		// writing the updated poem back to localStorage
		// 		localStorage.setItem(poem.id, JSON.stringify({
		// 			id: poem.id,
		// 			// title: poem.title,
		// 			text: lines
		// 		}))
		// 	})
		// 	// adding lines to poem element
		// 	poemElement.appendChild(lineElement)
		// })

		// adding delete button
		// let deleteButton = document.createElement('button')
		// // icon from https://lucide.dev/
		// deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
		// deleteButton.addEventListener('click', (event) => {
		// 	localStorage.removeItem(poem.id)
		// 	// 'refresh' the poems displayed
		// 	displayPoems()
		// })

		// poemElement.appendChild(deleteButton)

		// adding print button
		// removed print button for now
		// let printButton = document.createElement('button')
		// printButton.textContent = '\u{1F5A8}'
		// printButton.addEventListener('click', (event) => {
		// 	window.print()
		// })

		// poemElement.appendChild(printButton)

		// share button w/ web share api
		// IMPORTANT: NEED TO SET THIS UP PROPERLY (THE FORMATTING) AND TO USE  !!!!
		// let shareButton = document.createElement('button')
		// shareButton.textContent = '\u{1F517}'

		// // this function needs to be asyncronous to work like in my last project
		// let sharing = false

		// poemElement.appendChild(shareButton)

		// // using example from my last project:
		// shareButton.addEventListener('click', async (event) => {
		// 	if (navigator.share) {
		// 		if (sharing) {
		// 			return
		// 		}
		// 		sharing = true
		// 		try {
		// 			await navigator.share({
		// 				// title: poem.title,
		// 				text: poem.text
		// 			})
		// 		} finally {
		// 			sharing = false
		// 		}
		// 	}
		// })

		poemSection.appendChild(poemElement)
	})
}

let writePoem = () => {
	// using numerical ids for poem key in localStorage
	// let poemID = localStorage.length + 1
	// using a timestamp-based key instead so new poems never reuse the same localStorage key
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
	// console.log(Date.now())
	let poemID = Date.now()

	// let poemTitle = document.getElementById('poem-title').value
	let poemText = document.getElementById('poem-text').value
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split
	// using the split function to split by line breaks (similar to how poems are stored in the random poem api i used)
	let poemLines = []
	poemLines = poemText.split('\n')

	let poemInfo = {
		// title: poemTitle,
		text: poemLines
	}

	// https://developer.mozilla.orgq/en-US/docs/Web/API/Window/localStorage
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
	// just inserting the poemInfo object into localStorage returns [object Object] so I have to stringify it and parse it when I retrieve it
	localStorage.setItem(poemID, JSON.stringify(poemInfo))
}

writingArea.addEventListener('submit', (event) => {
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
	event.preventDefault()

	// checking for value in textarea before writing
	if (poemText.value == '') {
		// console.log('no text entered')
		poemText.focus()
		return
	} else {
		submitButton.classList.remove('allow')
	}
	
	// writing poem to localStorage on button submission
	writePoem()
	nextPlaceholder()
	// changing clearInput to true
	displayPoems(true)
})

// adding another function using this api i found to retrieve a random poem (might use this for something later): https://github.com/thundercomb/poetrydb/blob/master/README.md
// fetch is asynchronous so i have to use async/await here to prevent an error: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
let getRandomPoems = async () => {
	// fetching 10 random poems at once instead of just 1
	let response = await fetch('https://poetrydb.org/random/20')
	let poems = await response.json()
	// console.log(poems)
	return poems
}

// function to display random poem (now displaying 10 poems) on the page (will use this for something later)
let displayRandomPoem = async () => {
	// fallback poems shown instantly while api loads
	let poems = [
		{ lines: [
			'Not being a poet, and drunk as well,',
			'leaning into the diner and dawn',
			'and hearing a juke box mockery of some better',
			'human sound',
			'I wanted rhetoric',
			'but could only howl the rotten truth',
			'Norman Luboff',
			'should have his nuts ripped off with a plastic fork.',
			'Then howled around like a man with the',
			'final angst,',
			'not knowing what I wanted there',
			'Probably the waitress, bend her double',
			'like a safety pin,',
			'Deposit the mad seed before they',
			'tie off my tubes',
			'',
			'Suddenly a man with wild eyes rushed',
			'out from the wooden toilet',
			'Foam on his face and waving a razor',
			'like a flag, shouting',
			'',
			"We'll take our vengeance now!",
			'',
			'We rang for Luboff',
			'on the pay phone, but there was',
			'no contact',
			'',
			'Get a Lawyer, I said. These swine have gone',
			'far enough.',
			'Now is the time to',
			'lay a writ on them,',
			'Cease and Desist'
		] },
		{ lines: [
			'This is the end',
			'Beautiful friend',
			'This is the end',
			'My only friend, the end',
			'',
			'Of our elaborate plans, the end',
			'Of everything that stands, the end',
			'No safety or surprise, the end',
			"I'll never look into your eyes again",
			'Can you picture what will be?',
			'So limitless and free',
			'Desperately in need',
			"Of some stranger's hand",
			'In a desperate land',
			'',
			'Lost in a Roman wilderness of pain',
			'And all the children are insane',
			'All the children are insane',
			'Waiting for the summer rain, yeah',
			'',
			"There's danger on the edge of town",
			"Ride the King's Highway, baby",
			'Weird scenes inside the gold mine',
			'Ride the highway west, baby',
			'Ride the snake, ride the snake',
			'To the lake, the ancient lake, baby',
			"The snake, he's long, seven miles",
			'',
			'Ride the snake',
			"He's old and his skin is cold",
			'The west is the best',
			'The west is the best',
			'Get here and we\'ll do the rest',
			'The blue bus is calling us',
			'The blue bus is calling us',
			'Driver, where you taking us?'
		] },
		{ lines: [
			"Summertime and the livin's easy",
			"Bradley's on the microphone with Ras M.G.",
			'All the people in the dance will agree',
			"That we're well qualified to represent the LBC",
			'Me, and me and Louie run to the party',
			'Dance to the rhythm it gets harder',
			'',
			'Me and my girl got this relationship',
			'I love her so bad, but she treats me like sh',
			'On lock down like a penitentiary',
			"She spreads her lovin' all over and when she gets home",
			"There's none left for me",
			'',
			"Summertime and the livin's easy",
			"Bradley's on the microphone with Ras M.G.",
			'All the people in the dance will agree',
			"That we're well qualified to represent the LBC",
			'Me, and me and Louie run to the party',
			'Dance to the rhythm it gets harder',
			'',
			'Oh take this veil from off my eyes',
			'My burning sun will someday rise',
			"What am I gonna be doin' for a while?",
			'Said I\'m gonna play with myself',
			"Show them now we've come off the shelf"
		] },
		{ lines: [
			'You could be my silver spring',
			"Blue green colors flashin'",
			'I would be your only dream',
			'Your shining autumn, ocean crashing',
			'',
			"And don't say that she's pretty",
			'And did you say that she love you',
			"Baby, I don't wanna know",
			'',
			"So I'll begin not to love you",
			'Turn around, see me runnin\'',
			"I'll say I loved you years ago",
			'Tell myself you never loved me, no',
			'',
			"Don't say that she's pretty",
			'And did you say that she love you',
			"Baby, I don't wanna know",
			'Oh, can you tell me was it worth it',
			"Baby, I don't wanna know",
			'',
			'Time casts a spell on you but you won\'t forget me',
			'I know I could have loved you but you would not let me',
			'',
			'Time casts a spell on you but you won\'t forget me',
			'I know I could have loved you but you would not let me',
			'Well, time casts a spell on you but you won\'t forget me',
			'But I know I could have loved you but you would not let me',
			'Well, time casts a spell on you but you won\'t forget me',
			'But I know I could have loved you but you would not let me, go ahead and try'
		] }
	]

	// selecting a random poem to show first
	// let currentIndex = Math.floor(Math.random() * poems.length)

	// creating element
	// let randomPoemElement = document.createElement('section')
	// randomPoemElement.classList.add('random-poem')

	// filling the element with the poem's lines
	// let showPoem = (poem) => {
	// 	randomPoemElement.innerHTML = ''
	// 	poem.lines.forEach((line) => {
	// 		let lineElement = document.createElement('p')
	// 		lineElement.textContent = line
	// 		randomPoemElement.appendChild(lineElement)
	// 	})
	// }

	// show the first poem
	// showPoem(poems[currentIndex])
	// document.body.appendChild(randomPoemElement)

	// adding and remove hidden class if we have poems in localStorage
	// updated to fade as well
	// if (localStorage.length == 0) {
	// 	randomPoemElement.style.opacity = '0'
	// 	randomPoemElement.classList.remove('hidden')
	// 	requestAnimationFrame(() => { 
	// 		randomPoemElement.style.opacity = '1' 
	// 	})
	// } else {
	// 	randomPoemElement.classList.add('hidden')
	// }

	// rotate to next poem
	// setInterval(() => {
	// 	// only rotate if element is visible
	// 	if (randomPoemElement.classList.contains('hidden')) { 
	// 		return 
	// 	}
	// 	// fade out
	// 	randomPoemElement.style.opacity = '0'
	// 	randomPoemElement.addEventListener('transitionend', () => {
	// 		// move to next poem
	// 		currentIndex = (currentIndex + 1) % poems.length
	// 		showPoem(poems[currentIndex])
	// 		// fade in
	// 		requestAnimationFrame(() => { 
	// 			randomPoemElement.style.opacity = '1' 
	// 		})
	// 		// this again to prevent overlap
	// 	}, { once: true })
	// }, 5000)

	// creating container instead to show 4 poems at once
	let currentIndex = 0
	let container = document.createElement('section')
	container.id = 'random-poems-container'

	let poemElements = []
	// this loop is easier for me than forEach tbh
	for (let i = 0; i < 4; i++) {
		let element = document.createElement('section')
		element.classList.add('random-poem')
		container.appendChild(element)
		poemElements.push(element)
	}

	// fill each element with a different poem from the array
	let showPoems = (startIndex) => {
		poemElements.forEach((element, i) => {
			let poem = poems[(startIndex + i) % poems.length]
			element.innerHTML = ''
			poem.lines.forEach((line) => {
				let lineElement = document.createElement('p')
				lineElement.textContent = line
				element.appendChild(lineElement)
			})
		})
	}

	// set opacity to 0 before adding to dom to prevent flash
	container.style.opacity = '0'
	showPoems(currentIndex)
	document.body.appendChild(container)

	// show or hide based on localStorage
	if (localStorage.length == 0) {
		requestAnimationFrame(() => { 
			container.style.opacity = '1' 
		})
	} else {
		container.classList.add('hidden')
	}

	// rotate all poems at the same time
	setInterval(() => {
		if (container.classList.contains('hidden')) { return }
		container.style.opacity = '0'
		container.addEventListener('transitionend', () => {
			let nextIndex = Math.floor(Math.random() * poems.length)
			if (nextIndex === currentIndex) {
				nextIndex = (nextIndex + 1) % poems.length
			}
			currentIndex = nextIndex
			showPoems(currentIndex)
			requestAnimationFrame(() => { 
				container.style.opacity = '1' 
			})
		}, { once: true })
	}, 5000)

	// fetching api poems in the background and swapping the array after its done loading
	let apiPoems = await getRandomPoems()
	poems = apiPoems
}

// cycling placeholder text for input area
let placeholders = [
	'Write what you feel',
	'Write what you hear',
	'Write what you see',
	"Write what's on your mind",
	'Write what lingers',
	"Write what won't leave you alone",
	"Write what you can't say out loud"
]

// choosing random placeholder
let placeholderIndex = Math.floor(Math.random() * placeholders.length)
let dotCount = 1

poemText.placeholder = placeholders[placeholderIndex] + '.'

// animating the elipsis
setInterval(() => {
	if (dotCount === 1) {
		poemText.placeholder = placeholders[placeholderIndex] + '.'
	}
	if (dotCount === 2) {
		poemText.placeholder = placeholders[placeholderIndex] + '..'
	}
	if (dotCount === 3) {
		poemText.placeholder = placeholders[placeholderIndex] + '...'
	}

	// incrementing dot count every cycle
	dotCount++

	if (dotCount > 3) {
		dotCount = 1
	}

}, 500)

// next random placeholder when a poem is submitted
let nextPlaceholder = () => {
	placeholderIndex = Math.floor(Math.random() * placeholders.length)
	dotCount = 1
	poemText.placeholder = placeholders[placeholderIndex] + '.'
}

// focus on textarea when any key is pressed
document.addEventListener('keydown', (event) => {
	// also using shift will submit the poem or save it
	if (event.key === 'Enter' && event.shiftKey) {
		event.preventDefault()
		if (modal.classList.contains('hidden')) {
			submitButton.click()
		} else {
			modalSave.click()
		}
	} else if (event.key.length === 1) {
		if (modal.classList.contains('hidden')) {
			poemText.focus()
		} else {
			modalText.focus()
		}
	}
})

// display poems once the page loads
displayPoems()
displayRandomPoem()
// animation for page fade in on load
requestAnimationFrame(() => {
	document.body.style.opacity = '1'
})