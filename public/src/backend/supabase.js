"use strict";

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseConfig() {
    if (!SUPABASE_URL) {
        throw new Error(
            "SUPABASE_URL belum diatur di Vercel."
        );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY belum diatur di Vercel."
        );
    }

    return {
        url: SUPABASE_URL,
        key: SUPABASE_SERVICE_ROLE_KEY
    };
}

async function supabaseRequest(path, options = {}) {
    const config = getSupabaseConfig();

    const headers = {
        "Content-Type": "application/json",
        "apikey": config.key,
        "Authorization": `Bearer ${config.key}`,
        ...(options.headers || {})
    };

    const response = await fetch(
        `${config.url}${path}`,
        {
            ...options,
            headers
        }
    );

    const responseText =
        await response.text();

    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            data = {
                raw: responseText
            };
        }
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error_description ||
            data?.msg ||
            `Supabase HTTP ${response.status}`;

        const error =
            new Error(message);

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }

    return data;
}

export {
    supabaseRequest
};