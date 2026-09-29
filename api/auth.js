"use strict";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    return res.status(200).json({
        success: true,
        message: "API AUTH Vercel aktif."
    });
}