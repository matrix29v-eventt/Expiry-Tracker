/**
 * Advanced Expiry Date Detection Library
 * Implements multiple detection strategies with confidence scoring
 */

export interface DetectionResult {
  date: string;
  confidence: number;
  method: 'regex' | 'nlp' | 'ml' | 'hybrid';
  rawText?: string;
  patterns?: string[];
}

export interface DetectionConfig {
  enablePreprocessing: boolean;
  enableMultipleStrategies: boolean;
  minConfidence: number;
  maxDateRange: number; // Maximum years in future
  autoSetThreshold: number; // Threshold for automatic setting
}

export class AdvancedExpiryDetector {
  private config: DetectionConfig;  
  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = {
      enablePreprocessing: true,
      enableMultipleStrategies: true,
      minConfidence: 0.6,
      maxDateRange: 10,
      autoSetThreshold: 0.85, // Threshold for automatic setting
      ...config
    };
  }

  /**
   * Main detection method - tries all strategies
   */
  async detectExpiryDate(imageFile: File): Promise<DetectionResult[]> {
    const text = await this.extractText(imageFile);
    const results: DetectionResult[] = [];

    // Strategy 1: Regex Pattern Matching
    if (this.config.enableMultipleStrategies) {
      const regexResults = this.regexDetection(text);
      results.push(...regexResults);
    }

    // Strategy 2: NLP-based detection (if available)
    const nlpResults = this.nlpDetection(text);
    results.push(...nlpResults);

    // Strategy 3: Multiple strategy combination
    const hybridResults = this.hybridDetection(text, results);
    results.push(...hybridResults);

    // Filter and sort by confidence
    return results
      .filter(r => r.confidence >= this.config.minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(URL.createObjectURL(file));
          return;
        }

        // Apply multiple preprocessing techniques
        canvas.width = img.width;
        canvas.height = img.height;

        // 1. Convert to grayscale
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(img, 0, 0);

        // 2. Increase contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Contrast enhancement
        const factor = 1.5;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * factor);     // Red
          data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
          data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
        }
        
        ctx.putImageData(imageData, 0, 0);

        // 3. Sharpen
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(canvas, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(URL.createObjectURL(file));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extract text using Tesseract.js with preprocessing
   */
  private async extractText(file: File): Promise<string> {
    try {
      // Import Tesseract dynamically
      const Tesseract = await import('tesseract.js');
      
      const image = this.config.enablePreprocessing 
        ? await this.preprocessImage(file)
        : URL.createObjectURL(file);

      const result = await Tesseract.recognize(image, 'eng');

      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      return '';
    }
  }

  /**
   * Strategy 1: Advanced regex pattern matching
   */
  private regexDetection(text: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    
    // Enhanced date patterns with context awareness
    const patterns = [
      // EXP/Best Before with context
      {
        regex: /(?:EXP(?:IRY)?|BEST\s*BEFORE|USE\s*BY|EXPIRES?)\s*[:\-]?\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/gi,
        confidence: 0.9,
        format: 'YYYY-MM-DD'
      },
      // Month name patterns
      {
        regex: /(?:EXP(?:IRY)?|BEST\s*BEFORE|USE\s*BY|EXPIRES?)\s*[:\-]?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{2,4})/gi,
        confidence: 0.85,
        format: 'Month DD, YYYY'
      },
      // Standard date formats
      {
        regex: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g,
        confidence: 0.7,
        format: 'MM/DD/YYYY'
      },
      // Year first format
      {
        regex: /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
        confidence: 0.65,
        format: 'YYYY/MM/DD'
      },
      // Dot matrix style dates (common on products)
      {
        regex: /(?:EXP|BEST|USE|EXPIR)[\.:]*\s*(\d{2})(\d{2})(\d{2,4})/gi,
        confidence: 0.95,
        format: 'MMDDYYYY'
      }
    ];

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern.regex));
      
      for (const match of matches) {
        const dateStr = this.normalizeDate(match, pattern.format);
        if (dateStr && this.isValidDate(dateStr)) {
          results.push({
            date: dateStr,
            confidence: pattern.confidence * this.calculateContextScore(text, match.index!),
            method: 'regex',
            rawText: text,
            patterns: [pattern.regex.source]
          });
        }
      }
    }

    return results;
  }

  /**
   * Strategy 2: NLP-based detection
   */
  private nlpDetection(text: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    
    // Keywords that indicate dates
    const dateKeywords = [
      'expiry', 'expire', 'exp', 'best before', 'use by', 'sell by',
      'manufactured', 'production', 'packed', 'born on'
    ];

    const lines = text.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if line contains date keywords
      const hasKeyword = dateKeywords.some(keyword => lowerLine.includes(keyword));
      
      if (hasKeyword) {
        // Extract potential dates from this line
        const dates = this.extractDatesFromText(line);
        
        for (const date of dates) {
          results.push({
            date: date.date,
            confidence: date.confidence * 0.8, // Lower confidence for NLP
            method: 'nlp',
            rawText: text
          });
        }
      }
    }

    return results;
  }

  /**
   * Strategy 3: Hybrid approach combining multiple methods
   */
  private hybridDetection(text: string, previousResults: DetectionResult[]): DetectionResult[] {
    const results: DetectionResult[] = [];
    
    // Find consensus among multiple methods
    const dateFrequency = new Map<string, { count: number; totalConfidence: number; methods: string[] }>();
    
    for (const result of previousResults) {
      const existing = dateFrequency.get(result.date);
      
      if (existing) {
        existing.count++;
        existing.totalConfidence += result.confidence;
        existing.methods.push(result.method);
      } else {
        dateFrequency.set(result.date, {
          count: 1,
          totalConfidence: result.confidence,
          methods: [result.method]
        });
      }
    }

    // Generate hybrid results
    for (const [date, info] of dateFrequency) {
      if (info.count >= 2) { // Found by multiple methods
        const avgConfidence = info.totalConfidence / info.count;
        const consensusBonus = info.count >= 3 ? 0.1 : 0.05;
        
        results.push({
          date,
          confidence: Math.min(0.95, avgConfidence + consensusBonus),
          method: 'hybrid',
          rawText: text,
          patterns: info.methods
        });
      }
    }

    return results;
  }

  /**
   * Extract dates from text using multiple patterns
   */
  private extractDatesFromText(text: string): Array<{ date: string; confidence: number }> {
    const dates: Array<{ date: string; confidence: number }> = [];
    
    // Common date patterns
    const patterns = [
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{2,4})\b/gi,
      /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g
    ];

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const dateStr = this.normalizeDate(match, 'auto');
        if (dateStr && this.isValidDate(dateStr)) {
          dates.push({
            date: dateStr,
            confidence: 0.6
          });
        }
      }
    }

    return dates;
  }

  /**
   * Normalize date to standard format
   */
  private normalizeDate(match: RegExpMatchArray, format: string): string | null {
    try {
      let year: string, month: string, day: string;
      
      if (format.includes('Month')) {
        // Month name format
        month = this.getMonthNumber(match[1]);
        day = match[2].padStart(2, '0');
        year = match[3].length === 2 ? '20' + match[3] : match[3];
      } else if (format === 'MMDDYYYY') {
        // Dot matrix style
        month = match[1];
        day = match[2];
        year = match[3].length === 2 ? '20' + match[3] : match[3];
      } else if (format === 'YYYY/MM/DD') {
        // Year first
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      } else {
        // Standard MM/DD/YYYY or DD/MM/YYYY (assume MM/DD)
        month = match[1].padStart(2, '0');
        day = match[2].padStart(2, '0');
        year = match[3].length === 2 ? '20' + match[3] : match[3];
      }
      
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }

  /**
   * Convert month name to number
   */
  private getMonthNumber(monthName: string): string {
    const months: { [key: string]: string } = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    return months[monthName.toLowerCase()] || '01';
  }

  /**
   * Calculate context-based confidence score
   */
  private calculateContextScore(text: string, position: number): number {
    const beforeText = text.substring(Math.max(0, position - 50));
    const afterText = text.substring(position, Math.min(text.length, position + 50));
    
    let score = 1.0;
    
    // Boost confidence if near expiry keywords
    const keywords = ['exp', 'best', 'use', 'before', 'by', 'expiry', 'expire'];
    for (const keyword of keywords) {
      if (beforeText.toLowerCase().includes(keyword) || afterText.toLowerCase().includes(keyword)) {
        score += 0.1;
      }
    }
    
    // Reduce confidence if near irrelevant keywords
    const irrelevantWords = ['weight', 'height', 'length', 'width', 'volume', 'calories'];
    for (const word of irrelevantWords) {
      if (beforeText.toLowerCase().includes(word) || afterText.toLowerCase().includes(word)) {
        score -= 0.1;
      }
    }
    
    return Math.max(0.3, Math.min(1.5, score));
  }

  /**
   * Validate if date is reasonable
   */
  private isValidDate(dateStr: string): boolean {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) return false;
      
      // Check if date is not too far in the past or future
      const minDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() + this.config.maxDateRange, today.getMonth(), today.getDate());
      
      return date >= minDate && date <= maxDate;
    } catch {
      return false;
    }
  }
}

// Export as default for easy importing
export default AdvancedExpiryDetector;