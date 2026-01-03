import {
  Controller,
  FileTypeValidator,
  Post,
  Query,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import path from 'path';
import * as fs from 'fs';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null, destination: string) => void,
        ) => {
          const allowedFolders = ['avatars', 'posts', 'tweets'];
          const queryFolder = req.query.folder as string;
          const folder = allowedFolders.includes(queryFolder)
            ? queryFolder
            : 'misc';
          const uploadPath = `./uploads/${folder}`;

          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (
          req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const extension =
            MIME_EXTENSION_MAP[file.mimetype] ??
            path.extname((file as any).originalname);
          const safeExtension = extension ? extension.toLowerCase() : '';
          const fileName = `${randomUUID()}${safeExtension}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: /image\/(jpeg|jpg|png|webp|gif)$/i,
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    const allowedFolders = ['avatars', 'posts', 'tweets'];
    const targetFolder =
      folder && allowedFolders.includes(folder) ? folder : 'misc';
    // Use the same base URL that the frontend uses to access the API
    const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

    return {
      url: `${baseUrl}/api/uploads/${targetFolder}/${(file as any).filename}`,
    };
  }
}
