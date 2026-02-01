import { Module, Global } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { R2Service } from './r2.service';

@Global()
@Module({
    controllers: [UploadsController],
    providers: [R2Service],
    exports: [R2Service],
})
export class UploadsModule { }
