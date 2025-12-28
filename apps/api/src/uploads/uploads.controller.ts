import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null, destination: string) => void,
        ) => {
          const allowedFolders = ['avatars', 'posts'];
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
          const originalName = (file as any).originalname;
          callback(null, originalName);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    const allowedFolders = ['avatars', 'posts'];
    const targetFolder =
      folder && allowedFolders.includes(folder) ? folder : 'misc';
    // Use the same base URL that the frontend uses to access the API
    const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

    return {
      url: `${baseUrl}/api/uploads/${targetFolder}/${(file as any).filename}`,
    };
  }
}
