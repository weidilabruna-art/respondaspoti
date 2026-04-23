/**
 * Form Utilities for Validation, Persistence, and URL Generation
 */

const FormUtils = {
    // --- Validation ---

    validateFullName: function (name) {
        if (!name) return false;
        // Permitir nome único (apenas verifica se tem caracteres suficientes)
        return name.trim().length >= 2;
    },

    validateEmail: function (email) {
        if (!email) return false;
        // Simple regex for email validation
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validateCPF: function (cpf) {
        if (!cpf) return false;
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++)
            sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;

        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++)
            sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;

        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    },

    // --- Persistence ---
    cleanDigits: function (value) {
        return value ? value.replace(/\D/g, '') : '';
    },

    saveLeadData: function (data) {
        // data: { full_name, email, cpf, phone }
        if (data.full_name) localStorage.setItem('lead_full_name', data.full_name);
        if (data.email) localStorage.setItem('lead_email', data.email);
        if (data.cpf) localStorage.setItem('lead_cpf', this.cleanDigits(data.cpf)); // Save clean
        if (data.phone) localStorage.setItem('lead_phone', this.cleanDigits(data.phone)); // Save clean
    },

    getLeadData: function () {
        return {
            full_name: localStorage.getItem('lead_full_name') || '',
            email: localStorage.getItem('lead_email') || '',
            cpf: this.cleanDigits(localStorage.getItem('lead_cpf') || ''),
            phone: this.cleanDigits(localStorage.getItem('lead_phone') || '')
        };
    },

    // --- URL Helper ---

    buildCheckoutURL: function (baseUrl) {
        const lead = this.getLeadData();
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams();

        // 1. Copy current URL params (preserves tracking)
        for (const [key, value] of currentParams.entries()) {
            newParams.append(key, value);
        }

        // 2. Overwrite/Append User Data with Redundancy for Brazilian Checkouts
        const cleanCpf = this.cleanDigits(lead.cpf || currentParams.get('cpf') || currentParams.get('pix'));
        const cleanPhone = this.cleanDigits(lead.phone || currentParams.get('phone') || currentParams.get('tel'));
        const fullName = lead.full_name || currentParams.get('name') || currentParams.get('nome');
        const email = lead.email || currentParams.get('email');

        if (fullName) {
            newParams.set('name', fullName);
            newParams.set('nome', fullName);
            newParams.set('full_name', fullName);
        }
        if (email) {
            newParams.set('email', email);
        }
        if (cleanCpf) {
            newParams.set('cpf', cleanCpf);
            newParams.set('pix', cleanCpf); // Added for status page consistency
            newParams.set('document', cleanCpf);
            newParams.set('doc', cleanCpf);
        }
        if (cleanPhone) {
            newParams.set('phone', cleanPhone);
            newParams.set('tel', cleanPhone);
            newParams.set('cell', cleanPhone);
        }

        const separator = baseUrl.includes('?') ? '&' : '?';
        const finalUrl = `${baseUrl}${separator}${newParams.toString()}`;
        console.log("FormUtils: Generated URL ->", finalUrl);
        return finalUrl;
    },

    // --- Input Mask Helper ---

    maskCPF: function (value) {
        return value
            .replace(/\D/g, '') // Remove non-digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1'); // Capture max 11 digits
    }
};
