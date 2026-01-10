import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, CreditCard, User, Mail, Phone, Plus, Minus, Check, Sparkles } from 'lucide-react';
import type { CartItem } from '../App';

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (ticketId: string, quantity: number) => void;
  totalPrice: number;
}

export function CheckoutModal({ cart, onClose, onUpdateQuantity, totalPrice }: CheckoutModalProps) {
  const [step, setStep] = useState<'cart' | 'details' | 'payment' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'cart') {
      setStep('details');
    } else if (step === 'details') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('success');
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

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
          className="bg-gradient-to-br from-purple-900 to-black rounded-3xl border-2 border-yellow-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-purple-800 p-6 flex items-center justify-between border-b border-purple-500/30 rounded-t-3xl z-10">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                {step === 'success' ? 'Order Confirmed!' : 'Checkout'}
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          {/* Progress Steps */}
          {step !== 'success' && (
            <div className="p-6 border-b border-purple-500/30">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {['cart', 'details', 'payment'].map((s, index) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        animate={{
                          scale: step === s ? 1.2 : 1,
                          backgroundColor: ['cart', 'details', 'payment'].indexOf(step) >= index ? '#facc15' : '#581c87',
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-black mb-2"
                      >
                        {index + 1}
                      </motion.div>
                      <span className="text-sm text-purple-300 capitalize">{s}</span>
                    </div>
                    {index < 2 && (
                      <div className="flex-1 h-1 bg-purple-800 mx-2 mb-8">
                        <motion.div
                          animate={{
                            width: ['cart', 'details', 'payment'].indexOf(step) > index ? '100%' : '0%',
                          }}
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
          <div className="p-8">
            {step === 'cart' && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">Your Tickets</h3>
                
                {cart.map((item) => (
                  <motion.div
                    key={item.ticket.id}
                    layout
                    className="bg-gradient-to-r from-purple-800/50 to-purple-900/50 rounded-2xl p-6 border border-purple-500/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-white">{item.ticket.name}</h4>
                        <p className="text-purple-300">${item.ticket.price} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-400">
                          ${item.ticket.price * item.quantity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onUpdateQuantity(item.ticket.id, item.quantity - 1)}
                          className="w-10 h-10 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center"
                        >
                          <Minus className="w-5 h-5" />
                        </motion.button>
                        <span className="w-12 text-center text-xl font-bold">{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onUpdateQuantity(item.ticket.id, item.quantity + 1)}
                          className="w-10 h-10 rounded-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQuantity(item.ticket.id, 0)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        Remove
                      </motion.button>
                    </div>
                  </motion.div>
                ))}

                <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-6 border-2 border-yellow-500/30">
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span className="text-white">Total ({getTotalItems()} tickets)</span>
                    <span className="text-yellow-400">${totalPrice}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('details')}
                  className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-yellow-500/50 transition-all"
                >
                  Continue to Details
                </motion.button>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.form
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">Your Information</h3>
                
                <div>
                  <label className="flex items-center gap-2 text-purple-300 mb-2">
                    <User className="w-5 h-5" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-purple-300 mb-2">
                    <Mail className="w-5 h-5" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-purple-300 mb-2">
                    <Phone className="w-5 h-5" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-6 py-4 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep('cart')}
                    className="flex-1 py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all"
                  >
                    Continue to Payment
                  </motion.button>
                </div>
              </motion.form>
            )}

            {step === 'payment' && (
              <motion.form
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">Payment Details</h3>
                
                <div>
                  <label className="flex items-center gap-2 text-purple-300 mb-2">
                    <CreditCard className="w-5 h-5" />
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                    maxLength={19}
                    className="w-full px-6 py-4 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-purple-300 mb-2 block">Expiry Date</label>
                    <input
                      type="text"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      required
                      maxLength={5}
                      className="w-full px-6 py-4 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="text-purple-300 mb-2 block">CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      required
                      maxLength={3}
                      className="w-full px-6 py-4 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none transition-colors"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 rounded-2xl p-6 border-2 border-yellow-500/30">
                  <div className="flex items-center justify-between text-xl font-bold mb-2">
                    <span className="text-white">Order Total</span>
                    <span className="text-yellow-400">${totalPrice}</span>
                  </div>
                  <p className="text-sm text-purple-300">Includes all fees and taxes</p>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep('details')}
                    className="flex-1 py-4 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all"
                  >
                    Complete Purchase
                  </motion.button>
                </div>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 0.8 }}
                  className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center"
                >
                  <Check className="w-16 h-16 text-black" />
                </motion.div>

                <div>
                  <h3 className="text-4xl font-bold text-yellow-400 mb-3">Payment Successful!</h3>
                  <p className="text-xl text-purple-300 mb-2">Your tickets have been confirmed</p>
                  <p className="text-purple-400">Confirmation sent to {formData.email}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-800/50 to-purple-900/50 rounded-2xl p-8 border border-purple-500/30 max-w-md mx-auto">
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-purple-300">Order Number:</span>
                      <span className="font-bold text-white">MASK-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
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
                      <span className="font-bold text-white">{getTotalItems()}</span>
                    </div>
                    <div className="flex justify-between text-xl pt-3 border-t border-purple-500/30">
                      <span className="text-yellow-400 font-bold">Total Paid:</span>
                      <span className="text-yellow-400 font-bold">${totalPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-purple-300">
                  <Sparkles className="w-5 h-5" />
                  <p>Check your email for your digital tickets and QR codes</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all"
                >
                  Done
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}