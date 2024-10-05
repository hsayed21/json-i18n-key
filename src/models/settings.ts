export interface JsonI18nKeySettings {
	translationFiles: TranslationFile[];
	typeOfGetKey: 'Selection' | 'Clipboard' | 'Manual';
	enableCopilotTranslation: boolean;
	preserveFormating: boolean;
}

interface TranslationFile {
	lang: string;
	filePath: string;
	isDefault: boolean;
}
