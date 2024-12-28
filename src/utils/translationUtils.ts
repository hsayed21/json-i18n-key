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
		// vscode.LanguageModelChatMessage.User(`Translate the text "${text}" to ${lang}. Provide ONLY the translated text with no additional explanation, code blocks, or formatting. Return the translation as plain text.`),
		vscode.LanguageModelChatMessage.User(
			`Translate the text "${text}" to ${lang}, considering software development context and terminology. 
			Rules:
				- Use definite articles when appropriate (e.g., "the branch" not just "branch").
				- Maintain technical term consistency and avoid unnecessary literal translations.
				- Consider the context and follow conventional usage in software development.
				- Follow target language grammar rules
				- Use industry-standard translations for software-specific terminology.
			Context Rules:
				- Prioritize semantic meaning over literal translation.
				- Use standard programming terminology widely recognized in the target language.
				- Follow the target language's technical conventions and coding standards.
				- Ensure descriptive and meaningful translations for keys.
			Naming Convention Priorities:
				- Clarity and readability.
				- Consistency with the existing codebase or files (e.g., en.json, ar.json).

			Provide ONLY the translated text with no additional explanation, code blocks, or formatting. Return the translation as plain text.`
		),
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
