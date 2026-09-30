"use strict";

import { supabaseRequest } from "../src/backend/supabase.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const data = await supabaseRequest(
            "/rest/v1/pkm?select=*&order=created_at.desc",
            {
                method: "GET"
            }
        );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error("PKM API ERROR:", error);

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil data PKM.",
            data:
                error.data || null
        });
    }
}