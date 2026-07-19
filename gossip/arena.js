let channelSlug = 'gossip-4rjknshdafi' // The “slug” is just the end of the URL.
let myUsername = 'ali-salifov' // For linking to your profile.

// First, let’s lay out some *functions*, starting with our basic metadata:
let placeChannelInfo = (channelData) => {
	// console.log(channelTitle)
	// Then set their content/attributes to our data:
	// Target some elements in your HTML:
	let channelTitle = document.querySelector('#channel-title')
	let channelDescription = document.querySelector('#channel-description')
	let channelLink = document.querySelector('#channel-link')

	channelTitle.innerHTML = channelData.title
	channelDescription.innerHTML = channelData.description.html
	channelLink.href = `https://www.are.na/channel/${channelSlug}`
}

// Then our big function for specific-block-type rendering:
let renderBlock = (blockData) => {
	// To start, a shared `ul` where we’ll insert all our blocks
	let channelBlocks = document.querySelector('#channel-blocks')

	// Links!
	if (blockData.type == 'Link') {
		// Declares a “template literal” of the dynamic HTML we want.
		let linkItem =
		// the setup here is basically a list element that contains the thumbnail with a preview image and a dialog that contains full content of the link and a section for the close and share buttons, the other blocks follow the same pattern. im also adding a data attribute to the dialog to store the share url for the share button
			`
			<li class="link-block">
				<button type="button" class="link-button">
					<img alt="${blockData.image.alt_text}" src="${ blockData.image.large.src_2x }">
				</button>
				<dialog data-share-url="${blockData.source.url}">
					<section class="dialog-container link-dialog-container">
						<section class="dialog-middle-button-container">
							<a href="${blockData.source.url}">
								<div class="dialog-middle-button">
									<img src="assets/button.svg" alt="Read">
									<p>Read</p>
								</div>
								<img alt="${blockData.image.alt_text}" src="${blockData.image.large.src_2x}" class="thumbnail">
							</a>
						</section>
						<section class="dialog-buttons">
							<button type="button" class="dialog-close">
								<img src="assets/button.svg" alt="Close">
								<p>Close</p>
							</button>
							<button type="button" class="dialog-share">
								<img src="assets/button.svg" alt="Share">
								<p>Share</p>
							</button>
						</section>
					</section>
				</dialog>
			</li>
			`

		// And puts it into the page!
		channelBlocks.insertAdjacentHTML('beforeend', linkItem)

		// More on template literals:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	}

	// Images!
	else if (blockData.type == 'Image') {
		// …up to you!
		let imageItem =
			`
			<li class="image-block">
				<button type="button" class="image-button">
					<img alt="${blockData.image.alt_text}" src="${ blockData.image.large.src_2x }" class="image-thumbnail">
				</button>
				<dialog data-share-url="${blockData.image.large.src_2x}">
					<section class="dialog-container">
						<img src="${blockData.image.large.src_2x}" class="thumbnail">
						<section class="dialog-buttons">
							<button type="button" class="dialog-close">
								<img src="assets/button.svg" alt="Close">
								<p>Close</p>
							</button>
							<button type="button" class="dialog-share">
								<img src="assets/button.svg" alt="Share">
								<p>Share</p>
							</button>
						</section>
					</section>
				</dialog>
			</li>
			`

		// puts it into the page!
		channelBlocks.insertAdjacentHTML('beforeend', imageItem)
	}

	// Text!
	else if (blockData.type == 'Text') {
		// …up to you!
		let textItem =
			`
			<li class="text-block">
				<button type="button" class="text-button">
					<img src="assets/text-button.svg" alt="Read Text">
				</button>
				<dialog data-share-url="https://www.are.na/block/${blockData.id}">
					<section class="dialog-container">
						<section class="text-content">
							<p>${blockData.content.html}</p>
						</section>
						<section class="dialog-buttons">
							<button type="button" class="dialog-close">
								<img src="assets/button.svg" alt="Close">
								<p>Close</p>
							</button>
							<button type="button" class="dialog-share">
								<img src="assets/button.svg" alt="Share">
								<p>Share</p>
							</button>
						</section>
					</section>
				</dialog>
			</li>
			`

		// puts it into the page!
		// console.log(`${blockData.content.html}`); testing
		channelBlocks.insertAdjacentHTML('beforeend', textItem)
	}

	// Uploaded (not linked) media…
	else if (blockData.type == 'Attachment') {
		let contentType = blockData.attachment.content_type // Save us some repetition.

		// Uploaded videos!
		if (contentType.includes('video')) {
			// …still up to you, but we’ll give you the `video` element:
			let videoItem =
				`
				<li class="video-block">
					<button type="button" class="video-button">
						<img alt="${blockData.image.alt_text}" src="${ blockData.image.large.src_2x }">
					</button>
					<dialog data-share-url="${blockData.attachment.url}">
						<video controls src="${blockData.attachment.url}" class="thumbnail"></video>
						<button class="close"></button>
					</dialog>
				</li>
				`

			channelBlocks.insertAdjacentHTML('beforeend', videoItem)

			// More on `video`, like the `autoplay` attribute:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
		}

		// Uploaded PDFs!
		else if (contentType.includes('pdf')) {
			// …up to you!
			let pdfItem =
				`
				<li class="pdf-block">
					<button type="button" class="pdf-button">
						<img alt="${blockData.image.alt_text}" src="${ blockData.image.large.src_2x }">
					</button>
					<dialog data-share-url="${blockData.attachment.url}">
						<iframe src="${blockData.attachment.url}" class="thumbnail"></iframe>
						<button class="close"></button>
					</dialog>
				</li>
				`

				channelBlocks.insertAdjacentHTML('beforeend', pdfItem)
		}

		// Uploaded audio!
		else if (contentType.includes('audio')) {
			// …still up to you, but here’s an `audio` element:
			let audioItem =
				`
				<li class="audio-block">
					<button type="button" class="audio-button">
						<img src="assets/audio-button.svg" alt="Play Audio">
					</button>
					<dialog data-share-url="${blockData.attachment.url}">
						<section class="dialog-container">
							<audio controls src="${blockData.attachment.url}" class="thumbnail"></audio>
							<section class="dialog-buttons">
								<button type="button" class="dialog-close">
									<img src="assets/button.svg" alt="Close">
									<p>Close</p>
								</button>
								<button type="button" class="dialog-share">
									<img src="assets/button.svg" alt="Share">
									<p>Share</p>
								</button>
							</section>
						</section>
					</dialog>
				</li>
				`

			channelBlocks.insertAdjacentHTML('beforeend', audioItem)

			// More on`audio`:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
		}
	}

	// Linked (embedded) media…
	else if (blockData.type == 'Embed') {
		let embedType = blockData.embed.type

		// Linked video! (Youtube)
		if (embedType.includes('video')) {
			// …still up to you, but here’s an example `iframe` element:
			// changed it to an image thumbnail of the video
			let linkedVideoItem =
				`
				<li class="video-block">
					<button type="button" class="video-button">
						<img src="assets/play-button.svg" alt="Play Video" class="play-button">
						<img alt="${blockData.image.alt_text}" src="${ blockData.image.src }" class="video-thumbnail">
					</button>
					<dialog data-share-url="${blockData.source.url}">
						<section class="dialog-container">
							${ blockData.embed.html }
							<section class="dialog-buttons">
								<button type="button" class="dialog-close">
									<img src="assets/button.svg" alt="Close">
									<p>Close</p>
								</button>
								<button type="button" class="dialog-share">
									<img src="assets/button.svg" alt="Share">
									<p>Share</p>
								</button>
							</section>
						</section>
					</dialog>
				</li>
				`

			channelBlocks.insertAdjacentHTML('beforeend', linkedVideoItem)

			// More on `iframe`:
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		}
	}
}

// function to enable modal opening and closing, from eric's example 
let initInteraction = () => {
	let blocks = document.querySelectorAll('.image-block, .text-block, .link-block, .pdf-block, .video-block, .audio-block')
	blocks.forEach((block) => {
		let openButton = block.querySelector('.image-button, .text-button, .link-button, .pdf-button, .video-button, .audio-button')
		let dialog = block.querySelector('dialog')
		let closeButton = dialog.querySelector('button')
		let shareButton = dialog.querySelector('.dialog-share')

		openButton.onclick = () => {
			dialog.showModal()
		}

		closeButton.onclick = () => {
			dialog.close()
			stopVideos()
		}

		// adding an event listener to the share button to share the original content of the dialog 
		shareButton.onclick = () => shareContent(getURL(dialog))

		dialog.onclick = (event) => { // Listen on our `modal` also…
			if (event.target == dialog) { // Only if clicks are to itself (the background).
				dialog.close() // Close it then too.
				stopVideos()
			}
		}

		// adding an event listener to the dialog to close it when the OMG! button is clicked
		document.getElementById('omg-button').addEventListener('click', feelingLucky)
	})
}

// using this example michael shared with me to stop the videos and iframes from playing when the dialog is closed, from https://gist.github.com/cferdinandi/9044694?permalink_comment_id=3324219#gistcomment-3324219
let stopVideos = () => {
	document.querySelectorAll('iframe').forEach(v => { v.src = v.src });
	document.querySelectorAll('video').forEach(v => { v.pause() });
	document.querySelectorAll('audio').forEach(a => { a.pause() });
};

// content filtering function to hide and unhide certain blocks by assigning class
let filterBlocks = (filter) => {
	// selecting the main container and the blocks 
	let allBlocks = document.querySelector('#channel-blocks')
	let blocks = allBlocks.querySelectorAll('li')

	// looping through the blocks 
	blocks.forEach((block) => {
		// checking if the block is an image or a video 
		let allImages = block.classList.contains('image-block')
		let allVideos = block.classList.contains('video-block')

		// creating andsetting the show variable to false 
		let show = false

		// checking if the button clicked is all, images, videos, or others 
		if (filter === 'all') {
			show = true
		} else if (filter === 'images') {
			show = allImages
		} else if (filter === 'videos') {
			show = allVideos
		} else if (filter === 'others') {
			// if the block is not an image or a video, then show is true
			show = !allImages && !allVideos
		}

		// toggling the hidden class 
		block.classList.toggle('hidden', !show)
	})
}

// a function to change the position of the select button based on the button clicked 
// im doing this because originally i wanted to move the green svg left/right with an animation so i created an invisible wrapper for it and everything but i couldnt figure out how to make it work with a flex container so i tried using relative units to position and move it, couldnt figure it out, so this is kinda leftover from that idea but now just functions as a visual cue for the selected filter (static)
let navAnimation = () => {
	// targetting the selection green svg element 
	let selectedButton = document.querySelector('.nav-select')

	// an array of the filter buttons and their ids 
	let filters = [
		['all', 'filter-all-button'],
		['images', 'filter-images-button'],
		['videos', 'filter-videos-button'],
		['others', 'filter-others-button']
	]

	// looping through the filters 
	filters.forEach(([filter, id]) => {
		// targeting the button clicked
		let button = document.getElementById(id)
		// adding an event listener to the button clicked
		button.addEventListener('click', () => {
			filterBlocks(filter)
			// targeting the parent element of the button clicked
			let wrapper = button.parentElement
			// inserting the selection svg before the first child of the wrapper 
			if (wrapper) wrapper.insertBefore(selectedButton, wrapper.firstChild)
		})
	})
}

// a function to get the share url from the dialog data attribute 
let getURL = (dialog) => {
	// using getAttribute() to get the data-share-url attribute from the dialog, from MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute 
	return dialog.getAttribute('data-share-url')
}

// any double click or accidental click on the share button would trigger it multiple times and prevent the share menu from opening, so now im using a boolean to check if the share is already in progress and if it is, to return and not trigger it again

// a boolean to check if the share is already in progress
let sharing = false

// a function to pass the url to the share() method
// async function is used here because the share() method is asynchronous and needs to be awaited to wait for the share to complete, from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function and https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
let shareContent = async (url) => {
	// if the share is already in progress, return and not trigger it again 
	if (sharing) return
	// if the share is not in progress, set the sharing boolean to true
	sharing = true
	// using try/finally to set the sharing boolean to false after the share is complete, this is again to prevent multiple shares from being triggered, from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
	try {
		// using await to wait for the share() method to complete 
		await navigator.share({ url })
	// finally is run regardless of whether the share is successful or not, but all the urls are valid so it should always run, I got this from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch 
	} finally {
		sharing = false
	}
}

// a function to randomly select a block and open the dialog using the OMG! button 
let feelingLucky = () => {
	// selecting all the blocks 
	let blocks = document.querySelectorAll('.image-block, .text-block, .link-block, .pdf-block, .video-block, .audio-block')
	// selecting a random block using math.floor() to get a random index and then selecting the block at that index because the math.random() returns a number from 0-1, we need to multiply it by the number of blocks to get a random index, but also math.floor() to round up to the nearest integer, from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor 
	let randomBlock = blocks[Math.floor(Math.random() * blocks.length)]
	// selecting the dialog of the random block 
	let dialog = randomBlock.querySelector('dialog')
	// running the showModal() function to open it 
	dialog.showModal()
}

// a function to add a scrolled class to the header when the user scrolls down 
let logoAnimate = () => {
	// selecting the header 
	let header = document.querySelector('header')

	// a function to update the header when the user scrolls down 
	let updateHeader = () => {
		// only run the function if the window is less than 1401px wide
		if (window.innerWidth < 1401) {
			// using window.scrollY to get the number of pixels the user has scrolled down and toggling the scrolled class on the header if the user has scrolled down more than 0 pixels, scrollY on MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY
			header.classList.toggle('scrolled', window.scrollY > 0)
		} else {
			// if the window is greater than 481px wide, remove the scrolled class from the header
			header.classList.remove('scrolled')
		}
	}

	// adding an event listener to the window to run the updateHeader function when the user scrolls or resizes the window
	window.addEventListener('scroll', updateHeader)
	window.addEventListener('resize', updateHeader)
	updateHeader()
}

// an array of the fonts to animate the omg button
let fonts = ['"Syne", sans-serif', '"Bricolage Grotesque", sans-serif', '"Alegreya", serif']
// a variable to keep track of the current font being used
let fontCycle = 0

// same thing for the font weights
let weights = [700, 800]
let weightCycle = 0

// a function to animate the omg button
let animateOMG = () => {
	// selecting the omg button text
	let omgButton = document.querySelector('#omg-button p')
	// setting the font family to the current font in the array
	omgButton.style.fontFamily = fonts[fontCycle]
	// setting the font weight to one of the options in the array
	omgButton.style.fontWeight = weights[weightCycle]
	// i learned about the modulo operator trick a long time ago from my first computer science class at nyu back in 2019, I basically use it here to loop through the fonts array and reset it to 0 when it reaches the end
	fontCycle = (fontCycle + 1) % fonts.length
	// also using length here to calculate the size of the array
	weightCycle = (weightCycle + 1) % weights.length
}

// Finally, a helper function to fetch data from the API, then run a callback function with it:
let fetchJson = (url, callback, pageResponses = []) => {
	fetch(url, { cache: 'no-store' })
		.then((response) => response.json())
		.then((json) => {
			// Add this page to our temporary “accumulator” list parameter (an array).
			pageResponses.push(json)

			// Are.na response includes this “there are more!” flag (a boolean):
			if (json.meta && json.meta.has_more_pages) { // If that exists and is `true`, keep going…
				// Fetch *another* page worth, passing along our previous/accumulated responses.
				fetchJson(`${url}&page=${pageResponses.length + 1}`, callback, pageResponses)
			} else { // If it is `false`, there are no more pages…
				// “Flattens” them all together as if they were one page response.
				json.data = pageResponses.flatMap((page) => page.data)

				// Return the data to the callback!
				callback(json)
			}
	})
}

// More on `fetch`:
// https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch

// Now that we have said all the things we *can* do, go get the channel data:
fetchJson(`https://api.are.na/v3/channels/${channelSlug}`, (json) => {
	// console.log(json) // Always good to check your response!

	placeChannelInfo(json) // Pass all the data to the first function, above.
})

// And the data for the blocks:
fetchJson(`https://api.are.na/v3/channels/${channelSlug}/contents?per=100&sort=position_desc`, (json) => {
	// console.log(json) // See what we get back.

	// Loop through the nested `.data` array (list).
	json.data.forEach((blockData) => {
		// console.log(blockData) // The data for a single block.

		renderBlock(blockData) // Pass the single block’s data to the render function.
	})

	// initialize interaction with the blocks, from eric's example 
	initInteraction()

	// enabling the filter navigation selection logic 
	navAnimation()

	// enabling the logo scroll functionality 
	logoAnimate()

	// starting the omg button font cycle
	animateOMG()
	// setting an interval to run the animateOMG function every 2 seconds
	setInterval(animateOMG, 300)
})
