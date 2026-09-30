"use strict";

import {
    supabaseRequest
} from "../src/backend/supabase.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const body = req.body || {};

        const nik = String(
            body.nik || ""
        ).trim();

        const password = String(
            body.password || ""
        );

        if (!nik) {
            return res.status(400).json({
                success: false,
                message: "NIK wajib diisi."
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password wajib diisi."
            });
        }

        // ==========================================
        // 1. CEK SALESMAN
        // ==========================================

        const salesmanRows =
            await supabaseRequest(
                `/rest/v1/salesman?nik=eq.${encodeURIComponent(nik)}&select=nik,nama_marketing,auth_user_id`,
                {
                    method: "GET"
                }
            );

        if (
            !Array.isArray(salesmanRows) ||
            salesmanRows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "NIK tidak ditemukan di tabel salesman."
            });
        }

        const salesman =
            salesmanRows[0];

        // ==========================================
        // 2. CEK APAKAH SUDAH PUNYA AUTH USER
        // ==========================================

        if (salesman.auth_user_id) {
            return res.status(409).json({
                success: false,
                message:
                    "User ini sudah memiliki Supabase Auth.",
                authUserId:
                    salesman.auth_user_id
            });
        }

        // ==========================================
        // 3. BUAT EMAIL INTERNAL
        // ==========================================

        const email =
            `${nik}@pkm-auth.local`;

        // ==========================================
        // 4. BUAT USER SUPABASE AUTH
        // ==========================================

        const authUser =
            await supabaseRequest(
                "/auth/v1/admin/users",
                {
                    method: "POST",

                    body: JSON.stringify({
                        email,
                        password,
                        email_confirm: true,

                        user_metadata: {
                            nik,
                            nama_marketing:
                                salesman.nama_marketing ||
                                ""
                        }
                    })
                }
            );

        const authUserId =
            authUser?.id;

        if (!authUserId) {
            throw new Error(
                "Supabase Auth tidak mengembalikan user ID."
            );
        }

        // ==========================================
        // 5. SIMPAN AUTH USER ID
        // ==========================================

        await supabaseRequest(
            `/rest/v1/salesman?nik=eq.${encodeURIComponent(nik)}`,
            {
                method: "PATCH",

                headers: {
                    "Prefer": "return=minimal"
                },

                body: JSON.stringify({
                    auth_user_id:
                        authUserId
                })
            }
        );

        return res.status(200).json({
            success: true,

            message:
                "Supabase Auth user berhasil dibuat.",

            nik,

            nama:
                salesman.nama_marketing,

            authUserId,

            email
        });

    } catch (error) {

        console.error(
            "AUTH MIGRATE ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal membuat Supabase Auth user."
        });
    }
}