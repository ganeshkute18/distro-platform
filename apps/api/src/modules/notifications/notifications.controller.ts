import { Controller, Get, Patch, Param, Query, Body, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('unread') unread?: string,
  ) {
    return this.service.findForUser(user.id, Number(page), Number(limit), unread === 'true');
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.markRead(id, user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: User) {
    return this.service.markAllRead(user.id);
  }

  @Post('push-subscriptions')
  subscribe(
    @CurrentUser() user: User,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.service.savePushSubscription(user.id, body.endpoint, body.keys.p256dh, body.keys.auth);
  }

  @Delete('push-subscriptions')
  unsubscribe(@CurrentUser() user: User, @Body() body: { endpoint: string }) {
    return this.service.removePushSubscription(user.id, body.endpoint);
  }
}
