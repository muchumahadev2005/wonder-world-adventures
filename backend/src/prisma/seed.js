const prisma = require("./prismaClient");

const languages = [
	{ code: "en", name: "English", native: "English", flag: "GB", sortOrder: 1 },
	{ code: "te", name: "Telugu", native: "Telugu", flag: "IN", sortOrder: 2 },
	{ code: "hi", name: "Hindi", native: "Hindi", flag: "IN", sortOrder: 3 },
	{ code: "ta", name: "Tamil", native: "Tamil", flag: "IN", sortOrder: 4 },
];

const levels = [
	{ code: "beginner", name: "Beginner", description: "Alphabets, basic words and sounds", sortOrder: 1 },
	{ code: "intermediate", name: "Intermediate", description: "Small sentences and easy grammar", sortOrder: 2 },
	{ code: "expert", name: "Expert", description: "Reading, meaning and corrections", sortOrder: 3 },
];

const buildLessons = (lang, level) => {
	const prefix = `${lang}-${level}`;
	const chain = (arr) => arr.map((l, i) => ({ ...l, nextId: arr[i + 1]?.id }));

	/* ---------- ENGLISH ---------- */
	if (lang === "en" && level === "beginner") {
		return chain([
			{
				id: `${prefix}-1`, title: "Alphabets A–E", emoji: "🔤",
				color: "from-sky-400 to-indigo-500",
				intro: "Learn your first letters and the words they make.",
				words: [
					{ word: "A", meaning: "Apple", emoji: "🍎" },
					{ word: "B", meaning: "Ball",  emoji: "⚽" },
					{ word: "C", meaning: "Cat",   emoji: "🐱" },
					{ word: "D", meaning: "Dog",   emoji: "🐶" },
					{ word: "E", meaning: "Egg",   emoji: "🥚" },
				],
				questions: [
					{ type: "mcq", emoji: "🍎", question: "Which letter does Apple start with?", options: ["A","B","C","D"], answer: "A" },
					{ type: "mcq", emoji: "🐶", question: "Dog starts with?", options: ["B","D","E","C"], answer: "D" },
					{ type: "fill", emoji: "🥚", question: "Egg starts with the letter ___", answer: "E" },
					{ type: "mcq", emoji: "🐱", question: "Cat starts with?", options: ["A","B","C","D"], answer: "C" },
				],
			},
			{
				id: `${prefix}-2`, title: "Numbers 1–10", emoji: "🔢",
				color: "from-amber-400 to-orange-500",
				intro: "Count from one to ten with friendly numbers.",
				words: [
					{ word: "One",   emoji: "1️⃣" },
					{ word: "Three", emoji: "3️⃣" },
					{ word: "Five",  emoji: "5️⃣" },
					{ word: "Seven", emoji: "7️⃣" },
					{ word: "Ten",   emoji: "🔟" },
				],
				questions: [
					{ type: "mcq", emoji: "🔢", question: "Number after 9?", options: ["Eight","Eleven","Ten","Six"], answer: "Ten" },
					{ type: "mcq", emoji: "➕", question: "3 + 2 = ?", options: ["Five","Four","Six","Seven"], answer: "Five" },
					{ type: "fill", emoji: "7️⃣", question: "Type the number after six:", answer: "Seven" },
					{ type: "mcq", emoji: "1️⃣", question: "First counting number?", options: ["Zero","One","Two","Three"], answer: "One" },
				],
			},
			{
				id: `${prefix}-3`, title: "Fruits & Animals", emoji: "🍎",
				color: "from-rose-400 to-pink-500",
				intro: "Tasty fruits and friendly animals.",
				words: [
					{ word: "Apple",   emoji: "🍎" },
					{ word: "Banana",  emoji: "🍌" },
					{ word: "Lion",    emoji: "🦁" },
					{ word: "Rabbit",  emoji: "🐰" },
				],
				questions: [
					{ type: "mcq", emoji: "🍌", question: "Yellow curved fruit?", options: ["Apple","Banana","Mango","Grape"], answer: "Banana" },
					{ type: "fill", emoji: "🦁", question: "King of the jungle:", answer: "Lion" },
					{ type: "mcq", emoji: "🐰", question: "Long ears, hops around?", options: ["Lion","Rabbit","Dog","Cat"], answer: "Rabbit" },
					{ type: "mcq", emoji: "🍎", question: "What color is an apple?", options: ["Blue","Red","Purple","Black"], answer: "Red" },
				],
			},
		]);
	}

	if (lang === "en" && level === "intermediate") {
		return chain([
			{
				id: `${prefix}-1`, title: "Easy Sentences", emoji: "💬",
				color: "from-sky-400 to-cyan-500",
				intro: "Build your first simple sentences.",
				words: [
					{ word: "This is a cat.", emoji: "🐱" },
					{ word: "I like apples.", emoji: "🍎" },
					{ word: "She is happy.",  emoji: "😊" },
					{ word: "We play ball.",  emoji: "⚽" },
				],
				questions: [
					{ type: "fill", emoji: "🐱", question: "This is ___ cat.", answer: "a", hint: "Singular article" },
					{ type: "mcq", emoji: "🍎", question: "Pick the correct sentence", options: ["I like apples.","I likes apple.","Me like apple.","Apple I like."], answer: "I like apples." },
					{ type: "mcq", emoji: "😊", question: "She ___ happy.", options: ["am","is","are","be"], answer: "is" },
					{ type: "fill", emoji: "⚽", question: "We ___ ball.", answer: "play" },
				],
			},
			{
				id: `${prefix}-2`, title: "Word Combos", emoji: "🧩",
				color: "from-purple-400 to-fuchsia-500",
				intro: "Match words that go together.",
				words: [
					{ word: "Big elephant", emoji: "🐘" },
					{ word: "Red apple",    emoji: "🍎" },
					{ word: "Tall tree",    emoji: "🌳" },
					{ word: "Cute puppy",   emoji: "🐶" },
				],
				questions: [
					{ type: "mcq", emoji: "🐘", question: "Best word for elephant?", options: ["Tiny","Big","Thin","Short"], answer: "Big" },
					{ type: "mcq", emoji: "🌳", question: "A tree is usually…", options: ["Tall","Salty","Loud","Wet"], answer: "Tall" },
					{ type: "fill", emoji: "🐶", question: "Cute ___ (baby dog)", answer: "puppy" },
					{ type: "mcq", emoji: "🍎", question: "Apples are often…", options: ["Blue","Red","Black","Grey"], answer: "Red" },
				],
			},
			{
				id: `${prefix}-3`, title: "Tiny Grammar", emoji: "✏️",
				color: "from-amber-400 to-yellow-500",
				intro: "A / an / is / are.",
				words: [
					{ word: "An apple", emoji: "🍎" },
					{ word: "A ball",   emoji: "⚽" },
					{ word: "They are happy", emoji: "🥳" },
					{ word: "He is kind",     emoji: "💖" },
				],
				questions: [
					{ type: "mcq", emoji: "🍎", question: "___ apple", options: ["A","An","The","Is"], answer: "An" },
					{ type: "mcq", emoji: "⚽", question: "___ ball",  options: ["A","An","Is","Are"], answer: "A" },
					{ type: "fill", emoji: "🥳", question: "They ___ happy.", answer: "are" },
					{ type: "fill", emoji: "💖", question: "He ___ kind.", answer: "is" },
				],
			},
		]);
	}

	if (lang === "en" && level === "expert") {
		return chain([
			{
				id: `${prefix}-1`, title: "Reading Time", emoji: "📖",
				color: "from-indigo-500 to-purple-600",
				intro: "Read short lines and understand them.",
				words: [
					{ word: "The sun is bright today.", emoji: "☀️" },
					{ word: "Birds fly in the sky.",   emoji: "🐦" },
					{ word: "Mia loves her red bike.", emoji: "🚲" },
				],
				questions: [
					{ type: "mcq", emoji: "☀️", question: "What is bright today?", options: ["The moon","The sun","The lamp","The star"], answer: "The sun" },
					{ type: "mcq", emoji: "🐦", question: "Where do birds fly?", options: ["Underground","In the sky","In the sea","In a box"], answer: "In the sky" },
					{ type: "fill", emoji: "🚲", question: "Mia loves her ___ bike.", answer: "red" },
				],
			},
			{
				id: `${prefix}-2`, title: "Sentence Fix", emoji: "🛠️",
				color: "from-rose-500 to-pink-600",
				intro: "Spot and fix small mistakes.",
				words: [
					{ word: "She go to school. ➜ She goes to school.", emoji: "🏫" },
					{ word: "I has a pen. ➜ I have a pen.",            emoji: "🖊️" },
					{ word: "We was happy. ➜ We were happy.",          emoji: "😄" },
				],
				questions: [
					{ type: "mcq", emoji: "🏫", question: "Which is correct?", options: ["She go to school.","She goes to school.","She going school.","She go school."], answer: "She goes to school." },
					{ type: "mcq", emoji: "🖊️", question: "Pick the right one", options: ["I has a pen.","I have a pen.","I haves pen.","I having pen."], answer: "I have a pen." },
					{ type: "fill", emoji: "😄", question: "We ___ happy. (was/were)", answer: "were" },
				],
			},
			{
				id: `${prefix}-3`, title: "Listen & Choose", emoji: "🎧",
				color: "from-cyan-500 to-blue-600",
				intro: "Pretend to listen and pick the right answer.",
				words: [
					{ word: "Listen: 'The cat sat on the mat.'", emoji: "🐱" },
					{ word: "Listen: 'Stars shine at night.'",   emoji: "⭐" },
				],
				questions: [
					{ type: "mcq", emoji: "🐱", question: "Where did the cat sit?", options: ["On the bed","On the mat","On the chair","On the box"], answer: "On the mat" },
					{ type: "mcq", emoji: "⭐", question: "When do stars shine?", options: ["Morning","Noon","Night","Evening sun"], answer: "Night" },
					{ type: "fill", emoji: "🎧", question: "Stars shine at ___.", answer: "night" },
				],
			},
		]);
	}

	/* ---------- TELUGU ---------- */
	if (lang === "te" && level === "beginner") {
		return chain([
			{
				id: `${prefix}-1`, title: "Alphabets అ–ఈ", emoji: "🔤",
				color: "from-amber-400 to-rose-500",
				intro: "First Telugu vowels and the words they make.",
				words: [
					{ word: "అ", translit: "a", meaning: "Ammama (Grandma)", emoji: "👵" },
					{ word: "ఆ", translit: "aa", meaning: "Aavu (Cow)",      emoji: "🐄" },
					{ word: "ఇ", translit: "i",  meaning: "Illu (House)",    emoji: "🏠" },
					{ word: "ఈ", translit: "ee", meaning: "Eega (Fly)",      emoji: "🪰" },
				],
				questions: [
					{ type: "mcq", emoji: "🐄", question: "Which letter for Aavu (Cow)?", options: ["అ","ఆ","ఇ","ఈ"], answer: "ఆ" },
					{ type: "mcq", emoji: "🏠", question: "Illu starts with?",            options: ["అ","ఆ","ఇ","ఈ"], answer: "ఇ" },
					{ type: "fill", emoji: "👵", question: "First Telugu vowel (type letter):", answer: "అ" },
				],
			},
			{
				id: `${prefix}-2`, title: "Numbers 1–5", emoji: "🔢",
				color: "from-orange-400 to-amber-500",
				intro: "Count one to five in Telugu.",
				words: [
					{ word: "ఒకటి", translit: "okati",  meaning: "One",   emoji: "1️⃣" },
					{ word: "రెండు", translit: "rendu", meaning: "Two",   emoji: "2️⃣" },
					{ word: "మూడు", translit: "moodu", meaning: "Three", emoji: "3️⃣" },
					{ word: "నాలుగు", translit: "naalugu", meaning: "Four", emoji: "4️⃣" },
					{ word: "ఐదు",  translit: "aidu",  meaning: "Five",  emoji: "5️⃣" },
				],
				questions: [
					{ type: "mcq", emoji: "3️⃣", question: "Three in Telugu?", options: ["ఒకటి","రెండు","మూడు","ఐదు"], answer: "మూడు" },
					{ type: "mcq", emoji: "5️⃣", question: "Aidu means?",      options: ["Two","Three","Four","Five"], answer: "Five" },
					{ type: "fill", emoji: "1️⃣", question: "Type 'One' in English (meaning of ఒకటి):", answer: "One" },
				],
			},
			{
				id: `${prefix}-3`, title: "Fruits & Animals", emoji: "🍎",
				color: "from-rose-400 to-fuchsia-500",
				intro: "పండ్లు మరియు జంతువులు",
				words: [
					{ word: "ఆపిల్", translit: "aapil",  meaning: "Apple",  emoji: "🍎" },
					{ word: "అరటి",  translit: "arati",  meaning: "Banana", emoji: "🍌" },
					{ word: "కుక్క", translit: "kukka",  meaning: "Dog",    emoji: "🐶" },
					{ word: "పిల్లి", translit: "pilli",  meaning: "Cat",   emoji: "🐱" },
				],
				questions: [
					{ type: "mcq", emoji: "🐶", question: "Kukka means?", options: ["Cat","Dog","Cow","Lion"], answer: "Dog" },
					{ type: "mcq", emoji: "🍌", question: "Banana in Telugu?", options: ["ఆపిల్","అరటి","కుక్క","పిల్లి"], answer: "అరటి" },
					{ type: "fill", emoji: "🐱", question: "Type meaning of పిల్లి:", answer: "Cat" },
				],
			},
		]);
	}

	if (lang === "te" && level === "intermediate") {
		return chain([
			{
				id: `${prefix}-1`, title: "Small Sentences", emoji: "💬",
				color: "from-amber-400 to-orange-500",
				intro: "Easy daily sentences in Telugu.",
				words: [
					{ word: "ఇది పిల్లి.", translit: "Idi pilli.", meaning: "This is a cat.", emoji: "🐱" },
					{ word: "నాకు ఆపిల్ ఇష్టం.", translit: "Naaku aapil ishtam.", meaning: "I like apple.", emoji: "🍎" },
					{ word: "ఆమె సంతోషంగా ఉంది.", translit: "Aame santhoshamga undhi.", meaning: "She is happy.", emoji: "😊" },
				],
				questions: [
					{ type: "mcq", emoji: "🐱", question: "Idi pilli means?", options: ["This is a dog.","This is a cat.","I am a cat.","She is a cat."], answer: "This is a cat." },
					{ type: "mcq", emoji: "🍎", question: "Ishtam means?", options: ["Hate","Like","Eat","Drink"], answer: "Like" },
					{ type: "fill", emoji: "😊", question: "She is happy → Aame santhoshamga ___.", answer: "undhi" },
				],
			},
			{
				id: `${prefix}-2`, title: "Common Words", emoji: "🧩",
				color: "from-rose-400 to-pink-500",
				intro: "Useful everyday words.",
				words: [
					{ word: "నీరు", translit: "neeru", meaning: "Water", emoji: "💧" },
					{ word: "అన్నం", translit: "annam", meaning: "Rice / Food", emoji: "🍚" },
					{ word: "ఇల్లు", translit: "illu", meaning: "House", emoji: "🏠" },
				],
				questions: [
					{ type: "mcq", emoji: "💧", question: "Neeru means?", options: ["Fire","Water","Wind","Stone"], answer: "Water" },
					{ type: "fill", emoji: "🏠", question: "House in Telugu (translit):", answer: "illu" },
					{ type: "mcq", emoji: "🍚", question: "Annam means?", options: ["Bread","Rice","Milk","Tea"], answer: "Rice" },
				],
			},
		]);
	}

	if (lang === "te" && level === "expert") {
		return chain([
			{
				id: `${prefix}-1`, title: "Reading Lines", emoji: "📖",
				color: "from-fuchsia-500 to-purple-600",
				intro: "Read and understand short Telugu lines.",
				words: [
					{ word: "సూర్యుడు ప్రకాశిస్తున్నాడు.", translit: "Sooryudu prakaashistunnaadu.", meaning: "The sun is shining.", emoji: "☀️" },
					{ word: "పక్షులు ఎగురుతున్నాయి.", translit: "Pakshulu egurutunnaayi.", meaning: "Birds are flying.", emoji: "🐦" },
				],
				questions: [
					{ type: "mcq", emoji: "☀️", question: "What is shining?", options: ["Moon","Sun","Lamp","Star"], answer: "Sun" },
					{ type: "mcq", emoji: "🐦", question: "What are birds doing?", options: ["Sleeping","Flying","Eating","Walking"], answer: "Flying" },
				],
			},
		]);
	}

	/* ---------- HINDI ---------- */
	if (lang === "hi" && level === "beginner") {
		return chain([
			{
				id: `${prefix}-1`, title: "Vowels अ–ई", emoji: "🔤",
				color: "from-orange-400 to-red-500",
				intro: "Start with the first Hindi vowels.",
				words: [
					{ word: "अ", translit: "a",  meaning: "Anaar (Pomegranate)", emoji: "🍎" },
					{ word: "आ", translit: "aa", meaning: "Aam (Mango)",         emoji: "🥭" },
					{ word: "इ", translit: "i",  meaning: "Imli (Tamarind)",     emoji: "🌰" },
					{ word: "ई", translit: "ee", meaning: "Eekh (Sugarcane)",    emoji: "🎋" },
				],
				questions: [
					{ type: "mcq", emoji: "🥭", question: "Aam starts with?", options: ["अ","आ","इ","ई"], answer: "आ" },
					{ type: "fill", emoji: "🍎", question: "First vowel of Hindi (type the letter):", answer: "अ" },
					{ type: "mcq", emoji: "🌰", question: "Imli starts with?", options: ["अ","आ","इ","ई"], answer: "इ" },
				],
			},
			{
				id: `${prefix}-2`, title: "Numbers 1–5", emoji: "🔢",
				color: "from-amber-400 to-orange-500",
				intro: "Count from one to five in Hindi.",
				words: [
					{ word: "एक",  translit: "ek",   meaning: "One",   emoji: "1️⃣" },
					{ word: "दो",  translit: "do",   meaning: "Two",   emoji: "2️⃣" },
					{ word: "तीन", translit: "teen", meaning: "Three", emoji: "3️⃣" },
					{ word: "चार", translit: "chaar",meaning: "Four",  emoji: "4️⃣" },
					{ word: "पाँच",translit: "paanch",meaning:"Five",  emoji: "5️⃣" },
				],
				questions: [
					{ type: "mcq", emoji: "3️⃣", question: "Three in Hindi?", options: ["एक","दो","तीन","चार"], answer: "तीन" },
					{ type: "mcq", emoji: "5️⃣", question: "Paanch means?", options: ["Two","Three","Four","Five"], answer: "Five" },
					{ type: "fill", emoji: "1️⃣", question: "Meaning of एक (in English):", answer: "One" },
				],
			},
			{
				id: `${prefix}-3`, title: "Fruits & Animals", emoji: "🍎",
				color: "from-rose-500 to-pink-500",
				intro: "फल और जानवर",
				words: [
					{ word: "सेब",  translit: "seb",  meaning: "Apple",  emoji: "🍎" },
					{ word: "केला", translit: "kela", meaning: "Banana", emoji: "🍌" },
					{ word: "कुत्ता",translit: "kutta",meaning: "Dog",   emoji: "🐶" },
					{ word: "बिल्ली",translit:"billi", meaning: "Cat",   emoji: "🐱" },
				],
				questions: [
					{ type: "mcq", emoji: "🐶", question: "Kutta means?", options: ["Cat","Cow","Dog","Lion"], answer: "Dog" },
					{ type: "mcq", emoji: "🍌", question: "Banana in Hindi?", options: ["सेब","केला","कुत्ता","बिल्ली"], answer: "केला" },
					{ type: "fill", emoji: "🐱", question: "Meaning of बिल्ली:", answer: "Cat" },
				],
			},
		]);
	}

	if (lang === "hi" && level === "intermediate") {
		return chain([
			{
				id: `${prefix}-1`, title: "Easy Sentences", emoji: "💬",
				color: "from-orange-400 to-amber-500",
				intro: "रोज़ کے چھوٹے वाक्य",
				words: [
					{ word: "यह बिल्ली है।", translit: "Yeh billi hai.", meaning: "This is a cat.", emoji: "🐱" },
					{ word: "मुझे सेब पसंद है।", translit: "Mujhe seb pasand hai.", meaning: "I like apple.", emoji: "🍎" },
					{ word: "वह खुश है।", translit: "Vah khush hai.", meaning: "He/She is happy.", emoji: "😊" },
				],
				questions: [
					{ type: "mcq", emoji: "🐱", question: "Yeh billi hai means?", options: ["This is a dog","This is a cat","She is a cat","I am a cat"], answer: "This is a cat" },
					{ type: "fill", emoji: "🍎", question: "I like apple → Mujhe seb ___ hai.", answer: "pasand" },
					{ type: "mcq", emoji: "😊", question: "Khush means?", options: ["Sad","Angry","Happy","Tired"], answer: "Happy" },
				],
			},
			{
				id: `${prefix}-2`, title: "Common Words", emoji: "🧩",
				color: "from-red-400 to-rose-500",
				intro: "रोज़मर्रा के शब्द",
				words: [
					{ word: "पानी", translit: "paani", meaning: "Water", emoji: "💧" },
					{ word: "घर",   translit: "ghar",  meaning: "House", emoji: "🏠" },
					{ word: "खाना", translit: "khana", meaning: "Food",  emoji: "🍚" },
				],
				questions: [
					{ type: "mcq", emoji: "💧", question: "Paani means?", options: ["Fire","Water","Air","Sand"], answer: "Water" },
					{ type: "fill", emoji: "🏠", question: "House in Hindi (translit):", answer: "ghar" },
					{ type: "mcq", emoji: "🍚", question: "Khana means?", options: ["Food","Drink","Sleep","Play"], answer: "Food" },
				],
			},
		]);
	}

	if (lang === "hi" && level === "expert") {
		return chain([
			{
				id: `${prefix}-1`, title: "Reading Time", emoji: "📖",
				color: "from-fuchsia-500 to-purple-600",
				intro: "छोटी पंक्तियाँ पढ़ें।",
				words: [
					{ word: "सूरज चमक रहा है।", translit: "Sooraj chamak raha hai.", meaning: "The sun is shining.", emoji: "☀️" },
					{ word: "पक्षी आसमान में उड़ते हैं।", translit: "Pakshi aasmaan mein udte hain.", meaning: "Birds fly in the sky.", emoji: "🐦" },
				],
				questions: [
					{ type: "mcq", emoji: "☀️", question: "Sooraj means?", options: ["Moon","Sun","Star","Cloud"], answer: "Sun" },
					{ type: "mcq", emoji: "🐦", question: "Where do birds fly?", options: ["In water","In sky","Underground","Inside house"], answer: "In sky" },
				],
			},
		]);
	}

	/* ---------- TAMIL ---------- */
	if (lang === "ta" && level === "beginner") {
		return chain([
			{
				id: `${prefix}-1`, title: "Vowels அ–ஈ", emoji: "🔤",
				color: "from-emerald-400 to-teal-500",
				intro: "Start with the first Tamil vowels.",
				words: [
					{ word: "அ", translit: "a",  meaning: "Annan (Brother)", emoji: "👦" },
					{ word: "ஆ", translit: "aa", meaning: "Aadu (Goat)",     emoji: "🐐" },
					{ word: "இ", translit: "i",  meaning: "Idli",             emoji: "🍥" },
					{ word: "ஈ", translit: "ee", meaning: "Eecham (Fly)",    emoji: "🪰" },
				],
				questions: [
					{ type: "mcq", emoji: "🐐", question: "Aadu starts with?", options: ["அ","ஆ","இ","ஈ"], answer: "ஆ" },
					{ type: "fill", emoji: "👦", question: "First Tamil vowel (type letter):", answer: "அ" },
					{ type: "mcq", emoji: "🍥", question: "Idli starts with?", options: ["அ","ஆ","இ","ஈ"], answer: "இ" },
				],
			},
			{
				id: `${prefix}-2`, title: "Numbers 1–5", emoji: "🔢",
				color: "from-teal-400 to-cyan-500",
				intro: "Count one to five in Tamil.",
				words: [
					{ word: "ஒன்று",  translit: "ondru",  meaning: "One",   emoji: "1️⃣" },
					{ word: "இரண்டு", translit: "irandu", meaning: "Two",   emoji: "2️⃣" },
					{ word: "மூன்று",  translit: "moondru",meaning: "Three", emoji: "3️⃣" },
					{ word: "நான்கு",  translit: "naangu", meaning: "Four",  emoji: "4️⃣" },
					{ word: "ஐந்து",   translit: "ainthu", meaning: "Five",  emoji: "5️⃣" },
				],
				questions: [
					{ type: "mcq", emoji: "3️⃣", question: "Three in Tamil?", options: ["ஒன்று","இரண்டு","மூன்று","ஐந்து"], answer: "மூன்று" },
					{ type: "mcq", emoji: "5️⃣", question: "Ainthu means?", options: ["Two","Three","Four","Five"], answer: "Five" },
					{ type: "fill", emoji: "1️⃣", question: "Meaning of ஒன்று:", answer: "One" },
				],
			},
			{
				id: `${prefix}-3`, title: "Fruits & Animals", emoji: "🍎",
				color: "from-emerald-500 to-green-600",
				intro: "பழங்கள் மற்றும் விலங்குகள்",
				words: [
					{ word: "ஆப்பிள்",  translit: "aappil", meaning: "Apple", emoji: "🍎" },
					{ word: "வாழைப்பழம்", translit: "vaazhaipazham", meaning: "Banana", emoji: "🍌" },
					{ word: "நாய்",     translit: "naai",   meaning: "Dog",   emoji: "🐶" },
					{ word: "பூனை",    translit: "poonai", meaning: "Cat",   emoji: "🐱" },
				],
				questions: [
					{ type: "mcq", emoji: "🐶", question: "Naai means?", options: ["Cat","Dog","Cow","Lion"], answer: "Dog" },
					{ type: "mcq", emoji: "🍌", question: "Banana in Tamil?", options: ["ஆப்பிள்","வாழைப்பழம்","நாய்","பூனை"], answer: "வாழைப்பழம்" },
					{ type: "fill", emoji: "🐱", question: "Meaning of பூனை:", answer: "Cat" },
				],
			},
		]);
	}

	if (lang === "ta" && level === "intermediate") {
		return chain([
			{
				id: `${prefix}-1`, title: "Easy Sentences", emoji: "💬",
				color: "from-teal-400 to-emerald-500",
				intro: "எளிய தினசரி வாக்கியங்கள்",
				words: [
					{ word: "இது பூனை.", translit: "Idhu poonai.", meaning: "This is a cat.", emoji: "🐱" },
					{ word: "எனக்கு ஆப்பிள் பிடிக்கும்.", translit: "Enakku aappil pidikkum.", meaning: "I like apple.", emoji: "🍎" },
					{ word: "அவள் மகிழ்ச்சி.", translit: "Aval magizhchi.", meaning: "She is happy.", emoji: "😊" },
				],
				questions: [
					{ type: "mcq", emoji: "🐱", question: "Idhu poonai means?", options: ["This is a dog","This is a cat","She is a cat","I am a cat"], answer: "This is a cat" },
					{ type: "fill", emoji: "🍎", question: "I like apple → Enakku aappil ___.", answer: "pidikkum" },
					{ type: "mcq", emoji: "😊", question: "Magizhchi means?", options: ["Sad","Tired","Happy","Angry"], answer: "Happy" },
				],
			},
		]);
	}

	if (lang === "ta" && level === "expert") {
		return chain([
			{
				id: `${prefix}-1`, title: "Reading Time", emoji: "📖",
				color: "from-fuchsia-500 to-purple-600",
				intro: "சிறு வரிகளை படியுங்கள்.",
				words: [
					{ word: "சூரியன் பிரகாசிக்கிறது.", translit: "Sooriyan pirakaasikkirathu.", meaning: "The sun is shining.", emoji: "☀️" },
					{ word: "பறவைகள் பறக்கின்றன.", translit: "Paravaigal parakkindrana.", meaning: "Birds are flying.", emoji: "🐦" },
				],
				questions: [
					{ type: "mcq", emoji: "☀️", question: "Sooriyan means?", options: ["Moon","Sun","Star","Cloud"], answer: "Sun" },
					{ type: "mcq", emoji: "🐦", question: "What are birds doing?", options: ["Sleeping","Flying","Eating","Sitting"], answer: "Flying" },
				],
			},
		]);
	}

	return [];
};

const stories = [
	{
		slug: "enchanted-forest",
		title: "The Enchanted Forest",
		author: "Luna Starlight",
		category: "Fantasy",
		tags: ["Fantasy", "Fiction", "Mystery"],
		coverEmoji: "Forest",
		coverGradient: "linear-gradient(160deg, #1a1040 0%, #2d1b6e 40%, #3d2080 70%, #1a0f3a 100%)",
		duration: "12 min",
		starsReward: 3,
		pages: [
			"Deep in the enchanted forest, where fireflies danced like tiny stars, a clever fox named Finn and a timid rabbit named Rosa became the most unlikely of friends.",
			"One evening, Rosa tripped over a glowing mushroom. To their amazement, a tiny door appeared beneath it! \"Shall we go in?\" whispered Finn, his tail swishing with curiosity.",
			"Inside was a secret world — tiny houses made of acorns, rivers of moonlight, and music that made flowers bloom. The little folk who lived there had never seen visitors before!",
			"\"Please don't tell anyone about us,\" begged the tiny elder. \"This is our safe home.\" Finn and Rosa promised — and from that day on, they were the forest's secret-keepers forever.",
		],
		questions: [
			{ type: "mcq", question: "What did Rosa find?", options: ["A rock", "A glowing mushroom", "A fallen tree", "A flower"], answer: "A glowing mushroom", sortOrder: 1 },
			{ type: "mcq", question: "What were the tiny houses made of?", options: ["Wood", "Straw", "Acorns", "Leaves"], answer: "Acorns", sortOrder: 2 },
			{ type: "fill", question: "The fox's name was ____", answer: "Finn", hint: "Starts with F!", sortOrder: 3 },
			{ type: "mcq", question: "What did Finn and Rosa promise?", options: ["To tell everyone", "To come back daily", "To keep the secret", "To move in"], answer: "To keep the secret", sortOrder: 4 },
		],
	},
	{
		slug: "moon-rabbit",
		title: "The Moon Rabbit",
		author: "Star Writers",
		category: "Adventure",
		tags: ["Adventure", "Space", "Fun"],
		coverEmoji: "Moon",
		coverGradient: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
		duration: "8 min",
		starsReward: 2,
		pages: [
			'Once upon a time, a little rabbit looked up at the big bright moon. "I want to visit you!" she said.',
			'So she built a rocket from carrots and leaves. "3... 2... 1... Blast off!" she shouted.',
			"When she landed on the moon, she found it was made of cheese! She nibbled happily.",
			'The moon winked at her and said, "Come visit anytime, little friend!" And she did, every night in her dreams.',
		],
		questions: [
			{ type: "mcq", question: "What did the rabbit want to visit?", options: ["The Sun", "The Moon", "The Sea", "The Forest"], answer: "The Moon", sortOrder: 1 },
			{ type: "mcq", question: "What was the rocket made of?", options: ["Metal", "Carrots and leaves", "Wood", "Paper"], answer: "Carrots and leaves", sortOrder: 2 },
			{ type: "fill", question: "The moon was made of ______", answer: "cheese", hint: "It's a dairy food!", sortOrder: 3 },
			{ type: "mcq", question: "How did the story end?", options: ["Sadly", "Angrily", "Happily", "Quietly"], answer: "Happily", sortOrder: 4 },
		],
	},
	{
		slug: "brave-star",
		title: "The Brave Little Star",
		author: "Sky Tales",
		category: "Inspiration",
		tags: ["Inspiration", "Courage", "Night"],
		coverEmoji: "Star",
		coverGradient: "linear-gradient(160deg, #1a0533 0%, #4a1560 50%, #ff6b35 100%)",
		duration: "7 min",
		starsReward: 2,
		pages: [
			'There was a tiny star who was afraid of the dark. "But you ARE the light!" said the moon.',
			"The little star tried shining as bright as she could. Her glow lit up a whole village below.",
			'The children looked up and smiled. "Thank you, little star!" they cheered.',
			"From that night on, she was never afraid again. She knew her light made the world brighter.",
		],
		questions: [
			{ type: "mcq", question: "What was the star afraid of?", options: ["Heights", "The Dark", "Water", "Fire"], answer: "The Dark", sortOrder: 1 },
			{ type: "mcq", question: "Who said 'You ARE the light!'?", options: ["The Sun", "The Moon", "The Children", "The Star"], answer: "The Moon", sortOrder: 2 },
			{ type: "fill", question: "The star's glow lit up a ____", answer: "village", hint: "A small town", sortOrder: 3 },
			{ type: "mcq", question: "How did the star feel at the end?", options: ["Afraid", "Sad", "Brave", "Angry"], answer: "Brave", sortOrder: 4 },
		],
	},
	{
		slug: "dragon-friend",
		title: "The Friendly Dragon",
		author: "Magic Pen Co.",
		category: "Fantasy",
		tags: ["Friendship", "Fantasy", "Kindness"],
		coverEmoji: "Dragon",
		coverGradient: "linear-gradient(160deg, #0d2818 0%, #1a5c35 50%, #2d9e5f 100%)",
		duration: "10 min",
		starsReward: 3,
		isPremium: true,
		pages: [
			"Everyone was scared of the green dragon, but he just wanted friends.",
			'One day, a brave girl named Lily said "Hello!" The dragon was so happy he sneezed... flowers!',
			"Together they flew over mountains and valleys, sharing stories and snacks.",
			"The village learned that being different is wonderful, and the dragon became everyone's best friend.",
		],
		questions: [
			{ type: "mcq", question: "What color was the dragon?", options: ["Red", "Blue", "Green", "Purple"], answer: "Green", sortOrder: 1 },
			{ type: "fill", question: "The brave girl's name was ____", answer: "Lily", sortOrder: 2 },
			{ type: "mcq", question: "What did the dragon sneeze?", options: ["Fire", "Water", "Flowers", "Stars"], answer: "Flowers", sortOrder: 3 },
			{ type: "mcq", question: "What did the village learn?", options: ["Fear dragons", "Being different is wonderful", "Dragons are scary", "Never say hello"], answer: "Being different is wonderful", sortOrder: 4 },
		],
	},
	{
		slug: "rainbow-fish",
		title: "Rainbow Fish",
		author: "Ocean Stories",
		category: "Sharing",
		tags: ["Sharing", "Ocean", "Friendship"],
		coverEmoji: "Fish",
		coverGradient: "linear-gradient(160deg,#003366,#0077b6,#00b4d8)",
		duration: "9 min",
		starsReward: 3,
		pages: [
			"A beautiful fish with rainbow scales swam alone. \"Why won't anyone play with me?\"",
			"A wise octopus said, \"Share your sparkle!\" So the fish gave each friend a shiny scale.",
			"Soon the whole ocean glittered with shared colors. Every fish was special and unique.",
			"The rainbow fish smiled — having friends was better than having all the sparkle to herself.",
		],
		questions: [
			{ type: "mcq", question: "Why was the fish alone?", options: ["Too fast","Too shy","Nobody played with her","She was sick"], answer: "Nobody played with her", sortOrder: 1 },
			{ type: "fill", question: "Who gave advice? A wise ____", answer: "octopus", sortOrder: 2 },
			{ type: "mcq", question: "What did the fish share?", options: ["Food","Games","Shiny scales","Music"], answer: "Shiny scales", sortOrder: 3 },
			{ type: "mcq", question: "What was better than sparkle?", options: ["Swimming alone","Having friends","Eating","Being biggest"], answer: "Having friends", sortOrder: 4 },
		],
	},
	{
		slug: "little-cloud",
		title: "The Little Cloud",
		author: "Weather Tales",
		category: "Nature",
		tags: ["Nature", "Rain", "Kindness"],
		coverEmoji: "Cloud",
		coverGradient: "linear-gradient(160deg,#2c3e50,#3498db,#85c1e9)",
		duration: "6 min",
		starsReward: 2,
		pages: [
			"There was a tiny cloud who couldn't make rain. All the other clouds laughed at him.",
			"One hot summer day, the flowers were thirsty and wilting in the sun.",
			"The tiny cloud tried SO hard — and suddenly, drip... drop... it rained! Just a little, but enough.",
			"The flowers bloomed and butterflies danced. \"Thank you, little cloud!\" they cheered. He was never sad again.",
		],
		questions: [
			{ type: "mcq", question: "What could the cloud not do?", options: ["Float","Make rain","Move","Shine"], answer: "Make rain", sortOrder: 1 },
			{ type: "mcq", question: "Who was thirsty in summer?", options: ["Animals","Children","Flowers","Trees"], answer: "Flowers", sortOrder: 2 },
			{ type: "fill", question: "Drip... drop... it ____!", answer: "rained", hint: "Water from sky!", sortOrder: 3 },
			{ type: "mcq", question: "Who danced when it rained?", options: ["Birds","Butterflies","Bees","Frogs"], answer: "Butterflies", sortOrder: 4 },
		],
	},
	{
		slug: "magic-paintbrush",
		title: "The Magic Paintbrush",
		author: "Art House Books",
		category: "Magic",
		tags: ["Magic", "Art", "Wishes"],
		coverEmoji: "Paint",
		coverGradient: "linear-gradient(160deg,#4a0080,#9b59b6,#f39c12)",
		duration: "11 min",
		starsReward: 4,
		isPremium: true,
		pages: [
			"A poor girl named Maya found a golden paintbrush in the forest. It glittered like starlight.",
			"She painted a fish — and it jumped right off the paper into the river! The paintbrush was magic!",
			"Maya painted food for hungry families, homes for those without shelter, and flowers for sad people.",
			"She never used the brush for herself — only for others. And that made her the happiest girl in the world.",
		],
		questions: [
			{ type: "fill", question: "The girl's name was ____", answer: "Maya", hint: "Starts with M!", sortOrder: 1 },
			{ type: "mcq", question: "What was magic about the brush?", options: ["It glowed","Painted fast","Paintings came to life","Never ran out"], answer: "Paintings came to life", sortOrder: 2 },
			{ type: "mcq", question: "What did Maya paint first?", options: ["A bird","A fish","A cat","A flower"], answer: "A fish", sortOrder: 3 },
			{ type: "mcq", question: "Did Maya use the brush for herself?", options: ["Yes always","Sometimes","No never","Only once"], answer: "No never", sortOrder: 4 },
		],
	},
	{
		slug: "sleepy-elephant",
		title: "The Sleepy Elephant",
		author: "Jungle Reads",
		category: "Animals",
		tags: ["Animals", "Bedtime", "Funny"],
		coverEmoji: "Elephant",
		coverGradient: "linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",
		duration: "6 min",
		starsReward: 2,
		pages: [
			"Ellie the elephant couldn't sleep. She tossed, turned, and wiggled her big ears.",
			"The monkeys sang lullabies. The birds chirped softly. The lions roared... that wasn't helpful!",
			"Finally, a tiny mouse whispered: \"Count the stars, Ellie.\" So she did — one, two, three...",
			"By star number seven, Ellie was fast asleep, snoring loudly. And the whole jungle finally slept too!",
		],
		questions: [
			{ type: "mcq", question: "Who couldn't sleep?", options: ["The lion","The monkey","Ellie the elephant","The mouse"], answer: "Ellie the elephant", sortOrder: 1 },
			{ type: "mcq", question: "Who sang lullabies?", options: ["Birds","Monkeys","Lions","Frogs"], answer: "Monkeys", sortOrder: 2 },
			{ type: "fill", question: "Count the ____", answer: "stars", hint: "In the sky!", sortOrder: 3 },
			{ type: "mcq", question: "By what number did Ellie sleep?", options: ["Three","Five","Seven","Ten"], answer: "Seven", sortOrder: 4 },
		],
	},
];

const games = [
	{ slug: "math-add", title: "Addition Fun", icon: "calculator", color: "from-sky to-lavender", starsReward: 3, sortOrder: 1 },
	{ slug: "math-sub", title: "Subtraction", icon: "calculator", color: "from-mint to-sky", starsReward: 3, sortOrder: 2 },
	{ slug: "shapes", title: "Shape Match", icon: "shapes", color: "from-coral to-sunshine", starsReward: 5, sortOrder: 3 },
	{ slug: "patterns", title: "Patterns", icon: "puzzle", color: "from-bubblegum to-lavender", starsReward: 5, isPremium: true, sortOrder: 4 },
	{ slug: "memory", title: "Memory Game", icon: "brain", color: "from-sunshine to-coral", starsReward: 4, sortOrder: 5 },
	{ slug: "speed-math", title: "Speed Math", icon: "zap", color: "from-lavender to-bubblegum", starsReward: 8, isPremium: true, sortOrder: 6 },
];

const plans = [
	{ name: "Free", description: "Starter access", price: 0, durationDays: 30 },
	{ name: "Premium", description: "Unlock premium stories and games", price: 499, durationDays: 30 },
];

const seed = async () => {
	// Clean up legacy custom seed slugs to prevent duplication
	await prisma.lesson.deleteMany({
		where: { slug: { in: ["en-beginner-alphabets", "en-beginner-numbers", "hi-beginner-vowels"] } }
	});

	const languageByCode = {};
	for (const language of languages) {
		languageByCode[language.code] = await prisma.language.upsert({
			where: { code: language.code },
			update: language,
			create: language,
		});
	}

	const levelByCode = {};
	for (const level of levels) {
		levelByCode[level.code] = await prisma.level.upsert({
			where: { code: level.code },
			update: level,
			create: level,
		});
	}

	for (const language of Object.values(languageByCode)) {
		for (const level of Object.values(levelByCode)) {
			await prisma.languageLevel.upsert({
				where: { languageId_levelId: { languageId: language.id, levelId: level.id } },
				update: { sortOrder: level.sortOrder },
				create: { languageId: language.id, levelId: level.id, sortOrder: level.sortOrder },
			});
		}
	}

	// Dynamic seeding of all 26 lessons
	for (const langCode of Object.keys(languageByCode)) {
		for (const levelCode of Object.keys(levelByCode)) {
			const list = buildLessons(langCode, levelCode);
			for (const lesson of list) {
				const saved = await prisma.lesson.upsert({
					where: { slug: lesson.id },
					update: {
						title: lesson.title,
						intro: lesson.intro,
						emoji: lesson.emoji,
						color: lesson.color,
						languageId: languageByCode[langCode].id,
						levelId: levelByCode[levelCode].id,
					},
					create: {
						slug: lesson.id,
						title: lesson.title,
						intro: lesson.intro,
						emoji: lesson.emoji,
						color: lesson.color,
						languageId: languageByCode[langCode].id,
						levelId: levelByCode[levelCode].id,
					},
				});

				// Clean previous relations to rewrite
				await prisma.lessonCard.deleteMany({ where: { lessonId: saved.id } });
				await prisma.quiz.deleteMany({ where: { lessonId: saved.id } });

				await prisma.lessonCard.createMany({
					data: lesson.words.map((card, cidx) => ({
						lessonId: saved.id,
						word: card.word,
						emoji: card.emoji,
						translit: card.translit || null,
						meaning: card.meaning || null,
						sortOrder: cidx + 1,
					})),
				});

				const quiz = await prisma.quiz.create({
					data: {
						title: `${lesson.title} Quiz`,
						languageId: languageByCode[langCode].id,
						levelId: levelByCode[levelCode].id,
						lessonId: saved.id,
					},
				});

				await prisma.quizQuestion.createMany({
					data: lesson.questions.map((question, qidx) => ({
						quizId: quiz.id,
						type: question.type || "mcq",
						question: question.question,
						emoji: question.emoji || null,
						options: question.options || null,
						answer: question.answer,
						hint: question.hint || null,
						sortOrder: qidx + 1,
					})),
				});
			}
		}
	}

	// Seed stories
	for (const story of stories) {
		const saved = await prisma.story.upsert({
			where: { slug: story.slug },
			update: {
				title: story.title,
				description: story.pages[0],
				content: story.pages.join("\n\n"),
				pages: story.pages,
				author: story.author,
				category: story.category,
				tags: story.tags,
				coverEmoji: story.coverEmoji,
				coverGradient: story.coverGradient,
				duration: story.duration,
				starsReward: story.starsReward,
				isPremium: story.isPremium ?? false,
			},
			create: {
				slug: story.slug,
				title: story.title,
				description: story.pages[0],
				content: story.pages.join("\n\n"),
				pages: story.pages,
				author: story.author,
				category: story.category,
				tags: story.tags,
				coverEmoji: story.coverEmoji,
				coverGradient: story.coverGradient,
				duration: story.duration,
				starsReward: story.starsReward,
				isPremium: story.isPremium ?? false,
			},
		});

		// Clean and rewrite story quizzes
		const existingQuiz = await prisma.quiz.findFirst({ where: { storyId: saved.id } });
		if (existingQuiz) {
			await prisma.quizQuestion.deleteMany({ where: { quizId: existingQuiz.id } });
			await prisma.quiz.delete({ where: { id: existingQuiz.id } });
		}

		const quiz = await prisma.quiz.create({
			data: {
				title: `${story.title} Quiz`,
				storyId: saved.id,
			},
		});

		await prisma.quizQuestion.createMany({
			data: story.questions.map((question, qidx) => ({
				quizId: quiz.id,
				type: question.type || "mcq",
				question: question.question,
				emoji: question.emoji || null,
				options: question.options || null,
				answer: question.answer,
				hint: question.hint || null,
				sortOrder: qidx + 1,
			})),
		});
	}

	// Seed games
	for (const game of games) {
		await prisma.game.upsert({
			where: { slug: game.slug },
			update: {
				title: game.title,
				icon: game.icon,
				color: game.color,
				starsReward: game.starsReward,
				isPremium: game.isPremium ?? false,
				sortOrder: game.sortOrder,
			},
			create: {
				slug: game.slug,
				title: game.title,
				icon: game.icon,
				color: game.color,
				starsReward: game.starsReward,
				isPremium: game.isPremium ?? false,
				sortOrder: game.sortOrder,
			},
		});
	}

	// Seed plans
	for (const plan of plans) {
		const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
		if (existing) {
			await prisma.subscriptionPlan.update({ where: { id: existing.id }, data: plan });
		} else {
			await prisma.subscriptionPlan.create({ data: plan });
		}
	}

	// Seed admin user
	const bcrypt = require("bcryptjs");
	const adminPassword = await bcrypt.hash("Admin@123", 10);
	await prisma.user.upsert({
		where: { email: "admin@storynest.com" },
		update: { name: "StoryNest Admin", isVerified: true },
		create: {
			name: "StoryNest Admin",
			email: "admin@storynest.com",
			password: adminPassword,
			provider: ["email"],
			isVerified: true,
		},
	});
	console.log("Admin user seeded: admin@storynest.com / Admin@123");
};

seed()
	.then(async () => {
		console.log("Seeding completed successfully.");
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error("Seeding failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	});
