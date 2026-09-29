"use strict";

import {
    supabaseRequest
} from "../src/backend/services/supabase.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const rows = await supabaseRequest(
            "/rest/v1/salesman?select=nik,nama_marketing&limit=1",
            {
                method: "GET"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Koneksi Supabase berhasil.",
            data: rows
        });

    } catch (error) {
        console.error(
            "SUPABASE TEST ERROR:",
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