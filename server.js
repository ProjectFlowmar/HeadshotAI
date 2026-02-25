require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const config = require('./src/config');
const storage = require('./src/storage');
const aiService = require('./src/ai-service');

const app = express();

// Stripe needs raw body for webhooks
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Normal middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve results directory for authenticated downloads
app.use('/downloads', express.static(path.join(__dirname, 'results')));

// File upload config
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});

// Lazy-load Stripe (only when key is set)
let stripe = null;
function getStripe() {
  if (!stripe && config.stripe.secretKey) {
    stripe = require('stripe')(config.stripe.secretKey);
  }
  return stripe;
}

// ============================================================
// Pages
// ============================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/upload/:orderId', (req, res) => {
  const order = storage.getOrder(req.params.orderId);
  if (!order) return res.status(404).send('Order not found');
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/results/:orderId', (req, res) => {
  const order = storage.getOrder(req.params.orderId);
  if (!order) return res.status(404).send('Order not found');
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// ============================================================
// API: Checkout
// ============================================================

app.post('/api/checkout', async (req, res) => {
  const { package: pkg, email } = req.body;
  if (!pkg || !email) return res.status(400).json({ error: 'Package and email required' });
  
  const packageConfig = config.packages[pkg];
  if (!packageConfig) return res.status(400).json({ error: 'Invalid package' });

  const orderId = uuid();

  // Create order in pending state
  storage.createOrder({
    orderId,
    email,
    package: pkg,
    packageName: packageConfig.name,
    headshots: packageConfig.headshots,
    styles: packageConfig.styles,
    status: 'pending_payment',
    stripeSessionId: null,
    imageUrl: null,
    results: [],
  });

  const s = getStripe();
  if (s) {
    try {
      const session = await s.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageConfig.name} Headshot Package`,
              description: `${packageConfig.headshots} AI-generated professional headshots`,
            },
            unit_amount: packageConfig.price,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${config.baseUrl}/upload/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.baseUrl}/?canceled=true`,
        metadata: { orderId },
      });

      storage.updateOrder(orderId, { stripeSessionId: session.id });
      return res.json({ ok: true, url: session.url, orderId });
    } catch (err) {
      console.error('[Stripe] Error:', err.message);
      return res.status(500).json({ error: 'Payment error' });
    }
  }

  // No Stripe configured — dev mode, skip payment
  storage.updateOrder(orderId, { status: 'paid' });
  res.json({ ok: true, url: `/upload/${orderId}`, orderId });
});

// ============================================================
// API: Upload selfie & trigger generation
// ============================================================

app.post('/api/upload/:orderId', upload.single('selfie'), async (req, res) => {
  const order = storage.getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['paid', 'pending_payment'].includes(order.status)) {
    // Allow re-upload only if not already generating
    if (order.status === 'generating') return res.status(400).json({ error: 'Already generating' });
  }

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Convert to base64 data URI for fal.ai
  const buffer = fs.readFileSync(req.file.path);
  const mimeType = req.file.mimetype || 'image/jpeg';
  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

  storage.updateOrder(order.orderId, { status: 'generating', imageUrl: dataUri, uploadedAt: Date.now() });

  res.json({ ok: true, message: 'Generation started! Check back in a few minutes.', orderId: order.orderId });

  // Generate in background
  generateInBackground(order.orderId, dataUri, order.styles, order.headshots);
});

async function generateInBackground(orderId, imageUrl, styleCategories, maxImages) {
  console.log(`[Gen] Starting generation for order ${orderId}: ${maxImages} headshots`);
  
  try {
    const images = await aiService.generateHeadshots(imageUrl, styleCategories, maxImages);
    
    // Download results locally
    const downloaded = await aiService.downloadResults(orderId, images);
    
    storage.updateOrder(orderId, {
      status: 'completed',
      results: downloaded.map(d => ({
        id: d.id,
        filename: d.filename,
        category: d.category,
        url: `/downloads/${orderId}/${d.filename}`,
      })),
      completedAt: Date.now(),
    });

    console.log(`[Gen] Order ${orderId} completed: ${downloaded.length} headshots`);

    // TODO: Send email notification when email service is configured
    
  } catch (err) {
    console.error(`[Gen] Error for order ${orderId}:`, err.message);
    storage.updateOrder(orderId, { status: 'error', error: err.message });
  }
}

// ============================================================
// API: Check order status / get results
// ============================================================

app.get('/api/order/:orderId', (req, res) => {
  const order = storage.getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({
    ok: true,
    orderId: order.orderId,
    status: order.status,
    package: order.packageName,
    headshots: order.headshots,
    results: order.results || [],
    completedAt: order.completedAt,
    error: order.error,
  });
});

// Download all as zip
app.get('/api/download-all/:orderId', async (req, res) => {
  const order = storage.getOrder(req.params.orderId);
  if (!order || order.status !== 'completed') return res.status(404).json({ error: 'Not ready' });
  
  const archiver = require('archiver');
  const orderDir = path.join(__dirname, 'results', order.orderId);
  
  if (!fs.existsSync(orderDir)) return res.status(404).json({ error: 'Files not found' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=headshots-${order.orderId.slice(0, 8)}.zip`);

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);
  archive.directory(orderDir, false);
  archive.finalize();
});

// ============================================================
// API: Admin stats
// ============================================================

app.get('/api/admin/stats', (req, res) => {
  const orders = storage.getAllOrders();
  const completed = orders.filter(o => o.status === 'completed');
  const revenue = completed.reduce((sum, o) => sum + (config.packages[o.package]?.price || 0), 0);
  res.json({
    totalOrders: orders.length,
    completed: completed.length,
    generating: orders.filter(o => o.status === 'generating').length,
    revenue: revenue / 100,
    orders: orders.slice(0, 20),
  });
});

// ============================================================
// API: Print & Ship (Prodigi)
// ============================================================

app.post('/api/print-order', async (req, res) => {
  const { orderId, imageUrl, productId, shipping } = req.body;
  if (!orderId || !imageUrl || !productId || !shipping) {
    return res.status(400).json({ error: 'orderId, imageUrl, productId, and shipping required' });
  }

  const product = config.printProducts[productId];
  if (!product) return res.status(400).json({ error: 'Invalid product' });

  const order = storage.getOrder(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const totalPrice = product.price + product.shipping;

  // If Stripe is configured, create a checkout session for the print
  const s = getStripe();
  if (s) {
    try {
      const printOrderId = uuid();
      const session = await s.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: order.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: 'Museum-quality print shipped to your door',
            },
            unit_amount: product.price,
          },
          quantity: 1,
        }, {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Shipping' },
            unit_amount: product.shipping,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${config.baseUrl}/results/${orderId}?print=success`,
        cancel_url: `${config.baseUrl}/results/${orderId}?print=canceled`,
        metadata: { printOrderId, originalOrderId: orderId, productId, imageUrl: imageUrl.substring(0, 400) },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'IE', 'CO', 'MX', 'BR'],
        },
      });

      return res.json({ ok: true, url: session.url, printOrderId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Dev mode — simulate
  res.json({ ok: true, message: 'Print order simulated (Stripe not configured)', totalPrice: totalPrice / 100 });
});

// Submit order to Prodigi (called after Stripe payment for prints)
async function submitProdigiOrder(imageUrl, productId, shippingAddress) {
  const product = config.printProducts[productId];
  if (!product) return null;

  const prodigiEnv = process.env.PRODIGI_ENV === 'production' ? 'api' : 'api.sandbox';
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) { console.log('[Prodigi] No API key, skipping'); return null; }

  try {
    const response = await fetch(`https://${prodigiEnv}.prodigi.com/v4.0/Orders`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shippingMethod: 'standard',
        recipient: {
          name: shippingAddress.name,
          address: {
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 || '',
            postalOrZipCode: shippingAddress.postal_code,
            countryCode: shippingAddress.country,
            townOrCity: shippingAddress.city,
            stateOrCounty: shippingAddress.state || '',
          },
        },
        items: [{
          sku: product.prodigiSku,
          copies: 1,
          sizing: 'fillPrintArea',
          assets: [{
            printArea: 'default',
            url: imageUrl,
          }],
        }],
      }),
    });

    const data = await response.json();
    console.log('[Prodigi] Order submitted:', data);
    return data;
  } catch (err) {
    console.error('[Prodigi] Error:', err.message);
    return null;
  }
}

// ============================================================
// API: Get print products
// ============================================================

app.get('/api/print-products', (req, res) => {
  const products = Object.entries(config.printProducts).map(([id, p]) => ({
    id,
    name: p.name,
    price: (p.price / 100).toFixed(2),
    shipping: (p.shipping / 100).toFixed(2),
    total: ((p.price + p.shipping) / 100).toFixed(2),
  }));
  res.json({ ok: true, products });
});

// ============================================================
// Stripe Webhook
// ============================================================

async function handleStripeWebhook(req, res) {
  const s = getStripe();
  if (!s) return res.sendStatus(200);

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = s.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    console.error('[Stripe] Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      storage.updateOrder(orderId, { status: 'paid', stripeSessionId: session.id });
      console.log(`[Stripe] Payment confirmed for order ${orderId}`);
    }
  }

  res.sendStatus(200);
}

// ============================================================
// Start
// ============================================================

app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   ⚡ HeadshotAI Pro                      ║
║   Running on port ${config.port}                    ║
║   ${config.baseUrl}                      ║
╚══════════════════════════════════════════╝
  `);
  console.log(`[Server] Stripe: ${config.stripe.secretKey ? '✅ Configured' : '⚠️ Dev mode (no payment)'}`);
});
