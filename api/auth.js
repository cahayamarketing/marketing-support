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

        if (!gasUrl) {
            return res.status(500).json({
                success: false,
                message: "GAS_WEB_APP_URL belum tersedia di Vercel."
            });
        }

        const body = req.body || {};

        const action = body.action;
        const payload = body.payload || {};

        if (action !== "login") {
            return res.status(400).json({
                success: false,
                message: "Action tidak valid."
            });
        }

        const response = await fetch(gasUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: "login",
                payload: payload
            }),
            redirect: "follow"
        });

        const responseText = await response.text();

        let result;

        try {
            result = JSON.parse(responseText);
        } catch (error) {
            return res.status(502).json({
                success: false,
                message: "Response dari GAS bukan JSON.",
                raw: responseText
            });
        }

        return res.status(response.status).json(result);

    } catch (error) {
        console.error("AUTH ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Gagal menghubungi GAS."
        });
    }
}