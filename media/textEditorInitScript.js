// Get a reference to the VS Code webview api.
// We use this API to post messages back to our extension.

// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * Render the document in the webview.
 */
function updateContent(/** @type {string} */ text) {
	console.log('Webview ran updateContent()', text);

	// Render the content
	const editor = document.querySelector('#editor');
	editor.textContent = text;
}

// Add listener for user modifying text in the editor
editor.addEventListener('input', (e) => {
	const data = e.target.textContent;
	console.log('Webview sent message: webviewChanged', data);
	vscode.postMessage({
		type: 'webviewChanged',
		text: data,
	});
});

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
	const message = event.data; // The data that the extension sent
	switch (message.type) {
		case 'documentChanged':
			console.log('Webview recieved message: documentChanged', event.data);
			const text = message.text;

			// Update our webview's content.
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

vscode.postMessage({
	type: 'initialized',
});
