import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/api/uploads',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    UploadsModule,
    PostsModule,
  ],
})
export class AppModule {}
