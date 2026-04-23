(function () {
    // --- Configuration ---
    const CHECKOUT_DOMAINS = [
        'checkout.pagamentospay.site',
        'pay',
        'pagamento',
        'checkout',
        'kirvano',
        'pepper',
        'tribopay',
        'perfectpay',
        'gopay',
        'respondasptfy.shop' // Internal redirects often used for upsells
    ];

    const STORAGE_KEYS = {
        name: 'lead_full_name',
        email: 'lead_email',
        phone: 'lead_phone',
        cpf: 'lead_cpf'
    };

    // --- Utilities ---
    const CheckoutUtils = {
        // Remove non-numeric characters
        cleanDigits: function (value) {
            return value ? value.replace(/\D/g, '') : '';
        },

        // Save data to LocalStorage (merges with existing)
        saveData: function (data) {
            if (data.name) localStorage.setItem(STORAGE_KEYS.name, data.name);
            if (data.email) localStorage.setItem(STORAGE_KEYS.email, data.email);
            if (data.phone) localStorage.setItem(STORAGE_KEYS.phone, this.cleanDigits(data.phone));
            if (data.cpf) localStorage.setItem(STORAGE_KEYS.cpf, this.cleanDigits(data.cpf));
        },

        // Retrieve data from LocalStorage
        getData: function () {
            return {
                name: localStorage.getItem(STORAGE_KEYS.name) || '',
                email: localStorage.getItem(STORAGE_KEYS.email) || '',
                phone: this.cleanDigits(localStorage.getItem(STORAGE_KEYS.phone) || ''),
                cpf: this.cleanDigits(localStorage.getItem(STORAGE_KEYS.cpf) || '')
            };
        },

        // Check if a URL belongs to a checkout or payment flow
        isCheckoutUrl: function (url) {
            if (!url || url.startsWith('#') || url.startsWith('javascript:')) return false;
            return CHECKOUT_DOMAINS.some(domain => url.includes(domain));
        },

        // Append user data params to a URL
        appendParamsToUrl: function (urlStr) {
            try {
                const data = this.getData();

                // Handle relative URLs by creating a dummy base if needed
                // If it starts with http, it's absolute. Otherwise relative.
                const isAbsolute = urlStr.match(/^https?:\/\//);
                const dummyBase = 'https://example.com';
                const urlObj = new URL(urlStr, isAbsolute ? undefined : dummyBase);
                const params = urlObj.searchParams;

                // Helper to set param if missing
                const setIfMissing = (keys, value) => {
                    if (!value) return;
                    // If none of the keys exist, set the first one
                    const hasKey = keys.some(k => params.has(k));
                    if (!hasKey) {
                        keys.forEach(k => params.set(k, value));
                    }
                };

                // Helper to force overwrite (for known standard params)
                const setOrOverwrite = (key, value) => {
                    if (value) params.set(key, value);
                };

                // Strategy: Be redundant to ensure compatibility with different gateways

                // NAME
                if (data.name) {
                    setOrOverwrite('name', data.name);
                    setOrOverwrite('nome', data.name);
                    setOrOverwrite('full_name', data.name);
                }

                // EMAIL
                if (data.email) {
                    setOrOverwrite('email', data.email);
                }

                // PHONE
                if (data.phone) {
                    const cleanPhone = this.cleanDigits(data.phone);
                    setOrOverwrite('phone', cleanPhone);
                    setOrOverwrite('tel', cleanPhone);
                    setOrOverwrite('celular', cleanPhone);
                    setOrOverwrite('whatsapp', cleanPhone);
                }

                // CPF
                if (data.cpf) {
                    const cleanCpf = this.cleanDigits(data.cpf);
                    setOrOverwrite('cpf', cleanCpf);
                    setOrOverwrite('doc', cleanCpf);
                    setOrOverwrite('document', cleanCpf);
                }

                // UTMs (Pass forward existing UTMs from localStorage if not in URL)
                ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(utm => {
                    if (!params.has(utm)) {
                        const storedUtm = localStorage.getItem(utm);
                        if (storedUtm) params.set(utm, storedUtm);
                    }
                });

                // Return appropriate format
                if (isAbsolute) {
                    return urlObj.toString();
                } else {
                    return urlObj.pathname + urlObj.search + urlObj.hash;
                }
            } catch (e) {
                console.warn('CheckoutUtils: Invalid URL', urlStr, e);
                return urlStr;
            }
        },

        // Main function to run on page load
        processPage: function () {
            // 1. Capture Data from current URL (Upsell entry or Redirect)
            const currentParams = new URLSearchParams(window.location.search);
            const newData = {};

            const pName = currentParams.get('nome') || currentParams.get('name') || currentParams.get('full_name');
            if (pName) newData.name = pName;

            const pEmail = currentParams.get('email');
            if (pEmail) newData.email = pEmail;

            const pPhone = currentParams.get('phone') || currentParams.get('tel') || currentParams.get('celular') || currentParams.get('whatsapp');
            if (pPhone) newData.phone = pPhone;

            const pCpf = currentParams.get('cpf') || currentParams.get('doc');
            if (pCpf) newData.cpf = pCpf;

            if (Object.keys(newData).length > 0) {
                this.saveData(newData);
            }

            // 2. Find and Rewrite Links
            const links = document.querySelectorAll('a[href], form[action], iframe[src]');
            links.forEach(el => {
                let attr = '';
                if (el.tagName === 'A') attr = 'href';
                else if (el.tagName === 'FORM') attr = 'action';
                else if (el.tagName === 'IFRAME') attr = 'src';

                const rawUrl = el.getAttribute(attr);
                if (this.isCheckoutUrl(rawUrl)) {
                    const newUrl = this.appendParamsToUrl(rawUrl);
                    if (newUrl !== rawUrl) {
                        el.setAttribute(attr, newUrl);
                    }
                }
            });
        }
    };

    // Expose globally
    window.CheckoutUtils = CheckoutUtils;

    // Run on Load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CheckoutUtils.processPage());
    } else {
        CheckoutUtils.processPage();
    }

})();
