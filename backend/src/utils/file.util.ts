import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath: string | null) => {
  if (!filePath) return;

  const absolutePath = path.join(process.cwd(), 'public', filePath);

  fs.unlink(absolutePath, (err) => {
    if (err) {
      console.log(err);
    }
  });

  return true;
};