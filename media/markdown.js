// @ts-check

// Script run within the webview itself.
(function () {
	// Get a reference to the VS Code webview api.
	// We use this API to post messages back to our extension.

	// @ts-ignore
	const vscode = acquireVsCodeApi();

	const mainContainer = /** @type {HTMLElement} */ (document.querySelector('.main'));
	const contentContainer = document.querySelector('.content');

	const errorContainer = document.createElement('div');
	document.body.appendChild(errorContainer);
	errorContainer.className = 'error';
	errorContainer.style.display = 'none';

	/**
	 * Render the document in the webview.
	 */
	function updateContent(/** @type {string} */ text) {
		console.log(
			'\ntext\n',
			text,
			'\ncontentContainer.textContent\n',
			contentContainer.textContent,
			'\n\n\n'
		);
		try {
			// TODO: Check if text is valid markdown
		} catch {
			mainContainer.style.display = 'none';
			errorContainer.innerText = 'Error: Document is not valid markdown';
			errorContainer.style.display = '';
			return;
		}
		mainContainer.style.display = '';
		errorContainer.style.display = 'none';

		// Render the content
		if (contentContainer.textContent != text) {
			contentContainer.textContent = text;
		}

		document.querySelector('.content').addEventListener('input', () => {
			vscode.postMessage({
				type: 'change',
				text: contentContainer.textContent,
			});
		});
	}

	// Handle messages sent from the extension to the webview
	window.addEventListener('message', (event) => {
		const message = event.data; // The data that the extension sent
		switch (message.type) {
			case 'update':
				const text = message.text;

				// Update our webview's content
				updateContent(text);

				// Then persist state information.
				// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
				vscode.setState({ text });

				return;
		}
	});

	// Webviews are normally torn down when not visible and re-created when they become visible again.
	// State lets us save information across these re-loads
	const state = vscode.getState();
	if (state) {
		updateContent(state.text);
	}
})();
