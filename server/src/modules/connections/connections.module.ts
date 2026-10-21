import { Module } from '@nestjs/common';

import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase.guard';

@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsService, FirebaseAuthGuard],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}