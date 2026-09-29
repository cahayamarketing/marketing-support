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

        const nik = String(
            payload.nik || ""
        ).trim();

        if (!nik) {
            return res.status(400).json({
                success: false,
                message: "NIK wajib diisi."
            });
        }

        // ==========================================
        // 1. VALIDASI PASSWORD MELALUI GAS
        // ==========================================

        const gasResponse = await fetch(
            gasUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "login",
                    payload: payload
                }),
                redirect: "follow"
            }
        );

        const gasText =
            await gasResponse.text();

        let gasResult;

        try {
            gasResult =
                JSON.parse(gasText);
        } catch (error) {
            return res.status(502).json({
                success: false,
                message:
                    "Response dari GAS bukan JSON."
            });
        }

        // Kalau GAS gagal login,
        // langsung kembalikan errornya.
        if (
            !gasResult ||
            gasResult.success !== true
        ) {
            return res.status(
                gasResponse.status || 401
            ).json(gasResult);
        }

        // ==========================================
        // 2. AMBIL PROFILE DARI SUPABASE
        // ==========================================

        const profileRows =
            await supabaseRequest(
                `/rest/v1/v_user_profile?nik=eq.${encodeURIComponent(nik)}&select=*`,
                {
                    method: "GET"
                }
            );

        if (
            !Array.isArray(profileRows) ||
            profileRows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Password benar, tetapi profile user tidak ditemukan di Supabase."
            });
        }

        const profile =
            profileRows[0];

        // ==========================================
        // 3. CEK LOGIN_ALLOWED
        // ==========================================

        if (
            profile.login_allowed === false
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Akun ini tidak diizinkan untuk login."
            });
        }

        // ==========================================
        // 4. GABUNGKAN USER GAS + SUPABASE
        // ==========================================

        const gasUser =
            gasResult.result?.user ||
            gasResult.user ||
            {};

        const user = {
            ...gasUser,

            id: profile.nik,
            nik: profile.nik,

            username: profile.nik,

            name:
                profile.nama_marketing ||
                gasUser.name ||
                "",

            jabatan:
                profile.jab ||
                gasUser.jabatan ||
                "",

            pos:
                profile.pos ||
                gasUser.pos ||
                "",

            originalBranch:
                profile.cab || "",

            branch:
                String(profile.cab || "")
                    .trim()
                    .toUpperCase() === "HO"
                    ? "ALL"
                    : String(
                        profile.cab || ""
                    )
                        .trim()
                        .toUpperCase(),

            branchName:
                String(profile.cab || "")
                    .trim()
                    .toUpperCase() === "HO"
                    ? "SEMUA CABANG"
                    : profile.cab || "",

            role:
                profile.approval_role ||
                "USER",

            approvalRole:
                profile.approval_role ||
                "USER",

            canApprove:
                profile.can_approve === true,

            loginAllowed:
                profile.login_allowed !== false,

            access:
                String(
                    profile.sebagai ||
                    gasUser.access ||
                    "USER"
                ).toUpperCase(),

            leaderId:
                profile.id_tl || "",

            leaderName:
                profile.tl || "",

            status:
                String(
                    profile.status ||
                    "AKTIF"
                ).toUpperCase(),

            rolePkm:
                profile.role_pkm || "",

            authUserId:
                profile.auth_user_id ||
                null
        };

        // ==========================================
        // 5. RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,

            result: {
                success: true,

                message:
                    gasResult.message ||
                    "Login berhasil.",

                token:
                    gasResult.result?.token ||
                    gasResult.token ||
                    null,

                user
            }
        });

    } catch (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Login gagal."
        });
    }
}