'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { 
  Code2, 
  Plus, 
  Copy, 
  Trash2, 
  Check, 
  MonitorPlay, 
  Save, 
  Play, 
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Settings,
  Share2,
  Maximize2,
  Minimize2,
  FolderCode,
  Laptop
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// CodeMirror imports
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { dracula } from '@uiw/codemirror-theme-dracula';

// LiquidJS import
import { Liquid } from 'liquidjs';

interface Snippet {
  _id: string;
  title: string;
  code: string;
  createdBy: string;
  createdAt: string;
}

// ----------------------------------------------------
// Shopify Mock Context for Rich Theme & Page Previews
// ----------------------------------------------------
const mockShopifyContext = {
  shop: {
    name: "Commandos Boutique",
    email: "support@codecommandos.com",
    domain: "commandos-boutique.myshopify.com",
    secure_url: "https://commandos-boutique.myshopify.com",
    currency: "USD",
    money_format: "${{amount}}"
  },
  settings: {
    colors_accent_1: "#a855f7", 
    colors_accent_2: "#db2777", 
    colors_background_1: "#111827", 
    colors_background_2: "#1f2937", 
    colors_text: "#f3f4f6", 
    font_header_family: "Outfit, sans-serif",
    font_body_family: "Inter, sans-serif",
    grid_layout: "grid",
    card_border_radius: "16px"
  },
  routes: {
    root_url: "/",
    all_products_collection_url: "/collections/all",
    cart_url: "/cart",
    cart_add_url: "/cart/add",
    cart_change_url: "/cart/change",
    cart_clear_url: "/cart/clear",
    search_url: "/search"
  },
  cart: {
    item_count: 3,
    total_price: 24900,
    total_discount: 1500,
    items: [
      {
        id: 111,
        title: "Alpha Commandos Premium Hoodie",
        quantity: 1,
        price: 8900,
        original_price: 8900,
        final_price: 8900,
        url: "#",
        image: "https://picsum.photos/seed/hoodie/300/400",
        variant: { title: "Black / XL" }
      },
      {
        id: 222,
        title: "Beta Dev Cargo Joggers",
        quantity: 2,
        price: 8000,
        original_price: 8000,
        final_price: 8000,
        url: "#",
        image: "https://picsum.photos/seed/pants/300/400",
        variant: { title: "Olive / L" }
      }
    ]
  },
  product: {
    id: 12345,
    title: "Vibe Check Premium Sneaker",
    description: "<p>Elevate your developer workflow and lifestyle. Constructed with breathable primeknit, custom responsive foam sole, and clean cyber-punk accents. Supports compiling code on the go.</p>",
    price: 12900,
    compare_at_price: 18900,
    price_varies: false,
    available: true,
    featured_image: "https://picsum.photos/seed/sneaker/600/600",
    featured_media: {
      preview_image: {
        src: "https://picsum.photos/seed/sneaker/600/600"
      }
    },
    images: [
      "https://picsum.photos/seed/sneaker/600/600",
      "https://picsum.photos/seed/sneaker2/600/600",
      "https://picsum.photos/seed/sneaker3/600/600"
    ],
    variants: [
      { id: 11, title: "US 9 / Black", price: 12900, available: true },
      { id: 12, title: "US 10 / Black", price: 12900, available: true },
      { id: 13, title: "US 11 / White", price: 12900, available: false }
    ],
    options: ["Size", "Color"],
    tags: ["sneakers", "premium", "new-release"],
    url: "#"
  },
  collection: {
    id: 5678,
    title: "Summer Drop 2026",
    description: "Ultra lightweight garments and performance accessories designed for programmers who demand precision.",
    all_products_count: 4,
    url: "#",
    image: "https://picsum.photos/seed/summer/1200/500",
    products: [
      {
        id: 101,
        title: "Developer Knit T-Shirt",
        price: 3900,
        compare_at_price: 4900,
        featured_image: "https://picsum.photos/seed/tee/400/500",
        url: "#",
        vendor: "Commandos Labs"
      },
      {
        id: 102,
        title: "Cyberpunk Mechanical Keyboard V2",
        price: 18900,
        compare_at_price: 24900,
        featured_image: "https://picsum.photos/seed/keyboard/400/500",
        url: "#",
        vendor: "Commandos Labs"
      },
      {
        id: 103,
        title: "RGB Anti-Glare Desk Mat",
        price: 2900,
        featured_image: "https://picsum.photos/seed/deskmat/400/500",
        url: "#",
        vendor: "Commandos Labs"
      },
      {
        id: 104,
        title: "Coffee Overload Thermal Flask",
        price: 3500,
        featured_image: "https://picsum.photos/seed/flask/400/500",
        url: "#",
        vendor: "Commandos Labs"
      }
    ]
  },
  blogs: {
    news: {
      title: "Commandos News",
      articles: [
        {
          title: "Next.js 16 and Shopify Liquid Integrations",
          author: "Antigravity AI",
          published_at: "2026-07-04",
          excerpt: "How code commandos are scaling live Liquid rendering interfaces.",
          image: "https://picsum.photos/seed/news1/600/400",
          url: "#"
        }
      ]
    }
  },
  canonical_url: "https://commandos-boutique.myshopify.com/products/vibe-check-premium-sneaker",
  localization: {
    country: { iso_code: "US", name: "United States", currency: { iso_code: "USD", symbol: "$" } },
    language: { iso_code: "en", name: "English" }
  }
};

// ----------------------------------------------------
// Global Helper Functions
// ----------------------------------------------------
const extractSchema = (rawCode: string) => {
  const schemaRegex = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/i;
  const match = rawCode.match(schemaRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Invalid JSON in schema:", e);
      return null;
    }
  }
  return null;
};

const getDummyData = (setting: any) => {
  if (setting.default !== undefined) return setting.default;
  const type = setting.type;
  const id = (setting.id || '').toLowerCase();
  
  if (type === 'image_picker') {
    const seed = id || Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/800/600`;
  }
  if (type === 'text') {
    if (id.includes('title') || id.includes('heading')) return 'Premium Highlight';
    if (id.includes('btn') || id.includes('button')) return 'Shop Now';
    if (id.includes('url') || id.includes('link')) return '#';
    return 'Sample Text';
  }
  if (type === 'textarea' || type === 'richtext') {
    return '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Experience the modern aesthetics of fluid components.</p>';
  }
  if (type === 'url') return '#';
  if (type === 'color' || type === 'color_background') return '#a855f7';
  if (type === 'checkbox') return true;
  if (type === 'number') return 12;
  if (type === 'range') {
    if (setting.min !== undefined && setting.max !== undefined) {
      return Math.floor((setting.min + setting.max) / 2);
    }
    return 24;
  }
  if (type === 'select' || type === 'radio') {
    if (setting.options && setting.options.length > 0) {
      return setting.options[0].value;
    }
    return '';
  }
  if (type === 'video_url') return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  if (type === 'html' || type === 'liquid') return '<div>Premium Mock Layout</div>';
  
  return '';
};

// ----------------------------------------------------
// Premium Presets Selection
// ----------------------------------------------------
const PRESET_TEMPLATES = [
  {
    id: 'hero',
    name: '🔥 Glowing Hero Section',
    code: `<!-- Glowing Hero Section -->
<div class="hero-section" id="hero-{{ section.id }}">
  <div class="hero-glow"></div>
  <div class="hero-content">
    <span class="hero-badge">{{ section.settings.badge }}</span>
    <h1 class="hero-title">{{ section.settings.heading }}</h1>
    <p class="hero-subtitle">{{ section.settings.subheading }}</p>
    
    <div class="hero-buttons">
      {% if section.settings.button_text != blank %}
        <a href="{{ section.settings.button_link }}" class="btn btn-primary">{{ section.settings.button_text }}</a>
      {% endif %}
      {% if section.settings.secondary_button_text != blank %}
        <a href="{{ section.settings.secondary_button_link }}" class="btn btn-secondary">{{ section.settings.secondary_button_text }}</a>
      {% endif %}
    </div>
  </div>
</div>

<style>
  #hero-{{ section.id }} {
    position: relative;
    padding: 100px 20px;
    background: {{ section.settings.bg_color }};
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: {{ section.settings.border_radius }}px;
    overflow: hidden;
    font-family: 'Outfit', sans-serif;
    color: #fff;
    min-height: 400px;
  }
  
  .hero-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(0, 0, 0, 0) 60%);
    pointer-events: none;
    z-index: 1;
  }
  
  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 700px;
  }
  
  .hero-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(168, 85, 247, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.4);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #c084fc;
    margin-bottom: 24px;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
  }
  
  .hero-title {
    font-size: 48px;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 20px;
    letter-spacing: -1px;
    background: linear-gradient(to right, #fff, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .hero-subtitle {
    font-size: 18px;
    line-height: 1.6;
    color: #d1d5db;
    margin-bottom: 35px;
  }
  
  .hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    padding: 12px 30px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s ease;
  }
  
  .btn-primary {
    background: #a855f7;
    color: #fff;
    box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4);
  }
  
  .btn-primary:hover {
    background: #c084fc;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    .hero-title {
      font-size: 36px;
    }
    .hero-subtitle {
      font-size: 16px;
    }
    .hero-buttons {
      flex-direction: column;
      gap: 12px;
    }
  }
</style>

{% schema %}
{
  "name": "Glowing Hero Section",
  "settings": [
    {
      "type": "text",
      "id": "badge",
      "label": "Badge",
      "default": "New Drop"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Build Beautiful Storefronts Instantly"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Subheading",
      "default": "This Liquid template is compiled on-the-fly to represent an exact replica of how it will render in your online Shopify theme."
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#0b0f19"
    },
    {
      "type": "range",
      "id": "border_radius",
      "label": "Border Radius (px)",
      "min": 0,
      "max": 32,
      "step": 4,
      "default": 24
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Primary Button",
      "default": "Get Started"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Primary Button Link",
      "default": "#"
    },
    {
      "type": "text",
      "id": "secondary_button_text",
      "label": "Secondary Button",
      "default": "Documentation"
    },
    {
      "type": "url",
      "id": "secondary_button_link",
      "label": "Secondary Button Link",
      "default": "#"
    }
  ]
}
{% endschema %}`
  },
  {
    id: 'product-grid',
    name: '🛍️ Featured Products Grid',
    code: `<!-- Featured Products Grid -->
<div class="product-grid-section" id="grid-{{ section.id }}">
  <div class="grid-header">
    <h2>{{ section.settings.title }}</h2>
    <p>{{ section.settings.subtitle }}</p>
  </div>
  
  <div class="grid-container">
    {% for prod in collection.products %}
      <div class="product-card">
        <div class="product-badge">Sale</div>
        <div class="product-img-container">
          <img src="{{ prod.featured_image }}" alt="{{ prod.title }}" class="product-img" />
        </div>
        <div class="product-info">
          <span class="product-vendor">{{ prod.vendor }}</span>
          <h3 class="product-title">{{ prod.title }}</h3>
          
          <div class="product-price-row">
            <span class="price">{{ prod.price | money }}</span>
            {% if prod.compare_at_price > prod.price %}
              <span class="compare-price">{{ prod.compare_at_price | money }}</span>
            {% endif %}
          </div>
          
          <a href="{{ prod.url }}" class="add-to-cart-btn">View Product</a>
        </div>
      </div>
    {% endfor %}
  </div>
</div>

<style>
  #grid-{{ section.id }} {
    padding: 60px 20px;
    background: {{ section.settings.bg_color }};
    font-family: 'Inter', sans-serif;
    color: #fff;
    border-radius: 20px;
  }
  
  .grid-header {
    text-align: center;
    margin-bottom: 45px;
  }
  
  .grid-header h2 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 10px;
    color: #fff;
  }
  
  .grid-header p {
    font-size: 16px;
    color: #9ca3af;
  }
  
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 25px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .product-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
  }
  
  .product-card:hover {
    transform: translateY(-5px);
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow: 0 10px 25px rgba(168, 85, 247, 0.15);
  }
  
  .product-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 100px;
    z-index: 2;
  }
  
  .product-img-container {
    position: relative;
    padding-top: 100%;
    background: #000;
    overflow: hidden;
  }
  
  .product-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .product-card:hover .product-img {
    transform: scale(1.08);
  }
  
  .product-info {
    padding: 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  
  .product-vendor {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #a855f7;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .product-title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 12px 0;
    line-height: 1.4;
    height: 44px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .product-price-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .price {
    font-size: 18px;
    font-weight: 800;
    color: #fff;
  }
  
  .compare-price {
    font-size: 14px;
    text-decoration: line-through;
    color: #6b7280;
  }
  
  .add-to-cart-btn {
    display: block;
    width: 100%;
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 13px;
    padding: 10px 0;
    border-radius: 10px;
    transition: all 0.3s ease;
    box-sizing: border-box;
    margin-top: auto;
  }
  
  .product-card:hover .add-to-cart-btn {
    background: #a855f7;
    border-color: #a855f7;
    color: white;
  }
</style>

{% schema %}
{
  "name": "Featured Products",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Heading",
      "default": "New Arrivals"
    },
    {
      "type": "text",
      "id": "subtitle",
      "label": "Subheading",
      "default": "Shop our latest collections of professional developer wear."
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#111827"
    }
  ]
}
{% endschema %}`
  },
  {
    id: 'faq',
    name: '❓ Interactive FAQ Accordion',
    code: `<!-- Interactive FAQ Accordion -->
<div class="faq-section" id="faq-{{ section.id }}">
  <div class="faq-header">
    <h2>{{ section.settings.title }}</h2>
  </div>
  
  <div class="faq-container">
    {% for block in section.blocks %}
      <div class="faq-item" id="faq-item-{{ forloop.index }}">
        <button class="faq-trigger" onclick="toggleFaq({{ forloop.index }})">
          <span>{{ block.settings.question }}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-panel">
          <div class="faq-content">
            <p>{{ block.settings.answer }}</p>
          </div>
        </div>
      </div>
    {% endfor %}
  </div>
</div>

<script>
  function toggleFaq(index) {
    const item = document.getElementById('faq-item-' + index);
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-panel');
    const icon = item.querySelector('.faq-icon');
    
    if (item.classList.contains('active')) {
      item.classList.remove('active');
      panel.style.maxHeight = null;
      icon.textContent = '+';
    } else {
      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.faq-panel').style.maxHeight = null;
        el.querySelector('.faq-icon').textContent = '+';
      });
      
      item.classList.add('active');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      icon.textContent = '-';
    }
  }
</script>

<style>
  #faq-{{ section.id }} {
    padding: 60px 20px;
    background: {{ section.settings.bg_color }};
    font-family: 'Inter', sans-serif;
    color: #fff;
    border-radius: 20px;
  }
  .faq-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .faq-header h2 {
    font-size: 32px;
    font-weight: 800;
  }
  .faq-container {
    max-width: 700px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .faq-item {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  .faq-item.active {
    border-color: rgba(168, 85, 247, 0.4);
    background: rgba(255, 255, 255, 0.04);
  }
  .faq-trigger {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: none;
    border: none;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .faq-trigger:hover {
    color: #c084fc;
  }
  .faq-icon {
    font-size: 20px;
    font-weight: 400;
    color: #a855f7;
    transition: transform 0.3s ease;
  }
  .faq-panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
  }
  .faq-content {
    padding: 0 20px 20px 20px;
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.6;
  }
</style>

{% schema %}
{
  "name": "FAQ Accordion",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Heading",
      "default": "Frequently Asked Questions"
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#0b0f19"
    }
  ],
  "blocks": [
    {
      "type": "faq_item",
      "name": "FAQ Item",
      "settings": [
        {
          "type": "text",
          "id": "question",
          "label": "Question",
          "default": "What payment gateways are supported?"
        },
        {
          "type": "textarea",
          "id": "answer",
          "label": "Answer",
          "default": "We support Shopify Payments, PayPal, Stripe, and several manual payment structures according to client requirements."
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "FAQ Accordion",
      "blocks": [
        { "type": "faq_item" },
        { "type": "faq_item", "settings": { "question": "What is the revision policy?", "answer": "All delivered templates receive 30 days of free revisions." } }
      ]
    }
  ]
}
{% endschema %}`
  }
];

// ----------------------------------------------------
// Card component rendering Liquid directly in community cards
// ----------------------------------------------------
function SnippetCard({ 
  snippet, 
  onLoad, 
  onCopy, 
  onDelete, 
  copiedId, 
  engine,
  isAdmin
}: { 
  snippet: Snippet; 
  onLoad: (code: string) => void; 
  onCopy: (code: string, id: string) => void; 
  onDelete: (id: string) => void;
  copiedId: string | null;
  engine: any;
  isAdmin: boolean;
}) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function renderSnippet() {
      try {
        const rawCode = snippet.code;
        const schema = extractSchema(rawCode);
        
        // Build settings object
        const settings: Record<string, any> = {};
        if (schema && schema.settings) {
          schema.settings.forEach((setting: any) => {
            settings[setting.id] = setting.default !== undefined ? setting.default : getDummyData(setting);
          });
        }
        
        // Build blocks
        const blocks: any[] = [];
        if (schema && schema.presets && schema.presets[0] && schema.presets[0].blocks) {
          const schemaBlocksDef = schema.blocks || [];
          schema.presets[0].blocks.forEach((presetBlock: any) => {
            const blockDef = schemaBlocksDef.find((b: any) => b.type === presetBlock.type);
            const blockSettings: any = {};
            if (blockDef && blockDef.settings) {
              blockDef.settings.forEach((setting: any) => {
                blockSettings[setting.id] = setting.default !== undefined ? setting.default : getDummyData(setting);
              });
            }
            if (presetBlock.settings) {
              Object.assign(blockSettings, presetBlock.settings);
            }
            blocks.push({
              type: presetBlock.type,
              settings: blockSettings
            });
          });
        }

        // Context with mock shopify objects merged
        const context = {
          ...mockShopifyContext,
          section: {
            id: snippet._id,
            settings,
            blocks
          }
        };

        const codeWithoutSchema = rawCode.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '');
        const htmlContent = await engine.parseAndRender(codeWithoutSchema, context);
        
        if (active) {
          setRenderedHtml(htmlContent);
          setLoading(false);
        }
      } catch (err) {
        console.error("Card render error:", err);
        if (active) {
          setRenderedHtml(snippet.code.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, ''));
          setLoading(false);
        }
      }
    }
    renderSnippet();
    return () => { active = false; };
  }, [snippet, engine]);

  return (
    <div className="glass-panel border border-glass-border rounded-2xl overflow-hidden flex flex-col shadow-lg hover:border-purple-500/30 transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 bg-gray-950/20">
      
      {/* Title block */}
      <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/40">
        <div className="overflow-hidden pr-4 text-left">
          <h3 className="font-bold text-white text-base truncate group-hover:text-purple-400 transition-colors">{snippet.title}</h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">By {snippet.createdBy} • {new Date(snippet.createdAt).toLocaleDateString()}</p>
        </div>
        
        {/* Top actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onLoad(snippet.code)}
            className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-purple-500/20 text-gray-300 hover:text-purple-400 transition-all"
            title="Load into Editor"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={() => onCopy(snippet.code, snippet._id)}
            className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 transition-all"
            title="Copy Code"
          >
            {copiedId === snippet._id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {isAdmin && (
            <button
              onClick={() => onDelete(snippet._id)}
              className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
              title="Delete Snippet"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mock Browser Device Frame */}
      <div className="p-2 bg-gray-900/60 border-b border-glass-border">
        <div className="flex items-center justify-between bg-gray-950 px-3 py-1.5 rounded-lg border border-glass-border">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 block"></span>
          </div>
          <div className="text-[10px] font-mono text-gray-500 select-none truncate max-w-[150px]">
            {snippet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.liquid
          </div>
          <div className="w-4 h-4"></div>
        </div>
      </div>

      {/* Frame content */}
      <div className="relative w-full h-[230px] bg-gray-950 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <iframe
            title={snippet.title}
            srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:15px;background-color:#0b0f19;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}</style></head><body>${renderedHtml}</body></html>`}
            className="w-full h-full border-0 pointer-events-none"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

export default function ShopifyCodesPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  
  const defaultCode = `<!-- Custom Banner Section -->
<div class="custom-section" id="section-{{ section.id }}">
  <h2>{{ section.settings.title }}</h2>
  <p>{{ section.settings.description }}</p>
</div>

<style>
  #section-{{ section.id }} {
    padding: 60px 40px;
    background: {{ section.settings.bg_color }};
    text-align: center;
    border-radius: 16px;
    font-family: 'Outfit', sans-serif;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  #section-{{ section.id }} h2 {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 15px;
    letter-spacing: -0.5px;
  }
  #section-{{ section.id }} p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    max-width: 500px;
    margin: 0 auto;
  }
</style>

{% schema %}
{
  "name": "Custom Banner",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Heading",
      "default": "Welcome to my Shopify Section"
    },
    {
      "type": "textarea",
      "id": "description",
      "label": "Description",
      "default": "This is a live preview of your Shopify Liquid code. Try selecting other presets from the toolbar!"
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#581c87"
    }
  ]
}
{% endschema %}`;

  const [code, setCode] = useState(defaultCode);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Viewport & Fullscreen states
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Section State EXACTLY like app.js
  const [currentSchema, setCurrentSchema] = useState<any>(null);
  const [sectionState, setSectionState] = useState<{settings: any, blocks: any[]}>({ settings: {}, blocks: [] });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { user, dbUser } = useAuth();
  const profile = useWorkspaceStore((state) => state.memberProfile);
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : profile?.name) || 'Developer';
  const isAdmin = dbUser?.role === 'admin' || dbUser?.role === 'super_admin';

  // Initialize Liquid engine with rich Shopify filters
  const engine = useMemo(() => {
    const liq = new Liquid({
      lenientIf: true,
      strictFilters: false,
      strictVariables: false
    });
    
    // Shopify Custom tags support
    liq.registerTag('style', {
      parse: function (tagToken, remainTokens) {
        this.templates = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('tag:endstyle', () => stream.stop()).on('template', (tpl: any) => this.templates.push(tpl)).on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); });
        stream.start();
      },
      render: function* (ctx, emitter) {
        emitter.write('<style>');
        yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
        emitter.write('</style>');
      }
    });

    liq.registerTag('stylesheet', {
      parse: function (tagToken, remainTokens) {
        this.templates = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('tag:endstylesheet', () => stream.stop()).on('template', (tpl: any) => this.templates.push(tpl)).on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); });
        stream.start();
      },
      render: function* (ctx, emitter) {
        emitter.write('<style>');
        yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
        emitter.write('</style>');
      }
    });

    liq.registerTag('javascript', {
      parse: function (tagToken, remainTokens) {
        this.templates = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('tag:endjavascript', () => stream.stop()).on('template', (tpl: any) => this.templates.push(tpl)).on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); });
        stream.start();
      },
      render: function* (ctx, emitter) {
        emitter.write('<script>');
        yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
        emitter.write('</script>');
      }
    });

    liq.registerTag('form', {
      parse: function (tagToken, remainTokens) {
        this.templates = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('tag:endform', () => stream.stop()).on('template', (tpl: any) => this.templates.push(tpl)).on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); });
        stream.start();
      },
      render: function* (ctx, emitter) {
        const mockForm = { posted_successfully: false, errors: false, email: '' };
        (mockForm as any)['posted_successfully?'] = false;
        ctx.push({ form: mockForm });
        emitter.write('<form action="#" method="POST" class="shopify-mock-form">');
        yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
        emitter.write('</form>');
        ctx.pop();
      }
    });

    liq.registerTag('paginate', {
      parse: function (tagToken, remainTokens) {
        this.templates = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('tag:endpaginate', () => stream.stop()).on('template', (tpl: any) => this.templates.push(tpl)).on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); });
        stream.start();
      },
      render: function* (ctx, emitter) {
        ctx.push({ paginate: { pages: 1, current_page: 1, next: false, previous: false } });
        yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
        ctx.pop();
      }
    });

    liq.registerTag('render', { parse: function (tagToken) { this.args = tagToken.args; }, render: function (ctx, emitter) { emitter.write(`<!-- Mock Render: ${this.args} -->`); } });
    liq.registerTag('include', { parse: function (tagToken) { this.args = tagToken.args; }, render: function (ctx, emitter) { emitter.write(`<!-- Mock Include: ${this.args} -->`); } });
    liq.registerTag('section', { parse: function (tagToken) { this.args = tagToken.args; }, render: function (ctx, emitter) { emitter.write(`<!-- Mock Section: ${this.args} -->`); } });

    liq.registerFilter('img_url', (v) => v || 'https://cdn.shopify.com/s/images/admin/no-image-large.gif');
    liq.registerFilter('asset_url', (v) => v || '');
    liq.registerFilter('stylesheet_tag', (v) => `<link href="${v}" rel="stylesheet" type="text/css" media="all" />`);
    liq.registerFilter('script_tag', (v) => `<script src="${v}"></script>`);
    liq.registerFilter('t', (v) => v);
    liq.registerFilter('json', (v) => JSON.stringify(v));
    liq.registerFilter('handleize', (v) => (v || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    
    liq.registerFilter('money', (v) => '$' + ((v||0)/100).toFixed(2));
    liq.registerFilter('money_with_currency', (v) => '$' + ((v||0)/100).toFixed(2) + ' USD');
    liq.registerFilter('money_without_trailing_zeros', (v) => '$' + ((v||0)/100).toFixed(0));
    liq.registerFilter('money_without_currency', (v) => ((v||0)/100).toFixed(2));
    
    liq.registerFilter('image_url', (v) => v || 'https://cdn.shopify.com/s/images/admin/no-image-large.gif');
    liq.registerFilter('image_tag', (v) => `<img src="${v}" alt="" />`);
    liq.registerFilter('placeholder_svg_tag', (v, className) => `<svg class="${className || ''}" style="background:#eee;width:100%;height:100%;"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20px" fill="#aaa">${v}</text></svg>`);

    liq.registerFilter('color_modify', (v) => v || '');
    liq.registerFilter('color_lighten', (v) => v || '');
    liq.registerFilter('color_darken', (v) => v || '');
    liq.registerFilter('color_brightness', () => 128); 
    liq.registerFilter('color_to_rgb', (v) => v || 'rgb(0,0,0)');
    liq.registerFilter('color_to_hsl', (v) => v || 'hsl(0,0%,0%)');

    return liq;
  }, []);

  useEffect(() => {
    fetchSnippets();
    renderPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSnippets = async () => {
    try {
      const res = await fetch('/api/shopify-snippets');
      const data = await res.json();
      if (res.ok) setSnippets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const syncStateWithSchema = (schema: any, currentState: any) => {
    if (!schema) return currentState;
    
    const newSettings: any = {};
    if (schema.settings) {
      schema.settings.forEach((setting: any) => {
        if (currentState.settings[setting.id] !== undefined) {
          newSettings[setting.id] = currentState.settings[setting.id];
        } else {
          newSettings[setting.id] = getDummyData(setting);
        }
      });
    }
    
    const newBlocks: any[] = [];
    if (schema.presets && schema.presets[0] && schema.presets[0].blocks) {
      const schemaBlocksDef = schema.blocks || [];
      schema.presets[0].blocks.forEach((presetBlock: any, index: number) => {
        const blockDef = schemaBlocksDef.find((b: any) => b.type === presetBlock.type);
        const blockSettings: any = {};
        
        if (blockDef && blockDef.settings) {
          blockDef.settings.forEach((setting: any) => {
            blockSettings[setting.id] = getDummyData(setting);
          });
        }
        if (presetBlock.settings) {
          Object.assign(blockSettings, presetBlock.settings);
        }
        
        const existingBlock = currentState.blocks[index];
        if (existingBlock && existingBlock.type === presetBlock.type) {
          Object.assign(blockSettings, existingBlock.settings);
        }
        
        newBlocks.push({
          type: presetBlock.type,
          settings: blockSettings
        });
      });
    }
    
    return { settings: newSettings, blocks: newBlocks };
  };

  const executeRender = async (codeWithoutSchema: string, context: any) => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    
    let success = false;
    let attempts = 0;
    let renderedHtml = '';

    while (!success && attempts < 10) {
      try {
        renderedHtml = await engine.parseAndRender(codeWithoutSchema, context);
        success = true;
      } catch (error: any) {
        const errorMsg = error.message || '';
        
        const match = errorMsg.match(/tag "([^"]+)" not found/);
        if (match && match[1]) {
          const unknownTag = match[1];
          engine.registerTag(unknownTag, {
            parse: function(tagToken: any) { this.args = tagToken.args; },
            render: function(ctx: any, emitter: any) { emitter.write(`<!-- Mock: ${unknownTag} -->`); }
          });
          attempts++;
          continue;
        }
        
        let title = "Liquid Syntax Error";
        let message = errorMsg;
        let suggestion = "Please check your Liquid code for typos or invalid syntax.";
        
        if (message.includes('unexpected ":"')) {
          suggestion = "You have an extra colon ':' in your Liquid tag. For example, use <code>{% else %}</code> instead of <code>{% else : %}</code>.";
        } else if (message.includes('not closed')) {
          suggestion = "A tag like <code>{% if %}</code> or <code>{% for %}</code> is missing its closing tag (e.g., <code>{% endif %}</code>).";
        } else if (message.includes('expected')) {
          suggestion = "There is a missing character or wrong syntax in one of your liquid tags.";
        }

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Error</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; background-color: #0b0f19; color: #fff; margin: 0; box-sizing: border-box; }
                .error-box { max-width: 600px; margin: 20px auto; background: rgba(239, 68, 68, 0.05); padding: 30px; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                h2 { margin-top: 0; display: flex; align-items: center; gap: 10px; color: #ef4444; font-size: 20px; font-weight: 800; text-transform: uppercase; }
                .code-block { background: #070a13; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #f3f4f6; margin-bottom: 20px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.05); }
                .suggestion { background: rgba(59, 130, 246, 0.05); padding: 18px; border-radius: 12px; color: #93c5fd; font-size: 14px; line-height: 1.6; border: 1px solid rgba(59, 130, 246, 0.15); }
                code { background: rgba(59, 130, 246, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h2>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  ${title}
                </h2>
                <div class="code-block">${message}</div>
                <div class="suggestion">
                  <strong>💡 How to fix:</strong><br><br>
                  ${suggestion}
                </div>
              </div>
            </body>
            </html>
          `);
          iframeDoc.close();
        }
        return;
      }
    }

    if (success) {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Preview</title>
            <style>
              body { margin: 0; padding: 15px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #fff; }
            </style>
          </head>
          <body>
            ${renderedHtml}
          </body>
          </html>
        `);
        iframeDoc.close();
      }
    }
  };

  const renderPreview = useCallback(async (sourceCode: string = code) => {
    const schema = extractSchema(sourceCode);
    setCurrentSchema(schema);
    
    setSectionState(prevState => {
      const newState = syncStateWithSchema(schema, prevState);
      
      const context = {
        ...mockShopifyContext,
        section: {
          id: 'preview-section',
          settings: newState.settings,
          blocks: newState.blocks
        }
      };

      const codeWithoutSchema = sourceCode.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '');
      executeRender(codeWithoutSchema, context);
      
      return newState;
    });
  }, [code, engine]);

  // Debounced editor change
  const handleEditorChange = (value: string) => {
    setCode(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      renderPreview(value);
    }, 1000);
  };

  const updateSettingAndRender = (settingId: string, value: any, blockIndex: number = -1) => {
    setSectionState(prev => {
      const newState = { ...prev };
      if (blockIndex >= 0) {
        newState.blocks[blockIndex].settings[settingId] = value;
      } else {
        newState.settings[settingId] = value;
      }
      
      setTimeout(() => {
        const context = {
          ...mockShopifyContext,
          section: {
            id: 'preview-section',
            settings: newState.settings,
            blocks: newState.blocks
          }
        };
        const codeWithoutSchema = code.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '');
        executeRender(codeWithoutSchema, context);
      }, 0);
      
      return newState;
    });
  };

  // Load a preset template
  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = PRESET_TEMPLATES.find(p => p.id === e.target.value);
    if (selectedPreset) {
      setCode(selectedPreset.code);
      renderPreview(selectedPreset.code);
      toast.success(`${selectedPreset.name} loaded successfully!`);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) {
      toast.error('Please enter a title and some code');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shopify-snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, code, createdBy: displayName, firebaseUid: user?.uid })
      });

      if (res.ok) {
        toast.success('Snippet saved! Pending admin approval.');
        setTitle('');
        fetchSnippets();
      } else {
        toast.error('Failed to save snippet');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving snippet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this snippet?')) return;
    try {
      const res = await fetch(`/api/shopify-snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Snippet deleted successfully');
        setSnippets(prev => prev.filter(s => s._id !== id));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting snippet');
    }
  };

  const copyToClipboard = (text: string, id: string | null = null, msg = 'Code copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    toast.success(msg);
  };

  const getViewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      case 'desktop': default: return 'w-full max-w-full';
    }
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto space-y-6 pb-20 relative text-left">
      
      {/* Header Panel */}
      <div className="w-full glass-panel p-6 lg:p-8 rounded-2xl border border-glass-border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-950/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center gap-4 text-left relative z-10 w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 glow-purple">
            <Code2 className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">Shopify Codes</h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">Interactive theme component IDE & live compiled rendering</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto justify-start md:justify-end">
          
          {/* Preset templates selector */}
          <div className="relative">
            <select
              onChange={handleSelectPreset}
              defaultValue=""
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-glass-border hover:bg-gray-700 text-gray-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer appearance-none pr-8 min-w-[200px]"
            >
              <option value="" disabled>Select Preset Code...</option>
              {PRESET_TEMPLATES.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <FolderCode className="w-4 h-4" />
            </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border ${isSettingsOpen ? 'bg-purple-600 text-white shadow-lg border-purple-500/50 glow-purple' : 'bg-gray-800 text-gray-300 hover:bg-purple-500/20 hover:text-purple-400 border-glass-border'}`}
          >
            <Settings className="w-4 h-4" /> Edit Settings
          </button>
          
          <button 
            onClick={() => copyToClipboard(code, null, 'Code Copied!')}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors border border-glass-border"
          >
            <Share2 className="w-4 h-4" /> Share Code
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[750px] relative">
        
        {/* Settings Sidebar */}
        {isSettingsOpen && (
          <div className="absolute top-0 right-0 lg:left-0 h-full w-full lg:w-[350px] bg-gray-950/95 backdrop-blur-xl border border-glass-border rounded-2xl z-20 shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 text-left">
            <div className="p-4 border-b border-glass-border flex justify-between items-center bg-black/40">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400 animate-spin-slow" /> Section Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white p-1">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
              {/* Main Settings */}
              {currentSchema?.settings?.length > 0 ? (
                <div className="space-y-6">
                  {currentSchema.settings.map((setting: any) => {
                    const val = sectionState.settings[setting.id] ?? '';
                    return (
                      <div key={setting.id} className="space-y-2">
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                          {setting.label || setting.id}
                        </label>
                        {setting.type === 'color' || setting.type === 'color_background' ? (
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={val}
                              onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-glass-border p-0"
                            />
                            <input 
                              type="text"
                              value={val}
                              onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                              className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono"
                            />
                          </div>
                        ) : setting.type === 'textarea' || setting.type === 'richtext' || setting.type === 'html' || setting.type === 'liquid' ? (
                          <textarea
                            value={val}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs min-h-[90px] font-mono leading-relaxed"
                          />
                        ) : setting.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={val === true}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-700 bg-black/50 accent-purple-500 cursor-pointer"
                          />
                        ) : setting.type === 'select' || setting.type === 'radio' ? (
                          <select
                            value={val}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs"
                          >
                            {setting.options?.map((opt: any, i: number) => (
                              <option key={i} value={opt.value || opt}>{opt.label || opt.value || opt}</option>
                            ))}
                          </select>
                        ) : setting.type === 'range' || setting.type === 'number' ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={setting.min || 0}
                              max={setting.max || 100}
                              step={setting.step || 1}
                              value={val}
                              onChange={(e) => updateSettingAndRender(setting.id, Number(e.target.value))}
                              className="flex-1 accent-purple-500"
                            />
                            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded border border-gray-700 min-w-[40px] text-center font-mono">{val}</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-xs">No setting controls identified in schema.</p>
              )}

              {/* Block Settings */}
              {sectionState.blocks.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-glass-border">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Blocks</h3>
                  {sectionState.blocks.map((block, index) => {
                    const blockDef = (currentSchema.blocks || []).find((b: any) => b.type === block.type);
                    if (!blockDef || !blockDef.settings) return null;
                    
                    return (
                      <div key={index} className="p-4 bg-white/5 border border-glass-border rounded-xl space-y-4">
                        <h4 className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">{blockDef.name || block.type}</h4>
                        {blockDef.settings.map((setting: any) => {
                          const val = block.settings[setting.id] ?? '';
                          return (
                            <div key={setting.id} className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                {setting.label || setting.id}
                              </label>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => updateSettingAndRender(setting.id, e.target.value, index)}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Panel */}
        <div className="glass-panel border border-glass-border rounded-2xl flex flex-col shadow-lg overflow-hidden h-[500px] lg:h-full flex-1 min-w-[40%] relative z-10">
          <div className="p-3 border-b border-glass-border flex justify-between items-center bg-gray-950/60">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Liquid Code</h2>
            </div>
            <button 
              onClick={() => renderPreview(code)}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg glow-purple"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Run
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CodeMirror
              value={code}
              height="100%"
              extensions={[html()]}
              theme={dracula}
              onChange={handleEditorChange}
              className="h-full text-xs"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
              }}
            />
          </div>
        </div>

        {/* Fullscreen Backdrop */}
        {isFullscreen && (
          <div 
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md transition-opacity" 
            onClick={() => setIsFullscreen(false)} 
          />
        )}

        {/* Preview Panel */}
        <div className={`glass-panel border border-glass-border flex flex-col shadow-lg overflow-hidden bg-gray-950 transition-all duration-300 ${isFullscreen ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] h-[95vh] w-[95vw] !rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)]' : 'relative z-10 rounded-2xl h-[500px] lg:h-full flex-1'}`}>
          <div className="p-3 border-b border-glass-border flex justify-between items-center bg-gray-900 absolute top-0 w-full z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Live Preview</h2>
            </div>
            
            {/* Responsive Viewport controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-950 border border-glass-border rounded-lg p-0.5">
                <button 
                  onClick={() => setViewMode('desktop')} 
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Desktop"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setViewMode('tablet')} 
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'tablet' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Tablet"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setViewMode('mobile')} 
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-glass-border rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full pt-[48px] relative bg-gray-950 flex justify-center items-start overflow-hidden">
            <div className={`h-full ${getViewWidth()} bg-[#0b0f19] shadow-2xl transition-all duration-300 ease-in-out origin-top border-x border-glass-border`}>
              <iframe
                ref={iframeRef}
                title="Shopify Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Code Controls */}
      <div className="glass-panel p-5 border border-glass-border rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-4 bg-gray-950/40">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this snippet (e.g., Custom Header Accordion)"
          className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors w-full text-sm"
        />
        <button
          onClick={handleSave}
          disabled={submitting}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0 shadow-lg glow-purple"
        >
          <Save className="w-5 h-5" />
          {submitting ? 'Saving...' : 'Submit to Library'}
        </button>
      </div>

      {/* Community Library Section */}
      <div className="pt-6">
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <Laptop className="w-5 h-5 text-purple-400" />
          Community Library Previews
        </h2>
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading snippets...</div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-16 glass-panel border border-glass-border rounded-xl">
            <Code2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-300">No approved codes yet</h2>
            <p className="text-sm text-gray-500">Be the first to submit a Shopify snippet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {snippets.map((snippet) => (
              <SnippetCard
                key={snippet._id}
                snippet={snippet}
                onLoad={(loadedCode) => {
                  setCode(loadedCode);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  toast.success('Loaded into Editor!');
                  renderPreview(loadedCode);
                }}
                onCopy={(snippetCode, id) => copyToClipboard(snippetCode, id, 'Code copied!')}
                onDelete={handleDelete}
                copiedId={copiedId}
                engine={engine}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
