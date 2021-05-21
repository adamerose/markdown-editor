import * as vscode from 'vscode';
import { getNonce } from './util';

/**
 * Provider for text editors.
 *
 * Text editors are used for `.txt` files.
 * To get started, run this extension and open a `.md` file in VS Code.
 *
 * This provider demonstrates:
 *
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class TextEditorProvider implements vscode.CustomTextEditorProvider {
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new TextEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(
			TextEditorProvider.viewType,
			provider
		);
		return providerRegistration;
	}

	private static readonly viewType = 'markdownEditorExtension.text';

	constructor(private readonly context: vscode.ExtensionContext) {}

	/**
	 * Called when our custom editor is opened.
	 *
	 *
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview() {
			const text = document.getText();
			console.log('VS Code sent message: documentChanged', text);
			webviewPanel.webview.postMessage({
				type: 'documentChanged',
				text: text,
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		//
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const saveDocumentSubscription = vscode.workspace.onDidSaveTextDocument((e) => {
			console.log('onDidSaveTextDocument');
			updateWebview();
		});

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
			console.log('onDidChangeTextDocument: ', e.document.getText());
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			console.log('Disposed');
			changeDocumentSubscription.dispose();
			saveDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage((e) => {
			switch (e.type) {
				case 'webviewChanged':
					console.log('VS Code recieved message: webviewChanged', e.text);
					this.updateTextDocument(document, e.text);
					return;
				case 'initialized':
					console.log('VS Code recieved message: initialized');
					updateWebview();
					return;
			}
		});
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'media', 'textEditorInitScript.js')
		);

		return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Text Editor</title>
			</head>
			<body>
				<div id="editor" contenteditable="true">
					<p>Here goes the initial content of the editor.</p>
				</div>

				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	/**
	 * Write out the text to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, text: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);

		console.log('VS Code ran applyEdit', text);
		return vscode.workspace.applyEdit(edit).then(
			() => {
				console.log('VS Code finished applyEdit', text);
			},
			() => {
				console.log('VS Code failed applyEdit', text);
			}
		);
	}
}
