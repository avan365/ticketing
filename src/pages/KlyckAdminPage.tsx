import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { DollarSign, CreditCard, Wallet, TrendingUp, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { getAllOrders } from '../utils/orders';
import { resetInventory } from '../utils/inventory';
import { resetAllOrders } from '../utils/orders';
import { EventConfig } from '../config/eventConfig';
import type { Order } from '../utils/orders';

const KLYCK_ADMIN_PASSWORD = "klyck2026"; // Change this to your preferred password

// Check if admin session is still valid
function isSessionValid(): boolean {
  const sessionData = sessionStorage.getItem('klyck_admin_authenticated');
  if (!sessionData) return false;
  
  try {
    const { timestamp } = JSON.parse(sessionData);
    const now = Date.now();
    const isValid = (now - timestamp) < (24 * 60 * 60 * 1000); // 24 hours
    
    if (!isValid) {
      sessionStorage.removeItem('klyck_admin_authenticated');
    }
    
    return isValid;
  } catch {
    return false;
  }
}

// Save admin session
function saveSession(): void {
  sessionStorage.setItem('klyck_admin_authenticated', JSON.stringify({
    timestamp: Date.now(),
  }));
}

export function KlyckAdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check for existing valid session on mount
  useEffect(() => {
    if (isSessionValid()) {
      setIsAuthenticated(true);
      loadOrders();
    } else {
      setLoading(false);
    }
  }, []);

  const loadOrders = async () => {
    try {
      const allOrders = await getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === KLYCK_ADMIN_PASSWORD) {
      saveSession();
      setIsAuthenticated(true);
      setError('');
      loadOrders();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const handleResetInventory = async () => {
    if (confirm('⚠️ Are you sure you want to reset all inventory? This will restore all ticket availability to defaults.')) {
      resetInventory();
      alert('✅ Inventory reset successfully');
    }
  };

  const handleResetOrders = async () => {
    if (confirm('⚠️ WARNING: Are you sure you want to delete ALL orders? This action cannot be undone!')) {
      await resetAllOrders();
      await loadOrders();
      alert('✅ All orders deleted');
    }
  };

  // Calculate financial summaries
  const calculateFinancials = () => {
    const verifiedOrders = orders.filter(o => o.status === 'verified');
    
    let totalPayNow = 0;
    let totalStripe = 0;
    let totalEventRevenue = 0;
    let totalPlatformFees = 0;

    verifiedOrders.forEach(order => {
      // Customer pays (includes platform fee, excludes Stripe fee)
      const customerPays = order.customerPays ?? order.totalAmount;
      
      // Event revenue (ticket subtotal, excludes platform fees)
      const revenue = order.ticketSubtotal ?? 
        order.tickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
      
      // Platform fee
      const platformFee = order.platformFee ?? 0;

      if (order.paymentMethod === 'paynow') {
        totalPayNow += customerPays;
      } else if (order.paymentMethod === 'card') {
        totalStripe += customerPays;
      }

      totalEventRevenue += revenue;
      totalPlatformFees += platformFee;
    });

    return {
      totalPayNow,
      totalStripe,
      totalEventRevenue,
      totalPlatformFees,
      totalCustomerPayments: totalPayNow + totalStripe,
    };
  };

  const financials = calculateFinancials();

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: EventConfig.colors.background }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-8 max-w-md w-full shadow-xl"
          style={{ 
            backgroundColor: EventConfig.colors.backgroundSecondary,
            borderColor: EventConfig.colors.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: `${EventConfig.colors.primary.base}33` }}>
              <Lock className="w-8 h-8" style={{ color: EventConfig.colors.primary.base }} />
            </div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ 
                fontFamily: EventConfig.fonts.display,
                color: EventConfig.colors.text.primary,
              }}
            >
              KLYCK Admin
            </h1>
            <p style={{ color: EventConfig.colors.text.secondary }} className="text-sm">
              Financial Dashboard Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: EventConfig.colors.text.secondary }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none transition-colors"
                  style={{ 
                    backgroundColor: `${EventConfig.colors.secondary.base}80`,
                    borderColor: EventConfig.colors.border.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: EventConfig.colors.text.primary,
                  }}
                  placeholder="Enter password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: EventConfig.colors.text.secondary }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-bold transition-all"
              style={{ 
                background: `linear-gradient(to right, ${EventConfig.colors.primary.base}, ${EventConfig.colors.primary.dark})`,
                color: EventConfig.colors.text.primary,
              }}
            >
              Access Dashboard
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm"
              style={{ color: EventConfig.colors.text.secondary }}
            >
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: EventConfig.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: EventConfig.colors.primary.base }}></div>
          <p style={{ color: EventConfig.colors.text.secondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: EventConfig.colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ 
                fontFamily: EventConfig.fonts.display,
                color: EventConfig.colors.text.primary,
              }}
            >
              KLYCK Financial Dashboard
            </h1>
            <p style={{ color: EventConfig.colors.text.secondary }}>
              Revenue and payment summaries
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{ 
                backgroundColor: EventConfig.colors.backgroundSecondary,
                borderColor: EventConfig.colors.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: EventConfig.colors.text.primary,
              }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ 
                backgroundColor: EventConfig.colors.backgroundSecondary,
                borderColor: EventConfig.colors.border.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: EventConfig.colors.text.secondary,
              }}
            >
              Home
            </motion.button>
          </div>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total PayNow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 shadow-lg"
            style={{ 
              backgroundColor: EventConfig.colors.backgroundSecondary,
              borderColor: EventConfig.colors.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${EventConfig.colors.primary.base}33` }}>
                <Wallet className="w-6 h-6" style={{ color: EventConfig.colors.primary.base }} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: EventConfig.colors.text.secondary }}>
              Total PayNow
            </h3>
            <p className="text-2xl font-bold" style={{ color: EventConfig.colors.text.primary }}>
              ${financials.totalPayNow.toFixed(2)}
            </p>
            <p className="text-xs mt-2" style={{ color: EventConfig.colors.text.muted }}>
              Includes platform fees
            </p>
          </motion.div>

          {/* Total Stripe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-6 shadow-lg"
            style={{ 
              backgroundColor: EventConfig.colors.backgroundSecondary,
              borderColor: EventConfig.colors.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${EventConfig.colors.secondary.base}33` }}>
                <CreditCard className="w-6 h-6" style={{ color: EventConfig.colors.secondary.base }} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: EventConfig.colors.text.secondary }}>
              Total Stripe
            </h3>
            <p className="text-2xl font-bold" style={{ color: EventConfig.colors.text.primary }}>
              ${financials.totalStripe.toFixed(2)}
            </p>
            <p className="text-xs mt-2" style={{ color: EventConfig.colors.text.muted }}>
              Includes platform fees
            </p>
          </motion.div>

          {/* Total Event Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-6 shadow-lg"
            style={{ 
              backgroundColor: EventConfig.colors.backgroundSecondary,
              borderColor: EventConfig.colors.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${EventConfig.colors.primary.base}33` }}>
                <TrendingUp className="w-6 h-6" style={{ color: EventConfig.colors.primary.base }} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: EventConfig.colors.text.secondary }}>
              Event Revenue
            </h3>
            <p className="text-2xl font-bold" style={{ color: EventConfig.colors.text.primary }}>
              ${financials.totalEventRevenue.toFixed(2)}
            </p>
            <p className="text-xs mt-2" style={{ color: EventConfig.colors.text.muted }}>
              Excludes platform fees
            </p>
          </motion.div>

          {/* Total Platform Fees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-6 shadow-lg"
            style={{ 
              backgroundColor: EventConfig.colors.backgroundSecondary,
              borderColor: EventConfig.colors.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${EventConfig.colors.secondary.base}33` }}>
                <DollarSign className="w-6 h-6" style={{ color: EventConfig.colors.secondary.base }} />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: EventConfig.colors.text.secondary }}>
              Platform Fees
            </h3>
            <p className="text-2xl font-bold" style={{ color: EventConfig.colors.text.primary }}>
              ${financials.totalPlatformFees.toFixed(2)}
            </p>
            <p className="text-xs mt-2" style={{ color: EventConfig.colors.text.muted }}>
              Total collected
            </p>
          </motion.div>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-6 mb-8"
          style={{ 
            backgroundColor: EventConfig.colors.backgroundSecondary,
            borderColor: EventConfig.colors.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: EventConfig.colors.text.primary }}>
            Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm mb-1" style={{ color: EventConfig.colors.text.secondary }}>
                Total Customer Payments
              </p>
              <p className="text-2xl font-bold" style={{ color: EventConfig.colors.text.primary }}>
                ${financials.totalCustomerPayments.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: EventConfig.colors.text.secondary }}>
                Total Orders (Verified)
              </p>
              <p className="text-2xl font-bold" style={{ color: EventConfig.colors.text.primary }}>
                {orders.filter(o => o.status === 'verified').length}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: EventConfig.colors.text.secondary }}>
                Net Revenue
              </p>
              <p className="text-2xl font-bold" style={{ color: EventConfig.colors.primary.base }}>
                ${(financials.totalEventRevenue + financials.totalPlatformFees).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reset Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl p-6"
          style={{ 
            backgroundColor: EventConfig.colors.backgroundSecondary,
            borderColor: EventConfig.colors.border.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: EventConfig.colors.text.primary }}>
            Reset Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <motion.button
              onClick={handleResetInventory}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ 
                backgroundColor: `${EventConfig.colors.primary.base}33`,
                borderColor: EventConfig.colors.primary.base,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: EventConfig.colors.primary.base,
              }}
            >
              Reset Inventory
            </motion.button>
            <motion.button
              onClick={handleResetOrders}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ 
                backgroundColor: `${EventConfig.colors.secondary.base}33`,
                borderColor: EventConfig.colors.secondary.base,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: EventConfig.colors.secondary.base,
              }}
            >
              Reset All Orders
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

