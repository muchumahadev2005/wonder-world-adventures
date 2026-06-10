const createPrompt = (word = "") => {
	const text = String(word || "").trim();
	return {
		word: text,
		prompt: text ? `Listen carefully and repeat: ${text}` : "Choose a word and repeat it clearly.",
	};
};

module.exports = {
	createPrompt,
};
