'use client';

import { db } from '@/lib/instant';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const templates = [
  { name: '2 Choices', path: '/templates/2-choices.jpg' },
  { name: 'Bell Curve', path: '/templates/bell-curve.jpeg' },
  { name: 'Big Brain Wojak', path: '/templates/big-brain-wojak.jpeg' },
  { name: 'Mad Boy', path: '/templates/mad-boy.jpeg' },
  { name: 'Side Eye', path: '/templates/side-eye.jpeg' },
  { name: 'WTF', path: '/templates/WTF.jpeg' },
];

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  isSelected: boolean;
}

export default function CreatePage() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [drawingData, setDrawingData] = useState<ImageData | null>(null);
  
  // Text elements state
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [newText, setNewText] = useState('');
  const [textFontSize, setTextFontSize] = useState(40);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [mode, setMode] = useState<'draw' | 'text'>('draw');
  const resizeStartData = useRef<{ element: TextElement; startX: number; startFontSize: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSelectedTemplate(null);
      const url = URL.createObjectURL(selectedFile);
      setOriginalImageUrl(url);
      setPreviewUrl(url);
      setDrawingData(null);
      setTextElements([]);
      setSelectedTextId(null);
      setError(null);
      // Reset canvas when image changes
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 100);
    }
  };

  const handleTemplateSelect = async (templatePath: string) => {
    setSelectedTemplate(templatePath);
    setFile(null);
    setOriginalImageUrl(templatePath);
    setPreviewUrl(templatePath);
    setDrawingData(null);
    setTextElements([]);
    setSelectedTextId(null);
    setError(null);
    // Reset canvas when image changes
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  };

  const addTextElement = () => {
    if (!newText.trim()) return;
    
    const newElement: TextElement = {
      id: crypto.randomUUID(),
      text: newText,
      x: 100,
      y: 100,
      fontSize: textFontSize,
      color: textColor,
      isSelected: true,
    };
    
    setTextElements(prev => prev.map(t => ({ ...t, isSelected: false })).concat(newElement));
    setSelectedTextId(newElement.id);
    setNewText('');
    renderTextElements();
  };

  const deleteSelectedText = () => {
    if (selectedTextId) {
      setTextElements(prev => prev.filter(t => t.id !== selectedTextId));
      setSelectedTextId(null);
      renderTextElements();
    }
  };

  const renderTextElements = () => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render each text element
    textElements.forEach(element => {
      ctx.save();
      ctx.font = `bold ${element.fontSize}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = element.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(element.fontSize / 20, 2);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      
      // Draw text with outline
      ctx.strokeText(element.text, element.x, element.y);
      ctx.fillText(element.text, element.x, element.y);
      
      // Draw selection box if selected
      if (element.isSelected) {
        const metrics = ctx.measureText(element.text);
        const padding = 5;
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          element.x - padding,
          element.y - padding,
          metrics.width + padding * 2,
          element.fontSize + padding * 2
        );
        ctx.setLineDash([]);
        
        // Draw resize handle
        const handleSize = 8;
        ctx.fillStyle = '#0066FF';
        ctx.fillRect(
          element.x + metrics.width - handleSize / 2,
          element.y + element.fontSize - handleSize / 2,
          handleSize,
          handleSize
        );
      }
      
      ctx.restore();
    });
  };

  useEffect(() => {
    renderTextElements();
  }, [textElements, selectedTextId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTextId && mode === 'text') {
        e.preventDefault();
        deleteSelectedText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTextId, mode]);

  const getTextCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = textCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const getTextAtPoint = (x: number, y: number): TextElement | null => {
    const canvas = textCanvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Check each text element in reverse order (top to bottom)
    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i];
      ctx.font = `bold ${element.fontSize}px Impact, Arial Black, sans-serif`;
      const metrics = ctx.measureText(element.text);
      
      if (
        x >= element.x &&
        x <= element.x + metrics.width &&
        y >= element.y &&
        y <= element.y + element.fontSize
      ) {
        return element;
      }
    }
    
    return null;
  };

  const isResizeHandle = (element: TextElement, x: number, y: number): boolean => {
    const canvas = textCanvasRef.current;
    if (!canvas) return false;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    ctx.font = `bold ${element.fontSize}px Impact, Arial Black, sans-serif`;
    const metrics = ctx.measureText(element.text);
    const handleSize = 8;
    const handleX = element.x + metrics.width;
    const handleY = element.y + element.fontSize;
    
    return (
      x >= handleX - handleSize / 2 &&
      x <= handleX + handleSize / 2 &&
      y >= handleY - handleSize / 2 &&
      y <= handleY + handleSize / 2
    );
  };

  const handleTextCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'text') return;
    
    const { x, y } = getTextCanvasCoordinates(e);
    const clickedText = getTextAtPoint(x, y);
    
    if (clickedText) {
      if (isResizeHandle(clickedText, x, y)) {
        setIsResizing(true);
        setSelectedTextId(clickedText.id);
        resizeStartData.current = {
          element: clickedText,
          startX: x,
          startFontSize: clickedText.fontSize,
        };
        setTextElements(prev => prev.map(t => ({
          ...t,
          isSelected: t.id === clickedText.id
        })));
      } else {
        setIsDragging(true);
        setSelectedTextId(clickedText.id);
        setDragOffset({
          x: x - clickedText.x,
          y: y - clickedText.y,
        });
        setTextElements(prev => prev.map(t => ({
          ...t,
          isSelected: t.id === clickedText.id
        })));
      }
    } else {
      setSelectedTextId(null);
      setTextElements(prev => prev.map(t => ({ ...t, isSelected: false })));
    }
  };

  const handleTextCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'text') return;
    
    const { x, y } = getTextCanvasCoordinates(e);
    
    if (isDragging && selectedTextId) {
      setTextElements(prev => prev.map(t => 
        t.id === selectedTextId
          ? { ...t, x: x - dragOffset.x, y: y - dragOffset.y }
          : t
      ));
    } else if (isResizing && selectedTextId && resizeStartData.current) {
      const { element, startX, startFontSize } = resizeStartData.current;
      const canvas = textCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = `bold ${startFontSize}px Impact, Arial Black, sans-serif`;
          const metrics = ctx.measureText(element.text);
          const scale = (x - element.x) / metrics.width;
          const newFontSize = Math.max(20, Math.min(100, startFontSize * scale));
          setTextElements(prev => prev.map(t => 
            t.id === selectedTextId
              ? { ...t, fontSize: newFontSize }
              : t
          ));
        }
      }
    }
  };

  const handleTextCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    resizeStartData.current = null;
  };

  // Drawing handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    // Calculate scale between display size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    // Scale brush size to match canvas scale
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const scaledBrushSize = brushSize * scale;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = scaledBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    // Scale brush size to match canvas scale
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const scaledBrushSize = brushSize * scale;
    ctx.lineWidth = scaledBrushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save drawing data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingData(imageData);
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingData(null);
  };

  // Initialize canvas when image loads
  useEffect(() => {
    if (!originalImageUrl || !canvasRef.current || !textCanvasRef.current) return;

    const canvas = canvasRef.current;
    const textCanvas = textCanvasRef.current;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set canvas size to match original image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      textCanvas.width = img.width;
      textCanvas.height = img.height;
      
      // Set display size to match preview container
      const containerHeight = 384;
      const aspectRatio = img.width / img.height;
      const containerWidth = containerHeight * aspectRatio;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      textCanvas.style.width = `${containerWidth}px`;
      textCanvas.style.height = `${containerHeight}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx && drawingData) {
        // Restore previous drawing if exists
        ctx.putImageData(drawingData, 0, 0);
      }
      
      renderTextElements();
    };
    
    img.src = originalImageUrl;
  }, [originalImageUrl]);

  const drawTextOnImage = async (imageUrl: string, includeDrawing: boolean = true): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Add drawing layer if exists
        if (includeDrawing && canvasRef.current) {
          const drawingCanvas = canvasRef.current;
          const drawingCtx = drawingCanvas.getContext('2d');
          if (drawingCtx && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
            // Scale drawing to match main canvas if needed
            if (drawingCanvas.width === canvas.width && drawingCanvas.height === canvas.height) {
              ctx.drawImage(drawingCanvas, 0, 0);
            } else {
              // Scale the drawing to fit
              ctx.drawImage(
                drawingCanvas,
                0, 0, drawingCanvas.width, drawingCanvas.height,
                0, 0, canvas.width, canvas.height
              );
            }
          }
        }

        // Draw text elements
        textElements.forEach(element => {
          ctx.save();
          ctx.font = `bold ${element.fontSize}px Impact, Arial Black, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillStyle = element.color;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(element.fontSize / 20, 2);
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          
          // Draw text with outline
          ctx.strokeText(element.text, element.x, element.y);
          ctx.fillText(element.text, element.x, element.y);
          ctx.restore();
        });

        // Convert canvas to blob and then to File
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          const fileName = 'meme.jpg';
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve(file);
        }, 'image/jpeg', 0.95);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageUrl;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!file && !selectedTemplate) {
      setError('Please select an image or template');
      return;
    }

    if (!user) {
      setError('You must be signed in to post');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let imageUrl: string;
      let imageToUpload: File;

      // Check if we need to render text or drawing
      const hasText = textElements.length > 0;
      const hasDrawing = drawingData !== null && canvasRef.current && 
        canvasRef.current.width > 0 && canvasRef.current.height > 0;

      if (selectedTemplate && originalImageUrl) {
        // If there's text or drawing, render everything together
        if (hasText || hasDrawing) {
          imageToUpload = await drawTextOnImage(originalImageUrl, true);
        } else {
          // Fetch template image and convert to File
          const response = await fetch(originalImageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const fileName = selectedTemplate.split('/').pop() || 'template.jpg';
          
          // Determine MIME type from file extension
          let mimeType = blob.type;
          if (!mimeType || mimeType === 'application/octet-stream') {
            if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
              mimeType = 'image/jpeg';
            } else if (fileName.endsWith('.png')) {
              mimeType = 'image/png';
            } else if (fileName.endsWith('.gif')) {
              mimeType = 'image/gif';
            } else {
              mimeType = 'image/jpeg'; // default
            }
          }
          
          imageToUpload = new File([blob], fileName, { type: mimeType });
        }
      } else if (file && originalImageUrl) {
        // If there's text or drawing, render everything together
        if (hasText || hasDrawing) {
          imageToUpload = await drawTextOnImage(originalImageUrl, true);
        } else {
          imageToUpload = file;
        }
      } else {
        throw new Error('No image selected');
      }

      // Upload the final image (with or without text) to Cloudinary
      const formData = new FormData();
      formData.append('file', imageToUpload);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await uploadResponse.json();
      imageUrl = result.url;

      // Save meme to InstantDB
      await db.transact(
        db.tx.memes[crypto.randomUUID()].update({
          title: title.trim(),
          imageUrl,
          userId: user.id,
          userEmail: user.email || 'Anonymous',
          createdAt: Date.now(),
        })
      );

      // Redirect to home
      router.push('/');
    } catch (err) {
      console.error('Error creating meme:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create meme. Please try again.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Post a Meme</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your meme a title..."
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={isUploading}
            />
          </div>

          {previewUrl && (
            <div className="border border-gray-300 rounded-md p-4 space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    mode === 'draw'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={isUploading}
                >
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    mode === 'text'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={isUploading}
                >
                  Text
                </button>
              </div>

              {mode === 'text' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTextElement();
                        }
                      }}
                      placeholder="Enter text and press Enter to add..."
                      maxLength={100}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={addTextElement}
                      className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                      disabled={isUploading || !newText.trim()}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Size:</label>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                        className="w-20"
                        disabled={isUploading}
                      />
                      <span className="text-xs text-gray-600 w-8">{textFontSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Color:</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-8 rounded border border-gray-300"
                        disabled={isUploading}
                      />
                    </div>
                    {selectedTextId && (
                      <button
                        type="button"
                        onClick={deleteSelectedText}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                        disabled={isUploading}
                      >
                        Delete Selected
                      </button>
                    )}
                  </div>
                  {textElements.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Click and drag to move text. Drag the corner handle to resize. Click outside to deselect.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a Template
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {templates.map((template) => (
                <button
                  key={template.path}
                  type="button"
                  onClick={() => handleTemplateSelect(template.path)}
                  disabled={isUploading}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                    selectedTemplate === template.path
                      ? 'border-gray-900 ring-2 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Image
                    src={template.path}
                    alt={template.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 text-center">
                    {template.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Your Own Image
            </label>
            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={isUploading}
            />
          </div>

          {previewUrl && (
            <div className="border border-gray-300 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Preview</p>
                {mode === 'draw' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="brushSize" className="text-xs text-gray-600">Size:</label>
                      <input
                        id="brushSize"
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-20"
                        disabled={isUploading}
                      />
                      <span className="text-xs text-gray-600 w-8">{brushSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="brushColor" className="text-xs text-gray-600">Color:</label>
                      <input
                        id="brushColor"
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-10 h-8 rounded border border-gray-300"
                        disabled={isUploading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearDrawing}
                      className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      disabled={isUploading}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="relative w-full h-96 bg-gray-100 rounded overflow-hidden">
                {previewUrl.startsWith('blob:') ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="object-contain"
                  />
                )}
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`absolute inset-0 w-full h-full ${
                    mode === 'draw' ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
                  }`}
                  style={{ touchAction: mode === 'draw' ? 'none' : 'auto' }}
                />
                <canvas
                  ref={textCanvasRef}
                  onMouseDown={handleTextCanvasMouseDown}
                  onMouseMove={handleTextCanvasMouseMove}
                  onMouseUp={handleTextCanvasMouseUp}
                  onMouseLeave={handleTextCanvasMouseUp}
                  className={`absolute inset-0 w-full h-full ${
                    mode === 'text' ? 'cursor-move' : 'pointer-events-none'
                  }`}
                  style={{ touchAction: mode === 'text' ? 'none' : 'auto' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isUploading ? 'Posting...' : 'Post Meme'}
          </button>
        </form>
      </div>
    </div>
  );
}

