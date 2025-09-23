import { Camera, Check, Loader2, Scan, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface ScanResult {
  text: string;
  confidence: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for better barcode scanning
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const simulateScan = () => {
    // In a real implementation, this would use a library like ZXing or QuaggaJS
    // For demo purposes, we'll simulate scanning with common barcode patterns
    const sampleBarcodes = [
      { text: '1234567890123', confidence: 0.95 }, // EAN-13
      { text: '123456789012', confidence: 0.92 }, // UPC-A
      { text: '9780123456789', confidence: 0.88 }, // ISBN
      { text: '012345678905', confidence: 0.93 }, // UPC-A
    ];

    const result = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
    setScanResult(result);
  };

  const handleConfirmScan = () => {
    if (scanResult) {
      onScan(scanResult.text);
      setScanResult(null);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setScanResult(null);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scan className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Barcode Scanner</h3>
                <p className="text-sm text-gray-600">
                  {scanResult ? 'Confirm scanned barcode' : 'Point camera at barcode to scan'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scanner Content */}
          <div className="space-y-4">
            {error ? (
              <div className="text-center py-8">
                <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Camera className="h-8 w-8 text-red-600" />
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Camera Access Required</h4>
                <p className="mt-2 text-gray-600 max-w-md mx-auto">{error}</p>
                <div className="mt-4 space-y-2">
                  <Button onClick={startCamera} className="w-full">
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : scanResult ? (
              <div className="text-center py-8">
                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="mt-4 text-lg font-medium text-gray-900">Barcode Detected</h4>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Scanned Barcode:</p>
                  <code className="text-lg font-mono font-semibold text-gray-900">
                    {scanResult.text}
                  </code>
                  <p className="text-sm text-gray-500 mt-2">
                    Confidence: {(scanResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleConfirmScan} className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    Use This Barcode
                  </Button>
                  <Button variant="outline" onClick={() => setScanResult(null)} className="flex-1">
                    Scan Again
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* Camera View */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed rounded-lg w-64 h-32 flex items-center justify-center">
                      {isScanning ? (
                        <div className="text-white text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Scanning...</p>
                        </div>
                      ) : (
                        <div className="text-white text-center">
                          <Scan className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Align barcode here</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scanning line animation */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-32 relative overflow-hidden">
                        <div className="absolute inset-x-0 h-0.5 bg-red-500 animate-pulse scanning-line"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions and Actions */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Hold your device steady and ensure the barcode is well-lit for best results.
                  </p>

                  {/* Demo Scan Button */}
                  <div className="space-y-2">
                    <Button onClick={simulateScan} disabled={!isScanning} className="w-full">
                      <Scan className="h-4 w-4 mr-2" />
                      Simulate Scan (Demo)
                    </Button>
                    <p className="text-xs text-gray-500">
                      Click to simulate scanning a barcode for testing
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes scanning {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        .scanning-line {
          animation: scanning 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
