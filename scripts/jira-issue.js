((root, factory) => {
	'object' === typeof exports && 'undefined' !== typeof module ?
	module.exports = factory(require('tippy')) :
	'function' === typeof define && define.amd ? define(['tippy'], factory) :
	factory(root.tippy)
})(this, tippy => {
	const pattern = /\b[A-Z]{2,80}-\d+\b/g
	const skip = node => !node || ['script', 'style', 'jira'].includes(node.localName)
	const escape = str => {
		const div = document.createElement('div')
		div.appendChild(document.createTextNode(str == null ? '' : str))
		return div.innerHTML
	}
	const pop = node => {
		const tip = tippy(node, {
			maxWidth: '320px',
			delay: [200, 150],
			html: document.createElement('div'),
			performance: true,
			interactive: true,
			wait(show) {
				if (tip.loaded) return show()
				const content = html => {
					tip.tooltips.shift().popper.querySelector('.tippy-content').innerHTML = html
					tip.loaded = true
					show()
				}
				chrome.storage.sync.get(['url', 'login', 'password'], ({ url, login, password }) =>
					fetch(`${url}/rest/api/2/issue/${node.getAttribute('issue')}`, {
						headers: { Authorization: `Basic ${btoa([login, password].join(':'))}` },
					})
						.catch(() => {
							content('Provide valid URL & credentials in Jira web extension options ⭧')
						})
						.then(response => {
							if (response.status === 401)
								content('Please, provide valid credentials in Jira web extension options ⭧')
							if (response.status === 404)
								tip.destroy()
							return response.json()
						})
						.then(({ key, fields: { project, issuetype, priority, status, summary, description, labels, versions, fixVersions, assignee, progress } }) => {
							const version_link = version => `<a style="color:inherit" href="${url}/projects/${project.key}/versions/${version.id}" title="${escape(version.releaseDate)}">${version.name}</a>`
							const avatar = user => user ? `<img src="${user.avatarUrls['16x16']}" title="${escape(user.displayName)}" height="16" align="absmiddle">` :' '
							const icon = data => data ? `<img src="${data.iconUrl}" title="${escape(data.name)}" height="16" align="absmiddle"/>` : ''
							const versions_info = versions && versions.length  ? `<span title="Affected versions"><b>🗔</b> ${versions.map(version_link)}</span>` : ''
							const fixVersions_info = fixVersions && fixVersions.length ? `<span title="Target versions"><b>🞋</b> ${fixVersions.map(version_link)}</span>` : ''
							const labels_info = labels && labels.length ? `<span title="Labels"><b>🏷</b> ${labels.join(' ')}</span>` : ''
							const progress_info = ({ progress, percent }) => progress ? `<div style="background:lightgrey;"><div style="height:2px;background:green;width:${percent}%"></div></div>` : ''
							content(`
								${icon(issuetype)}
								${icon(priority)}
								${assignee ? avatar(assignee) : ''}
								<a style="color:inherit" href="${url}/browse/${key}" title="${escape(description)}">${summary}</a>
								${icon(status)}
								<p>${versions_info} ${fixVersions_info} ${labels_info}</p>
								${progress_info(progress)}
							`)
						})
				)
			},
		})
	}
	const wrap = node => {
		const iterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT, {
			acceptNode: node => !skip(node.parentNode) && pattern.test(node.data) && NodeFilter.FILTER_ACCEPT,
		})
		for (let node, temp = document.createElement('template'); node = iterator.nextNode();) {
			temp.innerHTML = node.data.replace(pattern, `<jira issue="$&">$&</jira>`)
			const wrappers = temp.content.querySelectorAll('jira[issue]')
			node.parentNode.replaceChild(temp.content, node)
			wrappers.forEach(pop)
		}
	}

	chrome.storage.sync.get(['url', 'jira'], ({ url, jira }) => {
		if (!jira && location.href.indexOf(url) === 0) return // disable on jira pages
		// Wrap loaded task ids occurences
		wrap(document)
		// Listen DOM added nodes to wrap injected task ids occurences
		new MutationObserver(mutations => mutations.forEach(
			mutation => mutation.addedNodes.forEach(wrap)
		)).observe(document, { childList: true, subtree: true })
	})
})
