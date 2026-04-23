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

    saveLeadData: function (data) {
        // data: { full_name, email, cpf, phone }
        if (data.full_name) localStorage.setItem('lead_full_name', data.full_name);
        if (data.email) localStorage.setItem('lead_email', data.email);
        if (data.cpf) localStorage.setItem('lead_cpf', data.cpf);
        if (data.phone) localStorage.setItem('lead_phone', data.phone);
    },

    getLeadData: function () {
        return {
            full_name: localStorage.getItem('lead_full_name') || '',
            email: localStorage.getItem('lead_email') || '',
            cpf: localStorage.getItem('lead_cpf') || '',
            phone: localStorage.getItem('lead_phone') || ''
        };
    },

    // --- URL Helper ---

    buildCheckoutURL: function (baseUrl) {
        const lead = this.getLeadData();
        const currentParams = new URLSearchParams(window.location.search);

        // Preserve existing UTMs from URL or localStorage if needed
        // (Assuming UTM tracking script handles UTM persistence mostly, 
        // but we ensure we pass them forward if present in current URL)

        // Construct new params
        const newParams = new URLSearchParams();

        // Copy current URL params (preserves tracking)
        for (const [key, value] of currentParams.entries()) {
            newParams.append(key, value);
        }

        // Overwrite/Append User Data
        if (lead.full_name) newParams.set('name', lead.full_name);
        if (lead.email) newParams.set('email', lead.email);
        if (lead.cpf) newParams.set('cpf', lead.cpf);
        if (lead.phone) newParams.set('phone', lead.phone);
        // PepperPay specific fields (if different, adjust here. Assuming standard query params work)

        // Check if baseUrl already has params
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}${newParams.toString()}`;
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
