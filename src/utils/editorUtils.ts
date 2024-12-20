import * as vscode from 'vscode';

export async function updateEditorKey(editor: vscode.TextEditor, oldKeyPath: string, newKeyPath: string) {
    await editor.edit((editBuilder) => {
        const range = editor.selection.isEmpty
            ? editor.document.lineAt(editor.selection.active).range
            : editor.selection;

        const text = editor.document.getText(range);
        const regex = new RegExp(`(['"])(${oldKeyPath.replace(/^['"]|['"]$/g, '')})(['"])`, 'g');
        const updatedText = text.replace(regex, `$1${newKeyPath}$3`);

        editBuilder.replace(range, updatedText);
    });
}
