const responses = [
	{
		keys: ["story", "read"],
		reply: "Let's read a story together. Try the Stories area, then come back and tell me your favorite part.",
	},
	{
		keys: ["learn", "lesson", "word"],
		reply: "Great choice. Pick a language in Learn and practice a few word cards. I can quiz you after.",
	},
	{
		keys: ["game", "play"],
		reply: "Game time. Addition Fun and Subtraction are ready to play, and more games are on the way.",
	},
	{
		keys: ["joke", "funny"],
		reply: "Why did the math book look worried? It had too many problems to solve.",
	},
	{
		keys: ["fact"],
		reply: "Fun fact: a rainbow is made when sunlight bends and reflects inside tiny drops of water.",
	},
	{
		keys: ["math"],
		reply: "Try this: 6 + 7 = 13. A quick trick is 6 + 6 = 12, then add one more.",
	},
];

const getReply = (message = "") => {
	const normalized = String(message).toLowerCase();
	const match = responses.find((item) => item.keys.some((key) => normalized.includes(key)));
	return match?.reply || "I am here with you. Ask me for a story, a joke, a fun fact, math help, or a learning game.";
};

module.exports = {
	getReply,
};
