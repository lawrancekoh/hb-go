import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/Button';
import { Check, X, RotateCw } from 'lucide-react';

/**
 * Creates an Image object from a URL.
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Generates a cropped image blob from the source image, handling rotation.
 */
async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped image using the pixelCrop values (relative to the rotated image)
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste generated rotated image at the top left corner
  ctx.putImageData(data, 0, 0);

  // Return as a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg');
  });
}

export default function ImageCropper({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [initialCroppedArea, setInitialCroppedArea] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Load image dimensions to set initial crop
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const isPortrait = height > width;

      // Default to full image
      let initialCrop = { x: 0, y: 0, width, height };

      // If Portrait, cover ~80% of vertical space (centered)
      if (isPortrait) {
        const cropHeight = height * 0.8;
        const cropY = (height - cropHeight) / 2;
        initialCrop = { x: 0, y: cropY, width, height: cropHeight };
      }

      setInitialCroppedArea(initialCrop);
      setIsReady(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onConfirm(croppedBlob);
    } catch (e) {
      console.error(e);
      // Optional: Show error to user? For now just log.
    }
  };

  const rotate = () => {
    setRotation((prevRotation) => prevRotation + 90);
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined} // Free-form cropping
          initialCroppedAreaPixels={initialCroppedArea}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          showGrid={true}
        />
      </div>

      {/* Controls */}
      <div className="bg-white p-4 flex flex-col gap-4 pb-safe">
        {/* Zoom Control */}
        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium text-slate-500">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-2/3"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 gap-2" onClick={onCancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button variant="outline" onClick={rotate} title="Rotate 90°">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button className="flex-1 gap-2" onClick={handleConfirm}>
            <Check className="h-4 w-4" /> Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
