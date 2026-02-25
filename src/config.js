require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3003,
  baseUrl: process.env.BASE_URL || 'http://localhost:3003',
  siteName: process.env.SITE_NAME || 'HeadshotAI Pro',
  
  fal: {
    key: process.env.FAL_KEY,
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      starter: process.env.STRIPE_PRICE_STARTER,
      pro: process.env.STRIPE_PRICE_PRO,
      premium: process.env.STRIPE_PRICE_PREMIUM,
    },
  },
  
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // Headshot styles — each becomes a generation with the user's face
  styles: [
    // Corporate / Business
    { id: 'corp-1', category: 'Corporate', prompt: 'Professional corporate headshot photo of this person wearing a dark navy business suit with a white dress shirt, clean studio background with soft gradient, professional studio lighting with key light and fill light, shallow depth of field, shot on Canon R5 85mm f/1.4, photorealistic' },
    { id: 'corp-2', category: 'Corporate', prompt: 'Professional headshot photo of this person wearing a charcoal grey suit jacket and light blue shirt, against a clean white studio backdrop, professional studio lighting, confident expression, corporate business portrait, shot on Sony A7R V 85mm, photorealistic' },
    { id: 'corp-3', category: 'Corporate', prompt: 'Executive business headshot of this person in a black blazer over a cream silk blouse, in a modern minimalist office with blurred glass walls behind, warm studio lighting, professional corporate portrait, photorealistic' },
    { id: 'corp-4', category: 'Corporate', prompt: 'Professional LinkedIn headshot of this person wearing smart business casual, crisp white shirt, against a soft grey gradient backdrop, natural warm lighting from a large window, approachable confident smile, shot on Phase One 150MP, photorealistic' },
    
    // Creative / Modern
    { id: 'creative-1', category: 'Creative', prompt: 'Modern creative professional headshot of this person wearing a trendy black turtleneck, against a moody dark charcoal background with dramatic side lighting, artistic portrait with cinematic teal and orange color grade, shot on Hasselblad X2D, photorealistic' },
    { id: 'creative-2', category: 'Creative', prompt: 'Contemporary creative headshot of this person in a stylish earth-tone outfit, brick wall background with warm Edison bulb lighting, shallow depth of field bokeh, editorial portrait style, warm authentic feel, photorealistic' },
    { id: 'creative-3', category: 'Creative', prompt: 'Artistic headshot of this person in a designer jacket, in a sleek modern art gallery with soft diffused lighting, minimalist aesthetic, fashion-forward professional portrait, shot on Leica S3 90mm, photorealistic' },
    
    // Outdoor / Natural
    { id: 'outdoor-1', category: 'Outdoor', prompt: 'Natural outdoor headshot of this person in smart casual attire, standing in a lush green park with soft golden hour sunlight filtering through trees, warm natural tones, friendly approachable expression, shallow depth of field, photorealistic' },
    { id: 'outdoor-2', category: 'Outdoor', prompt: 'Professional outdoor portrait of this person in business casual clothing, standing near a modern glass building with soft afternoon light, urban professional environment, shot on Canon R5 85mm f/1.2, photorealistic' },
    { id: 'outdoor-3', category: 'Outdoor', prompt: 'Natural light headshot of this person in a clean white button-up shirt, photographed in a rooftop garden with a city skyline softly blurred in the background, golden hour warm lighting, confident relaxed pose, photorealistic' },
    
    // LinkedIn Optimized
    { id: 'linkedin-1', category: 'LinkedIn', prompt: 'Perfect LinkedIn profile photo of this person, professional attire, clean solid blue-grey gradient background, ideal framing with head and shoulders, warm studio lighting setup, approachable professional expression, 800x800 square crop, photorealistic' },
    { id: 'linkedin-2', category: 'LinkedIn', prompt: 'Ideal LinkedIn headshot of this person wearing a professional dark blazer, against a soft warm neutral background, optimized for social media, friendly confident expression with slight smile, professional studio photography, photorealistic' },
    
    // Real Estate / Insurance Agent
    { id: 'agent-1', category: 'Agent', prompt: 'Professional real estate agent headshot of this person in a sharp suit with a warm smile, elegant office backdrop with soft bokeh, warm inviting lighting, trustworthy and approachable, luxury branding portrait, photorealistic' },
    { id: 'agent-2', category: 'Agent', prompt: 'Insurance advisor professional photo of this person in business professional attire, standing in a modern office with city view, warm lighting, confident and caring expression, trust-building portrait, photorealistic' },
    
    // Tech / Startup
    { id: 'tech-1', category: 'Tech', prompt: 'Tech startup founder headshot of this person in a premium quality hoodie or casual button-up, modern coworking space with neon accents blurred behind, moody tech-aesthetic lighting, innovative leader portrait, photorealistic' },
    { id: 'tech-2', category: 'Tech', prompt: 'Silicon Valley professional headshot of this person in smart casual attire, clean modern office with large monitors and green plants blurred behind, natural window light, approachable tech leader, photorealistic' },
    
    // Premium / Executive
    { id: 'exec-1', category: 'Executive', prompt: 'C-suite executive portrait of this person in a bespoke three-piece suit, in a luxury mahogany office with leather chair and bookshelf, Rembrandt lighting, authoritative yet warm, premium business portrait, photorealistic' },
    { id: 'exec-2', category: 'Executive', prompt: 'Board member professional photo of this person in premium business attire, photographed against rich dark background with dramatic studio lighting, power portrait with confidence and gravitas, shot on Phase One IQ4, photorealistic' },
    
    // Pet Portraits
    { id: 'pet-royal', category: 'Pet', prompt: 'Regal royal portrait painting of this pet animal wearing a renaissance nobleman outfit with gold epaulettes and red velvet cape, oil painting style, ornate gold frame background, dramatic lighting, museum quality portrait, photorealistic' },
    { id: 'pet-adventure', category: 'Pet', prompt: 'Adventure explorer portrait of this pet animal wearing a tiny explorer hat and vest, standing on a mountain peak at golden hour with dramatic clouds, national geographic style photography, epic landscape, photorealistic' },
    { id: 'pet-ceo', category: 'Pet', prompt: 'Corporate CEO portrait of this pet animal wearing a tiny business suit with tie, sitting at an executive desk in a corner office with city skyline view, professional business portrait photography, photorealistic' },
    { id: 'pet-wizard', category: 'Pet', prompt: 'Fantasy wizard portrait of this pet animal wearing a magical wizard robe and hat with stars, surrounded by floating books and magical sparkles, whimsical fantasy illustration, enchanting lighting, photorealistic' },
    { id: 'pet-astronaut', category: 'Pet', prompt: 'Space astronaut portrait of this pet animal wearing a NASA-style space suit, floating in space with Earth visible behind, cinematic lighting, sci-fi movie poster quality, photorealistic' },
    { id: 'pet-chef', category: 'Pet', prompt: 'Master chef portrait of this pet animal wearing a white chef coat and tall chef hat, standing in a gourmet kitchen with fresh ingredients, warm kitchen lighting, food magazine cover quality, photorealistic' },
    { id: 'pet-pirate', category: 'Pet', prompt: 'Pirate captain portrait of this pet animal wearing a pirate hat with skull and crossbones, an eye patch and a tiny sword, on the deck of a ship at sunset, adventure movie poster style, photorealistic' },
    { id: 'pet-superhero', category: 'Pet', prompt: 'Superhero portrait of this pet animal wearing a custom superhero cape and mask, standing heroically on a rooftop with a city below, dramatic comic book lighting, epic hero pose, photorealistic' },
    { id: 'pet-holiday', category: 'Pet', prompt: 'Holiday greeting card portrait of this pet animal wearing a cozy Christmas sweater surrounded by presents, christmas tree and warm fireplace in background, festive warm lighting, greeting card quality, photorealistic' },
    { id: 'pet-classic', category: 'Pet', prompt: 'Classic studio portrait of this pet animal against a clean studio backdrop, professional pet photography with soft lighting, beautiful fur detail, award-winning pet portrait, shot on Canon R5, photorealistic' },
  ],
  
  // Pet packages
  petPackages: {
    'pet-starter': { name: 'Pet Starter', headshots: 10, styles: ['Pet'], price: 1200, isPet: true },      // $12
    'pet-pro': { name: 'Pet Pro', headshots: 25, styles: ['Pet'], price: 2400, isPet: true },               // $24  
    'pet-ultimate': { name: 'Pet Ultimate', headshots: 50, styles: ['Pet'], price: 3900, isPet: true },     // $39
  },
  
  // Print products via Prodigi
  printProducts: {
    '8x10-print': { name: '8×10 Photo Print', prodigiSku: 'GLOBAL-PHO-8x10', cost: 3.50, price: 1499, shipping: 499 },
    '11x14-print': { name: '11×14 Photo Print', prodigiSku: 'GLOBAL-PHO-11x14', cost: 5.00, price: 1999, shipping: 599 },
    '16x20-canvas': { name: '16×20 Canvas Print', prodigiSku: 'GLOBAL-CAN-16x20', cost: 18.00, price: 4999, shipping: 799 },
    '20x24-canvas': { name: '20×24 Canvas Print', prodigiSku: 'GLOBAL-CAN-20x24', cost: 24.00, price: 6999, shipping: 999 },
    '24x36-canvas': { name: '24×36 Canvas Print', prodigiSku: 'GLOBAL-CAN-24x36', cost: 32.00, price: 8999, shipping: 999 },
    '8x10-framed': { name: '8×10 Framed Print', prodigiSku: 'GLOBAL-FRP-8x10', cost: 12.00, price: 3499, shipping: 699 },
    '16x20-framed': { name: '16×20 Framed Print', prodigiSku: 'GLOBAL-FRP-16x20', cost: 22.00, price: 5999, shipping: 899 },
  },
  
  // Packages
  packages: {
    starter: { name: 'Starter', headshots: 20, styles: ['Corporate', 'LinkedIn'], price: 1500 },
    pro: { name: 'Professional', headshots: 50, styles: ['Corporate', 'LinkedIn', 'Creative', 'Outdoor', 'Agent'], price: 2900 },
    premium: { name: 'Executive', headshots: 100, styles: 'all', price: 4900 },
    'pet-starter': { name: 'Pet Starter', headshots: 10, styles: ['Pet'], price: 1200, isPet: true },
    'pet-pro': { name: 'Pet Pro', headshots: 25, styles: ['Pet'], price: 2400, isPet: true },
    'pet-ultimate': { name: 'Pet Ultimate', headshots: 50, styles: ['Pet'], price: 3900, isPet: true },
  },
};
