import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseInterceptors, UploadedFile,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiConsumes } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto, RejectOrderDto, UpdateOrderStatusDto, OrderQueryDto,
} from './dto/order.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { Response } from 'express';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: OrderQueryDto, @CurrentUser() user: User) {
    return this.service.findAll(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, { id: user.id, role: user.role });
  }

  @Roles(Role.OWNER)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user.id);
  }

  @Roles(Role.OWNER)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectOrderDto, @CurrentUser() user: User) {
    return this.service.reject(id, dto, user.id);
  }

  @Roles(Role.STAFF, Role.OWNER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: User) {
    return this.service.updateStatus(id, dto, user.id);
  }

  @Roles(Role.CUSTOMER)
  @Post(':id/repeat')
  repeatOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.repeatOrder(id, user.id);
  }

  @Get(':id/invoice')
  async invoice(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const order = await this.service.findOne(id, { id: user.id, role: user.role });
    const printableOrder = order as any;
    const rows = (order.items || [])
      .map((item) => `<tr><td>${item.product.name}</td><td>${item.quantity}</td><td>₹${(item.unitPrice / 100).toFixed(2)}</td><td>₹${(item.subtotal / 100).toFixed(2)}</td></tr>`)
      .join('');

    const html = `<!doctype html><html><body style="font-family:Arial;padding:24px"><h2>Nath Sales Invoice</h2><p><strong>Order:</strong> ${order.orderNumber}</p><p><strong>Customer:</strong> ${order.customer?.name ?? ''}</p><p><strong>Address:</strong> ${order.deliveryAddress ?? '-'}</p><table border="1" cellspacing="0" cellpadding="8" width="100%"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><h3 style="margin-top:16px">Total: ₹${(order.totalAmount / 100).toFixed(2)}</h3><p><strong>Payment:</strong> ${printableOrder.paymentMethod ?? 'COD'} (${printableOrder.paymentStatus ?? 'PENDING'})</p><p><strong>Generated:</strong> ${new Date().toISOString()}</p></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.html"`);
    res.send(html);
  }

  @Roles(Role.CUSTOMER)
  @Patch(':id/payment-receipt')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt'))
  async uploadPaymentReceipt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('note') note: string | undefined,
    @CurrentUser() user: User,
  ) {
    const receiptUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'distro/receipts' }, (err, result) => {
          if (err || !result) return reject(err);
          resolve(result.secure_url);
        })
        .end(file.buffer);
    });
    return this.service.attachPaymentReceipt(id, user.id, receiptUrl, note);
  }
}
