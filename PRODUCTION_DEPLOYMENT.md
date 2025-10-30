# 🚀 Production Deployment Guide - DarkByte Invoice System

## Security Checklist ✅

### Environment Variables

**CRITICAL**: Before deploying to production, ensure all environment variables are properly set:

```bash
# .env.production
DATABASE_URL="postgresql://user:password@host:5432/database"  # Use PostgreSQL in production
JWT_SECRET="your-super-secure-random-string-at-least-64-characters"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://yourdomain.com"

# Pterodactyl Settings (if applicable)
PTERODACTYL_URL="https://panel.yourdomain.com"
PTERODACTYL_API_KEY="your-pterodactyl-api-key"
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Migration (SQLite → PostgreSQL)

For production, migrate from SQLite to PostgreSQL:

1. **Update schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Run migrations:**
```bash
npx prisma migrate deploy
npx prisma generate
```

### Security Enhancements Implemented ✅

#### 1. **Rate Limiting**
- Invoice generation: 5 requests per minute per user
- Invoice viewing: 30 requests per minute per user
- Invoice listing: 20 requests per minute per user
- Returns HTTP 429 with `Retry-After` header when limit exceeded

#### 2. **Input Validation**
- All user inputs are validated and sanitized
- Invoice IDs limited to 100 characters
- Order IDs validated for type and length
- Email format validation
- Negative amounts prevented

#### 3. **Error Handling**
- Detailed errors only shown in development mode
- Generic error messages in production
- All errors logged for monitoring
- Database connections properly closed with `finally` blocks

#### 4. **Data Sanitization**
- Invoice items sanitized before storage
- String lengths limited (names: 255 chars, descriptions: 500 chars)
- Numeric values validated and bounded
- JSON parsing wrapped in try-catch

#### 5. **Authentication & Authorization**
- JWT token validation on all endpoints
- User ownership verification for invoices
- Admin-only access for order verification
- Proper HTTP status codes (401, 403, 404)

#### 6. **Invoice Number Generation**
- Unique format: `DARKBYTE-2025-000001`
- 6-digit zero-padded sequential numbering
- Prevents duplicate invoice numbers
- Thread-safe generation

## Production Optimizations

### 1. Database Indexes

Add these indexes for better performance:

```sql
-- Add to your migration file
CREATE INDEX idx_invoice_user_id ON "Invoice"("userId");
CREATE INDEX idx_invoice_order_id ON "Invoice"("orderId");
CREATE INDEX idx_invoice_created_at ON "Invoice"("createdAt" DESC);
CREATE INDEX idx_invoice_number ON "Invoice"("invoiceNumber");
```

### 2. Pagination

Invoice listing supports pagination:
```typescript
GET /api/invoices/my-invoices?limit=50&offset=0
```

Response includes:
```json
{
  "invoices": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 123
  }
}
```

### 3. Caching Strategy

**Recommended**: Implement Redis caching for:
- User authentication tokens
- Frequently accessed invoices
- Rate limiting counters

Example with Redis:
```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache invoice for 5 minutes
await redis.setex(`invoice:${id}`, 300, JSON.stringify(invoice))
```

### 4. CDN & Asset Optimization

For invoice PDFs and images:
- Use Cloudflare or AWS CloudFront
- Enable compression (gzip/brotli)
- Set proper cache headers

## Monitoring & Logging

### 1. Error Tracking

Integrate Sentry for error monitoring:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 2. Logging Best Practices

All invoice operations are logged:
- Invoice generation attempts
- Failed validations
- Rate limit hits
- Database errors

**Recommended**: Use structured logging (Winston, Pino):

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

### 3. Metrics to Monitor

- Invoice generation rate
- Failed invoice creations
- Average response times
- Rate limit violations
- Database query performance

## Security Headers

Add security headers in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## Backup Strategy

### 1. Database Backups

**Automated daily backups:**
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/darkbyte_$DATE.sql
# Upload to S3 or similar
aws s3 cp /backups/darkbyte_$DATE.sql s3://your-backup-bucket/
```

### 2. Invoice Data Retention

- Keep all invoices indefinitely (legal requirement)
- Archive old invoices (>2 years) to cold storage
- Maintain audit logs for invoice modifications

## Performance Benchmarks

Expected performance metrics:

- Invoice generation: < 500ms
- Invoice retrieval: < 100ms
- Invoice listing (50 items): < 200ms
- PDF generation: < 2s

## Load Testing

Test with Apache Bench:

```bash
# Test invoice listing
ab -n 1000 -c 10 -H "Cookie: auth-token=YOUR_TOKEN" \
  https://yourdomain.com/api/invoices/my-invoices

# Test invoice retrieval
ab -n 500 -c 5 -H "Cookie: auth-token=YOUR_TOKEN" \
  https://yourdomain.com/api/invoices/INVOICE_ID
```

## SSL/TLS Configuration

**Required**: HTTPS only in production

1. Obtain SSL certificate (Let's Encrypt, Cloudflare, etc.)
2. Configure automatic HTTPS redirect
3. Enable HSTS header
4. Use TLS 1.3 minimum

## Email Notifications (Optional Enhancement)

Add email notifications for invoices:

```typescript
// Using Resend or SendGrid
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendInvoiceEmail(invoice: Invoice) {
  await resend.emails.send({
    from: 'invoices@darkbyte.in',
    to: invoice.customerEmail,
    subject: `Invoice ${invoice.invoiceNumber} - DarkByte Premium`,
    html: generateInvoiceEmailHTML(invoice),
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: await generateInvoicePDF(invoice),
      },
    ],
  })
}
```

## Compliance & Legal

### 1. GDPR Compliance

- ✅ Users can access their invoices
- ✅ Personal data is encrypted in transit (HTTPS)
- ⚠️ TODO: Implement data export endpoint
- ⚠️ TODO: Implement data deletion endpoint (with retention rules)

### 2. Tax Compliance

Current invoice includes:
- Subtotal
- Discount
- Tax (currently set to 0)
- Total amount

**TODO**: Integrate GST/VAT calculation based on region

### 3. Invoice Requirements (India)

✅ Company name (DarkByte Pvt. Ltd.)
✅ Contact information (support@darkbyte.in)
✅ Invoice number (unique sequential)
✅ Date of issue
✅ Customer details
✅ Itemized services
✅ Total amount
⚠️ TODO: Add GSTIN (if applicable)
⚠️ TODO: Add company address
⚠️ TODO: Add bank details for wire transfers

## Deployment Checklist

### Pre-Deployment

- [ ] Set all production environment variables
- [ ] Migrate to PostgreSQL database
- [ ] Run database migrations
- [ ] Test invoice generation end-to-end
- [ ] Verify PDF printing works correctly
- [ ] Enable error tracking (Sentry)
- [ ] Set up database backups
- [ ] Configure Redis for rate limiting
- [ ] Add security headers
- [ ] Enable HTTPS/SSL
- [ ] Test rate limiting functionality
- [ ] Verify email formatting and validation

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check invoice generation success rate
- [ ] Verify PDF downloads work in production
- [ ] Test on multiple browsers and devices
- [ ] Confirm email notifications (if enabled)
- [ ] Run load tests
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors

## Troubleshooting

### Common Issues

**1. Invoice generation fails:**
- Check database connection
- Verify order exists and has items
- Check invoice number uniqueness
- Review error logs

**2. Rate limiting too aggressive:**
```typescript
// Adjust limits in invoice-utils.ts
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 20, // Increase this
  windowMs: number = 60000
)
```

**3. PDF not printing correctly:**
- Clear browser cache
- Check print CSS in globals.css
- Verify react-to-print is installed
- Test on different browsers

**4. Slow performance:**
- Add database indexes
- Enable query caching
- Use Redis for rate limiting
- Optimize database queries

## Support Contacts

For production issues:

- 📧 Technical Support: support@darkbyte.in
- 📱 Emergency: +91 88261 28886
- 🌐 Status Page: status.darkbyte.in (recommended to set up)
- 💬 Slack/Discord: (set up team channel)

## Maintenance Windows

Recommended monthly maintenance:
- Database optimization and vacuum
- Log rotation and cleanup
- Dependency updates and security patches
- Performance review and optimization
- Backup verification

---

**Last Updated:** 2025-10-30

**Version:** 1.0.0

**Status:** Production Ready ✅

Built with ❤️ for DarkByte Premium Cloud Solutions
