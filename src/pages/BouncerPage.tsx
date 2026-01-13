import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, CheckCircle, XCircle, 
  Search, Camera, X
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  updateTicketStatus,
  getAllOrders,
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
  const [scanningQR, setScanningQR] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    return () => {
      // Cleanup scanner
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setScanningQR(false);
    
    try {
      // Clean up any existing scanner
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
        scannerRef.current.clear();
      }

      // IMPORTANT: Set scanning to true FIRST so the div renders
      setScanning(true);
      
      // Wait for React to render the div before creating scanner
      // Use requestAnimationFrame to ensure DOM is updated
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // Verify the element exists
      const element = document.getElementById(qrCodeRegionId);
      if (!element) {
        throw new Error('QR code scanner element not found in DOM');
      }

      // Create new scanner instance AFTER div exists
      const scanner = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = scanner;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No cameras found');
      }

      // Try cameras in order: back camera first, then front, then any other
      let cameraId: string | null = null;
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const frontCamera = devices.find(d => 
        d.label.toLowerCase().includes('front') || 
        d.label.toLowerCase().includes('user')
      );

      // Priority: back > front > first available
      // Prefer back camera for QR scanning (better for scanning)
      if (backCamera) {
        cameraId = backCamera.id;
      } else if (frontCamera) {
        cameraId = frontCamera.id;
      } else {
        cameraId = devices[0].id;
      }

      setScanningQR(true);

      // Start scanning with optimized settings
      // Try with specific camera ID first
      try {
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // QR code detected!
            setScanningQR(false);
            scanner.stop().catch(() => {});
            setScanning(false);
            handleQRScan(decodedText);
          },
          () => {
            // Ignore scanning errors (just means no QR code detected yet)
          }
        );
      } catch (startError: any) {
        // If specific camera fails, try with facingMode constraint
        console.log('Camera ID failed, trying with facingMode constraint:', startError);
        try {
          await scanner.start(
            { facingMode: backCamera ? 'environment' : 'user' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // QR code detected!
              setScanningQR(false);
              scanner.stop().catch(() => {});
              setScanning(false);
              handleQRScan(decodedText);
            },
            () => {
              // Ignore scanning errors (just means no QR code detected yet)
            }
          );
        } catch (fallbackError: any) {
          // Both methods failed, throw the original error
          throw startError;
        }
      }

      // Success - clear any previous errors
      setCameraError(null);
    } catch (error: any) {
      console.error('Error starting camera:', error);
      setScanning(false);
      setScanningQR(false);
      
      let errorMessage = '';
      let retryMessage = '';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied';
        retryMessage = 'Click "Allow" when prompted, then click "Try Again"';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found';
        retryMessage = 'Make sure your device has a camera and try again';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is in use';
        retryMessage = 'Close other apps using the camera, then click "Try Again"';
      } else if (error.message?.includes('No cameras')) {
        errorMessage = 'No cameras available';
        retryMessage = 'No camera detected. Please check your device settings';
      } else if (error.message?.includes('start failed') || error.message?.includes('Could not start')) {
        errorMessage = 'Camera failed to start';
        retryMessage = 'Try again or switch to a different camera';
      } else {
        errorMessage = 'Camera access failed';
        retryMessage = 'Try again or check browser permissions';
      }
      
      // Only show manual entry as last resort, don't auto-switch
      setCameraError(`${errorMessage}. ${retryMessage}`);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current.clear();
    }
    setScanning(false);
    setScanningQR(false);
    setCameraError(null);
  };

  const handleQRScan = (qrData: string) => {
    // Clean the QR data
    const cleanData = qrData.trim();
    console.log('Scanned QR data:', cleanData);
    
    const parsed = parseQRCodeData(cleanData);
    if (!parsed) {
      console.error('Failed to parse QR code:', cleanData);
      setResult({
        success: false,
        message: `Invalid QR code format. Scanned: "${cleanData.substring(0, 50)}..."`,
      });
      return;
    }

    console.log('Parsed QR code:', parsed);
    validateTicket(parsed.orderNumber.trim(), parsed.ticketId.trim());
  };

  const validateTicket = (orderNumber: string, ticketId: string) => {
    // Normalize inputs (uppercase, trim)
    const normalizedOrderNumber = orderNumber.trim().toUpperCase();
    const normalizedTicketId = ticketId.trim().toUpperCase();
    
    console.log('Validating ticket:', { normalizedOrderNumber, normalizedTicketId });
    
    // First check if order exists
    const orders = getAllOrders();
    const order = orders.find(o => o.orderNumber.toUpperCase() === normalizedOrderNumber);
    
    if (!order) {
      console.error('Order not found:', normalizedOrderNumber);
      setResult({
        success: false,
        message: `Order not found: ${normalizedOrderNumber}. Please check the order number.`,
      });
      return;
    }
    
    // Check if order is verified
    if (order.status !== 'verified') {
      console.error('Order not verified:', order.status);
      setResult({
        success: false,
        message: `Order ${normalizedOrderNumber} is ${order.status}. Only verified orders can be scanned.`,
      });
      return;
    }
    
    // Check if order has individual tickets
    if (!order.individualTickets || order.individualTickets.length === 0) {
      console.error('Order has no individual tickets');
      setResult({
        success: false,
        message: `Order ${normalizedOrderNumber} has no tickets. This may be an old order format.`,
      });
      return;
    }
    
    // Find ticket (case-insensitive)
    const ticket = order.individualTickets.find(
      t => t.ticketId.toUpperCase() === normalizedTicketId
    );
    
    if (!ticket) {
      console.error('Ticket not found in order:', normalizedTicketId);
      const availableTickets = order.individualTickets.map(t => t.ticketId).join(', ');
      setResult({
        success: false,
        message: `Ticket ${normalizedTicketId} not found in order ${normalizedOrderNumber}. Available tickets: ${availableTickets}`,
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
                  <div id={qrCodeRegionId} className="w-full min-h-[400px]"></div>
                  {scanningQR && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-green-400 rounded-lg w-64 h-64 opacity-50"></div>
                      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded">
                        Scanning for QR code...
                      </p>
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
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-yellow-400 text-xl">⚠️</div>
                      <div className="flex-1">
                        <p className="text-yellow-400 text-sm font-semibold mb-1">Camera Issue</p>
                        <p className="text-yellow-300 text-xs mb-3">{cameraError}</p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setCameraError(null);
                              startCamera();
                            }}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            🔄 Try Again
                          </button>
                          <button
                            onClick={async () => {
                              // Try with different camera constraints
                              setCameraError(null);
                              await stopCamera();
                              // Small delay to ensure cleanup
                              setTimeout(() => {
                                startCamera();
                              }, 500);
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            🔀 Try Different Camera
                          </button>
                          <button
                            onClick={() => {
                              stopCamera();
                              setCameraError(null);
                              setScanMode('manual');
                            }}
                            className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            Manual Entry (Last Resort)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : scanningQR ? (
                  <p className="text-center text-purple-300 text-sm mb-4">
                    Point camera at QR code
                  </p>
                ) : null}
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

        {/* Result Display - Only show for ticket validation, not camera errors */}
        <AnimatePresence>
          {result && !cameraError && (
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
                    {result.success ? 'Ticket Scanned Successfully!' : 'Ticket Validation Failed'}
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

