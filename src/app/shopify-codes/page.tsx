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
  Minimize2
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

export default function ShopifyCodesPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  
  const defaultCode = `<div class="custom-section">
  <h2>{{ section.settings.title }}</h2>
  <p>{{ section.settings.description }}</p>
</div>

<style>
  .custom-section {
    padding: 40px;
    background: {{ section.settings.bg_color }};
    text-align: center;
    border-radius: 8px;
    font-family: sans-serif;
  }
  .custom-section h2 {
    color: #333;
    margin-bottom: 15px;
  }
  .custom-section p {
    color: #666;
  }
</style>

{% schema %}
{
  "name": "Custom Section",
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
      "default": "This is a live preview of your Shopify liquid code."
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#f4f4f4"
    }
  ]
}
{% endschema %}`;

  const [code, setCode] = useState(defaultCode);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New states for extended functionality
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Section State EXACTLY like app.js
  const [currentSchema, setCurrentSchema] = useState<any>(null);
  const [sectionState, setSectionState] = useState<{settings: any, blocks: any[]}>({ settings: {}, blocks: [] });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const profile = useWorkspaceStore((state) => state.memberProfile);
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : profile?.name) || 'Developer';

  // Initialize Liquid engine 100% like app.js
  const engine = useMemo(() => {
    // using lenientIf so we don't crash on standard shopify undefined vars, but keeping logic same
    const liq = new Liquid({
      lenientIf: true,
      strictFilters: false,
      strictVariables: false
    });
    
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
    liq.registerFilter('money_without_currency', (v) => ((v||0)/100).toFixed(2));
    liq.registerFilter('image_url', (v) => v || 'https://cdn.shopify.com/s/images/admin/no-image-large.gif');
    liq.registerFilter('image_tag', (v) => `<img src="${v}" alt="" />`);
    liq.registerFilter('placeholder_svg_tag', (v, className) => `<svg class="${className || ''}" style="background:#eee;width:100%;height:100%;"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20px" fill="#aaa">${v}</text></svg>`);

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
        if (id.includes('title') || id.includes('heading')) return 'Dummy Heading';
        if (id.includes('btn') || id.includes('button')) return 'Click Here';
        if (id.includes('url') || id.includes('link')) return '#';
        return 'Sample Text';
    }
    if (type === 'textarea' || type === 'richtext') {
        return '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>';
    }
    if (type === 'url') return '#';
    if (type === 'color' || type === 'color_background') return '#333333';
    if (type === 'checkbox') return true;
    if (type === 'number') return 10;
    if (type === 'range') {
        if (setting.min !== undefined && setting.max !== undefined) {
            return Math.floor((setting.min + setting.max) / 2);
        }
        return 50;
    }
    if (type === 'select' || type === 'radio') {
        if (setting.options && setting.options.length > 0) {
            return setting.options[0].value;
        }
        return '';
    }
    if (type === 'video_url') return 'https://www.youtube.com/watch?v=_9VUPq31Z-Q';
    if (type === 'html' || type === 'liquid') return '<div>Dummy HTML Content</div>';
    
    return '';
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
    let html = '';

    while (!success && attempts < 10) {
        try {
            html = await engine.parseAndRender(codeWithoutSchema, context);
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
            
            // If strictly following app.js error logic:
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
                          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background-color: #fdfbfb; margin: 0; box-sizing: border-box; }
                          .error-box { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(211,47,47,0.1); border-left: 5px solid #ef4444; }
                          h2 { margin-top: 0; display: flex; align-items: center; gap: 10px; color: #ef4444; }
                          .code-block { background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #333; margin-bottom: 20px; overflow-x: auto; border: 1px solid #e5e7eb; }
                          .suggestion { background: #eff6ff; padding: 20px; border-radius: 8px; color: #1e3a8a; font-size: 15px; line-height: 1.6; border: 1px solid #bfdbfe; }
                          code { background: #dbeafe; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
                      </style>
                  </head>
                  <body>
                      <div class="error-box">
                          <h2>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
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
                      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                  </style>
              </head>
              <body>
                  ${html}
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
    
    // Use setState callback to ensure we have latest state before sync
    setSectionState(prevState => {
      const newState = syncStateWithSchema(schema, prevState);
      
      const context = {
          section: {
              id: 'preview-section',
              settings: newState.settings,
              blocks: newState.blocks
          },
          shop: { name: 'Preview Store' }
      };

      const codeWithoutSchema = sourceCode.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '');
      executeRender(codeWithoutSchema, context);
      
      return newState;
    });
  }, [code, engine]);

  const renderPreviewStateOnly = useCallback(async () => {
    const context = {
        section: {
            id: 'preview-section',
            settings: sectionState.settings,
            blocks: sectionState.blocks
        },
        shop: { name: 'Preview Store' }
    };
    const codeWithoutSchema = code.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '');
    await executeRender(codeWithoutSchema, context);
  }, [code, engine, sectionState]);

  // Debounced editor change
  const handleEditorChange = (value: string) => {
    setCode(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      renderPreview(value);
    }, 1000);
  };

  const handleSettingChange = (settingId: string, value: any, blockIndex: number = -1) => {
    setSectionState(prev => {
      const newState = { ...prev };
      if (blockIndex >= 0) {
        newState.blocks[blockIndex].settings[settingId] = value;
      } else {
        newState.settings[settingId] = value;
      }
      return newState;
    });
  };

  // We need a separate effect to re-render when state changes from the sidebar,
  // but only if it's explicitly changed by user, to avoid loop.
  // Actually, we can just call renderPreviewStateOnly directly from the change handler.
  const updateSettingAndRender = (settingId: string, value: any, blockIndex: number = -1) => {
    setSectionState(prev => {
      const newState = { ...prev };
      if (blockIndex >= 0) {
        newState.blocks[blockIndex].settings[settingId] = value;
      } else {
        newState.settings[settingId] = value;
      }
      
      // Async render after state logic
      setTimeout(() => {
        const context = {
            section: {
                id: 'preview-section',
                settings: newState.settings,
                blocks: newState.blocks
            },
            shop: { name: 'Preview Store' }
        };
        const codeWithoutSchema = code.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '');
        executeRender(codeWithoutSchema, context);
      }, 0);
      
      return newState;
    });
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
        toast.success('Snippet deleted');
        setSnippets(prev => prev.filter(s => s._id !== id));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting snippet');
    }
  };

  const copyToClipboard = (text: string, id: string | null = null, msg = 'Copied to clipboard!') => {
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
    <div className="max-w-[1600px] w-full mx-auto space-y-6 pb-20 relative">
      
      {/* Header Full Width Brand Styled */}
      <div className="w-full glass-panel p-6 lg:p-8 rounded-2xl border border-glass-border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center gap-4 text-left relative z-10 w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <Code2 className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">Shopify Codes</h1>
            <p className="text-gray-400 text-sm mt-1">Live Liquid preview editor and community code repository</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto justify-start md:justify-end">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${isSettingsOpen ? 'bg-purple-500 text-white shadow-lg glow-purple' : 'bg-gray-800 text-gray-300 hover:bg-purple-500/20 hover:text-purple-400 border border-transparent hover:border-purple-500/30'}`}
          >
            <Settings className="w-4 h-4" /> Edit Settings
          </button>
          <button 
            onClick={() => copyToClipboard(window.location.href, null, 'Preview Link Copied!')}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors border border-glass-border"
          >
            <ExternalLink className="w-4 h-4" /> Share Preview
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
      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[700px] relative">
        
        {/* Settings Sidebar */}
        {isSettingsOpen && (
          <div className="absolute top-0 right-0 lg:left-0 h-full w-full lg:w-[350px] bg-gray-950/95 backdrop-blur-xl border border-glass-border rounded-2xl z-20 shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300">
            <div className="p-4 border-b border-glass-border flex justify-between items-center bg-black/40">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" /> Section Settings
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
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                          {setting.label || setting.id}
                        </label>
                        {/* Setting Input Components */}
                        {setting.type === 'color' || setting.type === 'color_background' ? (
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={val}
                              onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input 
                              type="text"
                              value={val}
                              onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                              className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                            />
                          </div>
                        ) : setting.type === 'textarea' || setting.type === 'richtext' || setting.type === 'html' || setting.type === 'liquid' ? (
                          <textarea
                            value={val}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-h-[80px]"
                          />
                        ) : setting.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={val === true}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-700 bg-black/50 accent-purple-500"
                          />
                        ) : setting.type === 'select' || setting.type === 'radio' ? (
                          <select
                            value={val}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
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
                            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded border border-gray-700 min-w-[40px] text-center">{val}</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => updateSettingAndRender(setting.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No settings found in schema.</p>
              )}

              {/* Block Settings */}
              {sectionState.blocks.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-glass-border">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Blocks</h3>
                  {sectionState.blocks.map((block, index) => {
                    const blockDef = (currentSchema.blocks || []).find((b: any) => b.type === block.type);
                    if (!blockDef || !blockDef.settings) return null;
                    
                    return (
                      <div key={index} className="p-4 bg-white/5 border border-glass-border rounded-xl space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">{blockDef.name || block.type}</h4>
                        {blockDef.settings.map((setting: any) => {
                          const val = block.settings[setting.id] ?? '';
                          return (
                            <div key={setting.id} className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                {setting.label || setting.id}
                              </label>
                              {setting.type === 'text' || setting.type === 'image_picker' || setting.type === 'url' ? (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateSettingAndRender(setting.id, e.target.value, index)}
                                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateSettingAndRender(setting.id, e.target.value, index)}
                                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                                />
                              )}
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

        {/* Editor Pane */}
        <div className="glass-panel border border-glass-border rounded-2xl flex flex-col shadow-lg overflow-hidden h-[500px] lg:h-full flex-1 min-w-[40%] relative z-10">
          <div className="p-3 border-b border-glass-border flex justify-between items-center bg-gray-950/60">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Liquid Code</h2>
            </div>
            <button 
              onClick={() => renderPreview(code)}
              className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg glow-green"
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
              className="h-full text-sm"
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

        {/* Preview Pane */}
        <div className={`glass-panel border border-glass-border flex flex-col shadow-lg overflow-hidden bg-white transition-all duration-300 ${isFullscreen ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] h-[95vh] w-[95vw] !rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)]' : 'relative z-10 rounded-2xl h-[500px] lg:h-full flex-1'}`}>
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100 absolute top-0 w-full z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Live Preview</h2>
            </div>
            
            {/* Viewport Toggles & Fullscreen */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-200 rounded-lg p-0.5">
                <button 
                  onClick={() => setViewMode('desktop')} 
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('tablet')} 
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'tablet' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('mobile')} 
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full pt-[48px] relative bg-gray-200 flex justify-center items-start overflow-hidden">
            <div className={`h-full ${getViewWidth()} bg-white shadow-2xl transition-all duration-300 ease-in-out origin-top`}>
              {/* IMPORTANT: iframe ref used for document.write() directly mimicking app.js */}
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
          placeholder="Name this snippet (e.g., Custom Header)"
          className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors w-full"
        />
        <button
          onClick={handleSave}
          disabled={submitting}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0 shadow-lg glow-green"
        >
          <Save className="w-5 h-5" />
          {submitting ? 'Saving...' : 'Submit for Approval'}
        </button>
      </div>

      {/* Library Section */}
      <div className="pt-6">
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-gray-400" />
          Community Library
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
              <div key={snippet._id} className="glass-panel border border-glass-border rounded-2xl overflow-hidden flex flex-col shadow-lg hover:border-green-500/30 transition-colors group">
                <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/40">
                  <div className="overflow-hidden pr-4">
                    <h3 className="font-bold text-white text-lg truncate group-hover:text-green-400 transition-colors">{snippet.title}</h3>
                    <p className="text-xs text-gray-500 font-mono">By {snippet.createdBy} • {new Date(snippet.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setCode(snippet.code);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        toast.success('Loaded into Editor!');
                        renderPreview(snippet.code);
                      }}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-blue-500/20 text-gray-300 hover:text-blue-400 transition-colors"
                      title="Load into Editor"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(snippet.code, snippet._id, 'Code Copied!')}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-2"
                      title="Copy Code"
                    >
                      {copiedId === snippet._id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="relative w-full h-[250px] bg-white">
                  <iframe
                    title={snippet.title}
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}</style></head><body>${snippet.code.replace(/{%-?\s*schema\s*-?%}[\s\S]*?{%-?\s*endschema\s*-?%}/i, '')}</body></html>`}
                    className="w-full h-full border-0 pointer-events-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
