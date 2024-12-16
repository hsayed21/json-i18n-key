import * as vscode from 'vscode';

export class JsonI18nKeySettings {
	private static _instance: JsonI18nKeySettings;

	translationFiles: TranslationFile[] = [];
	typeOfGetKey: 'Selection' | 'Clipboard' | 'Manual';
	enableCopilotTranslation: boolean = false;
	preserveFormating: boolean = false;
	overrideKeyIfExistsWhenAdding: boolean = false;
	overrideKeyIfExistsWhenUpdating: boolean = true;
	enJsonFilePath: string = '';

	private constructor() {
			const settings = vscode.workspace.getConfiguration('json-i18n-key') as unknown as Settings;
			this.translationFiles = settings.translationFiles;
			this.typeOfGetKey = settings.typeOfGetKey;
			this.enableCopilotTranslation = settings.enableCopilotTranslation;
			this.preserveFormating = settings.preserveFormating;
			this.overrideKeyIfExistsWhenAdding = settings.overrideKeyIfExistsWhenAdding;
			this.overrideKeyIfExistsWhenUpdating = settings.overrideKeyIfExistsWhenUpdating;
		  this.enJsonFilePath = settings.translationFiles.find(file => file.lang === 'en' && file.isDefault == true)?.filePath || '';
	}

	static get instance(): JsonI18nKeySettings {
			if (!JsonI18nKeySettings._instance) {
					JsonI18nKeySettings._instance = new JsonI18nKeySettings();
			}
			return JsonI18nKeySettings._instance;
	}
}


interface Settings {
	translationFiles: TranslationFile[];
	typeOfGetKey: 'Selection' | 'Clipboard' | 'Manual';
	enableCopilotTranslation: boolean;
	preserveFormating: boolean;
	overrideKeyIfExistsWhenAdding: boolean;
	overrideKeyIfExistsWhenUpdating: boolean;
}

interface TranslationFile {
	lang: string;
	filePath: string;
	isDefault: boolean;
}
