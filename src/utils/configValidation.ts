import * as vscode from 'vscode';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';

export async function validateTranslationConfig(): Promise<boolean> {
    await autoDetectI18nFiles();

    const settings = JsonI18nKeySettings.instance;

    if (!settings.translationFiles || settings.translationFiles.length === 0) {
        vscode.window.showErrorMessage(
            'No translation files configured. Please configure translation files in settings.'
        );
        return false;
    }

    if (!settings.enJsonFilePath) {
        vscode.window.showErrorMessage(
            'English translation file not configured. Please set up a translation file with lang="en" and isDefault=true in settings.'
        );
        return false;
    }

    return true;
}
