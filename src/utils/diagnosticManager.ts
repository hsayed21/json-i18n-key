import * as vscode from 'vscode';
import { SUPPORTED_LANGUAGES, DEBOUNCE_DELAY, DIAGNOSTIC_KEY_PATH_REGEX, DIAGNOSTIC_SEVERITY, DIAGNOSTIC_FIXES } from './constants';
import debounce from './debounce';

export class DiagnosticManager {
    private readonly collection: vscode.DiagnosticCollection;
    private keys: Set<string>;

    constructor(keys: Set<string>) {
        this.collection = vscode.languages.createDiagnosticCollection('json-i18n-key');
        this.keys = keys;
        this.registerCodeActionProvider();
    }

    private registerCodeActionProvider() {
        vscode.languages.registerCodeActionsProvider(SUPPORTED_LANGUAGES, {
            provideCodeActions: (document, range, context) => {
                const diagnostics = context.diagnostics;
                const codeActions: vscode.CodeAction[] = [];

                diagnostics.forEach(diagnostic => {
                    if (diagnostic.source === 'json-i18n-key') {
                        const key = this.getKeyFromDiagnostic(diagnostic);
                        
                        // Add quick fix for missing translation
                        if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                            const action = new vscode.CodeAction(
                                DIAGNOSTIC_FIXES.ADD_KEY,
                                vscode.CodeActionKind.QuickFix
                            );
                            action.command = {
                                command: 'json-i18n-key.addKey',
                                title: DIAGNOSTIC_FIXES.ADD_KEY,
                                arguments: [key]
                            };
                            action.diagnostics = [diagnostic];
                            action.isPreferred = true;
                            codeActions.push(action);
                        }
                    }
                });

                return codeActions;
            }
        });
    }

    private getKeyFromDiagnostic(diagnostic: vscode.Diagnostic): string {
        const match = diagnostic.message.match(/key: (.*?)$/);
        return match ? match[1] : '';
    }

    public dispose() {
        this.collection.dispose();
    }

    public updateKeys(newKeys: Set<string>) {
        const hasChanges = newKeys.size !== this.keys.size || 
                          ![...newKeys].every(key => this.keys.has(key));
        
        if (hasChanges) {
            this.keys = new Set(newKeys);
            this.updateAllDiagnostics();
            return true;
        }
        return false;
    }

    private getDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
        if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
            return [];
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        let match;

        while ((match = DIAGNOSTIC_KEY_PATH_REGEX.exec(text)) !== null) {
            const key = match[1];
            if (!this.keys.has(key)) {
                const range = new vscode.Range(
                    document.positionAt(match.index),
                    document.positionAt(match.index + match[0].length)
                );
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `${DIAGNOSTIC_SEVERITY.MISSING_KEY.message}: ${key}`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'json-i18n-key';
                diagnostic.code = 'missing-translation';
                diagnostics.push(diagnostic);
            }
        }

        return diagnostics;
    }

    public readonly updateDiagnostics = debounce((document: vscode.TextDocument) => {
        if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
            return;
        }
        this.collection.set(document.uri, this.getDiagnostics(document));
    }, DEBOUNCE_DELAY);

    public updateAllDiagnostics() {
        vscode.workspace.textDocuments
            .filter(doc => SUPPORTED_LANGUAGES.includes(doc.languageId))
            .forEach(doc => this.updateDiagnostics(doc));
    }
}
