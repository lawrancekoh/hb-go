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
  const imgRef = useRef(null);

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
    // matches the image's aspect ratio (covering 90% of the image).
    const aspect = naturalWidth / naturalHeight;

    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
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
        } catch(e) {
            console.error(e);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="text-white p-4 font-semibold text-center shrink-0">
        Crop Receipt
      </div>

      {/* Middle - Image Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {currentImg && (
            <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
            >
                <img
                    ref={imgRef}
                    src={currentImg}
                    onLoad={onImageLoad}
                    className="max-h-[65vh] w-auto"
                    style={{ display: 'block' }}
                    alt="Receipt"
                />
            </ReactCrop>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white p-4 pb-safe flex gap-4 shrink-0 shadow-up z-10">
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
  );
}
