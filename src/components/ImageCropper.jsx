import { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/Button';
import { Check, X, RotateCw } from 'lucide-react';

// Helper to load image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper to crop
async function getCroppedImg(image, crop) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Handle crop units (px vs %)
  let pixelCrop = crop;

  if (crop.unit === '%') {
    pixelCrop = {
      x: (crop.x * image.width) / 100,
      y: (crop.y * image.height) / 100,
      width: (crop.width * image.width) / 100,
      height: (crop.height * image.height) / 100,
    };
  }

  canvas.width = pixelCrop.width * scaleX;
  canvas.height = pixelCrop.height * scaleY;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, 'image/jpeg');
  });
}

// Helper to rotate the source image itself
async function rotateImageSource(imageSrc, degrees) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Swap dimensions for 90/270
  if (degrees === 90 || degrees === 270) {
    canvas.width = image.height;
    canvas.height = image.width;
  } else {
    canvas.width = image.width;
    canvas.height = image.height;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg');
  });
}

export default function ImageCropper({ imageSrc, onCancel, onConfirm }) {
  const [currentImg, setCurrentImg] = useState(imageSrc);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [scale, setScale] = useState(1);
  const imgRef = useRef(null);

  // Pinch-to-zoom state
  const touchStartDist = useRef(0);
  const startScale = useRef(1);

  // Update currentImg if prop changes
  useEffect(() => {
    setCurrentImg(imageSrc);
  }, [imageSrc]);

  // Clean up blob URLs if we created any
  useEffect(() => {
    return () => {
      if (currentImg && currentImg !== imageSrc && currentImg.startsWith('blob:')) {
        URL.revokeObjectURL(currentImg);
      }
    };
  }, [currentImg, imageSrc]);

  // Initialize crop on load
  function onImageLoad(e) {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;

    // Calculate aspect ratio from natural dimensions to ensure the initial crop
    // matches the image's aspect ratio.
    const aspect = naturalWidth / naturalHeight;

    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80, // Default to 80%
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  const handleRotate = async () => {
    if (!currentImg) return;
    try {
      const newUrl = await rotateImageSource(currentImg, 90);
      setCurrentImg(newUrl);
      // setCrop will happen in onImageLoad
    } catch (e) {
      console.error("Rotation failed", e);
    }
  };

  const handleConfirm = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const blob = await getCroppedImg(imgRef.current, completedCrop);
        onConfirm(blob);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Helper for pinch distance
  const distance = (touch1, touch2) => {
    return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDist.current = distance(e.touches[0], e.touches[1]);
      startScale.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dist = distance(e.touches[0], e.touches[1]);
      if (touchStartDist.current > 0) {
        const ratio = dist / touchStartDist.current;
        // Clamp between 1.0 and 3.0
        const newScale = Math.min(Math.max(startScale.current * ratio, 1.0), 3.0);
        setScale(newScale);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="text-white p-4 font-semibold text-center shrink-0 z-10 bg-black/50">
        Crop Receipt
      </div>

      {/* Middle - Image Area */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-8 bg-neutral-900 touch-pan-x touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {currentImg && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            keepSelection={true}
            style={{
              width: `${scale * 100}%`,
              maxWidth: 'none',
              transition: 'width 0.1s ease-out',
              flexShrink: 0
            }}
          >
            <img
              ref={imgRef}
              src={currentImg}
              onLoad={onImageLoad}
              className="w-auto object-contain mx-auto"
              style={{ display: 'block', maxHeight: `${scale * 70}vh` }}
              alt="Receipt"
            />
          </ReactCrop>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white p-4 pb-safe flex flex-col gap-4 shrink-0 shadow-up z-10">
        {/* Zoom Control */}
        <div className="flex items-center gap-4 px-2">
          <span className="text-xs text-gray-500 font-medium">Zoom</span>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 gap-2" onClick={onCancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button variant="outline" onClick={handleRotate} title="Rotate 90°">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirm}>
            <Check className="h-4 w-4" /> Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
