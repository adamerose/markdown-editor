// Get a reference to the VS Code webview api.
// We use this API to post messages back to our extension.

// This was defined in markdownEditor.ts in the HTML snippet initializing CKEditor5. This line just stops IDE complaining.
// @ts-ignore
const editor = window.editor;
editor.timeLastModified = new Date();

// @ts-ignore
const vscode = acquireVsCodeApi();

editor.debounceActive = false;
const debounceDelay = 5;
const debounce = (callback, wait) => {
	let timeoutId = null;
	return (...args) => {
		window.clearTimeout(timeoutId);
		editor.debounceActive = true;
		timeoutId = window.setTimeout(() => {
			callback.apply(null, args);
			editor.debounceActive = false;
		}, wait);
	};
};

function waitFor(condition, callback) {
	if (!condition()) {
		window.setTimeout(waitFor.bind(null, condition, callback), 50);
	} else {
		callback();
	}
}

/**
 * Render the document in the webview.
 */
function updateContent(/** @type {string} */ text) {
	console.log('updateContent', text);
	try {
		// TODO: Check if text is valid markdown
	} catch {
		// TODO: Handle invalid markdown
	}

	// Render the content
	if (editor.getData() != text) {
		editor.setData(text);
	}

	console.log('getData', editor.getData());
}

// Add listener for user modifying text in the editor
editor.model.document.on('change:data', (e) => {
	const data = editor.getData();

	console.log('postMessage (webviewChanged)', data);
	editor.timeLastModified = new Date();
	vscode.postMessage({
		type: 'webviewChanged',
		text: data,
	});
});

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
	console.log('Recieved Message', event.data);
	const message = event.data; // The data that the extension sent
	switch (message.type) {
		case 'documentChanged':
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
