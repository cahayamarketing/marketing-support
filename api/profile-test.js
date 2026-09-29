"use strict";

import {
    supabaseRequest
} from "../src/backend/supabase.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const nik = String(
            req.query?.nik || ""
        ).trim();

        if (!nik) {
            return res.status(400).json({
                success: false,
                message: "Parameter nik wajib diisi."
            });
        }

        const rows = await supabaseRequest(
            `/rest/v1/v_user_profile?nik=eq.${encodeURIComponent(nik)}&select=*`,
            {
                method: "GET"
            }
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Profile user tidak ditemukan."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile user berhasil diambil.",
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "PROFILE TEST ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}