import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pay')
  async processPayment(@Body() body: { 
    amount: number; 
    currency: string; 
    paymentMethodId: string; 
    type: 'per-minute' | 'subscription' 
  }) {
    const { amount, currency, paymentMethodId, type } = body;

    if (!amount || !paymentMethodId) {
      throw new HttpException('Amount and payment method are required', HttpStatus.BAD_REQUEST);
    }

    return this.paymentService.processPayment(amount, currency, paymentMethodId, type);
  }
}