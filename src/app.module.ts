import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017'),
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    console.log('Successfully connected to the MongoDB database!');
  }
}