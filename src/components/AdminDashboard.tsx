import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Download,
  Check,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  RefreshCw,
  DollarSign,
  Ticket,
  Users,
  Package,
  Edit2,
  Save,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  downloadCSV,
  getAdminPassword,
  type Order,
} from "../utils/orders";
import {
  getInventory,
  saveInventory,
  resetInventory,
  getInventoryStats,
  getBaseQuantity,
  type TicketInventory,
} from "../utils/inventory";
import { EventConfig } from "../config/eventConfig";
import { sendCustomerConfirmation } from "../utils/email";

type AdminTab = "orders" | "inventory";

// Override password required to un-verify orders
const OVERRIDE_PASSWORD = "override";

interface AdminDashboardProps {
  onClose: () => void;
  skipAuth?: boolean; // If true, skip authentication (for use in AdminPage)
}

export function AdminDashboard({
  onClose,
  skipAuth = false,
}: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(skipAuth);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getOrderStats>>>(
    {
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
    }
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>(
    "all"
  );
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Inventory state
  const [inventory, setInventory] = useState<TicketInventory>({});
  const [inventoryStats, setInventoryStats] = useState(getInventoryStats());
  const [editingInventory, setEditingInventory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Override password modal state (for un-verifying orders)
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePassword, setOverridePassword] = useState("");
  const [overrideError, setOverrideError] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    orderId: string;
    status: Order["status"];
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();

      // Auto-refresh every 5 seconds to catch bouncer scans
      const interval = setInterval(() => {
        refreshData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    console.log("🔄 Refreshing admin data...");
    try {
      const orders = await getAllOrders();
      console.log("📋 Orders loaded:", orders.length);
      setOrders(orders);

      const statsData = await getOrderStats();
      setStats(statsData);
      setInventory(getInventory());
      // Derive global inventory stats from orders so counts are consistent across devices
      const soldById: Record<string, number> = {};

      const mapTicketToId = (ticketName: string, ticketPrice: number): string | null => {
        // 1) Try exact name match against current config
        const byName = EventConfig.tickets.find((t) => t.name === ticketName);
        if (byName) return byName.id;

        // 2) Legacy names (e.g. before renaming Phase III -> Final Release)
        if (ticketName === "Phase III") return "phase-iii";

        // 3) Fallback by unique price
        const byPrice = EventConfig.tickets.filter((t) => t.price === ticketPrice);
        if (byPrice.length === 1) return byPrice[0].id;

        return null;
      };

      for (const order of orders) {
        if (order.status === "rejected") continue;
        for (const t of order.tickets || []) {
          const id = mapTicketToId(t.name, t.price);
          if (!id) continue;
          soldById[id] = (soldById[id] || 0) + t.quantity;
        }
      }

      let totalTickets = 0;
      let totalSold = 0;

      for (const ticket of EventConfig.tickets) {
        const base = getBaseQuantity(ticket.id);
        totalTickets += base;
        totalSold += soldById[ticket.id] || 0;
      }

      setInventoryStats({
        totalTickets,
        totalSold,
        totalReserved: 0,
        totalAvailable: Math.max(0, totalTickets - totalSold),
      });
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    }
  };

  // Calculate ticket scanning stats for an order
  const getTicketScanStats = (order: Order) => {
    if (!order.individualTickets || order.individualTickets.length === 0) {
      return { scanned: 0, total: 0, percentage: 0 };
    }
    const scanned = order.individualTickets.filter(
      (t) => t.status === "used"
    ).length;
    const total = order.individualTickets.length;
    return {
      scanned,
      total,
      percentage: total > 0 ? Math.round((scanned / total) * 100) : 0,
    };
  };

  const handleInventoryEdit = (ticketId: string, currentAvailable: number) => {
    setEditingInventory(ticketId);
    setEditValue(currentAvailable.toString());
  };

  const handleInventorySave = (ticketId: string) => {
    const newValue = parseInt(editValue);
    if (!isNaN(newValue) && newValue >= 0) {
      const inv = getInventory();
      if (inv[ticketId]) {
        // Update total available (not just remaining)
        inv[ticketId].available = newValue + inv[ticketId].sold;
        saveInventory(inv);
        refreshData();
      }
    }
    setEditingInventory(null);
  };

  const handleResetInventory = () => {
    if (
      confirm(
        "Reset all inventory to default values? This will clear all sold counts."
      )
    ) {
      resetInventory();
      refreshData();
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === getAdminPassword()) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const handleStatusChange = async (
    orderId: string,
    status: Order["status"]
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // If order is already verified and trying to change, require override password
    if (order.status === "verified" && status !== "verified") {
      setPendingStatusChange({ orderId, status });
      setShowOverrideModal(true);
      setOverridePassword("");
      setOverrideError("");
      return;
    }

    // If verifying a PayNow order, send confirmation email to customer
    if (status === "verified" && order.paymentMethod === "paynow") {
      setSendingEmail(orderId);
      try {
        // Convert individualTickets to TicketQR format for email
        const qrCodes =
          order.individualTickets?.map((t) => ({
            ticketId: t.ticketId,
            qrCodeDataUrl: t.qrCodeDataUrl,
            orderNumber: order.orderNumber,
            ticketType: t.ticketType,
            customerName: order.customerName,
          })) || [];

        await sendCustomerConfirmation(
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          order.tickets.map((t) => ({
            ticket: {
              id: t.name.toLowerCase().replace(/\s+/g, "-"),
              name: t.name,
              price: t.price,
              description: "",
              available: 0,
            },
            quantity: t.quantity,
          })),
          order.totalAmount,
          "paynow",
          true, // isVerified = true, so email shows "Confirmed" status
          qrCodes.length > 0 ? qrCodes : undefined
        );
        console.log("✅ Confirmation email sent to:", order.customerEmail);
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      } finally {
        setSendingEmail(null);
      }
    }

    updateOrderStatus(orderId, status)
      .then(() => {
        refreshData();
      })
      .catch((error) => {
        console.error("Failed to update order status:", error);
        alert(
          `Failed to update order status: ${error.message || "Unknown error"}`
        );
      });
  };

  const handleOverrideConfirm = () => {
    if (overridePassword === OVERRIDE_PASSWORD) {
      if (pendingStatusChange) {
        updateOrderStatus(
          pendingStatusChange.orderId,
          pendingStatusChange.status
        )
          .then(() => {
            refreshData();
          })
          .catch((error) => {
            console.error("Failed to update order status:", error);
            setOverrideError(
              `Failed to update: ${error.message || "Unknown error"}`
            );
          });
      }
      setShowOverrideModal(false);
      setPendingStatusChange(null);
      setOverridePassword("");
      setOverrideError("");
    } else {
      setOverrideError("Incorrect override password");
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      await deleteOrder(orderId);
      refreshData();
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "verified":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "verified":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-purple-900 to-black rounded-2xl border-2 border-purple-500/30 p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              Admin Access
            </h2>
            <p
              className="text-purple-300 text-sm mt-2"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Enter password to view orders
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none pr-12"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-purple-800/50 text-white rounded-xl font-bold hover:bg-purple-700/50 transition-colors"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  letterSpacing: "1px",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  letterSpacing: "1px",
                }}
              >
                Login
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  }

  // Dashboard
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-4 border-b border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              ADHEERAA Admin
            </h1>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              {stats.pending} pending
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="p-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            {activeTab === "orders" && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            {activeTab === "inventory" && (
              <button
                onClick={handleResetInventory}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium transition-colors"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <RotateCcw className="w-4 h-4" />
                Reset Inventory
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "orders"
                ? "bg-yellow-500 text-black"
                : "bg-purple-700/50 text-white hover:bg-purple-600"
            }`}
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <Users className="w-4 h-4" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "inventory"
                ? "bg-yellow-500 text-black"
                : "bg-purple-700/50 text-white hover:bg-purple-600"
            }`}
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <Package className="w-4 h-4" />
            Inventory
          </button>
        </div>
      </div>

      {/* Orders Tab Content */}
      {activeTab === "orders" && (
        <>
          {/* Stats */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Verified Revenue</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${stats.totalRevenue}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Pending Revenue</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ${stats.pendingRevenue}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 pb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-yellow-400 focus:outline-none"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-400" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                className="px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-purple-300 text-lg">No orders found</p>
                <p className="text-purple-400 text-sm mt-2">
                  Orders will appear here when customers make purchases
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    className="bg-purple-900/30 rounded-xl border border-purple-500/20 overflow-hidden"
                  >
                    {/* Order Row */}
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-purple-800/20 transition-colors"
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )
                      }
                    >
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div>
                          <p className="text-purple-400 text-xs">Order #</p>
                          <p className="text-white font-mono font-bold">
                            {order.orderNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-purple-400 text-xs">Customer</p>
                          <p className="text-white">{order.customerName}</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-purple-400 text-xs">Email</p>
                          <p className="text-white text-sm truncate">
                            {order.customerEmail}
                          </p>
                        </div>
                        <div>
                          <p className="text-purple-400 text-xs">
                            Customer Pays
                          </p>
                          <p className="text-yellow-400 font-bold">
                            $
                            {order.customerPays !== undefined
                              ? order.customerPays.toFixed(2)
                              : order.totalAmount.toFixed(2)}
                          </p>
                          {order.stripeFee && order.stripeFee > 0 && (
                            <p className="text-purple-400 text-[10px] mt-0.5">
                              (excl. ${order.stripeFee.toFixed(2)} processing)
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-purple-400 text-xs">Status</p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-purple-400 text-xs">
                            Tickets Scanned
                          </p>
                          {(() => {
                            const scanStats = getTicketScanStats(order);
                            if (scanStats.total === 0) {
                              return (
                                <span className="text-purple-300 text-xs">
                                  N/A
                                </span>
                              );
                            }
                            return (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold ${
                                    scanStats.scanned === scanStats.total
                                      ? "text-green-400"
                                      : scanStats.scanned > 0
                                      ? "text-yellow-400"
                                      : "text-purple-300"
                                  }`}
                                >
                                  {scanStats.scanned}/{scanStats.total}
                                </span>
                                <span className="text-purple-400 text-xs">
                                  ({scanStats.percentage}%)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      )}
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-purple-500/20"
                        >
                          <div className="p-4 grid md:grid-cols-2 gap-6">
                            {/* Left Column - Details */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-purple-400 text-xs mb-1">
                                  Date
                                </p>
                                <p className="text-white">
                                  {new Date(order.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-purple-400 text-xs mb-1">
                                  Phone
                                </p>
                                <p className="text-white">
                                  {order.customerPhone}
                                </p>
                              </div>
                              <div>
                                <p className="text-purple-400 text-xs mb-1">
                                  Tickets
                                </p>
                                <div className="space-y-1">
                                  {order.tickets.map((ticket, i) => (
                                    <p key={i} className="text-white">
                                      {ticket.name} x{ticket.quantity} @ $
                                      {ticket.price} = $
                                      {(ticket.price * ticket.quantity).toFixed(
                                        2
                                      )}
                                    </p>
                                  ))}
                                </div>
                                {order.ticketSubtotal !== undefined && (
                                  <div className="mt-2 pt-2 border-t border-purple-500/20">
                                    <p className="text-purple-300 text-xs">
                                      Subtotal: $
                                      {order.ticketSubtotal.toFixed(2)}
                                    </p>
                                    {order.platformFee !== undefined &&
                                      order.platformFee > 0 && (
                                        <p className="text-purple-300 text-xs">
                                          Platform Fee: $
                                          {order.platformFee.toFixed(2)}
                                        </p>
                                      )}
                                    {order.stripeFee !== undefined &&
                                      order.stripeFee > 0 && (
                                        <p className="text-purple-300 text-xs">
                                          Processing Fee: $
                                          {order.stripeFee.toFixed(2)}
                                        </p>
                                      )}
                                    <p className="text-yellow-400 text-sm font-semibold mt-1">
                                      Customer Pays: $
                                      {order.customerPays !== undefined
                                        ? order.customerPays.toFixed(2)
                                        : order.totalAmount.toFixed(2)}
                                    </p>
                                    <p className="text-green-400 text-sm font-semibold mt-1">
                                      Revenue: $
                                      {order.ticketSubtotal.toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {order.individualTickets &&
                                order.individualTickets.length > 0 && (
                                  <div>
                                    <p className="text-purple-400 text-xs mb-2">
                                      Ticket Status
                                    </p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {order.individualTickets.map((ticket) => (
                                        <div
                                          key={ticket.ticketId}
                                          className="flex items-center justify-between p-2 bg-purple-800/20 rounded text-xs"
                                        >
                                          <div>
                                            <p className="text-white font-mono">
                                              {ticket.ticketId}
                                            </p>
                                            <p className="text-purple-300">
                                              {ticket.ticketType}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <span
                                              className={`px-2 py-1 rounded text-xs ${
                                                ticket.status === "used"
                                                  ? "bg-red-500/20 text-red-400"
                                                  : ticket.status === "valid"
                                                  ? "bg-green-500/20 text-green-400"
                                                  : "bg-yellow-500/20 text-yellow-400"
                                              }`}
                                            >
                                              {ticket.status}
                                            </span>
                                            {ticket.scannedAt && (
                                              <p className="text-purple-400 text-[10px] mt-1">
                                                {new Date(
                                                  ticket.scannedAt
                                                ).toLocaleString()}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              <div>
                                <p className="text-purple-400 text-xs mb-1">
                                  Payment Method
                                </p>
                                <p className="text-white capitalize">
                                  {order.paymentMethod}
                                </p>
                              </div>
                            </div>

                            {/* Right Column - Proof & Actions */}
                            <div className="space-y-4">
                              {order.proofOfPayment && (
                                <div>
                                  <p className="text-purple-400 text-xs mb-2">
                                    Payment Proof
                                  </p>
                                  <div
                                    className="relative w-40 h-40 rounded-lg overflow-hidden cursor-pointer border border-purple-500/30 hover:border-yellow-400 transition-colors"
                                    onClick={() =>
                                      setSelectedImage(order.proofOfPayment!)
                                    }
                                  >
                                    <img
                                      src={order.proofOfPayment}
                                      alt="Payment proof"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <ExternalLink className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div>
                                <p className="text-purple-400 text-xs mb-2">
                                  Actions
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order.id, "verified")
                                    }
                                    disabled={
                                      order.status === "verified" ||
                                      sendingEmail === order.id
                                    }
                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                                  >
                                    {sendingEmail === order.id ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4" />
                                        Verify
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order.id, "rejected")
                                    }
                                    disabled={order.status === "rejected"}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order.id, "pending")
                                    }
                                    disabled={order.status === "pending"}
                                    className="flex items-center gap-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Pending
                                  </button>
                                  <button
                                    onClick={() => handleDelete(order.id)}
                                    className="flex items-center gap-1 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-white text-sm transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Inventory Tab Content */}
      {activeTab === "inventory" && (
        <>
          {/* Inventory Stats */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Total Tickets</p>
                  <p className="text-2xl font-bold text-white">
                    {inventoryStats.totalTickets}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Sold</p>
                  <p className="text-2xl font-bold text-green-400">
                    {inventoryStats.totalSold}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">Available</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {inventoryStats.totalAvailable}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-xs">% Sold</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {inventoryStats.totalTickets > 0
                      ? Math.round(
                          (inventoryStats.totalSold /
                            inventoryStats.totalTickets) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            <div className="bg-purple-900/30 rounded-xl border border-purple-500/20 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-800/30">
                    <th className="px-4 py-3 text-left text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-4 py-3 text-center text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Total Stock
                    </th>
                    <th className="px-4 py-3 text-center text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="px-4 py-3 text-center text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-4 py-3 text-center text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-purple-300 text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/20">
                  {Object.entries(inventory).map(([ticketId, data]) => {
                    const remaining = data.available - data.sold;
                    const percentSold = Math.round(
                      (data.sold / data.available) * 100
                    );
                    const isSoldOut = remaining <= 0;
                    const isLow = remaining > 0 && remaining <= 10;

                    return (
                      <tr
                        key={ticketId}
                        className="hover:bg-purple-800/20 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <p
                            className="text-white font-medium"
                            style={{ fontFamily: "Cinzel, serif" }}
                          >
                            {data.name}
                          </p>
                          <p className="text-purple-400 text-xs mt-1">
                            ID: {ticketId}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <p className="text-yellow-400 font-bold">
                            ${data.price}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <p className="text-white">{data.available}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <p className="text-green-400 font-medium">
                            {data.sold}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {editingInventory === ticketId ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 px-2 py-1 bg-purple-800 border border-yellow-400 rounded text-white text-center focus:outline-none"
                              min="0"
                              autoFocus
                            />
                          ) : (
                            <p
                              className={`font-bold ${
                                isSoldOut
                                  ? "text-red-400"
                                  : isLow
                                  ? "text-orange-400"
                                  : "text-white"
                              }`}
                            >
                              {remaining}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {isSoldOut ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                              Sold Out
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              Available
                            </span>
                          )}
                          <div className="mt-2 w-full bg-purple-900 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                isSoldOut
                                  ? "bg-red-500"
                                  : isLow
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${percentSold}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {editingInventory === ticketId ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleInventorySave(ticketId)}
                                className="p-1.5 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                                title="Save"
                              >
                                <Save className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => setEditingInventory(null)}
                                className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleInventoryEdit(ticketId, remaining)
                              }
                              className="p-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
                              title="Edit Available"
                            >
                              <Edit2 className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={selectedImage}
              alt="Payment proof"
              className="max-w-full max-h-full rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Override Password Modal */}
      <AnimatePresence>
        {showOverrideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowOverrideModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    Override Required
                  </h3>
                  <p className="text-purple-300 text-sm">
                    Changing a verified order status
                  </p>
                </div>
              </div>

              <p className="text-purple-200 text-sm mb-4">
                This order has been verified. To change its status, please enter
                the override password.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    Override Password
                  </label>
                  <input
                    type="password"
                    value={overridePassword}
                    onChange={(e) => setOverridePassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleOverrideConfirm()
                    }
                    placeholder="Enter override password"
                    className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-orange-400 focus:outline-none"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    autoFocus
                  />
                  {overrideError && (
                    <p className="text-red-400 text-sm mt-2">{overrideError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowOverrideModal(false);
                      setPendingStatusChange(null);
                      setOverridePassword("");
                      setOverrideError("");
                    }}
                    className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOverrideConfirm}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Confirm Override
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
