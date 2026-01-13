import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, CheckCircle, XCircle, 
  Search, Camera, X
} from 'lucide-react';
import { 
  findTicket, 
  updateTicketStatus, 
  type IndividualTicket 
} from '../utils/orders';
import { parseQRCodeData } from '../utils/qrcode';

export function BouncerPage() {
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('qr');
  const [scannedData, setScannedData] = useState<string>('');
  const [manualOrderNumber, setManualOrderNumber] = useState('');
  const [manualTicketId, setManualTicketId] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    ticket?: IndividualTicket;
    orderNumber?: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setResult({
        success: false,
        message: 'Unable to access camera. Please use manual entry.',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleQRScan = (qrData: string) => {
    const parsed = parseQRCodeData(qrData);
    if (!parsed) {
      setResult({
        success: false,
        message: 'Invalid QR code format',
      });
      return;
    }

    validateTicket(parsed.orderNumber, parsed.ticketId);
  };

  const validateTicket = (orderNumber: string, ticketId: string) => {
    const ticket = findTicket(orderNumber, ticketId);
    
    if (!ticket) {
      setResult({
        success: false,
        message: `Ticket not found: ${ticketId}`,
      });
      return;
    }

    if (ticket.status === 'used') {
      setResult({
        success: false,
        message: `Ticket already used${ticket.scannedAt ? ` on ${new Date(ticket.scannedAt).toLocaleString()}` : ''}`,
        ticket,
        orderNumber,
      });
      return;
    }

    if (ticket.status === 'invalid') {
      setResult({
        success: false,
        message: 'Ticket is invalid',
        ticket,
        orderNumber,
      });
      return;
    }

    // Mark ticket as used
    const updateResult = updateTicketStatus(ticketId, 'used', 'bouncer');
    
    if (updateResult.success) {
      setResult({
        success: true,
        message: `Ticket validated! Type: ${ticket.ticketType}`,
        ticket: { ...ticket, status: 'used' },
        orderNumber,
      });
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        setResult(null);
        setScannedData('');
      }, 3000);
    } else {
      setResult({
        success: false,
        message: 'Failed to update ticket status',
        ticket,
        orderNumber,
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderNumber || !manualTicketId) {
      setResult({
        success: false,
        message: 'Please enter both order number and ticket ID',
      });
      return;
    }
    validateTicket(manualOrderNumber.trim(), manualTicketId.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Ticket Scanner
          </h1>
          <p className="text-purple-300">ADHEERAA Masquerade Night</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-6 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setScanMode('qr');
              stopCamera();
              setResult(null);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              scanMode === 'qr'
                ? 'bg-amber-600 text-white'
                : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
            }`}
          >
            <QrCode className="w-5 h-5 inline mr-2" />
            QR Scan
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setScanMode('manual');
              stopCamera();
              setResult(null);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              scanMode === 'manual'
                ? 'bg-amber-600 text-white'
                : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
            }`}
          >
            <Search className="w-5 h-5 inline mr-2" />
            Manual Entry
          </motion.button>
        </div>

        {/* QR Scan Mode */}
        {scanMode === 'qr' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl p-6"
          >
            {!scanning ? (
              <div className="text-center">
                <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-purple-300 mb-6">
                  Click to start camera and scan QR code
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startCamera}
                  className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  <Camera className="w-5 h-5 inline mr-2" />
                  Start Camera
                </motion.button>
              </div>
            ) : (
              <div>
                <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-center text-purple-300 text-sm mb-4">
                  Point camera at QR code
                </p>
                <div className="bg-purple-900/30 p-4 rounded-lg">
                  <label className="block text-purple-300 text-sm mb-2">
                    Or paste QR code data:
                  </label>
                  <input
                    type="text"
                    value={scannedData}
                    onChange={(e) => setScannedData(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && scannedData) {
                        handleQRScan(scannedData);
                      }
                    }}
                    placeholder="Paste QR code data here"
                    className="w-full px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-amber-500/40 focus:outline-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (scannedData) {
                        handleQRScan(scannedData);
                      }
                    }}
                    className="w-full mt-2 py-2 bg-amber-600 text-white rounded-lg font-semibold"
                  >
                    Validate
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Manual Entry Mode */}
        {scanMode === 'manual' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl p-6"
          >
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  value={manualOrderNumber}
                  onChange={(e) => setManualOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., ORD-12345"
                  className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-amber-500/40 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm mb-2">
                  Ticket ID
                </label>
                <input
                  type="text"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value.toUpperCase())}
                  placeholder="e.g., TKT-ABC123"
                  className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-amber-500/40 focus:outline-none"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-bold hover:shadow-lg transition-all"
              >
                Validate Ticket
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Result Display */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-6 rounded-xl border-2 ${
                result.success
                  ? 'bg-green-900/20 border-green-500/50'
                  : 'bg-red-900/20 border-red-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.success ? 'Ticket Valid!' : 'Validation Failed'}
                  </h3>
                  <p className="text-white mb-2">{result.message}</p>
                  {result.ticket && (
                    <div className="mt-3 space-y-1 text-sm text-purple-300">
                      <p>Order: {result.orderNumber}</p>
                      <p>Ticket ID: {result.ticket.ticketId}</p>
                      <p>Type: {result.ticket.ticketType}</p>
                      {result.ticket.scannedAt && (
                        <p>Scanned: {new Date(result.ticket.scannedAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    setScannedData('');
                    setManualOrderNumber('');
                    setManualTicketId('');
                  }}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

