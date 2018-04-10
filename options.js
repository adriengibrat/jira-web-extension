const DEFAULT_SETTINGS = {
	url: 'https://jira.oodrive.net',
	jira: false,
	login: '',
	password: '',
}

chrome.storage.sync.get(DEFAULT_SETTINGS, settings => {
	Object.keys(settings)
		.forEach(key => {
			const input = document.querySelector(`input[type="text"][name="${key}"]`)
			if (input) input.value = settings[key]
			const checkbox = document.querySelector(`input[type="checkbox"][name="${key}"]`)
			if (checkbox) checkbox.checked = !!settings[key]
		})
})

document.querySelectorAll('input').forEach(input => input.addEventListener('blur', () => {
	const settings = Object.keys(DEFAULT_SETTINGS)
		.reduce(
			(settings, key) => {
				const input = document.querySelector(`input[type="text"][name="${key}"],input[type="password"][name="${key}"]`)
				if (input) return Object.assign(settings, { [key]: input.value })
				const checkbox = document.querySelector(`input[type="checkbox"][name="${key}"]`)
				if (checkbox) return Object.assign(settings, { [key]: checkbox.checked })
				return settings
			},
			{},
		)
	chrome.storage.sync.set(settings)
}))
