const { z } = require("zod");

const createOrderSchema = z.object({
	planId: z.string({ required_error: "Plan ID is required" }),
});

const verifySchema = z.object({
	razorpayOrderId: z.string({ required_error: "Razorpay Order ID is required" }),
	razorpayPaymentId: z.string({ required_error: "Razorpay Payment ID is required" }),
	razorpaySignature: z.string({ required_error: "Razorpay Signature is required" }),
	planId: z.string({ required_error: "Plan ID is required" }),
});

module.exports = {
	createOrderSchema,
	verifySchema,
};
