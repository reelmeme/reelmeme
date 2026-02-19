export const renderMemeToBlob = (
  imageUrl: string,
  text: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context failed");

      // MANDATORY: 1080x1920 for Reels (9:16)
      const WIDTH = 1080;
      const HEIGHT = 1920;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      // 1. Draw Blurred Background Padding (Scale to Cover)
      const scaleFill = Math.max(WIDTH / img.width, HEIGHT / img.height);
      const fillW = img.width * scaleFill;
      const fillH = img.height * scaleFill;
      const fillX = (WIDTH - fillW) / 2;
      const fillY = (HEIGHT - fillH) / 2;

      ctx.save();
      ctx.filter = 'blur(60px) brightness(0.4)';
      ctx.drawImage(img, fillX, fillY, fillW, fillH);
      ctx.restore();

      // 2. Draw Main Image (Fit)
      ctx.save();
      ctx.filter = 'contrast(1.1) brightness(1.0) saturate(1.05)';
      const scaleFit = Math.min(WIDTH / img.width, HEIGHT / img.height);
      const fitW = img.width * scaleFit;
      const fitH = img.height * scaleFit;
      const fitX = (WIDTH - fitW) / 2;
      const fitY = (HEIGHT - fitH) / 2;
      ctx.drawImage(img, fitX, fitY, fitW, fitH);
      ctx.restore();

      // 3. Setup Text Styles - Modern Soft Grey High Contrast
      const fontSize = 100;
      // @ts-ignore
      if ('letterSpacing' in ctx) {
        // @ts-ignore
        ctx.letterSpacing = "4px";
      }
      
      ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#E0E0E0';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';

      // Text wrapping logic (Strict Max 2 lines, Max 5 words per line)
      const maxWidth = WIDTH * 0.9;
      const allWords = text.toUpperCase().split(' ');
      
      let lines: string[] = [];
      let currentLine = '';
      let wordCount = 0;

      for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i];
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if ((metrics.width > maxWidth || wordCount >= 5) && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word;
          wordCount = 1;
        } else {
          currentLine = testLine;
          wordCount++;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      const finalLines = lines.slice(0, 2);

      // 4. Draw lines in "Safe Zone" 
      const lineHeight = fontSize * 1.1;
      const totalTextHeight = finalLines.length * lineHeight;
      
      const marginFromBottom = 480; 
      let y = HEIGHT - totalTextHeight - marginFromBottom;

      finalLines.forEach((l) => {
        ctx.strokeText(l, WIDTH / 2, y + fontSize);
        ctx.fillText(l, WIDTH / 2, y + fontSize);
        y += lineHeight;
      });

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject("Blob generation failed");
      }, 'image/png', 0.9);
    };

    img.onerror = () => reject("Failed to load image for rendering");
  });
};
