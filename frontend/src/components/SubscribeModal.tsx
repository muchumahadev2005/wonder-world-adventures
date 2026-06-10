import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { subscriptionApi, paymentApi, ApiPlan } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Declare Razorpay global injected by script tag
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: Record<string, unknown>) => void) => void;
    };
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const SubscribeModal = ({ open, onClose, onSuccess }: Props) => {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ApiPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFetchingPlans(true);
    subscriptionApi
      .listPlans()
      .then(({ plans }) => {
        // Show only paid plans (price > 0)
        const paid = plans.filter((p) => p.price > 0 && p.isActive);
        setPlans(paid);
        if (paid.length > 0) setSelectedPlan(paid[0]);
      })
      .catch(() => setError("Failed to load plans"))
      .finally(() => setFetchingPlans(false));
  }, [open]);

  const handleSubscribe = async () => {
    if (!selectedPlan || !token) return;
    setError("");
    setLoading(true);

    try {
      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        setError("Payment gateway failed to load. Please try again.");
        return;
      }

      // 2. Create order on backend
      const order = await paymentApi.createOrder(selectedPlan.id, token);

      // 3. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: "Wonder World Adventures",
          description: `${order.planName} Subscription`,
          order_id: order.orderId,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: { color: "#7c5cbf" },
          handler: async (response: Record<string, unknown>) => {
            try {
              // 4. Verify payment on backend
              await paymentApi.verifyPayment(
                {
                  razorpayOrderId: response.razorpay_order_id as string,
                  razorpayPaymentId: response.razorpay_payment_id as string,
                  razorpaySignature: response.razorpay_signature as string,
                  planId: selectedPlan.id,
                },
                token,
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });

        rzp.on("payment.failed", (response: Record<string, unknown>) => {
          reject(new Error((response?.error as Record<string, unknown>)?.description as string || "Payment failed"));
        });

        rzp.open();
      });

      // 5. Payment + verification succeeded
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md rounded-[28px] border border-white/20 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a0f3a 0%, #2d1b6e 50%, #1a0f3a 100%)",
              boxShadow: "0 30px 80px -10px rgba(124,92,191,0.6), 0 10px 40px rgba(0,0,0,0.5)",
            }}
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="relative p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(124,92,191,0.4), rgba(167,139,250,0.2))" }}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center mx-auto mb-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown className="w-8 h-8 text-amber-900" fill="currentColor" />
              </motion.div>

              <h2 className="font-display text-2xl font-extrabold text-white">Unlock Premium</h2>
              <p className="text-white/70 text-sm mt-1">Access all stories, lessons & games</p>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <motion.div
                  className="text-center py-8"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-display text-xl font-bold">Payment Successful! 🎉</p>
                  <p className="text-white/70 text-sm mt-1">Your Premium is now active!</p>
                </motion.div>
              ) : (
                <>
                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {["All premium stories unlocked", "All language lessons included", "All mini-games unlocked", "Priority support"].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-white/80 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Plans */}
                  {fetchingPlans ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3 mb-5">
                      {plans.map((plan) => (
                        <motion.button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all"
                          style={
                            selectedPlan?.id === plan.id
                              ? {
                                  background: "linear-gradient(135deg, rgba(124,92,191,0.4), rgba(167,139,250,0.2))",
                                  border: "1px solid rgba(167,139,250,0.6)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }
                          }
                          whileTap={{ scale: 0.98 }}
                        >
                          <div>
                            <p className="font-display font-bold text-white">{plan.name}</p>
                            <p className="text-white/60 text-xs mt-0.5">{plan.durationDays} days access</p>
                          </div>
                          <p className="font-display text-xl font-extrabold text-amber-300">
                            ₹{plan.price}
                          </p>
                        </motion.button>
                      ))}
                      {plans.length === 0 && !fetchingPlans && (
                        <p className="text-white/50 text-center text-sm py-2">No plans available.</p>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 mb-4">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <motion.button
                    onClick={handleSubscribe}
                    disabled={loading || !selectedPlan || !token}
                    className="w-full py-4 rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                      boxShadow: "0 10px 30px rgba(245,158,11,0.4)",
                    }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Subscribe Now · ₹{selectedPlan?.price ?? "—"}
                      </>
                    )}
                  </motion.button>

                  {!token && (
                    <p className="text-center text-white/50 text-xs mt-3">
                      Please log in to subscribe.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscribeModal;
