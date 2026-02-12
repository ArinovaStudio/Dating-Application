import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';

const createDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'public/uploads/others';
    
    if (file.mimetype.startsWith('image')) folder = 'public/uploads/images';
    else if (file.mimetype.startsWith('video')) folder = 'public/uploads/videos';
    else if (file.mimetype.startsWith('audio')) folder = 'public/uploads/audio';
    
    createDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video') || file.mimetype.startsWith('audio')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, video, or audio file!', 400), false);
  }
};

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit 
});