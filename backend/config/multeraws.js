const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Create S3 client (uses IAM role automatically)
const s3Client = new S3Client({
  region: process.env.AWS_REGION
});

// Multer filter for file type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'));
  }
};

// Create the multer instance with S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Save files in a 'user-uploads/' folder within the bucket
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'user-uploads/' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // Set file size limit to 2MB
  fileFilter: fileFilter,
});

// module.exports = upload;