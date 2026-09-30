"use strict";

import {
    supabaseRequest
} from "../src/backend/supabase.js";

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

async function loginSupabase(email, password) {
    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                email,
                password
            })
        }
    );

    const text = await response.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = {
            raw: text
        };
    }

    if (!response.ok) {
        const error = new Error(
            data?.msg ||
            data?.message ||
            "Login Supabase gagal."
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {

        const body =
            req.body || {};

        const payload =
            body.payload || {};

        const nik =
            String(
                payload.nik || ""
            ).trim();

        const password =
            String(
                payload.password || ""
            );

        if (!nik || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "NIK dan password wajib diisi."
            });
        }

        // ==========================================
        // 1. CARI PROFILE USER
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
                    "Profile user tidak ditemukan."
            });
        }

        const profile =
            profileRows[0];

        // ==========================================
        // 2. CEK LOGIN
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
        // 3. USER SUDAH MIGRASI?
        // ==========================================

        if (profile.auth_user_id) {

            // ======================================
            // SUPABASE AUTH
            // ======================================

            const email =
                `${nik}@pkm-auth.local`;

            const auth =
                await loginSupabase(
                    email,
                    password
                );

            const user = {
                id: profile.nik,
                nik: profile.nik,
                username: profile.nik,

                name:
                    profile.nama_marketing || "",

                jabatan:
                    profile.jab || "",

                pos:
                    profile.pos || "",

                originalBranch:
                    profile.cab || "",

                branch:
                    String(
                        profile.cab || ""
                    )
                        .trim()
                        .toUpperCase() === "HO"
                        ? "ALL"
                        : String(
                            profile.cab || ""
                        )
                            .trim()
                            .toUpperCase(),

                branchName:
                    String(
                        profile.cab || ""
                    )
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
                    profile.auth_user_id
            };

            return res.status(200).json({
                success: true,

                result: {
                    success: true,

                    message:
                        "Login berhasil.",

                    token:
                        auth.access_token,

                    refreshToken:
                        auth.refresh_token,

                    expiresIn:
                        auth.expires_in,

                    user
                }
            });
        }

        // ==========================================
        // 4. BELUM MIGRASI → GAS FALLBACK
        // ==========================================

        const gasUrl =
            process.env.GAS_WEB_APP_URL;

        if (!gasUrl) {
            return res.status(500).json({
                success: false,
                message:
                    "GAS_WEB_APP_URL belum tersedia."
            });
        }

        const gasResponse =
            await fetch(
                gasUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({
                        action: "login",
                        payload
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
        } catch {
            return res.status(502).json({
                success: false,
                message:
                    "Response dari GAS bukan JSON."
            });
        }

        if (
            !gasResult ||
            gasResult.success !== true
        ) {
            return res.status(
                gasResponse.status || 401
            ).json(gasResult);
        }

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
                String(
                    profile.cab || ""
                )
                    .trim()
                    .toUpperCase() === "HO"
                    ? "ALL"
                    : String(
                        profile.cab || ""
                    )
                        .trim()
                        .toUpperCase(),

            branchName:
                String(
                    profile.cab || ""
                )
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
                profile.auth_user_id || null
        };

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