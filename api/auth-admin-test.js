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
            "/auth/v1/admin/users?per_page=1",
            {
                method: "GET"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Supabase Auth Admin API berhasil diakses.",
            usersFound:
                rows?.users?.length || 0
        });

    } catch (error) {
        console.error(
            "AUTH ADMIN TEST ERROR:",
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