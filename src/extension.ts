import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './markdownEditor';
import { TextEditorProvider } from './textEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(MarkdownEditorProvider.register(context));
	context.subscriptions.push(TextEditorProvider.register(context));
}
