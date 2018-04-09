const DEFAULT_SETTINGS = {
	url: 'https://jira.oodrive.net',
	login: '',
	password: '',
}

chrome.storage.sync.get(DEFAULT_SETTINGS, settings => {
	Object.keys(settings)
		.forEach(key => {
			const input = document.querySelector(`input[type="text"][name="${key}"]`)
			if (input) input.value = settings[key]
		})
})

document.querySelectorAll('input').forEach(input => input.addEventListener('blur', () => {
	const settings = Object.keys(DEFAULT_SETTINGS)
		.reduce(
			(settings, key) => {
				const input = document.querySelector(`input[name="${key}"]`)
				return Object.assign(settings, { [key]: input && input.value })
			},
			{},
		)
	chrome.storage.sync.set(settings)
}))
