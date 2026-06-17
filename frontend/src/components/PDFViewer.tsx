import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, Loader2 } from "lucide-react";

// Access global PDFJS library from CDN
const pdfjsLib = (window as any).pdfjsLib;

interface PDFViewerProps {
  fileUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Initialize PDFJS library worker
  useEffect(() => {
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }, []);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      setPageNum(1);
      setSearchResults([]);
      setSearchQuery("");

      try {
        if (!pdfjsLib) {
          throw new Error("Không thể tải thư viện PDF.js. Vui lòng kiểm tra lại kết nối mạng.");
        }

        // Handle relative vs absolute URLs (proxy compatibility)
        const absoluteUrl = fileUrl.startsWith("http") ? fileUrl : `${window.location.origin}${fileUrl}`;
        
        const loadingTask = pdfjsLib.getDocument({
          url: absoluteUrl,
          withCredentials: false
        });
        
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err: any) {
        console.error("PDF load error:", err);
        setError("Không thể hiển thị tài liệu PDF. Lỗi cấu hình file hoặc server.");
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [fileUrl]);

  // Render a specific page
  const renderPage = async (pageNumber: number, currentScale: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      // Cancel previous render task if active
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: currentScale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err.name !== "RenderingCancelledException") {
        console.error("PDF page render error:", err);
      }
    }
  };

  // Trigger page render when pageNum or scale changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale]);

  // Search through PDF text content
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfDoc || !searchQuery.trim()) return;

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    const matchingPages: number[] = [];

    try {
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(" ").toLowerCase();
        
        if (text.includes(query)) {
          matchingPages.push(i);
        }
      }
      
      setSearchResults(matchingPages);
      if (matchingPages.length > 0) {
        setPageNum(matchingPages[0]); // Go to first match
      } else {
        alert("Không tìm thấy kết quả phù hợp trong tài liệu.");
      }
    } catch (err) {
      console.error("PDF text search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePrevPage = () => {
    if (pageNum > 1) setPageNum(pageNum - 1);
  };

  const handleNextPage = () => {
    if (pageNum < numPages) setPageNum(pageNum + 1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-dark-800 rounded-2xl border border-dark-700/50">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang tải tài liệu PDF online...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/35 text-red-300 rounded-2xl flex flex-col items-center justify-center">
        <p className="font-semibold text-lg mb-2">Đã xảy ra lỗi</p>
        <p className="text-sm text-center text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-dark-800/80 border border-dark-700/50 rounded-2xl shadow-md backdrop-blur-md">
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={pageNum <= 1}
            className="p-2 rounded-xl bg-dark-900 border border-dark-700 hover:bg-dark-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-300">
            Trang {pageNum} / {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNum >= numPages}
            className="p-2 rounded-xl bg-dark-900 border border-dark-700 hover:bg-dark-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.6}
            className="p-2 rounded-xl bg-dark-900 border border-dark-700 hover:bg-dark-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          <span className="text-xs font-semibold text-slate-400 bg-dark-950 px-3 py-1.5 rounded-lg border border-dark-700">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="p-2 rounded-xl bg-dark-900 border border-dark-700 hover:bg-dark-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Tìm kiếm từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 bg-dark-950/80 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-dark-700 disabled:text-slate-500 font-semibold text-xs rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Tìm"
            )}
          </button>
        </form>
      </div>

      {/* Search results banner if any */}
      {searchResults.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-brand-950/20 border border-brand-800/40 rounded-xl text-xs text-brand-300">
          <span className="font-semibold">Từ khóa tìm thấy ở trang:</span>
          {searchResults.map((page) => (
            <button
              key={page}
              onClick={() => setPageNum(page)}
              className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                pageNum === page
                  ? "bg-brand-600 text-white"
                  : "bg-dark-800 hover:bg-dark-700 text-slate-300"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* PDF Viewport (Restricted Right click) */}
      <div 
        className="relative flex justify-center p-6 bg-dark-950/40 border border-dark-700/30 rounded-2xl overflow-auto select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Anti-copy screen overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none" />
        
        {/* PDF Canvas */}
        <canvas ref={canvasRef} className="shadow-2xl rounded-lg max-w-full bg-white transition-all duration-150" />
      </div>
    </div>
  );
};

export default PDFViewer;
