import * as vscode from 'vscode';

export class JsonI18nKeySettings {
	private static _instance: JsonI18nKeySettings;

	enJsonFilePath: string;
	translationFiles: TranslationFile[];
	typeOfGetKey: 'Selection' | 'Clipboard' | 'Manual';
	enableCopilotTranslation: boolean;
	preserveFormating: boolean;
	overrideKeyIfExistsWhenAdding: boolean;
	overrideKeyIfExistsWhenUpdating: boolean;
	autoDetectTranslations: boolean;
	keyFormat: 'None' | 'PascalCase' | 'camelCase' |'snake_case' | 'kebab-case';

	private constructor() {
			const settings = vscode.workspace.getConfiguration('json-i18n-key') as unknown as Settings;
			this.translationFiles = settings.translationFiles.sort((a, b) => a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1);
			this.typeOfGetKey = settings.typeOfGetKey;
			this.enableCopilotTranslation = settings.enableCopilotTranslation;
			this.preserveFormating = settings.preserveFormating;
			this.overrideKeyIfExistsWhenAdding = settings.overrideKeyIfExistsWhenAdding;
			this.overrideKeyIfExistsWhenUpdating = settings.overrideKeyIfExistsWhenUpdating;
			this.autoDetectTranslations = settings.autoDetectTranslations;
			this.keyFormat = settings.keyFormat;
		  this.enJsonFilePath = settings.translationFiles.find(file => file.lang === 'en' && file.isDefault == true)?.filePath || '';
	}

	static get instance(): JsonI18nKeySettings {
			// if (!JsonI18nKeySettings._instance) {
					JsonI18nKeySettings._instance = new JsonI18nKeySettings();
			// }
			return JsonI18nKeySettings._instance;
	}

	async updateConfig(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace) {
		try {
				const config = vscode.workspace.getConfiguration('json-i18n-key');
				await config.update(key, value, target);
				vscode.window.showInformationMessage(`Configuration updated: ${key}`);
				// Reload the settings after the update
				JsonI18nKeySettings._instance = new JsonI18nKeySettings();
		} catch (error) {
				vscode.window.showErrorMessage(`Failed to update configuration: ${error}`);
		}
	}
}

interface Settings {
	translationFiles: TranslationFile[];
	typeOfGetKey: 'Selection' | 'Clipboard' | 'Manual';
	enableCopilotTranslation: boolean;
	preserveFormating: boolean;
	overrideKeyIfExistsWhenAdding: boolean;
	overrideKeyIfExistsWhenUpdating: boolean;
	autoDetectTranslations: boolean;
	keyFormat: 'None' | 'PascalCase' | 'camelCase' | 'snake_case' | 'kebab-case';
}

interface TranslationFile {
	lang: string;
	filePath: string;
	isDefault: boolean;
}
