import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import { createCroppedFile } from './cropImage';

function CropDialog({ file, imageUrl, requirement, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [imageUrl]);

  const confirm = async () => {
    if (!pixels) return;
    setBusy(true);
    setError('');
    try {
      const croppedFile = await createCroppedFile(imageUrl, file, pixels, requirement);
      onConfirm(croppedFile);
    } catch (cropError) {
      setError(cropError.message);
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="admin-crop-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
      <div className="admin-crop-header"><div><h2>Crop {requirement.label.toLowerCase()}</h2><p>Move and zoom the image to fit {requirement.width}:{requirement.height}.</p></div><button type="button" onClick={onCancel} disabled={busy} title="Close crop panel"><X size={20} /></button></div>
      <div className="admin-crop-stage"><Cropper image={imageUrl} crop={crop} zoom={zoom} aspect={requirement.width / requirement.height} onCropChange={setCrop} onZoomChange={setZoom} onCropAreaChange={(_, areaPixels) => setPixels(areaPixels)} showGrid /></div>
      <div className="admin-crop-controls"><label htmlFor="admin-crop-zoom">Zoom</label><input id="admin-crop-zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-crop-actions"><button type="button" className="admin-btn secondary" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="admin-btn primary" onClick={confirm} disabled={busy || !pixels}>{busy ? 'Preparing...' : 'Crop & upload'}</button></div>
    </dialog>
  );
}

export default CropDialog;
