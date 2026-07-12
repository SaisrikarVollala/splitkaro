// EXIF reader helper to get orientation tag without external dependencies
function getExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (!e.target?.result) return resolve(-1);
      const view = new DataView(e.target.result as ArrayBuffer);
      if (view.byteLength < 2 || view.getUint16(0) !== 0xFFD8) {
        return resolve(-2); // Not a JPEG
      }
      let offset = 2;
      const length = view.byteLength;
      while (offset < length) {
        if (view.getUint16(offset) === 0xFFE1) {
          if (view.getUint32(offset + 4) === 0x45786966) { // "Exif"
            let exifOffset = offset + 10;
            const marker = view.getUint16(exifOffset);
            const little = marker === 0x4949; // Little vs Big Endian
            exifOffset += 2;
            if (view.getUint16(exifOffset, little) !== 0x002A) {
              return resolve(-1);
            }
            const firstIFDOffset = view.getUint32(exifOffset + 2, little);
            let dirOffset = offset + 10 + firstIFDOffset;
            const entries = view.getUint16(dirOffset, little);
            dirOffset += 2;
            for (let i = 0; i < entries; i++) {
              if (view.getUint16(dirOffset + (i * 12), little) === 0x0112) {
                const val = view.getUint16(dirOffset + (i * 12) + 8, little);
                return resolve(val);
              }
            }
          }
        } else if ((view.getUint16(offset) & 0xFF00) !== 0xFF00) {
          break;
        }
        offset += 2 + view.getUint16(offset + 2);
      }
      return resolve(-1);
    };
    // Parse first 64KB
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
}

// Inlined worker code for background image manipulation via OffscreenCanvas
const workerCode = `
  self.onmessage = async (e) => {
    const { imageBitmap, orientation } = e.data;
    
    let origWidth = imageBitmap.width;
    let origHeight = imageBitmap.height;
    
    // Determine target dimensions based on orientation
    // Orientation tags:
    // 3 = 180 deg
    // 6 = 90 deg CW
    // 8 = 270 deg CW
    const isRotated = orientation === 6 || orientation === 8;
    const canvasWidth = isRotated ? origHeight : origWidth;
    const canvasHeight = isRotated ? origWidth : origHeight;
    
    // Create OffscreenCanvas for auto-rotation
    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      self.postMessage({ error: 'Failed to create canvas context' });
      return;
    }
    
    // Perform EXIF rotation
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    if (orientation === 3) {
      ctx.rotate(Math.PI);
    } else if (orientation === 6) {
      ctx.rotate(Math.PI / 2);
    } else if (orientation === 8) {
      ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(imageBitmap, -origWidth / 2, -origHeight / 2);
    
    // Get rotated image pixel data for structural cropping
    const rotatedWidth = canvasWidth;
    const rotatedHeight = canvasHeight;
    const imgData = ctx.getImageData(0, 0, rotatedWidth, rotatedHeight);
    const pixels = imgData.data;
    
    // Bounding Box Detection: Crop empty borders / background padding
    // Helper to calculate color difference
    const getPixelColor = (x, y) => {
      const idx = (y * rotatedWidth + x) * 4;
      return [pixels[idx], pixels[idx+1], pixels[idx+2]];
    };
    
    // Sample the 4 corners to establish background color (average)
    const corners = [
      getPixelColor(0, 0),
      getPixelColor(rotatedWidth - 1, 0),
      getPixelColor(0, rotatedHeight - 1),
      getPixelColor(rotatedWidth - 1, rotatedHeight - 1)
    ];
    const avgBg = [
      Math.round(corners.reduce((sum, c) => sum + c[0], 0) / 4),
      Math.round(corners.reduce((sum, c) => sum + c[1], 0) / 4),
      Math.round(corners.reduce((sum, c) => sum + c[2], 0) / 4)
    ];
    
    const colorDistance = (c1, c2) => {
      return Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
      );
    };
    
    // Find boundaries of content (pixels different from background color)
    const threshold = 35; // Sensitivity threshold for background crop
    let minX = rotatedWidth, maxX = 0, minY = rotatedHeight, maxY = 0;
    
    // Scan pixels using step increments to speed up computation
    const step = 8; 
    for (let y = 0; y < rotatedHeight; y += step) {
      for (let x = 0; x < rotatedWidth; x += step) {
        const color = getPixelColor(x, y);
        if (colorDistance(color, avgBg) > threshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Fallback to full width/height if no distinct bounding box found
    if (minX >= maxX || minY >= maxY) {
      minX = 0;
      maxX = rotatedWidth;
      minY = 0;
      maxY = rotatedHeight;
    } else {
      // Add slight padding around detected content (e.g. 20px)
      minX = Math.max(0, minX - 20);
      minY = Math.max(0, minY - 20);
      maxX = Math.min(rotatedWidth, maxX + 20);
      maxY = Math.min(rotatedHeight, maxY + 20);
    }
    
    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;
    
    // Apply size constraints: downscale proportionally if max dimension exceeds 1800px
    let targetWidth = croppedWidth;
    let targetHeight = croppedHeight;
    const maxDim = 1800;
    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
        targetHeight = maxDim;
      }
    }
    
    // Create final cropped and resized canvas
    const finalCanvas = new OffscreenCanvas(targetWidth, targetHeight);
    const finalCtx = finalCanvas.getContext('2d');
    
    // Draw cropped region from rotated canvas onto final canvas with resize mapping
    finalCtx.drawImage(
      canvas,
      minX, minY, croppedWidth, croppedHeight, // Source
      0, 0, targetWidth, targetHeight         // Destination
    );
    
    // Compress image to JPEG quality 0.8
    const blob = await finalCanvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.8
    });
    
    self.postMessage({ blob });
  };
`;

export async function preprocessReceipt(file: File): Promise<Blob> {
  const orientation = await getExifOrientation(file);
  const imageBitmap = await createImageBitmap(file);
  
  return new Promise((resolve, reject) => {
    const blobWorker = new Blob([workerCode], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(blobWorker);
    const worker = new Worker(workerURL);
    
    worker.onmessage = (e) => {
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(e.data.blob);
      }
      worker.terminate();
      URL.revokeObjectURL(workerURL);
    };
    
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
      URL.revokeObjectURL(workerURL);
    };
    
    worker.postMessage({ imageBitmap, orientation }, [imageBitmap]);
  });
}
