const Razorpay = require("razorpay");
const crypto = require("crypto");
const { razorpayKeyId, razorpayKeySecret } = require("../../config/env");
const repository = require("./payments.repository");

const getRazorpay = () => {
	if (!razorpayKeyId || !razorpayKeySecret) {
		throw new Error("Razorpay credentials not configured");
	}
	return new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
};

/**
 * Create a Razorpay order for the given plan.
 * Returns { orderId, amount, currency, planId, planName, razorpayKeyId }
 */
const createOrder = async (userId, planId) => {
	const plan = await repository.getPlanById(planId);
	if (!plan || !plan.isActive) {
		const err = new Error("Plan not found or inactive");
		err.status = 404;
		throw err;
	}

	const razorpay = getRazorpay();
	// Razorpay amounts are in paise (1 INR = 100 paise)
	const amountPaise = plan.price * 100;
	const order = await razorpay.orders.create({
		amount: amountPaise,
		currency: "INR",
		receipt: `order_${userId}_${Date.now()}`,
		notes: { userId, planId },
	});

	// Persist a PENDING payment record
	await repository.createPayment({
		userId,
		amount: plan.price,
		razorpayOrderId: order.id,
		status: "PENDING",
	});

	return {
		orderId: order.id,
		amount: amountPaise,
		currency: order.currency,
		planId,
		planName: plan.name,
		razorpayKeyId,
	};
};

/**
 * Verify Razorpay signature, activate subscription, mark payment SUCCESS.
 */
const verifyPayment = async (userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId }) => {
	// 1. Verify signature
	const body = `${razorpayOrderId}|${razorpayPaymentId}`;
	const expectedSig = crypto
		.createHmac("sha256", razorpayKeySecret)
		.update(body)
		.digest("hex");

	if (expectedSig !== razorpaySignature) {
		const err = new Error("Invalid payment signature");
		err.status = 400;
		throw err;
	}

	// 2. Find the plan
	const plan = await repository.getPlanById(planId);
	if (!plan) {
		const err = new Error("Plan not found");
		err.status = 404;
		throw err;
	}

	// 3. Cancel old active subscriptions
	await repository.cancelOldSubscriptions(userId);

	// 4. Create new active subscription
	const startDate = new Date();
	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + plan.durationDays);

	const subscription = await repository.createSubscription({
		userId,
		planId,
		startDate,
		endDate,
	});

	// 5. Update payment record to SUCCESS
	await repository.updatePayment({
		razorpayOrderId,
		razorpayPaymentId,
		status: "SUCCESS",
		subscriptionId: subscription.id,
	});

	return { subscription, message: "Payment verified and subscription activated" };
};

/**
 * Return payment history for user.
 */
const getHistory = async (userId) => {
	return repository.getPaymentsByUserId(userId);
};

module.exports = { createOrder, verifyPayment, getHistory };
