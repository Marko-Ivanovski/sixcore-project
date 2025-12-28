import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (
          req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname((file as any).originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // Accept images only
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Return the URL.
    // Assuming the app serves '/uploads' statically from the uploads dir.
    // In production/docker, the host might differ, but relative path or full URL
    // depends on how frontend consumes it. Returning absolute path for now based on env or default.
    const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001/api';
    // We are serving static files at /uploads prefix presumably
    return {
      url: `${baseUrl}/uploads/${(file as any).filename}`,
    };
  }
}
