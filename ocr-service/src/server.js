const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const moment = require('moment');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/detect-expiry', limiter);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Smart OCR Detection Service
class SmartOCRDetection {
  constructor() {
    this.confidenceThreshold = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.85;
    this.logger = logger;
  }

  // Preprocess image for better OCR accuracy
  async preprocessImage(imageBuffer) {
    try {
      const processedImage = await sharp(imageBuffer)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .grayscale()
        .normalize()
        .sharpen({ sigma: 1, flat: true })
        .threshold(128)
        .png()
        .toBuffer();
      
      this.logger.info('Image preprocessed successfully');
      return processedImage;
    } catch (error) {
      this.logger.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  // Extract text using Tesseract.js
  async extractText(imageBuffer) {
    try {
      const worker = await Tesseract.createWorker('eng');
      
      // Configure Tesseract for better date detection
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789/-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1'
      });

      const { data: { text, confidence } } = await worker.recognize(imageBuffer);
      await worker.terminate();

      this.logger.info(`OCR extracted text with confidence: ${confidence}`);
      return { text, confidence };
    } catch (error) {
      this.logger.error('Text extraction failed:', error);
      throw error;
    }
  }

  // Advanced date detection strategies
  detectExpiryDates(text) {
    const strategies = [
      // Strategy 1: Standard date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
      {
        name: 'Standard Formats',
        patterns: [
          /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/g, // MM/DD/YYYY
          /\b(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}\b/g, // DD/MM/YYYY
          /\b\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g, // YYYY-MM-DD
          /\b(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}\b/g, // DD-MM-YYYY
        ]
      },
      // Strategy 2: Expiry/BEST BEFORE keywords
      {
        name: 'Expiry Keywords',
        patterns: [
          /(?:exp|expiry|expires?|best\s+before|use\s+by|sell\s+by)[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
          /(?:exp|expiry|expires?|best\s+before|use\s+by|sell\s+by)[\s:]+(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/gi,
        ]
      },
      // Strategy 3: Month name formats
      {
        name: 'Month Names',
        patterns: [
          /\b(0[1-9]|[12]\d|3[01])\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}\b/gi,
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(0[1-9]|[12]\d|3[01]),?\s+\d{4}\b/gi,
        ]
      },
      // Strategy 4: Relaxed patterns (for low-quality images)
      {
        name: 'Relaxed Patterns',
        patterns: [
          /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
          /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{2,4}\b/gi,
        ]
      }
    ];

    const detectedDates = [];
    const now = moment();

    strategies.forEach(strategy => {
      strategy.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Extract date part from the match
            const dateMatch = match.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{2,4}/i);
            if (dateMatch) {
              const dateStr = dateMatch[0];
              const parsedDate = this.parseFlexibleDate(dateStr);
              
              if (parsedDate && this.isValidExpiryDate(parsedDate, now)) {
                detectedDates.push({
                  date: parsedDate.format('YYYY-MM-DD'),
                  originalText: match,
                  strategy: strategy.name,
                  confidence: this.calculateDateConfidence(match, strategy.name)
                });
              }
            }
          });
        }
      });
    });

    // Remove duplicates and sort by confidence
    const uniqueDates = detectedDates.filter((date, index, self) =>
      index === self.findIndex(d => d.date === date.date)
    );

    return uniqueDates.sort((a, b) => b.confidence - a.confidence);
  }

  // Parse flexible date formats
  parseFlexibleDate(dateStr) {
    const formats = [
      'MM/DD/YYYY', 'M/D/YYYY', 'DD/MM/YYYY', 'D/M/YYYY',
      'YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD-YYYY', 'DD-MM-YYYY',
      'MMM DD YYYY', 'MMMM DD YYYY', 'DD MMM YYYY', 'DD MMMM YYYY',
      'MM/DD/YY', 'M/D/YY', 'DD/MM/YY', 'D/M/YY'
    ];

    for (const format of formats) {
      const parsed = moment(dateStr, format, true);
      if (parsed.isValid()) {
        return parsed;
      }
    }

    return null;
  }

  // Validate if date is a reasonable expiry date
  isValidExpiryDate(date, now) {
    const minPast = now.clone().subtract(2, 'years');
    const maxFuture = now.clone().add(10, 'years');
    
    return date.isAfter(minPast) && date.isBefore(maxFuture);
  }

  // Calculate confidence score for detected dates
  calculateDateConfidence(dateText, strategy) {
    let confidence = 0.5; // Base confidence

    // Strategy-based confidence
    const strategyScores = {
      'Standard Formats': 0.9,
      'Expiry Keywords': 0.95,
      'Month Names': 0.85,
      'Relaxed Patterns': 0.6
    };
    confidence = strategyScores[strategy] || 0.5;

    // Format-based adjustments
    if (dateText.match(/\d{4}/)) confidence += 0.1; // Has 4-digit year
    if (dateText.match(/^(0[1-9]|1[0-2])/)) confidence += 0.05; // Proper month format
    if (dateText.match(/^(0[1-9]|[12]\d|3[01])/)) confidence += 0.05; // Proper day format

    // Keyword bonuses
    if (dateText.toLowerCase().includes('exp')) confidence += 0.1;
    if (dateText.toLowerCase().includes('best')) confidence += 0.1;
    if (dateText.toLowerCase().includes('use')) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  // Main detection method
  async detectExpiryDate(imageBuffer) {
    try {
      this.logger.info('Starting smart expiry date detection');
      
      // Step 1: Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // Step 2: Extract text
      const { text, confidence: ocrConfidence } = await this.extractText(processedImage);
      
      if (!text.trim()) {
        return {
          success: false,
          message: 'No text detected in image',
          detectedDates: [],
          ocrConfidence: 0
        };
      }

      // Step 3: Detect dates using multiple strategies
      const detectedDates = this.detectExpiryDates(text);
      
      // Step 4: Calculate overall confidence
      const bestDate = detectedDates[0];
      const overallConfidence = bestDate ? 
        Math.min(bestDate.confidence * ocrConfidence, 1.0) : ocrConfidence;

      this.logger.info(`Detection complete. Found ${detectedDates.length} dates. Best confidence: ${overallConfidence}`);

      return {
        success: true,
        detectedDates,
        bestDate,
        ocrConfidence,
        overallConfidence,
        extractedText: text,
        shouldAutoSet: bestDate && overallConfidence >= this.confidenceThreshold
      };

    } catch (error) {
      this.logger.error('Smart detection failed:', error);
      return {
        success: false,
        message: error.message,
        detectedDates: [],
        ocrConfidence: 0
      };
    }
  }
}

// Initialize smart detection service
const smartDetection = new SmartOCRDetection();

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ExpiryTracker OCR Service',
    version: '1.0.0'
  });
});

app.post('/detect-expiry', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await smartDetection.detectExpiryDate(req.file.buffer);
    
    res.json({
      ...result,
      processingTime: Date.now(),
      imageInfo: {
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    logger.error('Detection endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OCR processing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Smart OCR Service running on port ${PORT}`);
  logger.info(`Confidence threshold: ${smartDetection.confidenceThreshold}`);
});

module.exports = app;