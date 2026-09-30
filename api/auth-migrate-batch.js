"use strict";

import {
    supabaseRequest
} from "../src/backend/services/supabase.js";

const INITIAL_PASSWORD = "123456";
const BATCH_SIZE = 10;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        // ==========================================
        // 1. AMBIL USER YANG BELUM PUNYA AUTH
        // ==========================================

        const users = await supabaseRequest(
            `/rest/v1/salesman?auth_user_id=is.null&select=nik,nama_marketing,auth_user_id&limit=${BATCH_SIZE}`,
            {
                method: "GET"
            }
        );

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Tidak ada user yang perlu dimigrasikan.",
                processed: 0,
                successCount: 0,
                failedCount: 0
            });
        }

        const results = [];

        // ==========================================
        // 2. PROSES SATU PER SATU
        // ==========================================

        for (const user of users) {

            const nik =
                String(user.nik || "").trim();

            const nama =
                String(
                    user.nama_marketing || ""
                ).trim();

            if (!nik) {
                results.push({
                    nik: "",
                    nama,
                    status: "FAILED",
                    message: "NIK kosong."
                });

                continue;
            }

            try {

                // ----------------------------------
                // Buat Supabase Auth User
                // ----------------------------------

                const email =
                    `${nik}@pkm-auth.local`;

                const authUser =
                    await supabaseRequest(
                        "/auth/v1/admin/users",
                        {
                            method: "POST",

                            body: JSON.stringify({
                                email,
                                password:
                                    INITIAL_PASSWORD,

                                email_confirm: true,

                                user_metadata: {
                                    nik,
                                    nama_marketing:
                                        nama
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

                // ----------------------------------
                // Simpan auth_user_id
                // ----------------------------------

                await supabaseRequest(
                    `/rest/v1/salesman?nik=eq.${encodeURIComponent(nik)}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        },

                        body: JSON.stringify({
                            auth_user_id:
                                authUserId
                        })
                    }
                );

                results.push({
                    nik,
                    nama,
                    status: "SUCCESS",
                    authUserId
                });

            } catch (error) {

                results.push({
                    nik,
                    nama,
                    status: "FAILED",
                    message:
                        error.message ||
                        "Gagal membuat Auth user."
                });
            }
        }

        const successCount =
            results.filter(
                x => x.status === "SUCCESS"
            ).length;

        const failedCount =
            results.filter(
                x => x.status === "FAILED"
            ).length;

        return res.status(200).json({
            success: true,

            message:
                "Batch migrasi selesai.",

            processed:
                results.length,

            successCount,

            failedCount,

            results
        });

    } catch (error) {

        console.error(
            "AUTH BATCH MIGRATION ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Migrasi batch gagal."
        });
    }
}