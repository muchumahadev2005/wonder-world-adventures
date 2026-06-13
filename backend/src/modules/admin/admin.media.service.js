const prisma = require("../../prisma/prismaClient");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ── Provider Interface ───────────────────────────────────────────
// Each provider must implement: upload(file) → { url, fileName }, delete(fileName) → void

class LocalProvider {
	constructor() {
		this.uploadDir = path.join(__dirname, "../../../public/uploads");
		if (!fs.existsSync(this.uploadDir)) {
			fs.mkdirSync(this.uploadDir, { recursive: true });
		}
	}

	async upload(file) {
		const ext = path.extname(file.originalname);
		const fileName = `${crypto.randomUUID()}${ext}`;
		const filePath = path.join(this.uploadDir, fileName);
		fs.writeFileSync(filePath, file.buffer);
		const url = `/uploads/${fileName}`;
		return { url, fileName };
	}

	async delete(fileName) {
		const filePath = path.join(this.uploadDir, fileName);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}
}

// ── Cloudinary Provider (interface ready, implementation deferred) ──
class CloudinaryProvider {
	constructor(config) {
		this.config = config;
		// TODO: Initialize cloudinary SDK
		// const cloudinary = require("cloudinary").v2;
		// cloudinary.config({ cloud_name, api_key, api_secret });
	}

	async upload(file) {
		// TODO: Implement cloudinary upload
		// const result = await cloudinary.uploader.upload_stream(...)
		throw new Error("CloudinaryProvider not implemented yet. Set MEDIA_PROVIDER=local");
	}

	async delete(fileName) {
		// TODO: Implement cloudinary delete
		throw new Error("CloudinaryProvider not implemented yet");
	}
}

// ── Provider Factory ─────────────────────────────────────────────

const getMediaProvider = () => {
	const providerName = process.env.MEDIA_PROVIDER || "local";
	switch (providerName) {
		case "cloudinary":
			return new CloudinaryProvider({
				cloudName: process.env.CLOUDINARY_CLOUD_NAME,
				apiKey: process.env.CLOUDINARY_API_KEY,
				apiSecret: process.env.CLOUDINARY_API_SECRET,
			});
		case "local":
		default:
			return new LocalProvider();
	}
};

const provider = getMediaProvider();

// ── Service Functions ────────────────────────────────────────────

const uploadMedia = async (file, userId) => {
	const { url, fileName } = await provider.upload(file);

	const media = await prisma.media.create({
		data: {
			fileName,
			originalName: file.originalname,
			mimeType: file.mimetype,
			size: file.size,
			url,
			provider: process.env.MEDIA_PROVIDER || "local",
			uploadedBy: userId || null,
		},
	});

	return media;
};

const listMedia = async ({ page = 1, limit = 30, search, folder, mimeType } = {}) => {
	const skip = (page - 1) * limit;
	const where = {};

	if (search) {
		where.OR = [
			{ originalName: { contains: search, mode: "insensitive" } },
			{ altText: { contains: search, mode: "insensitive" } },
		];
	}
	if (folder) where.folder = folder;
	if (mimeType) where.mimeType = { startsWith: mimeType };

	const [items, total] = await Promise.all([
		prisma.media.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
		prisma.media.count({ where }),
	]);

	return { items, total, page, limit };
};

const deleteMedia = async (id) => {
	const media = await prisma.media.findUnique({ where: { id } });
	if (!media) {
		const err = new Error("Media not found");
		err.status = 404;
		throw err;
	}

	try {
		await provider.delete(media.fileName);
	} catch {
		// File may already be deleted — continue
	}

	await prisma.media.delete({ where: { id } });
	return { deleted: true };
};

const updateMedia = async (id, data) => {
	return prisma.media.update({
		where: { id },
		data: {
			altText: data.altText,
			folder: data.folder,
		},
	});
};

module.exports = {
	uploadMedia,
	listMedia,
	deleteMedia,
	updateMedia,
};
