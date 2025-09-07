import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });
  }

  async processPayment(amount: number, currency: string = 'usd', paymentMethodId: string, type: 'per-minute' | 'subscription') {
    try {
      if (type === 'subscription') {
        // Create subscription
        const subscription = await this.stripe.subscriptions.create({
          customer: 'customer_id', // Replace with actual customer ID
          items: [{ price: 'price_id' }], // Replace with actual price ID
          default_payment_method: paymentMethodId,
        });

        return {
          success: true,
          subscriptionId: subscription.id,
          status: subscription.status
        };
      } else {
        // One-time payment
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          payment_method: paymentMethodId,
          confirm: true,
          return_url: 'https://your-website.com/return'
        });

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        };
      }
    } catch (error) {
      console.error('Stripe error:', error);
      throw new HttpException('Payment processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}