import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/Button';
import { Check, X, RotateCw } from 'lucide-react';

// Utility to crop image (implemented inline if not in utils)
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImgUtil(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg');
  });
}

export default function ImageCropper({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImgUtil(imageSrc, croppedAreaPixels);
      onConfirm(croppedBlob);
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation} // Pass rotation to Cropper? react-easy-crop supports it
          aspect={undefined} // Free crop
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
        />
      </div>

      {/* Controls */}
      <div className="bg-white p-4 flex flex-col gap-4 pb-safe">
        <div className="flex items-center justify-between px-4">
             <span className="text-sm font-medium text-slate-500">Zoom</span>
             <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-2/3"
            />
        </div>

        <div className="flex gap-4">
            <Button variant="outline" className="flex-1 gap-2" onClick={onCancel}>
                <X className="h-4 w-4" /> Cancel
            </Button>
            <Button variant="outline" onClick={() => setRotation((r) => r + 90)}>
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
