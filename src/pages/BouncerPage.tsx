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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
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
    setCameraError(null);
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        
        // Wait for video to actually start playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Error playing video:', err);
              setCameraError('Camera started but video not displaying. Try refreshing the page.');
              stopCamera();
            });
          }
        };

        // Check if video is actually playing after a delay
        setTimeout(() => {
          if (videoRef.current && (videoRef.current.readyState < 2 || videoRef.current.paused)) {
            setCameraError('Camera may not be working. Try using manual entry or check camera permissions.');
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please use manual entry.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another app. Please close it and try again.';
      } else {
        errorMessage += 'Please use manual entry.';
      }
      
      setCameraError(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
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
    setCameraError(null);
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
      // Show success popup
      setShowSuccessPopup(true);
      
      setResult({
        success: true,
        message: `Ticket validated! Type: ${ticket.ticketType}`,
        ticket: { ...ticket, status: 'used' },
        orderNumber,
      });
      
      // Auto-clear success popup after 2 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 2000);
      
      // Auto-clear result after 4 seconds
      setTimeout(() => {
        setResult(null);
        setScannedData('');
        setManualOrderNumber('');
        setManualTicketId('');
      }, 4000);
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
        {/* Success Popup */}
        <AnimatePresence>
          {showSuccessPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-8 py-6 rounded-xl shadow-2xl border-2 border-green-400"
            >
              <div className="flex items-center gap-4">
                <CheckCircle className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl font-bold">Ticket Scanned!</h3>
                  <p className="text-green-100">Successfully registered</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    muted
                    className="w-full h-64 object-cover"
                  />
                  {!cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-green-400 rounded-lg w-48 h-48 opacity-50"></div>
                    </div>
                  )}
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {cameraError ? (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
                    <p className="text-red-400 text-sm mb-2">⚠️ Camera Error</p>
                    <p className="text-red-300 text-xs">{cameraError}</p>
                    <button
                      onClick={() => {
                        stopCamera();
                        setScanMode('manual');
                      }}
                      className="mt-3 text-red-400 hover:text-red-300 text-sm underline"
                    >
                      Switch to Manual Entry →
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-purple-300 text-sm mb-4">
                    Point camera at QR code
                  </p>
                )}
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

