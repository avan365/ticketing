import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Smartphone, 
  AlertCircle, 
  Check,
  Loader2,
  ExternalLink,
  Lock
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  STRIPE_PUBLISHABLE_KEY,
  getFeeBreakdown, 
  createPaymentIntent, 
  PLATFORM_FEE_PERCENTAGE,
  API_URL,
  isBackendAvailable
} from '../utils/stripe';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Apple Pay icon component
const ApplePayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.72 8.2c-.1.08-1.86 1.07-1.86 3.28 0 2.55 2.24 3.46 2.3 3.48-.01.06-.36 1.24-1.18 2.45-.73 1.06-1.5 2.13-2.7 2.13s-1.57-.7-3.01-.7c-1.41 0-1.91.72-3.01.72s-1.84-1-2.69-2.21C4.5 15.9 3.65 13.46 3.65 11.14c0-3.72 2.42-5.69 4.8-5.69 1.26 0 2.32.83 3.11.83.76 0 1.94-.88 3.39-.88.55 0 2.52.05 3.77 1.9zM14.13 3.45c.54-.64.92-1.53.92-2.42 0-.12-.01-.25-.03-.35-.88.03-1.93.58-2.56 1.31-.5.57-.96 1.46-.96 2.36 0 .14.02.27.04.32.06.01.16.02.26.02.79 0 1.78-.53 2.33-1.24z"/>
  </svg>
);

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Montserrat, sans-serif',
      '::placeholder': {
        color: '#a78bfa',
      },
      iconColor: '#facc15',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

interface StripePaymentProps {
  amount: number;
  customerEmail: string;
  customerName: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
  selectedMethod: 'card' | 'apple_pay' | 'grabpay';
}

// Inner component that uses Stripe hooks
function StripePaymentForm({
  amount,
  customerEmail,
  customerName,
  onSuccess,
  onError,
  onBack,
  selectedMethod,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  
  const fees = getFeeBreakdown(amount, selectedMethod === 'apple_pay' ? 'apple_pay' : selectedMethod);
  const totalWithFee = fees.total;

  // Check backend availability on mount
  useEffect(() => {
    isBackendAvailable().then(setBackendAvailable);
  }, []);

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    setCardError(event.error?.message || null);
  };

  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Check if backend is available
      if (!backendAvailable) {
        // Demo mode - simulate payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        onSuccess('demo_payment_' + Date.now());
        return;
      }

      // 1. Create PaymentIntent on backend
      const paymentIntent = await createPaymentIntent(totalWithFee, customerEmail, customerName);
      
      if (!paymentIntent) {
        throw new Error('Failed to create payment intent');
      }

      // 2. Confirm payment with Stripe
      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName,
              email: customerEmail,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (confirmedIntent?.status === 'succeeded') {
        onSuccess(confirmedIntent.id);
      } else {
        throw new Error('Payment not completed. Status: ' + confirmedIntent?.status);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setCardError(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrabPay = async () => {
    setIsProcessing(true);
    
    try {
      if (!backendAvailable) {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSuccess('demo_grabpay_' + Date.now());
        return;
      }

      // Create Checkout Session for GrabPay (redirect flow)
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalWithFee,
          customerEmail,
          customerName,
          paymentMethod: 'grabpay',
          orderDetails: { tickets: 'ADHEERAA Masquerade Tickets' },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to GrabPay
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GrabPay failed';
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplePay = async () => {
    // For Apple Pay, we'd use PaymentRequest API
    // For now, fall back to card payment
    setIsProcessing(true);
    
    try {
      if (!backendAvailable) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSuccess('demo_applepay_' + Date.now());
        return;
      }

      // Check if Apple Pay is available
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const paymentRequest = stripe.paymentRequest({
        country: 'SG',
        currency: 'sgd',
        total: {
          label: 'ADHEERAA Tickets',
          amount: Math.round(totalWithFee * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      const canMakePayment = await paymentRequest.canMakePayment();
      
      if (!canMakePayment?.applePay) {
        throw new Error('Apple Pay is not available on this device. Please use Card payment instead.');
      }

      // For full implementation, you'd show the Apple Pay sheet
      // For now, show error
      throw new Error('Apple Pay requires additional setup. Please use Card payment.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apple Pay failed';
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    switch (selectedMethod) {
      case 'card':
        handleCardPayment();
        break;
      case 'apple_pay':
        handleApplePay();
        break;
      case 'grabpay':
        handleGrabPay();
        break;
    }
  };

  const getMethodIcon = () => {
    switch (selectedMethod) {
      case 'card':
        return <CreditCard className="w-8 h-8 text-blue-400" />;
      case 'apple_pay':
        return <ApplePayIcon className="w-8 h-8 text-white" />;
      case 'grabpay':
        return <Smartphone className="w-8 h-8 text-white" />;
    }
  };

  const getMethodTitle = () => {
    switch (selectedMethod) {
      case 'card':
        return 'Credit/Debit Card';
      case 'apple_pay':
        return 'Apple Pay';
      case 'grabpay':
        return 'GrabPay';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          selectedMethod === 'grabpay' ? 'bg-[#00B14F]' : 
          selectedMethod === 'apple_pay' ? 'bg-black' :
          'bg-gradient-to-br from-purple-600 to-purple-800'
        }`}>
          {getMethodIcon()}
        </div>
        <div>
          <h3 
            className="text-2xl font-bold text-yellow-400"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
          >
            {getMethodTitle()}
          </h3>
          <p className="text-purple-300 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {backendAvailable === false ? '⚠️ Demo Mode' : 'Secure payment powered by Stripe'}
          </p>
        </div>
      </div>

      {/* Backend status warning */}
      {backendAvailable === false && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <p className="text-amber-300 font-semibold">Demo Mode</p>
            <p className="text-amber-200/70">
              Backend server not running. Payments will be simulated.
            </p>
          </div>
        </div>
      )}

      {/* Card Form - Only for card payments */}
      {selectedMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-purple-300 mb-2 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Card Details
            </label>
            <div className={`px-4 py-4 bg-purple-900/50 border rounded-xl transition-colors ${
              cardError ? 'border-red-500' : 'border-purple-500/30 focus-within:border-yellow-400'
            }`}>
              <CardElement 
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {cardError}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-purple-400 text-xs">
            <Lock className="w-4 h-4" />
            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Your card details are encrypted and secure
            </span>
          </div>
        </div>
      )}

      {/* Apple Pay Info */}
      {selectedMethod === 'apple_pay' && (
        <div className="bg-purple-900/30 rounded-xl p-6 border border-purple-500/30 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
            <ApplePayIcon className="w-10 h-10 text-white" />
          </div>
          <p className="text-white font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Pay with Apple Pay
          </p>
          <p className="text-purple-300 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Click below to pay with Face ID or Touch ID
          </p>
        </div>
      )}

      {/* GrabPay Info */}
      {selectedMethod === 'grabpay' && (
        <div className="bg-purple-900/30 rounded-xl p-6 border border-purple-500/30 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#00B14F] rounded-2xl flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <p className="text-white font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Pay with GrabPay
          </p>
          <p className="text-purple-300 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            You'll be redirected to GrabPay to complete payment.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-400">
            <ExternalLink className="w-4 h-4" />
            <span>Opens Grab app or GrabPay web</span>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-5 border-2 border-yellow-500/30">
        <div className="space-y-2 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <div className="flex justify-between text-purple-300">
            <span>Tickets</span>
            <span>${fees.ticketPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-purple-300">
            <span>Service Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
            <span>+${fees.platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-purple-300">
            <span>Processing ({fees.stripeFeeLabel})</span>
            <span>+${fees.stripeFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-purple-500/30">
            <span className="text-white">Total</span>
            <span className="text-yellow-400">${fees.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors disabled:opacity-50"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
        >
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          onClick={handleSubmit}
          disabled={isProcessing || (selectedMethod === 'card' && !cardComplete && backendAvailable !== false)}
          className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {selectedMethod === 'apple_pay' && <ApplePayIcon className="w-5 h-5" />}
              {selectedMethod === 'grabpay' && <span className="text-[#00B14F]">●</span>}
              {selectedMethod === 'card' && <CreditCard className="w-5 h-5" />}
              Pay ${fees.total.toFixed(2)}
            </>
          )}
        </motion.button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-purple-400 text-xs pt-2">
        <Check className="w-4 h-4 text-green-400" />
        <span style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Secured by Stripe • 256-bit SSL encryption
        </span>
      </div>
    </motion.div>
  );
}

// Wrapper component with Elements provider
export function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}
