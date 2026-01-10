import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, CreditCard, User, Mail, Phone, Plus, Minus, Check, Sparkles, AlertCircle, Upload, QrCode, Smartphone, Clock, Copy, CheckCircle } from 'lucide-react';
import type { CartItem } from '../App';
import { sendCustomerConfirmation, PAYNOW_UEN } from '../utils/email';
import { saveOrder, type Order } from '../utils/orders';
import { StripePayment } from './StripePayment';
import { STRIPE_FEES, PLATFORM_FEE_PERCENTAGE, getFeeBreakdown, calculatePlatformFee } from '../utils/stripe';
import { confirmPurchase, directPurchase, checkCartAvailability } from '../utils/inventory';

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (ticketId: string, quantity: number) => void;
  onClearCart: () => void;
  totalPrice: number;
  onPurchaseComplete?: () => void; // Called after successful purchase to refresh inventory
}

type CheckoutStep = 'cart' | 'details' | 'payment-select' | 'paynow' | 'stripe-payment' | 'pending' | 'success';
type PaymentMethod = 'paynow' | 'card' | 'apple_pay' | 'grabpay' | null;

// Apple Pay icon component
const ApplePayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.72 8.2c-.1.08-1.86 1.07-1.86 3.28 0 2.55 2.24 3.46 2.3 3.48-.01.06-.36 1.24-1.18 2.45-.73 1.06-1.5 2.13-2.7 2.13s-1.57-.7-3.01-.7c-1.41 0-1.91.72-3.01.72s-1.84-1-2.69-2.21C4.5 15.9 3.65 13.46 3.65 11.14c0-3.72 2.42-5.69 4.8-5.69 1.26 0 2.32.83 3.11.83.76 0 1.94-.88 3.39-.88.55 0 2.52.05 3.77 1.9zM14.13 3.45c.54-.64.92-1.53.92-2.42 0-.12-.01-.25-.03-.35-.88.03-1.93.58-2.56 1.31-.5.57-.96 1.46-.96 2.36 0 .14.02.27.04.32.06.01.16.02.26.02.79 0 1.78-.53 2.33-1.24z"/>
  </svg>
);

// GrabPay icon component  
const GrabPayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`${className} rounded-full bg-[#00B14F] flex items-center justify-center`}>
    <span className="text-white font-bold text-xs">G</span>
  </div>
);

export function CheckoutModal({ cart, onClose, onUpdateQuantity, onClearCart, totalPrice, onPurchaseComplete }: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState(0); // Store final amount before cart clear
  const [ticketCount, setTicketCount] = useState(0); // Store ticket count before cart clear
  const [proofOfPayment, setProofOfPayment] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [copiedUEN, setCopiedUEN] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, type: 'uen' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'uen') {
        setCopiedUEN(true);
        setTimeout(() => setCopiedUEN(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ proof: 'File size must be less than 5MB' });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors({ proof: 'Please upload an image file' });
        return;
      }

      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfPayment(reader.result as string);
        setErrors({});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    }

    // Format expiry date
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})/, '$1/').slice(0, 5);
    }

    // Format CVV
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Format phone
    if (name === 'phone') {
      formattedValue = value.replace(/[^\d+\-() ]/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateDetails = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!formData.expiry.trim() || formData.expiry.length < 5) {
      newErrors.expiry = 'Enter MM/YY';
    }

    if (!formData.cvv.trim() || formData.cvv.length < 3) {
      newErrors.cvv = 'Enter CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'cart') {
      setStep('details');
    } else if (step === 'details') {
      if (validateDetails()) {
        setStep('payment-select');
      }
    } else if (step === 'payment-select') {
      if (paymentMethod === 'paynow') {
        setStep('paynow');
      } else if (paymentMethod === 'card' || paymentMethod === 'apple_pay' || paymentMethod === 'grabpay') {
        setStep('stripe-payment');
      }
    } else if (step === 'paynow') {
      if (!proofOfPayment) {
        setErrors({ proof: 'Please upload proof of payment' });
        return;
      }
      setIsProcessing(true);
      
      const newOrderNumber = `MASK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      setOrderNumber(newOrderNumber);
      
      // Calculate total with platform fee (no Stripe fee for manual PayNow)
      const paynowTotal = totalPrice + calculatePlatformFee(totalPrice);
      
      // Save order to local storage (Admin Dashboard)
      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber: newOrderNumber,
        createdAt: new Date().toISOString(),
        status: 'pending',
        paymentMethod: 'paynow',
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        tickets: cart.map(item => ({
          name: item.ticket.name,
          quantity: item.quantity,
          price: item.ticket.price,
        })),
        totalAmount: paynowTotal,
        proofOfPayment: proofOfPayment,
      };
      saveOrder(order);
      
      // NOTE: Email will be sent AFTER admin verifies the payment
      // (Not sent immediately for PayNow - see AdminDashboard.tsx)
      
      // Update inventory - mark tickets as sold
      directPurchase(cart.map(item => ({ ticketId: item.ticket.id, quantity: item.quantity })));
      onPurchaseComplete?.(); // Refresh inventory in parent
      
      setPaidAmount(paynowTotal); // Store before clearing cart
      setTicketCount(cart.reduce((total, item) => total + item.quantity, 0));
      setIsProcessing(false);
      setStep('pending');
    } else if (step === 'payment') {
      if (validatePayment()) {
        setIsProcessing(true);
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const newOrderNumber = `MASK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        setOrderNumber(newOrderNumber);
        
        // Save order to local storage (Admin Dashboard)
        const order: Order = {
          id: crypto.randomUUID(),
          orderNumber: newOrderNumber,
          createdAt: new Date().toISOString(),
          status: 'verified', // Card payments are auto-verified
          paymentMethod: 'card',
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          tickets: cart.map(item => ({
            name: item.ticket.name,
            quantity: item.quantity,
            price: item.ticket.price,
          })),
          totalAmount: totalPrice,
        };
        saveOrder(order);
        
        // Send confirmation email to CUSTOMER
        await sendCustomerConfirmation(
          newOrderNumber,
          formData.name,
          formData.email,
          cart,
          totalPrice,
          'card'
        );
        
        setIsProcessing(false);
        setStep('success');
        // Clear cart after successful purchase
        onClearCart();
      }
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Map steps to progress bar index
  const getProgressIndex = () => {
    if (step === 'cart') return 0;
    if (step === 'details') return 1;
    return 2; // payment-select, paynow, payment, pending, success
  };
  const progressIndex = getProgressIndex();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-purple-900 to-black rounded-3xl border-2 border-yellow-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-purple-800 p-6 flex items-center justify-between border-b border-purple-500/30 rounded-t-3xl z-10 shrink-0">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-yellow-400" />
              <h2 
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                {step === 'success' ? 'Order Confirmed!' : 'Checkout'}
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </motion.button>
          </div>

          {/* Progress Steps */}
          {step !== 'success' && step !== 'pending' && (
            <div className="p-4 lg:p-6 border-b border-purple-500/30 shrink-0">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {['Cart', 'Details', 'Payment'].map((s, index) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        animate={{
                          scale: progressIndex === index ? 1.15 : 1,
                          backgroundColor: progressIndex >= index ? '#facc15' : '#581c87',
                        }}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-black mb-2 text-lg"
                      >
                        {progressIndex > index ? <Check className="w-5 h-5" /> : index + 1}
                      </motion.div>
                      <span className="text-xs lg:text-sm text-purple-300 capitalize" style={{ fontFamily: 'Montserrat, sans-serif' }}>{s}</span>
                    </div>
                    {index < 2 && (
                      <div className="flex-1 h-1 bg-purple-800 mx-1 lg:mx-2 mb-8 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: progressIndex > index ? '100%' : '0%',
                          }}
                          transition={{ duration: 0.3 }}
                          className="h-full bg-yellow-400"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 lg:p-8 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {step === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-yellow-400 mb-4 lg:mb-6 font-bebas tracking-wide">Your Tickets</h3>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-6xl mb-4"
                      >
                        🎭
                      </motion.div>
                      <p className="text-purple-300 text-lg font-montserrat">Your cart is empty</p>
                      <p className="text-purple-400 text-sm mt-2 font-montserrat">Add some tickets to get started!</p>
                    </div>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <motion.div
                          key={item.ticket.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="bg-gradient-to-r from-purple-800/50 to-purple-900/50 rounded-2xl p-4 lg:p-6 border border-purple-500/30"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                              <h4 className="text-lg lg:text-xl font-bold text-white font-bebas tracking-wide">{item.ticket.name}</h4>
                              <p className="text-purple-300 text-sm lg:text-base font-montserrat">${item.ticket.price} each</p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-xl lg:text-2xl font-bold text-yellow-400 font-montserrat">
                                ${item.ticket.price * item.quantity}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 lg:gap-3">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onUpdateQuantity(item.ticket.id, item.quantity - 1)}
                                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-4 h-4 lg:w-5 lg:h-5" />
                              </motion.button>
                              <span className="w-10 lg:w-12 text-center text-lg lg:text-xl font-bold font-montserrat">{item.quantity}</span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onUpdateQuantity(item.ticket.id, item.quantity + 1)}
                                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                              </motion.button>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onUpdateQuantity(item.ticket.id, 0)}
                              className="text-red-400 hover:text-red-300 font-bold text-sm lg:text-base font-montserrat"
                            >
                              Remove
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}

                      <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-4 lg:p-6 border-2 border-yellow-500/30">
                        <div className="flex items-center justify-between text-xl lg:text-2xl font-bold">
                          <span className="text-white font-montserrat">Total ({getTotalItems()} tickets)</span>
                          <span className="text-yellow-400 font-montserrat">${totalPrice}</span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep('details')}
                        className="w-full py-4 lg:py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-2xl font-bold text-lg lg:text-xl hover:shadow-2xl hover:shadow-yellow-500/50 transition-all font-bebas tracking-wide"
                      >
                        Continue to Details
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}

              {step === 'details' && (
                <motion.form
                  key="details"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 lg:space-y-6"
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-yellow-400 mb-4 lg:mb-6 font-bebas tracking-wide">Your Information</h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-purple-300 mb-2 font-montserrat text-sm lg:text-base">
                      <User className="w-4 h-4 lg:w-5 lg:h-5" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 lg:px-6 py-3 lg:py-4 bg-purple-900/50 border ${errors.name ? 'border-red-500' : 'border-purple-500/30'} rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors font-montserrat text-sm lg:text-base`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-purple-300 mb-2 font-montserrat text-sm lg:text-base">
                      <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 lg:px-6 py-3 lg:py-4 bg-purple-900/50 border ${errors.email ? 'border-red-500' : 'border-purple-500/30'} rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors font-montserrat text-sm lg:text-base`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-purple-300 mb-2 font-montserrat text-sm lg:text-base">
                      <Phone className="w-4 h-4 lg:w-5 lg:h-5" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 lg:px-6 py-3 lg:py-4 bg-purple-900/50 border ${errors.phone ? 'border-red-500' : 'border-purple-500/30'} rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors font-montserrat text-sm lg:text-base`}
                      placeholder="+65 9123 4567"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 lg:gap-4 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('cart')}
                      className="flex-1 py-3 lg:py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors font-bebas tracking-wide text-base lg:text-lg"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 lg:py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all font-bebas tracking-wide text-base lg:text-lg"
                    >
                      Continue to Payment
                    </motion.button>
                  </div>
                </motion.form>
              )}

              {step === 'payment-select' && (
                <motion.div
                  key="payment-select"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <h3 
                    className="text-2xl font-bold text-yellow-400 mb-4"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                  >
                    Select Payment Method
                  </h3>

                  {/* PayNow Option - NO FEES */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPaymentMethod('paynow')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      paymentMethod === 'paynow'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shrink-0">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>PayNow</span>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">NO FEES</span>
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">RECOMMENDED</span>
                      </div>
                      <p className="text-purple-300 text-xs mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Scan QR & upload proof • Instant Singapore bank transfer
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'paynow' ? 'border-yellow-400 bg-yellow-400' : 'border-purple-500'
                    }`}>
                      {paymentMethod === 'paynow' && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </motion.button>

                  {/* Credit Card Option */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      paymentMethod === 'card'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>Credit/Debit Card</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">{STRIPE_FEES.card.label}</span>
                      </div>
                      <p className="text-purple-300 text-xs mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Visa, Mastercard, AMEX • Powered by Stripe
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'card' ? 'border-yellow-400 bg-yellow-400' : 'border-purple-500'
                    }`}>
                      {paymentMethod === 'card' && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </motion.button>

                  {/* Apple Pay Option */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      paymentMethod === 'apple_pay'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center shrink-0">
                      <ApplePayIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>Apple Pay</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">{STRIPE_FEES.apple_pay.label}</span>
                      </div>
                      <p className="text-purple-300 text-xs mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Pay with Face ID or Touch ID • Safari/iOS only
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'apple_pay' ? 'border-yellow-400 bg-yellow-400' : 'border-purple-500'
                    }`}>
                      {paymentMethod === 'apple_pay' && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </motion.button>

                  {/* GrabPay Option */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPaymentMethod('grabpay')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      paymentMethod === 'grabpay'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#00B14F] flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>GrabPay</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">{STRIPE_FEES.grabpay.label}</span>
                      </div>
                      <p className="text-purple-300 text-xs mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Pay with Grab wallet • Opens Grab app
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'grabpay' ? 'border-yellow-400 bg-yellow-400' : 'border-purple-500'
                    }`}>
                      {paymentMethod === 'grabpay' && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </motion.button>

                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-xl p-4 border-2 border-yellow-500/30 mt-4">
                    {(() => {
                      // Calculate fees based on selected payment method
                      const stripeMethod = paymentMethod === 'apple_pay' ? 'apple_pay' : 
                                          paymentMethod === 'grabpay' ? 'grabpay' : 
                                          paymentMethod === 'card' ? 'card' : null;
                      
                      const platformFee = totalPrice * (PLATFORM_FEE_PERCENTAGE / 100);
                      const showPlatformFee = paymentMethod !== null; // Show for all methods
                      const showStripeFee = stripeMethod !== null;
                      
                      const fees = stripeMethod ? getFeeBreakdown(totalPrice, stripeMethod) : null;
                      const totalWithPlatformOnly = totalPrice + platformFee;
                      const finalTotal = fees ? fees.total : (paymentMethod === 'paynow' ? totalWithPlatformOnly : totalPrice);
                      
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm text-purple-300 mb-1">
                            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Tickets</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>${totalPrice.toFixed(2)}</span>
                          </div>
                          
                          {showPlatformFee && (
                            <div className="flex items-center justify-between text-sm text-purple-300 mb-1">
                              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Service Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>+${platformFee.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {showStripeFee && fees && (
                            <div className="flex items-center justify-between text-sm text-purple-300 mb-1">
                              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Processing ({fees.stripeFeeLabel})</span>
                              <span style={{ fontFamily: 'Montserrat, sans-serif' }}>+${fees.stripeFee.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-purple-500/30 mt-2">
                            <span className="text-yellow-400" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total</span>
                            <span className="text-yellow-400" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              ${finalTotal.toFixed(2)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-purple-400 mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {getTotalItems()} ticket{getTotalItems() > 1 ? 's' : ''} for ADHEERAA Masquerade Night
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('details')}
                      className="flex-1 py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: paymentMethod ? 1.02 : 1 }}
                      whileTap={{ scale: paymentMethod ? 0.98 : 1 }}
                      onClick={handleSubmit}
                      disabled={!paymentMethod}
                      className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                    >
                      Continue
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'paynow' && (
                <motion.div
                  key="paynow"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-6"
                >
                  <h3 
                    className="text-2xl font-bold text-yellow-400 mb-2"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                  >
                    Pay with PayNow
                  </h3>
                  <p className="text-purple-300 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Scan the QR code below using your banking app
                  </p>

                  {/* PayNow QR Code */}
                  <div className="bg-white rounded-2xl p-6 mx-auto max-w-sm">
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden max-w-[200px] mx-auto">
                      {/* Placeholder QR Code Pattern */}
                      <div className="absolute inset-4 grid grid-cols-8 gap-1">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white px-3 py-1 rounded text-xs font-bold text-purple-600">
                          PAYNOW
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 text-sm font-medium">ADHEERAA Events</p>
                    </div>

                    {/* UEN Copy Section */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                        <div>
                          <p className="text-gray-500 text-xs font-medium">UEN</p>
                          <p className="text-black font-bold font-mono">{PAYNOW_UEN}</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => copyToClipboard(PAYNOW_UEN, 'uen')}
                          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
                            copiedUEN 
                              ? 'bg-green-500 text-white' 
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {copiedUEN ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                        <div>
                          <p className="text-gray-500 text-xs font-medium">Amount (incl. {PLATFORM_FEE_PERCENTAGE}% service fee)</p>
                          <p className="text-black font-bold text-xl">${(totalPrice * (1 + PLATFORM_FEE_PERCENTAGE / 100)).toFixed(2)}</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => copyToClipboard((totalPrice * (1 + PLATFORM_FEE_PERCENTAGE / 100)).toFixed(2), 'amount')}
                          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
                            copiedAmount 
                              ? 'bg-green-500 text-white' 
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {copiedAmount ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-start gap-3">
                      <Smartphone className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="text-sm text-purple-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        <p className="font-semibold text-white mb-1">How to pay:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Open your banking app (DBS, OCBC, UOB, etc.)</li>
                          <li>Scan the QR code above</li>
                          <li>Enter amount: <span className="text-yellow-400 font-bold">${(totalPrice * (1 + PLATFORM_FEE_PERCENTAGE / 100)).toFixed(2)}</span></li>
                          <li>Complete the payment</li>
                          <li>Screenshot the confirmation</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Upload Proof */}
                  <div>
                    <label 
                      className="block text-purple-300 mb-2 font-medium"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Upload Proof of Payment *
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full p-6 rounded-xl border-2 border-dashed transition-all ${
                        proofOfPayment
                          ? 'border-green-500 bg-green-500/10'
                          : errors.proof
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-purple-500/50 bg-purple-900/30 hover:border-purple-400'
                      }`}
                    >
                      {proofOfPayment ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <img src={proofOfPayment} alt="Proof" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-left">
                            <p className="text-green-400 font-semibold flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              Image uploaded
                            </p>
                            <p className="text-purple-300 text-sm">{proofFileName}</p>
                            <p className="text-purple-400 text-xs mt-1">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-purple-400" />
                          <p className="text-purple-300 font-medium">Click to upload screenshot</p>
                          <p className="text-purple-400 text-xs">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </motion.button>
                    {errors.proof && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.proof}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setStep('payment-select');
                        setProofOfPayment(null);
                        setProofFileName('');
                      }}
                      disabled={isProcessing}
                      className="flex-1 py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors disabled:opacity-50"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: proofOfPayment && !isProcessing ? 1.02 : 1 }}
                      whileTap={{ scale: proofOfPayment && !isProcessing ? 0.98 : 1 }}
                      onClick={handleSubmit}
                      disabled={!proofOfPayment || isProcessing}
                      className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                    >
                      {isProcessing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                          />
                          Submitting...
                        </>
                      ) : (
                        'Submit Payment'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'stripe-payment' && paymentMethod && paymentMethod !== 'paynow' && (
                <StripePayment
                  amount={totalPrice}
                  customerEmail={formData.email}
                  customerName={formData.name}
                  selectedMethod={paymentMethod as 'card' | 'apple_pay' | 'grabpay'}
                  onBack={() => {
                    setStep('payment-select');
                    setPaymentMethod(null);
                  }}
                  onSuccess={async (paymentId) => {
                    const newOrderNumber = `MASK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
                    setOrderNumber(newOrderNumber);
                    
                    // Calculate total with all fees
                    const stripeMethod = paymentMethod === 'apple_pay' ? 'apple_pay' : 
                                        paymentMethod === 'grabpay' ? 'grabpay' : 'card';
                    const fees = getFeeBreakdown(totalPrice, stripeMethod);
                    
                    // Save order to local storage (Admin Dashboard)
                    const order: Order = {
                      id: crypto.randomUUID(),
                      orderNumber: newOrderNumber,
                      createdAt: new Date().toISOString(),
                      status: 'verified', // Stripe payments are auto-verified
                      paymentMethod: 'card',
                      customerName: formData.name,
                      customerEmail: formData.email,
                      customerPhone: formData.phone,
                      tickets: cart.map(item => ({
                        name: item.ticket.name,
                        quantity: item.quantity,
                        price: item.ticket.price,
                      })),
                      totalAmount: fees.total,
                      adminNotes: `Payment ID: ${paymentId}, Method: ${paymentMethod}, Platform Fee: $${fees.platformFee}, Stripe Fee: $${fees.stripeFee}`,
                    };
                    saveOrder(order);
                    
                    // Send confirmation email to CUSTOMER
                    await sendCustomerConfirmation(
                      newOrderNumber,
                      formData.name,
                      formData.email,
                      cart,
                      fees.total,
                      'card'
                    );
                    
                    // Update inventory - mark tickets as sold
                    confirmPurchase(cart.map(item => ({ ticketId: item.ticket.id, quantity: item.quantity })));
                    onPurchaseComplete?.(); // Refresh inventory in parent
                    
                    setPaidAmount(fees.total); // Store before clearing cart
                    setTicketCount(cart.reduce((total, item) => total + item.quantity, 0));
                    setStep('success');
                    onClearCart();
                  }}
                  onError={(error) => {
                    setErrors({ payment: error });
                  }}
                />
              )}

              {/* Legacy payment step - kept for compatibility but not used */}
              {step === 'payment' && (
                <motion.form
                  key="payment"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 lg:space-y-6"
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-yellow-400 mb-4 lg:mb-6 font-bebas tracking-wide">Payment Details</h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-purple-300 mb-2 font-montserrat text-sm lg:text-base">
                      <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength={19}
                      className={`w-full px-4 lg:px-6 py-3 lg:py-4 bg-purple-900/50 border ${errors.cardNumber ? 'border-red-500' : 'border-purple-500/30'} rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors font-montserrat text-sm lg:text-base`}
                      placeholder="1234 5678 9012 3456"
                    />
                    {errors.cardNumber && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="text-purple-300 mb-2 block font-montserrat text-sm lg:text-base">Expiry Date</label>
                      <input
                        type="text"
                        name="expiry"
                        value={formData.expiry}
                        onChange={handleInputChange}
                        maxLength={5}
                        className={`w-full px-4 lg:px-6 py-3 lg:py-4 bg-purple-900/50 border ${errors.expiry ? 'border-red-500' : 'border-purple-500/30'} rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors font-montserrat text-sm lg:text-base`}
                        placeholder="MM/YY"
                      />
                      {errors.expiry && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.expiry}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-purple-300 mb-2 block font-montserrat text-sm lg:text-base">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        maxLength={4}
                        className={`w-full px-4 lg:px-6 py-3 lg:py-4 bg-purple-900/50 border ${errors.cvv ? 'border-red-500' : 'border-purple-500/30'} rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors font-montserrat text-sm lg:text-base`}
                        placeholder="123"
                      />
                      {errors.cvv && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-4 lg:p-6 border-2 border-yellow-500/30">
                    <div className="flex items-center justify-between text-lg lg:text-xl font-bold mb-2">
                      <span className="text-white font-montserrat">Order Total</span>
                      <span className="text-yellow-400 font-montserrat">${totalPrice}</span>
                    </div>
                    <p className="text-sm text-purple-300 font-montserrat">Includes all fees and taxes</p>
                  </div>

                  <div className="flex gap-3 lg:gap-4 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('details')}
                      disabled={isProcessing}
                      className="flex-1 py-3 lg:py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors disabled:opacity-50 font-bebas tracking-wide text-base lg:text-lg"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                      whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                      disabled={isProcessing}
                      className="flex-1 py-3 lg:py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all disabled:opacity-70 font-bebas tracking-wide text-base lg:text-lg flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                          />
                          Processing...
                        </>
                      ) : (
                        'Complete Purchase'
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}

              {step === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-8"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded-full flex items-center justify-center border-4 border-yellow-400/50"
                  >
                    <Clock className="w-16 h-16 text-yellow-400" />
                  </motion.div>

                  <div>
                    <h3 
                      className="text-3xl lg:text-4xl font-bold text-yellow-400 mb-3"
                      style={{ fontFamily: 'Cinzel, serif' }}
                    >
                      Payment Pending
                    </h3>
                    <p 
                      className="text-xl text-purple-300 mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Your payment is being verified
                    </p>
                    <p 
                      className="text-purple-400"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      We'll email you at <span className="text-white">{formData.email}</span> once confirmed
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-800/50 to-purple-900/50 rounded-2xl p-6 lg:p-8 border border-purple-500/30 max-w-md mx-auto">
                    <div className="space-y-3 text-left" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Reference:</span>
                        <span className="font-bold text-white">{orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Name:</span>
                        <span className="font-bold text-white">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Event:</span>
                        <span className="font-bold text-white">ADHEERAA Masquerade</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Date:</span>
                        <span className="font-bold text-white">Feb 21, 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Tickets:</span>
                        <span className="font-bold text-white">{ticketCount}</span>
                      </div>
                      <div className="flex justify-between text-xl pt-3 border-t border-purple-500/30">
                        <span className="text-yellow-400 font-bold">Amount:</span>
                        <span className="text-yellow-400 font-bold">${paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-amber-300 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="font-bold">⏰ Verification typically takes 5-15 minutes.</span><br />
                      You'll receive your e-tickets via email once payment is confirmed.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onClearCart();
                      onClose();
                    }}
                    className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-4 lg:py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl glow-gold"
                  >
                    <Check className="w-12 h-12 lg:w-16 lg:h-16 text-black" />
                  </motion.div>

                  <div>
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl lg:text-4xl font-bold text-yellow-400 mb-3 font-cinzel"
                    >
                      Payment Successful!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg lg:text-xl text-purple-300 mb-2 font-montserrat"
                    >
                      Your tickets have been confirmed
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-purple-400 font-montserrat text-sm lg:text-base"
                    >
                      Confirmation sent to {formData.email}
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-purple-800/50 to-purple-900/50 rounded-2xl p-6 lg:p-8 border border-purple-500/30 max-w-md mx-auto"
                  >
                    <div className="space-y-3 text-left font-montserrat text-sm lg:text-base">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Order Number:</span>
                        <span className="font-bold text-white">{orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Event:</span>
                        <span className="font-bold text-white">ADHEERAA Masquerade</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Date:</span>
                        <span className="font-bold text-white">Feb 21, 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Venue:</span>
                        <span className="font-bold text-white">Skyfall Rooftop Bar</span>
                      </div>
                      <div className="flex justify-between text-lg lg:text-xl pt-3 border-t border-purple-500/30">
                        <span className="text-yellow-400 font-bold">Total Paid:</span>
                        <span className="text-yellow-400 font-bold">${paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center justify-center gap-2 text-purple-300 font-montserrat text-sm lg:text-base"
                  >
                    <Sparkles className="w-5 h-5" />
                    <p>Check your email for your digital tickets and QR codes</p>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-10 lg:px-12 py-3 lg:py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold text-base lg:text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all font-bebas tracking-wide"
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

