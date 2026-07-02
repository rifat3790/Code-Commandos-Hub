document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'htmlmixed',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseTags: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2
    });

    // Initialize Liquid engine
    const engine = new liquidjs.Liquid();

    // Register Shopify specific block tags
    engine.registerTag('style', {
        parse: function (tagToken, remainTokens) {
            this.templates = [];
            const stream = this.liquid.parser.parseStream(remainTokens);
            stream
                .on('tag:endstyle', () => stream.stop())
                .on('template', tpl => this.templates.push(tpl))
                .on('end', () => {
                    throw new Error(`tag ${tagToken.getText()} not closed`);
                });
            stream.start();
        },
        render: function* (ctx, emitter) {
            emitter.write('<style>');
            yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
            emitter.write('</style>');
        }
    });

    engine.registerTag('javascript', {
        parse: function (tagToken, remainTokens) {
            this.templates = [];
            const stream = this.liquid.parser.parseStream(remainTokens);
            stream
                .on('tag:endjavascript', () => stream.stop())
                .on('template', tpl => this.templates.push(tpl))
                .on('end', () => {
                    throw new Error(`tag ${tagToken.getText()} not closed`);
                });
            stream.start();
        },
        render: function* (ctx, emitter) {
            emitter.write('<script>');
            yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
            emitter.write('</script>');
        }
    });

    engine.registerTag('form', {
        parse: function (tagToken, remainTokens) {
            this.templates = [];
            const stream = this.liquid.parser.parseStream(remainTokens);
            stream
                .on('tag:endform', () => stream.stop())
                .on('template', tpl => this.templates.push(tpl))
                .on('end', () => {
                    throw new Error(`tag ${tagToken.getText()} not closed`);
                });
            stream.start();
        },
        render: function* (ctx, emitter) {
            const mockForm = {
                posted_successfully: false,
                errors: false,
                email: ''
            };
            mockForm['posted_successfully?'] = false;
            
            ctx.push({ form: mockForm });
            emitter.write('<form action="#" method="POST" class="shopify-mock-form">');
            yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
            emitter.write('</form>');
            ctx.pop();
        }
    });

    engine.registerTag('paginate', {
        parse: function (tagToken, remainTokens) {
            this.templates = [];
            const stream = this.liquid.parser.parseStream(remainTokens);
            stream
                .on('tag:endpaginate', () => stream.stop())
                .on('template', tpl => this.templates.push(tpl))
                .on('end', () => {
                    throw new Error(`tag ${tagToken.getText()} not closed`);
                });
            stream.start();
        },
        render: function* (ctx, emitter) {
            ctx.push({ paginate: { pages: 1, current_page: 1, next: false, previous: false } });
            yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
            ctx.pop();
        }
    });

    engine.registerTag('render', {
        parse: function (tagToken) { this.args = tagToken.args; },
        render: function (ctx, emitter) { emitter.write(`<!-- Mock Render: ${this.args} -->`); }
    });
    engine.registerTag('include', {
        parse: function (tagToken) { this.args = tagToken.args; },
        render: function (ctx, emitter) { emitter.write(`<!-- Mock Include: ${this.args} -->`); }
    });
    engine.registerTag('section', {
        parse: function (tagToken) { this.args = tagToken.args; },
        render: function (ctx, emitter) { emitter.write(`<!-- Mock Section: ${this.args} -->`); }
    });

    engine.registerFilter('img_url', (v) => v || 'https://cdn.shopify.com/s/images/admin/no-image-large.gif');
    engine.registerFilter('asset_url', (v) => v || '');
    engine.registerFilter('stylesheet_tag', (v) => `<link href="${v}" rel="stylesheet" type="text/css" media="all" />`);
    engine.registerFilter('script_tag', (v) => `<script src="${v}"></script>`);
    engine.registerFilter('t', (v) => v);
    engine.registerFilter('json', (v) => JSON.stringify(v));
    engine.registerFilter('handleize', (v) => (v || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    engine.registerFilter('money', (v) => '$' + ((v||0)/100).toFixed(2));
    engine.registerFilter('money_without_currency', (v) => ((v||0)/100).toFixed(2));
    engine.registerFilter('image_url', (v) => v || 'https://cdn.shopify.com/s/images/admin/no-image-large.gif');
    engine.registerFilter('image_tag', (v) => `<img src="${v}" alt="" />`);
    engine.registerFilter('placeholder_svg_tag', (v, className) => `<svg class="${className || ''}" style="background:#eee;width:100%;height:100%;"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20px" fill="#aaa">${v}</text></svg>`);

    // DOM Elements
    const runBtn = document.getElementById('runBtn');
    const shareBtn = document.getElementById('shareBtn');
    const sharePreviewBtn = document.getElementById('sharePreviewBtn');
    const editSettingsBtn = document.getElementById('editSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsSidebar = document.getElementById('settings-sidebar');
    const settingsContent = document.getElementById('settings-content');
    const iframe = document.getElementById('preview-frame');
    const desktopBtn = document.getElementById('desktopView');
    const mobileBtn = document.getElementById('mobileView');
    const previewPane = document.querySelector('.preview-pane');
    const toast = document.getElementById('toast');

    // Helper: Extract JSON schema from {% schema %} ... {% endschema %}
    function extractSchema(code) {
        const schemaRegex = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/i;
        const match = code.match(schemaRegex);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                console.error("Invalid JSON in schema:", e);
                return null;
            }
        }
        return null;
    }

    // Helper: Generate smart dummy data based on field type and ID
    function getDummyData(setting) {
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
        if (type === 'url') {
            return '#';
        }
        if (type === 'color' || type === 'color_background') {
            return '#333333';
        }
        if (type === 'checkbox') {
            return true;
        }
        if (type === 'number') {
            return 10;
        }
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
        if (type === 'html' || type === 'liquid') {
            return '<div>Dummy HTML Content</div>';
        }
        if (type === 'video_url') {
            return 'https://www.youtube.com/watch?v=_9VUPq31Z-Q';
        }
        
        return '';
    }

    // Global State for Sidebar Editing
    let currentSchema = null;
    let sectionState = {
        settings: {},
        blocks: []
    };

    function syncStateWithSchema(schema) {
        if (!schema) return;
        currentSchema = schema;
        
        const newSettings = {};
        if (schema.settings) {
            schema.settings.forEach(setting => {
                if (sectionState.settings[setting.id] !== undefined) {
                    newSettings[setting.id] = sectionState.settings[setting.id];
                } else {
                    newSettings[setting.id] = getDummyData(setting);
                }
            });
        }
        sectionState.settings = newSettings;
        
        const newBlocks = [];
        if (schema.presets && schema.presets[0] && schema.presets[0].blocks) {
            const schemaBlocksDef = schema.blocks || [];
            schema.presets[0].blocks.forEach((presetBlock, index) => {
                const blockDef = schemaBlocksDef.find(b => b.type === presetBlock.type);
                const blockSettings = {};
                
                if (blockDef && blockDef.settings) {
                    blockDef.settings.forEach(setting => {
                        blockSettings[setting.id] = getDummyData(setting);
                    });
                }
                if (presetBlock.settings) {
                    Object.assign(blockSettings, presetBlock.settings);
                }
                
                const existingBlock = sectionState.blocks[index];
                if (existingBlock && existingBlock.type === presetBlock.type) {
                    Object.assign(blockSettings, existingBlock.settings);
                }
                
                newBlocks.push({
                    type: presetBlock.type,
                    settings: blockSettings
                });
            });
        }
        sectionState.blocks = newBlocks;
    }

    function generateInputHtml(setting, value, target, blockIndex = -1) {
        const id = setting.id;
        const label = setting.label || id;
        const type = setting.type;
        const dataAttrs = `data-target="${target}" data-id="${id}" data-type="${type}" ${blockIndex >= 0 ? `data-block-index="${blockIndex}"` : ''}`;
        
        let inputHtml = '';
        const safeVal = (value || '').toString().replace(/"/g, '&quot;');
        
        if (type === 'text' || type === 'image_picker' || type === 'url' || type === 'video_url') {
            inputHtml = `<input type="text" value="${safeVal}" ${dataAttrs}>`;
        } else if (type === 'textarea' || type === 'richtext' || type === 'html' || type === 'liquid') {
            inputHtml = `<textarea ${dataAttrs}>${safeVal}</textarea>`;
        } else if (type === 'color' || type === 'color_background') {
            const hexVal = (value && typeof value === 'string' && value.startsWith('#')) ? value.substring(0, 7) : '#000000';
            inputHtml = `<input type="color" value="${hexVal}" ${dataAttrs}>`;
        } else if (type === 'range' || type === 'number') {
            inputHtml = `<input type="number" value="${value || 0}" ${dataAttrs}>`;
        } else if (type === 'checkbox') {
            inputHtml = `<input type="checkbox" ${value ? 'checked' : ''} ${dataAttrs}>`;
        } else if (type === 'select' || type === 'radio') {
            inputHtml = `<select ${dataAttrs}>`;
            if (setting.options) {
                setting.options.forEach(opt => {
                    const optVal = opt.value || opt;
                    const optLabel = opt.label || optVal;
                    inputHtml += `<option value="${optVal}" ${value === optVal ? 'selected' : ''}>${optLabel}</option>`;
                });
            }
            inputHtml += `</select>`;
        } else {
            inputHtml = `<input type="text" value="${safeVal}" ${dataAttrs}>`;
        }
        
        return `
            <div class="setting-control">
                <label>${label}</label>
                ${inputHtml}
            </div>
        `;
    }

    function renderSidebar() {
        if (!currentSchema) {
            settingsContent.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No schema found in code.</p>';
            return;
        }
        
        let html = '';
        if (currentSchema.settings && currentSchema.settings.length > 0) {
            html += '<div class="settings-group"><h3>Section Settings</h3>';
            currentSchema.settings.forEach(setting => {
                html += generateInputHtml(setting, sectionState.settings[setting.id], 'section');
            });
            html += '</div>';
        }
        
        if (sectionState.blocks.length > 0) {
            sectionState.blocks.forEach((block, index) => {
                html += `<div class="settings-group"><h3>Block: ${block.type}</h3>`;
                const blockDef = (currentSchema.blocks || []).find(b => b.type === block.type);
                if (blockDef && blockDef.settings) {
                    blockDef.settings.forEach(setting => {
                        html += generateInputHtml(setting, block.settings[setting.id], 'block', index);
                    });
                }
                html += '</div>';
            });
        }
        
        if (!html) html = '<p style="padding: 20px; color: var(--text-secondary);">No settings defined in schema.</p>';
        settingsContent.innerHTML = html;
        
        settingsContent.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('input', (e) => {
                const type = e.target.dataset.type;
                const id = e.target.dataset.id;
                const targetType = e.target.dataset.target;
                const blockIndex = e.target.dataset.blockIndex;
                
                let val = e.target.value;
                if (type === 'checkbox') val = e.target.checked;
                if (type === 'range' || type === 'number') val = Number(val);
                
                if (targetType === 'section') {
                    sectionState.settings[id] = val;
                } else if (targetType === 'block') {
                    sectionState.blocks[blockIndex].settings[id] = val;
                }
                
                renderPreviewStateOnly();
            });
        });
    }

    // Helper: Build settings object filling missing values with dummy data
    function buildSettings(settingsDef) {
        const settingsObj = {};
        if (settingsDef && Array.isArray(settingsDef)) {
            settingsDef.forEach(setting => {
                if (setting.id) {
                    settingsObj[setting.id] = getDummyData(setting);
                }
            });
        }
        return settingsObj;
    }

    async function executeRender(codeWithoutSchema, context) {
        let success = false;
        let attempts = 0;
        let html = '';

        while (!success && attempts < 10) {
            try {
                html = await engine.parseAndRender(codeWithoutSchema, context);
                success = true;
            } catch (error) {
                const errorMsg = error.message || '';
                
                const match = errorMsg.match(/tag "([^"]+)" not found/);
                if (match && match[1]) {
                    const unknownTag = match[1];
                    engine.registerTag(unknownTag, {
                        parse: function(tagToken) { this.args = tagToken.args; },
                        render: function(ctx, emitter) { emitter.write(`<!-- Mock: ${unknownTag} -->`); }
                    });
                    attempts++;
                    continue;
                }
                
                console.error("Liquid rendering error:", error);
                
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

                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
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
                return;
            }
        }

        if (success) {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
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

    // Main render function
    async function renderPreview() {
        const code = editor.getValue();
        const schema = extractSchema(code);
        syncStateWithSchema(schema);
        
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
    }
    
    // Fast render when editing sidebar (skips re-syncing schema)
    async function renderPreviewStateOnly() {
        const code = editor.getValue();
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
    }

    // Load from URL Hash if exists
    function loadFromUrl() {
        if (window.location.hash) {
            try {
                // Remove '#' and decode base64
                const encoded = window.location.hash.substring(1);
                const decoded = decodeURIComponent(atob(encoded));
                editor.setValue(decoded);
            } catch (e) {
                console.error("Failed to decode URL hash");
            }
        }
    }

    // Save to URL Hash
    function shareLink() {
        const code = editor.getValue();
        // Encode base64 and make URL safe
        const encoded = btoa(encodeURIComponent(code));
        const newUrl = window.location.pathname + '?mode=editor#' + encoded;
        window.history.replaceState(null, null, newUrl);
        
        // Copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast();
        });
    }

    function sharePreviewLink() {
        const code = editor.getValue();
        const encoded = btoa(encodeURIComponent(code));
        const newUrl = window.location.pathname + '?mode=fullscreen#' + encoded;
        window.history.replaceState(null, null, newUrl);
        
        // Copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast();
        });
    }

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Event Listeners
    runBtn.addEventListener('click', renderPreview);
    shareBtn.addEventListener('click', shareLink);
    if (sharePreviewBtn) {
        sharePreviewBtn.addEventListener('click', sharePreviewLink);
    }
    
    // Sidebar Edit Button Listeners
    if (editSettingsBtn) {
        editSettingsBtn.addEventListener('click', () => {
            renderSidebar();
            settingsSidebar.classList.add('open');
        });
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsSidebar.classList.remove('open');
        });
    }
    
    // Full Screen Toggle
    const fullScreenToggle = document.getElementById('fullScreenToggle');
    if (fullScreenToggle) {
        fullScreenToggle.addEventListener('click', () => {
            document.body.classList.toggle('preview-fullscreen');
            fullScreenToggle.classList.toggle('active');
        });
    }
    
    // Auto-render on code change (with debounce)
    let timeout;
    editor.on('change', () => {
        clearTimeout(timeout);
        timeout = setTimeout(renderPreview, 1000); // 1s debounce
    });

    desktopBtn.addEventListener('click', () => {
        previewPane.classList.remove('mobile-view');
        desktopBtn.classList.add('active');
        mobileBtn.classList.remove('active');
    });

    mobileBtn.addEventListener('click', () => {
        previewPane.classList.add('mobile-view');
        mobileBtn.classList.add('active');
        desktopBtn.classList.remove('active');
    });

    // Check mode
    function checkMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'fullscreen') {
            document.body.classList.add('fullscreen-mode');
        }
    }

    // Initial Load
    checkMode();
    loadFromUrl();
    renderPreview();
});
