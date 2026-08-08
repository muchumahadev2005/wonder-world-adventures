const catchAsync = require("../../utils/catchAsync");
const service = require("./admin.media.service");

const uploadMedia = catchAsync(async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ success: false, message: "No file uploaded" });
	}
	const media = await service.uploadMedia(req.file, req.user?.id);
	res.status(201).json({ success: true, media });
});

const listMedia = catchAsync(async (req, res) => {
	const { page, limit, search, folder, type } = req.query;
	const parsedPage = parseInt(page) || 1;
	const parsedLimit = parseInt(limit) || 30;
	const data = await service.listMedia({
		page: parsedPage,
		limit: parsedLimit,
		search,
		folder,
		mimeType: type,
	});
	// Rename 'items' → 'media' and add 'pages' to match frontend API contract
	const { items, total } = data;
	res.json({ success: true, media: items, total, pages: Math.ceil(total / parsedLimit) });
});

const deleteMedia = catchAsync(async (req, res) => {
	const result = await service.deleteMedia(req.params.id);
	res.json({ success: true, ...result });
});

const updateMedia = catchAsync(async (req, res) => {
	const media = await service.updateMedia(req.params.id, req.body);
	res.json({ success: true, media });
});

module.exports = { uploadMedia, listMedia, deleteMedia, updateMedia };
