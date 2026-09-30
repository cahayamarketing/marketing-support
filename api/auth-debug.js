"use strict";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const gasUrl = process.env.GAS_WEB_APP_URL;

        const payload = req.body?.payload || {};

        const response = await fetch(gasUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: "login",
                payload
            }),
            redirect: "follow"
        });

        const text = await response.text();

        return res.status(200).json({
            success: true,
            gasStatus: response.status,
            gasContentType:
                response.headers.get("content-type"),
            gasResponseLength: text.length,
            gasResponsePreview: text.substring(0, 500)
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}