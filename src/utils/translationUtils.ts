import * as vscode from 'vscode';

async function getTranslationFromCopilot(text: string, lang: string): Promise<string | false> {
	// Retrieve a specific model
	const [model] = await vscode.lm.selectChatModels({
		vendor: 'copilot',
		family: 'gpt-3.5-turbo'
	});

	// Creating a prompt
	if (!text || !lang) {
		return false;
	}

	const messages: vscode.LanguageModelChatMessage[] = [
		vscode.LanguageModelChatMessage.User(`Translate the text "${text}" to ${lang}. Provide ONLY the translated text with no additional explanation, code blocks, or formatting. Return the translation as plain text.`),
	];

	// Sending the prompt
	let chatResponse: vscode.LanguageModelChatResponse | undefined;
	try {
		chatResponse = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
	} catch (err) {
		if (err instanceof vscode.LanguageModelError) {
			// console.log(err.message, err.code, err.cause);
		} else {
			// If the error is not a LanguageModelError, you can rethrow it or handle it accordingly
		}
		return false;
	}

	const allFragments: string[] = [];
	for await (const fragment of chatResponse.text) {
		allFragments.push(fragment);
	}

	const translatedText = allFragments.join('');
	if (translatedText.includes("can't assist")) {
		return false;
	}
	return translatedText;
}

export { getTranslationFromCopilot };
