'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Settings, 
  Sparkles, 
  Layers, 
  Code, 
  Play, 
  Info, 
  ChevronRight, 
  RefreshCw, 
  FolderOpen, 
  Eye, 
  BookOpen,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface SchemaSetting {
  id: string;
  type: 'text' | 'textarea' | 'richtext' | 'image_picker' | 'product' | 'collection' | 'color' | 'range' | 'checkbox' | 'select' | 'number';
  label: string;
  idName: string;
  info: string;
  defaultVal: any;
  // Range specifics
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // Select specifics
  options?: { label: string; value: string }[];
}

interface SchemaBlock {
  id: string;
  type: string;
  name: string;
  limit?: number;
  settings: SchemaSetting[];
}

interface PresetTemplate {
  name: string;
  description: string;
  icon: any;
  settings: SchemaSetting[];
  blocks: SchemaBlock[];
  maxBlocks?: number;
}

export default function SchemaBuilderPage() {
  const store = useWorkspaceStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'liquid' | 'preview' | 'usage'>('liquid');
  
  // Section Config
  const [sectionName, setSectionName] = useState('Hero Showcase Banner');
  const [sectionTag, setSectionTag] = useState<'section' | 'div'>('section');
  const [sectionClass, setSectionClass] = useState('shopify-section-hero');
  const [maxBlocks, setMaxBlocks] = useState<number>(6);
  const [enableCssSchema, setEnableCssSchema] = useState<boolean>(false);
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'visual' | 'debug'>('visual');
  const [faqOpenItems, setFaqOpenItems] = useState<Record<string, boolean>>({});
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  
  // Active Schema items
  const [settings, setSettings] = useState<SchemaSetting[]>([]);
  const [blocks, setBlocks] = useState<SchemaBlock[]>([]);
  
  // Playground State (stores values entered by the developer inside the mock customizer)
  const [playgroundValues, setPlaygroundValues] = useState<Record<string, any>>({});
  const [playgroundBlocks, setPlaygroundBlocks] = useState<{ id: string; type: string; values: Record<string, any> }[]>([]);

  // Hydrate workspace store
  useEffect(() => {
    store.hydrate();
    // Load saved schema draft if it exists in localStorage
    const saved = localStorage.getItem('code_commandos_schema_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sectionName) setSectionName(parsed.sectionName);
        if (parsed.sectionTag) setSectionTag(parsed.sectionTag);
        if (parsed.sectionClass) setSectionClass(parsed.sectionClass);
        if (parsed.maxBlocks) setMaxBlocks(parsed.maxBlocks);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.blocks) setBlocks(parsed.blocks);
        if (parsed.enableCssSchema !== undefined) setEnableCssSchema(parsed.enableCssSchema);
      } catch (e) {
        console.error('Failed to parse schema draft', e);
      }
    }
  }, []);

  // Save schema draft on modification
  useEffect(() => {
    const draft = { sectionName, sectionTag, sectionClass, maxBlocks, settings, blocks, enableCssSchema };
    localStorage.setItem('code_commandos_schema_draft', JSON.stringify(draft));
  }, [sectionName, sectionTag, sectionClass, maxBlocks, settings, blocks, enableCssSchema]);

  // Synchronize playground default values when settings/blocks layout structure changes
  useEffect(() => {
    const initialVals: Record<string, any> = {};
    settings.forEach(set => {
      initialVals[set.idName] = playgroundValues[set.idName] !== undefined ? playgroundValues[set.idName] : set.defaultVal;
    });
    setPlaygroundValues(initialVals);
  }, [settings]);

  // Quick Preset Templates
  const PRESET_TEMPLATES: PresetTemplate[] = [
    {
      name: 'Hero Banner',
      description: 'Image overlay background banner with heading, subheading text, button link, and custom height controls.',
      icon: Sparkles,
      settings: [
        { id: '1', type: 'image_picker', label: 'Background Image', idName: 'background_image', info: 'Upload section background image', defaultVal: '' },
        { id: '2', type: 'text', label: 'Banner Heading Title', idName: 'heading_title', info: 'Main banner heading text', defaultVal: 'Elevate Your Store Visuals' },
        { id: '3', type: 'textarea', label: 'Subheading Text', idName: 'subheading_text', info: 'Subtext displayed below the title', defaultVal: 'Build premium responsive Shopify custom themes with Code Commandos tools offline and database-free.' },
        { id: '4', type: 'color', label: 'Heading Text Color', idName: 'heading_color', info: 'Choose heading text hex color code', defaultVal: '#ffffff' },
        { id: '5', type: 'range', label: 'Banner Overlay Opacity', idName: 'overlay_opacity', info: 'Subtle black gradient overlay opacity', defaultVal: 40, min: 0, max: 90, step: 5, unit: '%' },
        { id: '6', type: 'text', label: 'Primary Action Button Label', idName: 'button_label', info: 'Button text', defaultVal: 'Get Started Now' },
        { id: '7', type: 'product', label: 'Feature Product Link', idName: 'featured_product', info: 'Choose product to link action button to', defaultVal: '' },
        { id: '8', type: 'checkbox', label: 'Enable Full Screen Height', idName: 'full_height', info: 'Force banner section to take full viewport screen height', defaultVal: true }
      ],
      blocks: [],
      maxBlocks: 0
    },
    {
      name: 'FAQ Accordion',
      description: 'Expandable list of questions and answers. Powered by customizable nested blocks.',
      icon: Layers,
      settings: [
        { id: 'faq-title', type: 'text', label: 'FAQ Accordion Title', idName: 'faq_title', info: 'Section title displayed at the top', defaultVal: 'Frequently Asked Questions' },
        { id: 'faq-bg', type: 'color', label: 'Background Fill Color', idName: 'background_fill', info: 'Color for section backdrop', defaultVal: '#090d16' },
        { id: 'faq-multi', type: 'checkbox', label: 'Allow Multiple Accordions Open', idName: 'multi_open', info: 'Keep other questions open when a new one is selected', defaultVal: false }
      ],
      blocks: [
        {
          id: 'faq-item-block',
          type: 'faq_item',
          name: 'FAQ Question Accordion Block',
          limit: 12,
          settings: [
            { id: 'faq-q', type: 'text', label: 'Question Text', idName: 'question', info: 'Write accordion header question text', defaultVal: 'How do I install the Liquid schema template code?' },
            { id: 'faq-a', type: 'textarea', label: 'Answer Content', idName: 'answer', info: 'Write detail paragraph response', defaultVal: 'Simply copy the generated {% schema %} block at the bottom of your liquid section file and insert it, replacing the old block.' }
          ]
        }
      ],
      maxBlocks: 12
    },
    {
      name: 'Client Testimonials Carousel',
      description: 'Horizontal card grid showcasing custom client reviews, avatar images, and quote messages.',
      icon: Eye,
      settings: [
        { id: 'test-h', type: 'text', label: 'Section Heading', idName: 'carousel_heading', info: 'Header text', defaultVal: 'What Clients Say About Refayet' },
        { id: 'test-stars', type: 'checkbox', label: 'Show Star Badge Icons', idName: 'show_stars', info: 'Display 5 golden rating stars automatically', defaultVal: true },
        { id: 'test-color', type: 'color', label: 'Card Border Highlight Color', idName: 'border_color', info: 'Cards accent border highlight', defaultVal: '#10b981' }
      ],
      blocks: [
        {
          id: 'test-block',
          type: 'testimonial_card',
          name: 'Client Testimony Review Block',
          limit: 8,
          settings: [
            { id: 't-author', type: 'text', label: 'Client Name Label', idName: 'client_name', info: 'Name of reviewer', defaultVal: 'John Miller' },
            { id: 't-role', type: 'text', label: 'Client Position', idName: 'client_title', info: 'Company or role title', defaultVal: 'CEO, Fitestore Inc' },
            { id: 't-photo', type: 'image_picker', label: 'Client Avatar', idName: 'client_avatar', info: 'Optional portrait photo', defaultVal: '' },
            { id: 't-quote', type: 'textarea', label: 'Feedback Quote Message', idName: 'client_feedback_quote', info: 'Testimonial quote text', defaultVal: 'Excellent work from Refayet! Visual layouts are pixel perfect, clean, and highly premium.' }
          ]
        }
      ],
      maxBlocks: 8
    },
    {
      name: 'Feature Grid Showcase',
      description: '3-column grid featuring store benefits or services with icons, titles, and descriptions.',
      icon: Layers,
      settings: [
        { id: 'grid-h', type: 'text', label: 'Grid Title Heading', idName: 'grid_heading', info: 'Section main title', defaultVal: 'Why Developers Choose Us' },
        { id: 'grid-bg', type: 'color', label: 'Backdrop Fill Color', idName: 'grid_background', info: 'Color for section backdrop', defaultVal: '#0a0f1d' },
        { id: 'grid-cols', type: 'range', label: 'Columns Count', idName: 'grid_columns', info: 'Choose layout columns', defaultVal: 3, min: 2, max: 4, step: 1 }
      ],
      blocks: [
        {
          id: 'grid-item-block',
          type: 'grid_item',
          name: 'Feature Grid Card Block',
          limit: 8,
          settings: [
            { id: 'gi-t', type: 'text', label: 'Feature Title', idName: 'feature_title', info: 'Card header text', defaultVal: 'Superfast Build' },
            { id: 'gi-d', type: 'textarea', label: 'Feature Description', idName: 'feature_desc', info: 'Card detail body paragraph', defaultVal: 'Compiles Liquid code in milliseconds offline without databases.' }
          ]
        }
      ],
      maxBlocks: 8
    },
    {
      name: 'Interactive Video Hero',
      description: 'Full-width cinematic background video block with text overlays, autoplay, and audio toggles.',
      icon: Play,
      settings: [
        { id: 'v-url', type: 'text', label: 'Video Source URL', idName: 'video_source_url', info: 'Enter MP4 or YouTube video link', defaultVal: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4' },
        { id: 'v-h', type: 'text', label: 'Overlay Hero Heading', idName: 'video_heading', info: 'Cinematic title text overlay', defaultVal: 'Cinematic Video Background' },
        { id: 'v-mute', type: 'checkbox', label: 'Autoplay and Muted', idName: 'video_muted', info: 'Loop and autoplay muted video automatically', defaultVal: true },
        { id: 'v-color', type: 'color', label: 'Overlay Text Tint', idName: 'video_text_color', info: 'Hex text color', defaultVal: '#ffffff' }
      ],
      blocks: [],
      maxBlocks: 0
    },
    {
      name: 'Newsletter Subscription Banner',
      description: 'Newsletter email capture form with marketing opt-in boxes and customizable success pages.',
      icon: Sparkles,
      settings: [
        { id: 'n-title', type: 'text', label: 'Newsletter Heading', idName: 'newsletter_title', info: 'Form title text', defaultVal: 'Subscribe To Code Commandos' },
        { id: 'n-text', type: 'textarea', label: 'Marketing Subtext', idName: 'newsletter_subtext', info: 'Provide opt-in offer or descriptive text', defaultVal: 'Get weekly updates on premium Shopify section mockups and schema builder updates.' },
        { id: 'n-btn', type: 'text', label: 'Subscribe Button Text', idName: 'newsletter_button_text', info: 'Button label', defaultVal: 'Join Community' },
        { id: 'n-terms', type: 'checkbox', label: 'Require Terms Agreement', idName: 'require_terms', info: 'Show checkbox for privacy consent', defaultVal: true }
      ],
      blocks: [],
      maxBlocks: 0
    }
  ];

  // Helper to load presets
  const handleLoadPreset = (preset: PresetTemplate) => {
    setSectionName(preset.name);
    setSectionClass(`shopify-section-${preset.name.toLowerCase().replace(/\s+/g, '-')}`);
    setSettings(preset.settings);
    setBlocks(preset.blocks);
    if (preset.maxBlocks !== undefined) setMaxBlocks(preset.maxBlocks);
    
    // Clear playground blocks and reset values
    setPlaygroundBlocks([]);
    const initialVals: Record<string, any> = {};
    preset.settings.forEach(set => {
      initialVals[set.idName] = set.defaultVal;
    });
    setPlaygroundValues(initialVals);
    
    store.logActivity('Preset Schema Loaded', 'template', `Loaded preset schema structure: ${preset.name}`);
  };

  // Schema setting handlers
  const handleAddSetting = () => {
    const id = Math.random().toString(36).substring(2, 7);
    const newSet: SchemaSetting = {
      id,
      type: 'text',
      label: `Setting Label ${settings.length + 1}`,
      idName: `setting_id_${id}`,
      info: 'Enter information help text for Shopify dashboard editor',
      defaultVal: ''
    };
    setSettings([...settings, newSet]);
  };

  const handleUpdateSetting = (id: string, updated: Partial<SchemaSetting>) => {
    setSettings(settings.map(set => {
      if (set.id === id) {
        const result = { ...set, ...updated };
        // Clean ID string to follow snake_case convention
        if (updated.idName) {
          result.idName = updated.idName
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_');
        }
        // Sync defaultVal type conversions
        if (updated.type) {
          if (updated.type === 'checkbox') result.defaultVal = false;
          else if (updated.type === 'range') result.defaultVal = 10;
          else if (updated.type === 'color') result.defaultVal = '#ffffff';
          else result.defaultVal = '';
        }
        return result;
      }
      return set;
    }));
  };

  const handleDeleteSetting = (id: string) => {
    setSettings(settings.filter(set => set.id !== id));
  };

  // Block handlers
  const handleAddBlock = () => {
    const id = Math.random().toString(36).substring(2, 7);
    const newBlock: SchemaBlock = {
      id,
      type: `block_type_${id}`,
      name: `Block Title ${blocks.length + 1}`,
      limit: 6,
      settings: []
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (id: string, updated: Partial<SchemaBlock>) => {
    setBlocks(blocks.map(blk => {
      if (blk.id === id) {
        const result = { ...blk, ...updated };
        if (updated.type) {
          result.type = updated.type
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_');
        }
        return result;
      }
      return blk;
    }));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter(blk => blk.id !== id));
  };

  // Nest setting inside block
  const handleAddBlockSetting = (blockId: string) => {
    setBlocks(blocks.map(blk => {
      if (blk.id === blockId) {
        const id = Math.random().toString(36).substring(2, 7);
        return {
          ...blk,
          settings: [
            ...blk.settings,
            {
              id,
              type: 'text',
              label: `Block Setting ${blk.settings.length + 1}`,
              idName: `block_setting_${id}`,
              info: 'Block setting info description',
              defaultVal: ''
            }
          ]
        };
      }
      return blk;
    }));
  };

  const handleUpdateBlockSetting = (blockId: string, settingId: string, updated: Partial<SchemaSetting>) => {
    setBlocks(blocks.map(blk => {
      if (blk.id === blockId) {
        return {
          ...blk,
          settings: blk.settings.map(set => {
            if (set.id === settingId) {
              const res = { ...set, ...updated };
              if (updated.idName) {
                res.idName = updated.idName
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, '_')
                  .replace(/_+/g, '_');
              }
              return res;
            }
            return set;
          })
        };
      }
      return blk;
    }));
  };

  const handleDeleteBlockSetting = (blockId: string, settingId: string) => {
    setBlocks(blocks.map(blk => {
      if (blk.id === blockId) {
        return {
          ...blk,
          settings: blk.settings.filter(set => set.id !== settingId)
        };
      }
      return blk;
    }));
  };

  // Compile JSON Schema string
  const compiledSchemaJson = useMemo(() => {
    let formattedSettings = settings.map(set => {
      const base: Record<string, any> = {
        type: set.type,
        id: set.idName,
        label: set.label,
        default: set.defaultVal
      };
      if (set.info) base.info = set.info;
      
      if (set.type === 'range') {
        base.min = set.min !== undefined ? set.min : 0;
        base.max = set.max !== undefined ? set.max : 100;
        base.step = set.step !== undefined ? set.step : 1;
        if (set.unit) base.unit = set.unit;
      }
      if (set.type === 'select' && set.options) {
        base.options = set.options;
      }
      return base;
    });

    if (enableCssSchema) {
      formattedSettings = [
        ...formattedSettings,
        { type: 'header', content: 'Section Spacing & Styling' },
        { type: 'range', id: 'padding_top', label: 'Padding Top', default: 36, min: 0, max: 100, step: 4, unit: 'px' },
        { type: 'range', id: 'padding_bottom', label: 'Padding Bottom', default: 36, min: 0, max: 100, step: 4, unit: 'px' },
        { type: 'color', id: 'section_background', label: 'Section Background Color', default: '#111827' },
        { type: 'range', id: 'max_width', label: 'Container Max Width', default: 1200, min: 800, max: 1600, step: 50, unit: 'px' }
      ];
    }

    const formattedBlocks = blocks.map(blk => {
      const baseBlock: Record<string, any> = {
        type: blk.type,
        name: blk.name,
        settings: blk.settings.map(set => {
          const sBase: Record<string, any> = {
            type: set.type,
            id: set.idName,
            label: set.label,
            default: set.defaultVal
          };
          if (set.info) sBase.info = set.info;
          if (set.type === 'range') {
            sBase.min = set.min !== undefined ? set.min : 0;
            sBase.max = set.max !== undefined ? set.max : 100;
            sBase.step = set.step !== undefined ? set.step : 1;
            if (set.unit) sBase.unit = set.unit;
          }
          if (set.type === 'select' && set.options) {
            sBase.options = set.options;
          }
          return sBase;
        })
      };
      if (blk.limit) baseBlock.limit = blk.limit;
      return baseBlock;
    });

    const defaultPresets = [{
      name: sectionName,
      category: 'Custom Content'
    }];

    const schemaObj: Record<string, any> = {
      name: sectionName,
      tag: sectionTag,
      class: sectionClass,
      settings: formattedSettings
    };

    if (formattedBlocks.length > 0) {
      schemaObj.blocks = formattedBlocks;
      if (maxBlocks) schemaObj.max_blocks = maxBlocks;
    }

    schemaObj.presets = defaultPresets;

    return JSON.stringify(schemaObj, null, 2);
  }, [sectionName, sectionTag, sectionClass, maxBlocks, settings, blocks, enableCssSchema]);

  // Full Liquid Code output template
  const fullLiquidCode = useMemo(() => {
    const cssStyleBlock = enableCssSchema ? `{%- style -%}
  .shopify-section-{{ section.id }} {
    padding-top: {{ section.settings.padding_top }}px;
    padding-bottom: {{ section.settings.padding_bottom }}px;
    background-color: {{ section.settings.section_background }};
  }
  .shopify-section-{{ section.id }} .container-wrapper {
    max-width: {{ section.settings.max_width }}px;
    margin: 0 auto;
    padding-left: 15px;
    padding-right: 15px;
  }
{%- endstyle -%}

` : '';

    return `${cssStyleBlock}<!-- Visual Section Template generated by Code Commandos Hub -->
<${sectionTag} class="${sectionClass} shopify-section-{{ section.id }}">
  
  <!-- Content markup -->
  <div class="container-wrapper">
    <!-- settings test outputs -->
    ${settings.length > 0 ? settings.map(s => {
      if (s.type === 'image_picker') {
        return `{% if section.settings.${s.idName} != blank %}
      <img src="{{ section.settings.${s.idName} | image_url: width: 800 }}" alt="{{ section.settings.${s.idName}.alt }}" class="banner-img" />
    {% endif %}`;
      }
      return `<h2>{{ section.settings.${s.idName} }}</h2>`;
    }).join('\n    ') : '<!-- Add schema settings keys here -->'}
    
    <!-- blocks render loops -->
    ${blocks.length > 0 ? blocks.map(b => {
      return `{% for block in section.blocks %}
      {% case block.type %}
        {% when '${b.type}' %}
          <div class="block-card" {{ block.shopify_attributes }}>
            ${b.settings.length > 0 ? b.settings.map(bs => {
              return `<span>{{ block.settings.${bs.idName} }}</span>`;
            }).join('\n            ') : '<!-- Block settings -->'}
          </div>
      {% endcase %}
    {% endfor %}`;
    }).join('\n    ') : '<!-- Add block elements here -->'}
  </div>

</${sectionTag}>

{% schema %}
${compiledSchemaJson}
{% endschema %}`;
  }, [sectionTag, sectionClass, settings, blocks, compiledSchemaJson, enableCssSchema]);

  // Handle Copy to clipboard
  const handleCopySchema = () => {
    navigator.clipboard.writeText(fullLiquidCode);
    setCopied(true);
    store.logActivity('Section Schema Copied', 'template', `Copied: ${sectionName} liquid code`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy only JSON schema block
  const handleCopySchemaOnly = () => {
    navigator.clipboard.writeText(compiledSchemaJson);
    setCopiedJson(true);
    store.logActivity('Schema JSON Copied', 'template', `Copied only the JSON configuration for: ${sectionName}`);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Trigger highlighting on setting cards
  const triggerHighlightField = (idName: string) => {
    // Find setting with this idName
    const setting = settings.find(s => s.idName === idName);
    if (setting) {
      setHighlightedField(idName);
      const el = document.getElementById(`setting-card-${setting.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => setHighlightedField(null), 2000);
    }
  };

  // Magic Generator content filler
  const handleMagicGenerate = () => {
    const themes = [
      {
        name: 'NeoTech AI Studio',
        tag: 'section',
        class: 'shopify-section-neotech-ai',
        settings: {
          heading_title: 'Unleash Quantum Computing',
          subheading_text: 'Accelerate your development cycle with agentic workflows and premium offline AI compilers.',
          heading_color: '#10b981',
          overlay_opacity: 50,
          button_label: 'Explore AI Engine',
          faq_title: 'NeoTech FAQ Hub',
          carousel_heading: 'Innovation Partner Reviews',
          border_color: '#10b981',
          section_background: '#040815',
          padding_top: 60,
          padding_bottom: 60,
          max_width: 1100
        },
        blocks: [
          {
            type: 'faq_item',
            values: {
              question: 'How fast is the offline compiler?',
              answer: 'It executes within milliseconds using pre-compiled rust bin hooks and local WebAssembly caches.'
            }
          },
          {
            type: 'faq_item',
            values: {
              question: 'Does it support Shopify CLI?',
              answer: 'Yes, full compatibility with Shopify CLI 3.x is guaranteed out of the box.'
            }
          },
          {
            type: 'testimonial_card',
            values: {
              client_name: 'Dr. Evelyn Vance',
              client_title: 'Director of AI, Cyberdyne',
              client_feedback_quote: 'Code Commandos tools have completely revamped how our team builds Shopify custom section settings.'
            }
          },
          {
            type: 'testimonial_card',
            values: {
              client_name: 'Marcus Brody',
              client_title: 'Lead Architect, Shopist',
              client_feedback_quote: 'Extremely fast schema compilation. The Visual Layout feature is absolutely brilliant!'
            }
          }
        ]
      },
      {
        name: 'Vogue Essentials Boutique',
        tag: 'div',
        class: 'shopify-section-vogue-boutique',
        settings: {
          heading_title: 'Summer Solstice Collection',
          subheading_text: 'Discover curated designer apparel handcrafted from 100% organic cotton and premium sustainable fibers.',
          heading_color: '#f59e0b',
          overlay_opacity: 20,
          button_label: 'Shop The Collection',
          faq_title: 'Shipping & Returns Support',
          carousel_heading: 'Customer Love Stories',
          border_color: '#f59e0b',
          section_background: '#1c1917',
          padding_top: 48,
          padding_bottom: 48,
          max_width: 1200
        },
        blocks: [
          {
            type: 'faq_item',
            values: {
              question: 'Is worldwide shipping available?',
              answer: 'Yes, we ship to over 150 countries with carbon-neutral shipping options.'
            }
          },
          {
            type: 'faq_item',
            values: {
              question: 'What is your return policy?',
              answer: 'We offer a 30-day hassle-free return window for all unused, tags-on items.'
            }
          },
          {
            type: 'testimonial_card',
            values: {
              client_name: 'Sophia Thorne',
              client_title: 'Fashion Editor, Trendset',
              client_feedback_quote: 'Stunning visual layout and premium typography options. The section looks so high-end!'
            }
          },
          {
            type: 'testimonial_card',
            values: {
              client_name: 'Liam Sterling',
              client_title: 'Founder, Sterling Threads',
              client_feedback_quote: 'Excellent design structure. It loaded perfectly on our Dawn theme without layout shifts.'
            }
          }
        ]
      },
      {
        name: 'FitFlow Wellness Hub',
        tag: 'section',
        class: 'shopify-section-fitflow',
        settings: {
          heading_title: 'Mindful Movement Practices',
          subheading_text: 'Align your body and mind with our professional yoga, pilates, and guided meditation instructors.',
          heading_color: '#6366f1',
          overlay_opacity: 35,
          button_label: 'Book a Class',
          faq_title: 'FitFlow Membership FAQ',
          carousel_heading: 'What Our Yogis Say',
          border_color: '#6366f1',
          section_background: '#0f172a',
          padding_top: 80,
          padding_bottom: 80,
          max_width: 1000
        },
        blocks: [
          {
            type: 'faq_item',
            values: {
              question: 'Are classes suitable for beginners?',
              answer: 'Absolutely! We offer multi-level instructions and options for every pose to suit your experience.'
            }
          },
          {
            type: 'faq_item',
            values: {
              question: 'What equipment do I need?',
              answer: 'Just a yoga mat and comfortable attire. We provide blocks, straps, and bolsters in the studio.'
            }
          },
          {
            type: 'testimonial_card',
            values: {
              client_name: 'Elena Rostova',
              client_title: 'Yoga Practitioner',
              client_feedback_quote: 'The section layout feels incredibly peaceful and organized. Just like our studio!'
            }
          },
          {
            type: 'testimonial_card',
            values: {
              client_name: 'Daniel Kim',
              client_title: 'Pilates Instructor',
              client_feedback_quote: 'Great responsiveness on both mobile and tablet. Extremely easy for clients to browse and book.'
            }
          }
        ]
      }
    ];

    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    setSectionName(randomTheme.name);
    setSectionTag(randomTheme.tag as 'section' | 'div');
    setSectionClass(randomTheme.class);
    
    // Sync settings values
    const newVals = { ...playgroundValues };
    Object.entries(randomTheme.settings).forEach(([k, v]) => {
      newVals[k] = v;
    });
    setPlaygroundValues(newVals);

    // Load matching playground blocks with random IDs
    const newPlaygroundBlocks = randomTheme.blocks.map(b => ({
      id: Math.random().toString(36).substring(2, 7),
      type: b.type,
      values: b.values
    }));
    setPlaygroundBlocks(newPlaygroundBlocks);

    store.logActivity('Magic Schema Generated', 'template', `Applied magic generator theme: ${randomTheme.name}`);
  };

  // Download Liquid Section File
  const handleDownloadLiquid = () => {
    const filename = `${sectionName.toLowerCase().replace(/\s+/g, '-')}.liquid`;
    const element = document.createElement('a');
    const file = new Blob([fullLiquidCode], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    store.logActivity('Section Downloaded', 'download', `Downloaded Liquid file: ${filename}`);
  };

  // Import Shopify Section Schema JSON
  const handleImportSchema = () => {
    setImportError('');
    try {
      let rawJson = importJsonText.trim();
      
      // Attempt to strip Liquid tags if user pasted them
      if (rawJson.includes('{% schema %}')) {
        const match = rawJson.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
        if (match) {
          rawJson = match[1].trim();
        }
      }
      
      const parsed = JSON.parse(rawJson);
      if (!parsed.name) {
        throw new Error('Schema JSON must contain a "name" attribute.');
      }

      setSectionName(parsed.name);
      setSectionTag(parsed.tag || 'section');
      setSectionClass(parsed.class || `shopify-section-${parsed.name.toLowerCase().replace(/\s+/g, '-')}`);
      if (parsed.max_blocks) setMaxBlocks(parsed.max_blocks);

      const parsedSettings: SchemaSetting[] = (parsed.settings || []).map((s: any) => ({
        id: Math.random().toString(36).substring(2, 7),
        type: s.type || 'text',
        label: s.label || s.id || 'Setting Label',
        idName: s.id || 'setting_id',
        info: s.info || '',
        defaultVal: s.default !== undefined ? s.default : (s.type === 'checkbox' ? false : s.type === 'range' ? 0 : ''),
        min: s.min,
        max: s.max,
        step: s.step,
        unit: s.unit,
        options: s.options
      }));
      setSettings(parsedSettings);

      const parsedBlocks: SchemaBlock[] = (parsed.blocks || []).map((b: any) => ({
        id: Math.random().toString(36).substring(2, 7),
        type: b.type || 'block_type',
        name: b.name || b.type || 'Block',
        limit: b.limit,
        settings: (b.settings || []).map((bs: any) => ({
          id: Math.random().toString(36).substring(2, 7),
          type: bs.type || 'text',
          label: bs.label || bs.id || 'Block Setting Label',
          idName: bs.id || 'block_setting_id',
          info: bs.info || '',
          defaultVal: bs.default !== undefined ? bs.default : (bs.type === 'checkbox' ? false : bs.type === 'range' ? 0 : ''),
          min: bs.min,
          max: bs.max,
          step: bs.step,
          unit: bs.unit,
          options: bs.options
        }))
      }));
      setBlocks(parsedBlocks);

      // Reset mock editor customizer blocks
      setPlaygroundBlocks([]);
      const initialVals: Record<string, any> = {};
      parsedSettings.forEach(s => {
        initialVals[s.idName] = s.defaultVal;
      });
      setPlaygroundValues(initialVals);

      setImportJsonText('');
      setImportModalOpen(false);
      store.logActivity('Schema JSON Imported', 'template', `Loaded custom schema settings: ${parsed.name}`);
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON formatting. Please check syntax.');
    }
  };

  // Add block to mock customizer list
  const handleAddPlaygroundBlock = (blockType: string) => {
    const blkDef = blocks.find(b => b.type === blockType);
    if (!blkDef) return;

    const initialVals: Record<string, any> = {};
    blkDef.settings.forEach(set => {
      initialVals[set.idName] = set.defaultVal;
    });

    const newBlk = {
      id: Math.random().toString(36).substring(2, 7),
      type: blockType,
      values: initialVals
    };
    setPlaygroundBlocks([...playgroundBlocks, newBlk]);
  };

  const handleUpdatePlaygroundBlockValue = (blockId: string, settingId: string, val: any) => {
    setPlaygroundBlocks(playgroundBlocks.map(pb => {
      if (pb.id === blockId) {
        return {
          ...pb,
          values: { ...pb.values, [settingId]: val }
        };
      }
      return pb;
    }));
  };

  const handleDeletePlaygroundBlock = (blockId: string) => {
    setPlaygroundBlocks(playgroundBlocks.filter(pb => pb.id !== blockId));
  };

  const getValidationStats = () => {
    // 1. Check duplicate IDs
    const allIds = settings.map(s => s.idName);
    if (enableCssSchema) {
      allIds.push('padding_top', 'padding_bottom', 'section_background', 'max_width');
    }
    blocks.forEach(b => {
      allIds.push(b.type);
      b.settings.forEach(bs => allIds.push(bs.idName));
    });
    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index && id !== '');
    const hasDuplicates = duplicates.length > 0;

    // 2. Check empty IDs
    const hasEmptyIds = settings.some(s => !s.idName) || blocks.some(b => !b.type || b.settings.some(bs => !bs.idName));

    // 3. Size check
    let sizeBytes = 0;
    try {
      sizeBytes = new Blob([compiledSchemaJson]).size;
    } catch (e) {}
    const sizeKb = (sizeBytes / 1024).toFixed(2);

    // 4. Validate JSON structure
    let isValidJson = false;
    let jsonError = '';
    try {
      JSON.parse(compiledSchemaJson);
      isValidJson = true;
    } catch (err: any) {
      jsonError = err.message;
    }

    return {
      hasDuplicates,
      duplicates: Array.from(new Set(duplicates)),
      hasEmptyIds,
      sizeKb,
      isValidJson,
      jsonError,
      settingsCount: settings.length + (enableCssSchema ? 4 : 0),
      blocksCount: blocks.length
    };
  };

  // Render visual interactive preview matching settings and blocks
  const renderVisualSectionPreview = () => {
    // Spacing settings lookup
    const hasStyling = enableCssSchema;
    const paddingTop = hasStyling ? (playgroundValues['padding_top'] !== undefined ? `${playgroundValues['padding_top']}px` : '36px') : '24px';
    const paddingBottom = hasStyling ? (playgroundValues['padding_bottom'] !== undefined ? `${playgroundValues['padding_bottom']}px` : '36px') : '24px';
    const sectionBg = hasStyling ? (playgroundValues['section_background'] || '#111827') : '#0b0f19';
    const maxWidth = hasStyling ? (playgroundValues['max_width'] !== undefined ? `${playgroundValues['max_width']}px` : '1200px') : '100%';

    // Custom CSS style for mockup
    const sectionStyle = {
      paddingTop,
      paddingBottom,
      backgroundColor: sectionBg,
      color: '#f3f4f6',
      transition: 'all 0.3s ease'
    };

    // Helper to find settings by partial key
    const findSettingVal = (keywords: string[]) => {
      const set = settings.find(s => keywords.some(k => s.idName.includes(k)));
      return set ? playgroundValues[set.idName] : undefined;
    };

    // Extract dynamic title, description, button details
    const titleVal = findSettingVal(['heading', 'title', 'name']) || sectionName;
    const descVal = findSettingVal(['text', 'desc', 'subheading', 'paragraph']);
    const buttonLabel = findSettingVal(['button_label', 'btn_text', 'action_label']);
    const textColor = findSettingVal(['color', 'text_color', 'heading_color']) || '#ffffff';
    const hasFullHeight = findSettingVal(['full_height', 'fullscreen']);
    const imagePickerVal = settings.find(s => s.type === 'image_picker');

    // Is it a predefined preset style?
    const isHero = settings.some(s => s.idName === 'heading_title') && settings.some(s => s.idName === 'button_label');
    const isFAQ = blocks.some(b => b.type === 'faq_item');
    const isTestimonials = blocks.some(b => b.type === 'testimonial_card');
    const isGrid = settings.some(s => s.idName === 'grid_heading') || blocks.some(b => b.type === 'grid_item');
    const isVideo = settings.some(s => s.idName === 'video_source_url');
    const isNewsletter = settings.some(s => s.idName === 'newsletter_title');

    const toggleFaq = (id: string) => {
      const isMulti = playgroundValues['multi_open'] === true;
      if (isMulti) {
        setFaqOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
      } else {
        setFaqOpenItems(prev => ({ [id]: !prev[id] }));
      }
    };

    const clickToHighlight = (keywords: string[]) => {
      const set = settings.find(s => keywords.some(k => s.idName.includes(k)));
      if (set) {
        triggerHighlightField(set.idName);
      }
    };

    return (
      <div 
        className="w-full rounded-xl overflow-hidden border border-white/5 flex flex-col font-sans transition-all relative group/preview"
        style={sectionStyle}
      >
        {/* Hover overlay hint */}
        <div className="absolute top-2 right-2 text-[8px] bg-black/60 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none select-none z-30 uppercase tracking-widest font-mono">
          Interactive Live Preview (Click Texts to Edit)
        </div>

        {/* Dynamic Inner Container wrapper */}
        <div 
          className="mx-auto px-4 w-full"
          style={{ maxWidth }}
        >
          {/* 1. HERO BANNER MOCKUP RENDER */}
          {isHero ? (
            <div className={`flex flex-col items-center text-center space-y-4 py-8 relative rounded-xl overflow-hidden ${hasFullHeight ? 'min-h-[220px]' : ''} justify-center`}>
              {/* Mock background image */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center transition-all bg-no-repeat"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80')`,
                  opacity: (100 - (playgroundValues['overlay_opacity'] !== undefined ? playgroundValues['overlay_opacity'] : 40)) / 100
                }}
              />
              <div className="absolute inset-0 bg-black/45 z-0" />
              
              <div className="relative z-10 max-w-xl px-4 space-y-3">
                <h2 
                  onClick={() => clickToHighlight(['heading_title'])}
                  className="text-xl font-extrabold tracking-tight leading-tight uppercase cursor-pointer hover:text-green-400 transition-colors select-text"
                  style={{ color: textColor }}
                >
                  {String(titleVal)}
                </h2>
                {descVal && (
                  <p 
                    onClick={() => clickToHighlight(['subheading_text', 'desc', 'paragraph'])}
                    className="text-xs text-gray-250 leading-relaxed font-medium cursor-pointer hover:text-green-400 transition-colors select-text"
                  >
                    {String(descVal)}
                  </p>
                )}
                {buttonLabel && (
                  <button 
                    onClick={() => clickToHighlight(['button_label'])}
                    className="px-4 py-2 bg-white text-black font-bold rounded-lg text-xs hover:scale-105 transition-transform shadow-lg shadow-white/5 active:scale-95"
                  >
                    {String(buttonLabel)}
                  </button>
                )}
              </div>
            </div>
          ) : isFAQ ? (
            /* 2. FAQ ACCORDION MOCKUP RENDER */
            <div className="space-y-4 py-4">
              <div className="text-center md:text-left border-b border-white/5 pb-2.5">
                <h2 
                  onClick={() => clickToHighlight(['faq_title'])}
                  className="text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer hover:text-green-400 transition-colors"
                >
                  {String(titleVal)}
                </h2>
              </div>
              <div className="space-y-2.5">
                {playgroundBlocks.length > 0 ? (
                  playgroundBlocks.map((pb, idx) => {
                    const isOpen = !!faqOpenItems[pb.id];
                    return (
                      <div 
                        key={pb.id} 
                        className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden"
                      >
                        <button 
                          onClick={() => toggleFaq(pb.id)}
                          className="w-full p-3 flex justify-between items-center text-left hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="text-xs font-bold text-gray-200">{String(pb.values['question'] || `FAQ Question #${idx + 1}`)}</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-90 text-green-400' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="p-3 border-t border-white/5 bg-black/20 text-gray-400 text-xs leading-relaxed font-medium">
                            {String(pb.values['answer'] || 'Answer content details...')}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6 border border-dashed border-white/10 rounded-lg text-gray-550 text-xs">
                    No accordion questions added yet. Tweak block parameters in the Shopify Editor Sidebar!
                  </div>
                )}
              </div>
            </div>
          ) : isTestimonials ? (
            /* 3. CLIENT TESTIMONIALS CAROUSEL MOCKUP RENDER */
            <div className="space-y-5 py-4">
              <div className="text-center">
                <h2 
                  onClick={() => clickToHighlight(['carousel_heading'])}
                  className="text-sm font-extrabold text-white uppercase tracking-widest cursor-pointer hover:text-green-400 transition-colors"
                >
                  {String(titleVal)}
                </h2>
                <div className="w-12 h-1 bg-green-500 mx-auto mt-2 rounded-full" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {playgroundBlocks.length > 0 ? (
                  playgroundBlocks.map((pb, idx) => {
                    const stars = playgroundValues['show_stars'] !== false;
                    const borderHighlight = playgroundValues['border_color'] || '#10b981';
                    return (
                      <div 
                        key={pb.id} 
                        className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all relative text-left flex flex-col justify-between"
                        style={{ borderLeft: `3px solid ${borderHighlight}` }}
                      >
                        <div className="space-y-2">
                          {stars && (
                            <div className="flex gap-0.5 text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Sparkles key={i} className="w-3 h-3 fill-amber-400 text-transparent" />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-305 leading-relaxed italic font-medium">
                            "{String(pb.values['client_feedback_quote'] || 'Excellent Shopify theme custom work! Extremely recommended.')}"
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-green-500/20 to-emerald-800/30 flex items-center justify-center font-extrabold text-[10px] text-white border border-white/10">
                            {String(pb.values['client_name'] || 'A')[0]}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-white leading-tight">{String(pb.values['client_name'] || 'Client Partner')}</h4>
                            <span className="text-[8px] text-gray-550 font-mono">{String(pb.values['client_title'] || 'Project Manager')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center p-6 border border-dashed border-white/10 rounded-lg text-gray-550 text-xs">
                    No client reviews added yet. Add testimonial blocks in the sidebar.
                  </div>
                )}
              </div>
            </div>
          ) : isGrid ? (
            /* 4. FEATURE GRID SHOWCASE MOCKUP RENDER */
            <div className="space-y-4 py-4">
              <div className="text-center md:text-left border-b border-white/5 pb-2.5">
                <h2 
                  onClick={() => clickToHighlight(['grid_heading'])}
                  className="text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer hover:text-green-400 transition-colors"
                >
                  {String(titleVal)}
                </h2>
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-${playgroundValues['grid_columns'] || 3} gap-3`}>
                {playgroundBlocks.length > 0 ? (
                  playgroundBlocks.map((pb, idx) => (
                    <div key={pb.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                      <div className="w-6 h-6 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-2">
                        <span className="text-[10px] text-green-400 font-bold font-mono">#{idx + 1}</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-white mb-1">{String(pb.values['feature_title'] || 'Feature Item')}</h4>
                      <p className="text-[9px] text-gray-400 leading-relaxed">{String(pb.values['feature_desc'] || 'Description content')}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center p-6 border border-dashed border-white/10 rounded-lg text-gray-550 text-xs">
                    No features defined yet. Add feature grid blocks in the sidebar.
                  </div>
                )}
              </div>
            </div>
          ) : isVideo ? (
            /* 5. INTERACTIVE VIDEO HERO MOCKUP RENDER */
            <div className="relative rounded-xl overflow-hidden py-12 px-4 flex flex-col items-center justify-center min-h-[200px] text-center">
              <video 
                src={String(playgroundValues['video_source_url'] || '')} 
                autoPlay={playgroundValues['video_muted'] !== false}
                muted={playgroundValues['video_muted'] !== false}
                loop
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/60 z-0" />
              <div className="relative z-10 max-w-md space-y-2">
                <h2 
                  onClick={() => clickToHighlight(['video_heading'])}
                  className="text-base font-extrabold uppercase tracking-wide cursor-pointer hover:text-green-400 transition-colors" 
                  style={{ color: textColor }}
                >
                  {String(titleVal)}
                </h2>
                <div 
                  onClick={() => clickToHighlight(['video_source_url'])}
                  className="w-10 h-10 rounded-full border-2 border-white/30 hover:border-green-400 flex items-center justify-center mx-auto cursor-pointer bg-black/35 hover:scale-110 transition-transform"
                >
                  <Play className="w-4.5 h-4.5 text-white translate-x-0.5" />
                </div>
                <span className="text-[8px] uppercase tracking-widest font-mono text-gray-400 block pt-1">Click to edit source video</span>
              </div>
            </div>
          ) : isNewsletter ? (
            /* 6. NEWSLETTER SUBSCRIPTION BANNER MOCKUP RENDER */
            <div className="py-6 px-4 rounded-xl text-center space-y-4 max-w-md mx-auto">
              <div className="space-y-1.5">
                <h2 
                  onClick={() => clickToHighlight(['newsletter_title'])}
                  className="text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer hover:text-green-400 transition-colors"
                >
                  {String(titleVal)}
                </h2>
                {descVal && (
                  <p 
                    onClick={() => clickToHighlight(['newsletter_subtext'])}
                    className="text-[10px] text-gray-400 leading-normal cursor-pointer hover:text-green-400 transition-colors"
                  >
                    {String(descVal)}
                  </p>
                )}
              </div>
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="flex gap-1.5">
                  <input 
                    type="email" 
                    placeholder="Enter email address..." 
                    disabled
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-300 placeholder-gray-550" 
                  />
                  <button 
                    onClick={() => clickToHighlight(['newsletter_button_text'])}
                    className="px-3 bg-green-500 text-black font-bold text-[10px] rounded hover:bg-green-600 transition-colors uppercase shrink-0"
                  >
                    {String(playgroundValues['newsletter_button_text'] || 'Submit')}
                  </button>
                </div>
                {playgroundValues['require_terms'] === true && (
                  <div className="flex items-center gap-1.5 justify-center">
                    <input type="checkbox" checked disabled className="rounded border-white/15 bg-white/5" />
                    <span className="text-[8px] text-gray-550">I agree to receive developer updates</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 7. DYNAMIC GENERAL LAYOUT SIMULATOR */
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <span className="text-[8px] tracking-widest font-black uppercase text-green-400 font-mono px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 inline-block">
                  {sectionClass || ' Shopify Custom Section'}
                </span>
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider">{String(titleVal)}</h2>
                {descVal && <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">{String(descVal)}</p>}
              </div>

              {/* Show generic image field if selected */}
              {imagePickerVal && (
                <div className="max-w-md mx-auto h-24 rounded-lg border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-gray-550 text-[10px] gap-1">
                  <Play className="w-4.5 h-4.5 text-gray-500" />
                  <span>Dynamic Image Resource: {imagePickerVal.idName}</span>
                </div>
              )}

              {/* Dynamic Blocks Grid */}
              {playgroundBlocks.length > 0 && (
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <span className="text-[9px] text-gray-500 font-extrabold uppercase font-mono tracking-widest block text-center">Section Components ({playgroundBlocks.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {playgroundBlocks.map((pb, idx) => {
                      const blkDef = blocks.find(b => b.type === pb.type);
                      if (!blkDef) return null;
                      
                      const bTitle = pb.values['title'] || pb.values['heading'] || pb.values['name'] || `${blkDef.name} #${idx + 1}`;
                      
                      return (
                        <div key={pb.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-left relative flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-mono text-green-400 uppercase font-bold tracking-wider">{blkDef.name}</span>
                            <h4 className="font-extrabold text-white">{String(bTitle)}</h4>
                            
                            <div className="space-y-1 pt-1.5 border-t border-white/5 text-[9px] text-gray-400 font-medium">
                              {blkDef.settings.map(bs => {
                                if (['title', 'heading', 'name'].some(k => bs.idName.includes(k))) return null;
                                return (
                                  <div key={bs.id} className="truncate">
                                    <span className="text-gray-550 font-mono text-[8px] mr-1">{bs.idName}:</span>
                                    <span>{String(pb.values[bs.idName] || '')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const validation = getValidationStats();

  return (
    <div className="h-full flex flex-col space-y-6 pb-12 select-none text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-green-400" />
            <span>SHOPIFY SCHEMA BUILDER</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium">Design Shopify sections settings, blocks, and presets visually. Compile liquid schemas instantly.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5 text-green-400" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={handleCopySchemaOnly}
            className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={handleMagicGenerate}
            className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
            title="Auto-fill settings with high-converting themed content"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Magic Content</span>
          </button>
          <button
            onClick={handleCopySchema}
            className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Code' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownloadLiquid}
            className="px-3.5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .liquid</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Load bar */}
      <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-3">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
          <FolderOpen className="w-3.5 h-3.5 text-green-400" />
          <span>Load Shopify Starter Presets</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_TEMPLATES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => handleLoadPreset(preset)}
                className="p-3 rounded-lg border border-glass-border bg-gray-950/40 hover:bg-glass-hover text-left flex items-start gap-3 transition-colors hover:border-green-500/20 group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/25 flex items-center justify-center text-green-400 shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white leading-tight">{preset.name}</h4>
                  <p className="text-[9px] text-gray-500 truncate mt-1">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Deck */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: VISUAL MODEL CONFIG (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-6 max-h-[72vh] overflow-y-auto pr-1">
          
          {/* General settings card */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-green-400" />
              <span>Section Configuration Details</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Section Name</label>
                <input
                  type="text"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">HTML Wrapper Tag</label>
                  <select
                    value={sectionTag}
                    onChange={(e) => setSectionTag(e.target.value as 'section' | 'div')}
                    className="w-full px-2 py-1.5 rounded-lg glass-input text-xs cursor-pointer"
                  >
                    <option value="section">section</option>
                    <option value="div">div</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Class Suffix</label>
                  <input
                    type="text"
                    value={sectionClass}
                    onChange={(e) => setSectionClass(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Max Blocks Limit</label>
                <input
                  type="number"
                  value={maxBlocks || ''}
                  onChange={(e) => setMaxBlocks(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                  placeholder="e.g. 10 (0 for unlimited)"
                />
              </div>
            </div>

            {/* Spacing & Styling auto-inject row */}
            <div className="border-t border-glass-border pt-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Inject Spacing & Styling Boilerplate</h4>
                <p className="text-[10px] text-gray-500">Auto-inject padding-top/bottom, background color, container max-width fields & style markup.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={enableCssSchema} 
                  onChange={(e) => setEnableCssSchema(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 peer-checked:after:bg-black peer-checked:after:border-green-500" />
              </label>
            </div>
          </div>

          {/* Section settings Customizer card */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-green-400" />
                <span>General Section Settings ({settings.length})</span>
              </span>
              <button
                onClick={handleAddSetting}
                className="px-2 py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Setting</span>
              </button>
            </div>

            {settings.length > 0 ? (
              <div className="space-y-3.5">
                {settings.map((set, idx) => (
                  <div 
                    key={set.id}
                    id={`setting-card-${set.id}`}
                    className={`p-3 rounded-lg border space-y-3 relative group transition-all duration-300 ${
                      highlightedField === set.idName 
                        ? 'border-green-500 bg-green-950/25 ring-2 ring-green-500/30 scale-[1.01]' 
                        : 'border-glass-border/70 bg-black/30'
                    }`}
                  >
                    {/* Position Label / Delete button */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-green-400 font-mono">SETTING #{idx + 1}</span>
                      <button
                        onClick={() => handleDeleteSetting(set.id)}
                        className="p-1 rounded bg-red-950/20 hover:bg-red-500/10 text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                        title="Delete setting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inputs deck */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Input Type</label>
                        <select
                          value={set.type}
                          onChange={(e) => handleUpdateSetting(set.id, { type: e.target.value as any })}
                          className="w-full px-2 py-1 rounded glass-input text-xs cursor-pointer"
                        >
                          <option value="text">Text Input</option>
                          <option value="textarea">Textarea Block</option>
                          <option value="richtext">Rich Text Area</option>
                          <option value="image_picker">Image Picker</option>
                          <option value="product">Product Picker</option>
                          <option value="collection">Collection Picker</option>
                          <option value="color">Color Picker</option>
                          <option value="range">Range Slider</option>
                          <option value="checkbox">Checkbox Switch</option>
                          <option value="number">Number Field</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Setting ID (Snake Case)</label>
                        <input
                          type="text"
                          value={set.idName}
                          onChange={(e) => handleUpdateSetting(set.id, { idName: e.target.value })}
                          className="w-full px-2 py-1 rounded glass-input text-xs font-mono"
                          placeholder="heading_title"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Customizer Label</label>
                        <input
                          type="text"
                          value={set.label}
                          onChange={(e) => handleUpdateSetting(set.id, { label: e.target.value })}
                          className="w-full px-2 py-1 rounded glass-input text-xs"
                          placeholder="Heading Label"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Default Value</label>
                        {set.type === 'checkbox' ? (
                          <select
                            value={String(set.defaultVal)}
                            onChange={(e) => handleUpdateSetting(set.id, { defaultVal: e.target.value === 'true' })}
                            className="w-full px-2 py-1 rounded glass-input text-xs cursor-pointer"
                          >
                            <option value="true">Checked (True)</option>
                            <option value="false">Unchecked (False)</option>
                          </select>
                        ) : set.type === 'color' ? (
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="color"
                              value={set.defaultVal || '#ffffff'}
                              onChange={(e) => handleUpdateSetting(set.id, { defaultVal: e.target.value })}
                              className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              value={set.defaultVal || ''}
                              onChange={(e) => handleUpdateSetting(set.id, { defaultVal: e.target.value })}
                              className="w-full px-2 py-1 rounded glass-input text-xs font-mono"
                              placeholder="#ffffff"
                            />
                          </div>
                        ) : set.type === 'range' ? (
                          <input
                            type="number"
                            value={set.defaultVal || 0}
                            onChange={(e) => handleUpdateSetting(set.id, { defaultVal: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 rounded glass-input text-xs font-mono"
                          />
                        ) : (
                          <input
                            type="text"
                            value={set.defaultVal || ''}
                            onChange={(e) => handleUpdateSetting(set.id, { defaultVal: e.target.value })}
                            className="w-full px-2 py-1 rounded glass-input text-xs"
                            placeholder="Default content text"
                          />
                        )}
                      </div>
                    </div>

                    {/* Range settings specific configs */}
                    {set.type === 'range' && (
                      <div className="grid grid-cols-4 gap-3 border-t border-white/5 pt-2 text-[10px]">
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase block font-bold">Min Value</span>
                          <input
                            type="number"
                            value={set.min !== undefined ? set.min : 0}
                            onChange={(e) => handleUpdateSetting(set.id, { min: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-0.5 rounded glass-input text-[11px] font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase block font-bold">Max Value</span>
                          <input
                            type="number"
                            value={set.max !== undefined ? set.max : 100}
                            onChange={(e) => handleUpdateSetting(set.id, { max: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-0.5 rounded glass-input text-[11px] font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase block font-bold">Step</span>
                          <input
                            type="number"
                            value={set.step !== undefined ? set.step : 1}
                            onChange={(e) => handleUpdateSetting(set.id, { step: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-0.5 rounded glass-input text-[11px] font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase block font-bold">Unit Symbol</span>
                          <input
                            type="text"
                            value={set.unit || ''}
                            onChange={(e) => handleUpdateSetting(set.id, { unit: e.target.value })}
                            className="w-full px-2 py-0.5 rounded glass-input text-[11px] font-mono"
                            placeholder="px, %, rem"
                          />
                        </div>
                      </div>
                    )}

                    {/* Info Help tooltip description */}
                    <div className="space-y-1">
                      <span className="text-[8px] text-gray-500 uppercase block font-bold">Customizer Help Info text (Optional)</span>
                      <input
                        type="text"
                        value={set.info}
                        onChange={(e) => handleUpdateSetting(set.id, { info: e.target.value })}
                        className="w-full px-3 py-1 rounded glass-input text-[11px]"
                        placeholder="e.g. Upload your store primary logo image"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-650 border border-dashed border-glass-border rounded-lg text-xs">
                No section settings added yet. Click "Add Setting" or Load a Starter Preset above.
              </div>
            )}
          </div>

          {/* Section Blocks Customizer card */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-green-400" />
                <span>Repeatable Section Blocks ({blocks.length})</span>
              </span>
              <button
                onClick={handleAddBlock}
                className="px-2 py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Block Type</span>
              </button>
            </div>

            {blocks.length > 0 ? (
              <div className="space-y-4">
                {blocks.map((blk, bIdx) => (
                  <div 
                    key={blk.id}
                    className="p-3.5 rounded-lg border border-glass-border/70 bg-black/45 space-y-3.5 text-left"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-green-400 font-mono">BLOCK TYPE #{bIdx + 1}</span>
                      <button
                        onClick={() => handleDeleteBlock(blk.id)}
                        className="p-1 rounded bg-red-950/20 hover:bg-red-500/10 text-red-400"
                        title="Delete block type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Block Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Block Type ID</label>
                        <input
                          type="text"
                          value={blk.type}
                          onChange={(e) => handleUpdateBlock(blk.id, { type: e.target.value })}
                          className="w-full px-2 py-1 rounded glass-input text-xs font-mono"
                          placeholder="testimonial_item"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Block Name</label>
                        <input
                          type="text"
                          value={blk.name}
                          onChange={(e) => handleUpdateBlock(blk.id, { name: e.target.value })}
                          className="w-full px-2 py-1 rounded glass-input text-xs"
                          placeholder="Testimonial Item"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-500 uppercase">Block Limit (0 for unlimited)</label>
                        <input
                          type="number"
                          value={blk.limit || ''}
                          onChange={(e) => handleUpdateBlock(blk.id, { limit: parseInt(e.target.value) || undefined })}
                          className="w-full px-2 py-1 rounded glass-input text-xs font-mono"
                          placeholder="e.g. 6"
                        />
                      </div>
                    </div>

                    {/* Block Internal Settings List */}
                    <div className="border-t border-white/5 pt-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-gray-450 uppercase font-black tracking-wider">Block Settings ({blk.settings.length})</span>
                        <button
                          onClick={() => handleAddBlockSetting(blk.id)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add Block Setting</span>
                        </button>
                      </div>

                      {blk.settings.length > 0 ? (
                        <div className="space-y-2">
                          {blk.settings.map((set, sIdx) => (
                            <div 
                              key={set.id}
                              className="p-2 rounded bg-black/60 border border-white/5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
                            >
                              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 shrink-0 font-mono">
                                #{sIdx + 1}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 items-center">
                                <select
                                  value={set.type}
                                  onChange={(e) => handleUpdateBlockSetting(blk.id, set.id, { type: e.target.value as any })}
                                  className="px-1.5 py-0.5 rounded glass-input text-[11px] cursor-pointer"
                                >
                                  <option value="text">Text</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="richtext">RichText</option>
                                  <option value="image_picker">Image</option>
                                  <option value="color">Color</option>
                                  <option value="checkbox">Checkbox</option>
                                </select>

                                <input
                                  type="text"
                                  value={set.idName}
                                  onChange={(e) => handleUpdateBlockSetting(blk.id, set.id, { idName: e.target.value })}
                                  className="px-2 py-0.5 rounded glass-input text-[11px] font-mono"
                                  placeholder="setting_id"
                                />

                                <input
                                  type="text"
                                  value={set.label}
                                  onChange={(e) => handleUpdateBlockSetting(blk.id, set.id, { label: e.target.value })}
                                  className="px-2 py-0.5 rounded glass-input text-[11px]"
                                  placeholder="Heading"
                                />

                                <input
                                  type="text"
                                  value={set.defaultVal || ''}
                                  onChange={(e) => handleUpdateBlockSetting(blk.id, set.id, { defaultVal: e.target.value })}
                                  className="px-2 py-0.5 rounded glass-input text-[11px]"
                                  placeholder="Default text"
                                />
                              </div>

                              <button
                                onClick={() => handleDeleteBlockSetting(blk.id, set.id)}
                                className="p-1 rounded bg-red-950/20 text-red-400 md:self-center shrink-0 self-end hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-gray-650 text-[10px] border border-dashed border-white/5 rounded">
                          No nested settings inside this block yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-650 border border-dashed border-glass-border rounded-lg text-xs">
                No custom blocks types added. Click "Add Block Type" to model nested blocks.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CODE VIEWER & LIVE CUSTOMIZER MOCK (xl:col-span-5) */}
        <div className="xl:col-span-5 flex flex-col items-stretch space-y-4">
          
          {/* Tab Navigation header */}
          <div className="flex bg-gray-950/80 p-1.5 border border-glass-border rounded-xl justify-between shrink-0">
            <button
              onClick={() => setActiveTab('liquid')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'liquid' 
                  ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' 
                  : 'text-gray-400 hover:text-white hover:bg-glass-hover'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Liquid Code</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preview' 
                  ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' 
                  : 'text-gray-400 hover:text-white hover:bg-glass-hover'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Shopify Customizer Mock</span>
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'usage' 
                  ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' 
                  : 'text-gray-400 hover:text-white hover:bg-glass-hover'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Usage Guide</span>
            </button>
          </div>

          {/* Dynamic Content Panel View */}
          <div className="flex-1 min-h-[500px] border border-glass-border rounded-2xl bg-gray-950/20 overflow-hidden flex flex-col">
            
            {/* Tab 1: Live Liquid Code compile output */}
            {activeTab === 'liquid' && (
              <div className="flex-1 flex flex-col overflow-hidden text-left bg-gray-950/30">
                <div className="p-3 bg-gray-950 border-b border-glass-border flex items-center justify-between shrink-0 select-none">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest font-mono">Live Liquid Output</span>
                  <div className="flex gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-mono font-bold animate-pulse">COMPILED OK</span>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-gray-300 relative select-text bg-gray-950/65">
                  <pre className="whitespace-pre-wrap">{fullLiquidCode}</pre>
                </div>
              </div>
            )}

            {/* Tab 2: Live Shopify Theme Customizer Mockup Sidebar */}
            {activeTab === 'preview' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-glass-border h-full overflow-hidden bg-gray-950/45">
                
                {/* Visual customizer sidebar mock (real shopify admin panel mimicry) */}
                <div className="p-4 overflow-y-auto flex flex-col space-y-4 text-left h-full">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md glow-green" />
                    <span className="text-[10px] text-white font-extrabold uppercase tracking-wider font-mono">Shopify Editor Sidebar</span>
                  </div>

                  <div className="space-y-4">
                    {/* General inputs */}
                    {settings.length > 0 ? (
                      settings.map(set => (
                        <div key={set.id} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-gray-200">{set.label}</label>
                            <span className="text-[8px] font-mono text-gray-500">{set.idName}</span>
                          </div>

                          {set.type === 'checkbox' ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="checkbox"
                                checked={!!playgroundValues[set.idName]}
                                onChange={(e) => setPlaygroundValues({ ...playgroundValues, [set.idName]: e.target.checked })}
                                className="w-4 h-4 rounded bg-gray-900 border border-white/10 text-emerald-500 cursor-pointer"
                              />
                              <span className="text-[10px] text-gray-400">Enable</span>
                            </div>
                          ) : set.type === 'color' ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={playgroundValues[set.idName] || '#ffffff'}
                                onChange={(e) => setPlaygroundValues({ ...playgroundValues, [set.idName]: e.target.value })}
                                className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={playgroundValues[set.idName] || ''}
                                onChange={(e) => setPlaygroundValues({ ...playgroundValues, [set.idName]: e.target.value })}
                                className="w-full px-2 py-1 rounded glass-input text-xs font-mono"
                              />
                            </div>
                          ) : set.type === 'range' ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                <span>Min: {set.min || 0}</span>
                                <span className="text-green-400 font-bold">{playgroundValues[set.idName] || 0}{set.unit || ''}</span>
                                <span>Max: {set.max || 100}</span>
                              </div>
                              <input
                                type="range"
                                min={set.min !== undefined ? set.min : 0}
                                max={set.max !== undefined ? set.max : 100}
                                step={set.step !== undefined ? set.step : 1}
                                value={playgroundValues[set.idName] || 0}
                                onChange={(e) => setPlaygroundValues({ ...playgroundValues, [set.idName]: parseInt(e.target.value) || 0 })}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-400"
                              />
                            </div>
                          ) : set.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={playgroundValues[set.idName] || ''}
                              onChange={(e) => setPlaygroundValues({ ...playgroundValues, [set.idName]: e.target.value })}
                              className="w-full p-2 rounded glass-input text-xs font-medium"
                            />
                          ) : (
                            <input
                              type="text"
                              value={playgroundValues[set.idName] || ''}
                              onChange={(e) => setPlaygroundValues({ ...playgroundValues, [set.idName]: e.target.value })}
                              className="w-full px-2 py-1 rounded glass-input text-xs"
                            />
                          )}

                          {set.info && <p className="text-[9px] text-gray-500 italic mt-0.5 leading-tight">{set.info}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-500 text-center py-4">No settings settings defined.</p>
                    )}

                    {/* Block Adders inside Mock Editor */}
                    {blocks.length > 0 && (
                      <div className="border-t border-white/5 pt-3 space-y-3">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block font-mono">Repeatable Blocks</span>
                        <div className="flex gap-2 flex-wrap">
                          {blocks.map(blk => (
                            <button
                              key={blk.id}
                              onClick={() => handleAddPlaygroundBlock(blk.type)}
                              className="px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add {blk.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* Playground blocks list */}
                        {playgroundBlocks.length > 0 && (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {playgroundBlocks.map((pb, idx) => {
                              const blkDef = blocks.find(b => b.type === pb.type);
                              if (!blkDef) return null;
                              return (
                                <div key={pb.id} className="p-2.5 rounded bg-black/40 border border-white/5 space-y-2 text-left relative group">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-1 select-none">
                                    <span className="text-[9px] font-bold text-gray-400">{blkDef.name} block #{idx + 1}</span>
                                    <button 
                                      onClick={() => handleDeletePlaygroundBlock(pb.id)}
                                      className="text-red-400 hover:text-red-300 font-bold text-[8px] uppercase tracking-wider"
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  {blkDef.settings.map(bs => (
                                    <div key={bs.id} className="space-y-0.5 text-[10px]">
                                      <label className="font-bold text-gray-300 block">{bs.label}</label>
                                      <input
                                        type="text"
                                        value={pb.values[bs.idName] || ''}
                                        onChange={(e) => handleUpdatePlaygroundBlockValue(pb.id, bs.idName, e.target.value)}
                                        className="w-full px-2 py-0.5 rounded glass-input text-[11px]"
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Output preview matching Shopify custom HTML render */}
                <div className="p-4 flex flex-col justify-between h-full bg-black/40 text-left overflow-y-auto">
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0 select-none">
                      <div className="flex gap-1 border border-glass-border rounded-md p-0.5 bg-black/40">
                        <button
                          onClick={() => setPreviewMode('visual')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all uppercase ${
                            previewMode === 'visual'
                              ? 'bg-green-500 text-black font-extrabold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Visual Layout
                        </button>
                        <button
                          onClick={() => setPreviewMode('debug')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all uppercase ${
                            previewMode === 'debug'
                              ? 'bg-green-500 text-black font-extrabold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Debug Variables
                        </button>
                      </div>

                      {/* Viewport size toggles */}
                      {previewMode === 'visual' && (
                        <div className="flex gap-1 border border-glass-border rounded-md p-0.5 bg-black/40">
                          <button
                            onClick={() => setViewportSize('desktop')}
                            className={`p-1 rounded transition-colors ${viewportSize === 'desktop' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                            title="Desktop Viewport"
                          >
                            <Monitor className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewportSize('tablet')}
                            className={`p-1 rounded transition-colors ${viewportSize === 'tablet' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                            title="Tablet Viewport"
                          >
                            <Tablet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewportSize('mobile')}
                            className={`p-1 rounded transition-colors ${viewportSize === 'mobile' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                            title="Mobile Viewport"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preview Area container */}
                    {previewMode === 'visual' ? (
                      <div className="flex-1 flex items-start justify-center p-3 bg-gray-950/40 rounded-xl overflow-x-hidden overflow-y-auto border border-white/5 min-h-[350px]">
                        <motion.div
                          layout
                          initial={false}
                          animate={{
                            width: viewportSize === 'mobile' ? 360 : viewportSize === 'tablet' ? 580 : '100%',
                          }}
                          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                          className="mx-auto w-full max-w-full"
                        >
                          {viewportSize === 'mobile' ? (
                            <div className="relative mx-auto border-[10px] border-gray-800 rounded-[36px] shadow-2xl bg-[#090d16] overflow-hidden w-full max-w-[360px] min-h-[480px]">
                              {/* Notch */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-24 bg-gray-800 rounded-b-xl z-20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mr-2" />
                                <div className="w-8 h-1 bg-gray-900 rounded-full" />
                              </div>
                              <div className="pt-5 overflow-y-auto h-full max-h-[500px]">
                                {renderVisualSectionPreview()}
                              </div>
                            </div>
                          ) : viewportSize === 'tablet' ? (
                            <div className="relative mx-auto border-[12px] border-gray-800 rounded-[28px] shadow-2xl bg-[#090d16] overflow-hidden w-full max-w-[580px] min-h-[420px]">
                              {/* Camera dot */}
                              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-800 z-20" />
                              <div className="pt-4 overflow-y-auto h-full max-h-[450px]">
                                {renderVisualSectionPreview()}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-[#090d16]">
                              {/* Browser header chrome */}
                              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-950/80 border-b border-white/5 select-none shrink-0">
                                <div className="flex gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                </div>
                                <div className="mx-auto bg-white/5 rounded px-12 py-0.5 text-[9px] text-gray-400 font-mono flex items-center gap-1.5 border border-white/5">
                                  <span className="text-green-500">https://</span>
                                  <span>code-commandos-hub.local/schema-preview</span>
                                </div>
                              </div>
                              <div className="overflow-y-auto max-h-[500px]">
                                {renderVisualSectionPreview()}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    ) : (
                      <div 
                        className="p-4 rounded-xl border border-dashed border-white/10 space-y-4 overflow-y-auto"
                        style={{ 
                          background: 'radial-gradient(circle at top right, rgba(16,185,129,0.03), transparent 60%)',
                        }}
                      >
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 font-mono">
                          &lt;{sectionTag} class="{sectionClass}"&gt;
                        </span>

                        {/* Display live values inside a visual card layout */}
                        <div className="space-y-3">
                          {settings.map(set => {
                            const val = playgroundValues[set.idName];
                            if (set.type === 'color') {
                              return (
                                <div key={set.id} className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-550 font-mono">{set.idName}:</span>
                                  <div className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: val }} />
                                  <span className="font-mono text-gray-300">{val}</span>
                                </div>
                              );
                            }
                            if (set.type === 'image_picker') {
                              return (
                                <div key={set.id} className="text-xs space-y-1">
                                  <span className="text-gray-550 font-mono">{set.idName}:</span>
                                  <div className="w-full h-12 rounded border border-white/5 bg-white/5 flex items-center justify-center text-gray-500 text-[10px] italic">
                                    [Loaded Dynamic Image Resource]
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={set.id} className="text-xs">
                                <span className="text-gray-550 font-mono block text-[9px] mb-0.5">{set.idName}:</span>
                                <span className="text-white font-bold leading-normal">{String(val || `[${set.label}]`)}</span>
                              </div>
                            );
                          })}

                          {/* Render playground blocks */}
                          {playgroundBlocks.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                              <span className="text-[8px] text-gray-500 font-black uppercase font-mono tracking-wider block">Rendered Blocks ({playgroundBlocks.length})</span>
                              <div className="grid grid-cols-1 gap-2">
                                {playgroundBlocks.map((pb, idx) => {
                                  const blkDef = blocks.find(b => b.type === pb.type);
                                  if (!blkDef) return null;
                                  return (
                                    <div key={pb.id} className="p-2.5 rounded bg-white/[0.02] border border-white/5 text-[10px] space-y-1 text-left relative">
                                      <span className="absolute right-2 top-2 text-[8px] font-mono text-green-500">{pb.type}</span>
                                      <h4 className="font-black text-gray-300">{blkDef.name} #{idx + 1}</h4>
                                      
                                      {blkDef.settings.map(bs => (
                                        <div key={bs.id} className="flex items-start gap-1">
                                          <span className="text-gray-550 font-mono text-[9px] shrink-0">{bs.idName}:</span>
                                          <span className="text-white truncate font-medium">{String(pb.values[bs.idName] || `[${bs.label}]`)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 text-right">
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 font-mono">
                            &lt;/{sectionTag}&gt;
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] text-gray-500 text-center leading-normal border-t border-white/5 pt-2 select-none shrink-0 mt-3 font-medium">
                    * Values entered in this Shopify editor mimicry sync in memory to mock dynamic rendering blocks.
                  </p>
                </div>

              </div>
            )}

            {/* Tab 3: Detailed Liquid Usage Guide */}
            {activeTab === 'usage' && (
              <div className="flex-1 p-5 overflow-y-auto space-y-5 text-left bg-gray-950/45 max-h-[72vh]">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-4 h-4 text-green-400" />
                    <span>Developer Integration Guide</span>
                  </h3>
                  <p className="text-xs text-gray-500">How to call these custom fields inside your Shopify liquid theme files.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* General settings loop calling */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest font-mono">1. Rendering Settings variables</span>
                    <p className="text-gray-400 leading-relaxed text-[11px]">
                      Access section fields using the <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-yellow-300">{"{{ section.settings.id }}"}</code> tags inside the liquid code file.
                    </p>
                    
                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg font-mono text-[11px] text-gray-300 space-y-2">
                      {settings.length > 0 ? settings.map(s => (
                        <div key={s.id}>
                          <span className="text-gray-550 block">{"{% comment %} Render label: " + s.label + " {% endcomment %}"}</span>
                          {s.type === 'image_picker' ? (
                            <span>{`{% if section.settings.${s.idName} != blank %}
  <img src="{{ section.settings.${s.idName} | image_url: width: 400 }}" alt="{{ section.settings.${s.idName}.alt }}" />
{% endif %}`}</span>
                          ) : (
                            <span>{`<div>{{ section.settings.${s.idName} }}</div>`}</span>
                          )}
                        </div>
                      )) : (
                        <div className="text-gray-500 italic">No settings defined yet. Add some on the left.</div>
                      )}
                    </div>
                  </div>

                  {/* Repeatable Blocks Loop calling */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest font-mono">2. Iterating through custom blocks</span>
                    <p className="text-gray-400 leading-relaxed text-[11px]">
                      Repeatable elements are retrieved by running a loop over <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-yellow-300">{"section.blocks"}</code>. Filter block markup using case tags.
                    </p>

                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg font-mono text-[11px] text-gray-300">
                      {blocks.length > 0 ? (
                        <span>{`{% for block in section.blocks %}
  {% case block.type %}
    ${blocks.map(b => `{% when '${b.type}' %}
      <!-- Render Block: ${b.name} -->
      <div class="block-${b.type}">
        ${b.settings.map(bs => `<h3>{{ block.settings.${bs.idName} }}</h3>`).join('\n        ')}
      </div>`).join('\n    ')}
  {% endcase %}
{% endfor %}`}</span>
                      ) : (
                        <div className="text-gray-550 italic">No repeatable blocks defined yet. Add some block types on the left.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Real-time JSON Schema Validator Console */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/40 space-y-3 shrink-0 text-left">
            <div className="flex items-center justify-between border-b border-glass-border pb-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span className={`w-2 h-2 rounded-full shrink-0 ${validation.isValidJson && !validation.hasDuplicates && !validation.hasEmptyIds ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                <span>Schema Validator Diagnostics</span>
              </span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                validation.isValidJson && !validation.hasDuplicates && !validation.hasEmptyIds
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {validation.isValidJson && !validation.hasDuplicates && !validation.hasEmptyIds ? 'PASS' : 'DIAGNOSTICS WARNING'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded bg-gray-900/50 border border-white/5 font-medium">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Total Settings</span>
                <span className="text-sm font-extrabold text-white font-mono">{validation.settingsCount}</span>
              </div>
              <div className="p-2 rounded bg-gray-900/50 border border-white/5 font-medium">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Block Types</span>
                <span className="text-sm font-extrabold text-white font-mono">{validation.blocksCount}</span>
              </div>
              <div className="p-2 rounded bg-gray-900/50 border border-white/5 font-medium">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">File Size</span>
                <span className="text-sm font-extrabold text-white font-mono">{validation.sizeKb} KB</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 text-[10px] font-semibold leading-relaxed">
              <div className="flex items-center justify-between text-gray-400">
                <span>JSON Syntax Integrity</span>
                {validation.isValidJson ? (
                  <span className="text-green-400">✓ Valid JSON Syntax</span>
                ) : (
                  <span className="text-red-400">✗ Syntax Error</span>
                )}
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Unique IDs Compliance</span>
                {!validation.hasDuplicates ? (
                  <span className="text-green-400">✓ 100% Unique Keys</span>
                ) : (
                  <span className="text-red-400">✗ Dups: {validation.duplicates.join(', ')}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Empty Keys Prevention</span>
                {!validation.hasEmptyIds ? (
                  <span className="text-green-400">✓ All Keys Complete</span>
                ) : (
                  <span className="text-red-400">✗ Empty fields found</span>
                )}
              </div>
            </div>
          </div>

        </div>
  
      </div>

      {/* Import JSON Modal */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setImportModalOpen(false);
                setImportError('');
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-glass-border p-6 rounded-xl w-full max-w-2xl relative z-10 space-y-4 text-left shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-green-400" />
                  <span>Import Shopify Section Schema</span>
                </h3>
                <span className="text-[9px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">JSON Parsing</span>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                Paste your raw Shopify section schema JSON below. You can paste the entire liquid file containing the <code className="text-green-400 bg-white/5 px-1 py-0.5 rounded">{"{% schema %}"}</code> block or just the raw JSON object inside it.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between">
                    <span>Schema JSON Input</span>
                    <span className="text-gray-550 font-normal normal-case">Accepts full Liquid file or raw JSON</span>
                  </label>
                  <textarea
                    placeholder={`e.g.,\n{\n  "name": "Custom Video Banner",\n  "settings": [\n    { "type": "text", "id": "video_url", "label": "Video URL" }\n  ]\n}`}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="w-full h-64 px-3 py-2 rounded-lg glass-input text-xs font-mono bg-black/50 border border-white/10 text-white focus:outline-none focus:border-green-500/50"
                  />
                </div>
                
                {importError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col gap-1">
                    <span className="font-bold">Parsing Error:</span>
                    <span className="font-mono text-[10px] leading-normal">{importError}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportError('');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSchema}
                  disabled={!importJsonText.trim()}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-black shadow-lg shadow-green-500/10 transition-colors"
                >
                  Import Schema
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
