"use strict";

const { google } = require("googleapis");
const { Readable } = require("stream");
const crypto = require("crypto");

const PKM_ITEM_DRIVE_ID =
    process.env.PKM_ITEM_DRIVE_ID;

const PKM_ITEM_IMAGES_DRIVE_ID =
    process.env.PKM_ITEM_IMAGES_DRIVE_ID;    

const LPJ_IMAGES_DRIVE_ID =
    process.env.LPJ_IMAGES_DRIVE_ID;

function getPkmImagesFolderId() {

    if (!PKM_ITEM_DRIVE_ID) {

        throw new Error(
            "PKM_ITEM_DRIVE_ID belum dikonfigurasi."
        );
    }

    return PKM_ITEM_DRIVE_ID;
}

function getPkmItemImagesDriveClient() {

    const clientId =
        process.env.GOOGLE_OAUTH_CLIENT_ID;

    const clientSecret =
        process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    const redirectUri =
        process.env.GOOGLE_OAUTH_REDIRECT_URI;

    const refreshToken =
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (
        !clientId ||
        !clientSecret ||
        !redirectUri ||
        !refreshToken
    ) {

        const error =
            new Error(
                "Konfigurasi Google Drive OAuth PKM ITEM belum lengkap."
            );

        error.status = 500;

        throw error;
    }

    if (!PKM_ITEM_IMAGES_DRIVE_ID) {

        const error =
            new Error(
                "PKM_ITEM_IMAGES_DRIVE_ID belum dikonfigurasi."
            );

        error.status = 500;

        throw error;
    }

    const auth =
        new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

    auth.setCredentials({
        refresh_token:
            refreshToken
    });

    return google.drive({
        version: "v3",
        auth
    });
}


async function uploadPkmItemImage({
    pkmId,
    itemId,
    imageData,
    type
}) {

    const value =
        String(
            imageData || ""
        ).trim();

    if (!value) {
        return "";
    }

    const match =
        value.match(
            /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\r\n]+)$/i
        );

    if (!match) {

        const error =
            new Error(
                `Format ${type} PKM ITEM tidak valid.`
            );

        error.status = 400;

        throw error;
    }

    const rawExtension =
        match[1].toLowerCase();

    const extension =
        rawExtension === "jpeg" ||
        rawExtension === "jpg"
            ? "jpg"
            : rawExtension;

    const mimeType =
        extension === "jpg"
            ? "image/jpeg"
            : `image/${extension}`;

    const buffer =
        Buffer.from(
            match[2].replace(
                /\s+/g,
                ""
            ),
            "base64"
        );

    if (
        buffer.length >
        5 * 1024 * 1024
    ) {

        const error =
            new Error(
                `Ukuran ${type} PKM ITEM terlalu besar. Maksimal 5 MB.`
            );

        error.status = 400;

        throw error;
    }

    const drive =
        getPkmItemImagesDriveClient();

    const folderId =
        PKM_ITEM_IMAGES_DRIVE_ID;

    const safeType =
        String(
            type || "FOTO"
        )
            .toUpperCase()
            .replace(
                /[^A-Z0-9_ -]/g,
                ""
            )
            .replace(
                /\s+/g,
                "_"
            );

    const fileName =
        `${pkmId}.${itemId}.${safeType}.${Date.now()}.${extension}`;

    const uploaded =
        await drive.files.create({

            requestBody: {

                name:
                    fileName,

                parents: [
                    folderId
                ],

                mimeType:
                    mimeType
            },

            media: {

                mimeType:
                    mimeType,

                body:
                    Readable.from(
                        buffer
                    )
            },

            fields:
                "id,name,mimeType"
        });

    if (
        !uploaded.data ||
        !uploaded.data.id
    ) {

        const error =
            new Error(
                `File ${type} PKM ITEM gagal disimpan ke Google Drive.`
            );

        error.status = 500;

        throw error;
    }

    return {
        path:
            `PKM ITEM_Images/${fileName}`,

        fileId:
            uploaded.data.id,

        fileName:
            uploaded.data.name
    };
}


async function uploadLpjImage({
    pkmId,
    lpjId,
    imageData,
    type
}) {

    const value =
        String(
            imageData || ""
        ).trim();

    if (!value) {
        return "";
    }

    if (!LPJ_IMAGES_DRIVE_ID) {

        const error =
            new Error(
                "LPJ_IMAGES_DRIVE_ID belum dikonfigurasi."
            );

        error.status = 500;

        throw error;
    }

    const match =
        value.match(
            /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\r\n]+)$/i
        );

    if (!match) {

        const error =
            new Error(
                `Format ${type} LPJ tidak valid.`
            );

        error.status = 400;

        throw error;
    }

    const rawExtension =
        match[1].toLowerCase();

    const extension =
        rawExtension === "jpeg" ||
        rawExtension === "jpg"
            ? "jpg"
            : rawExtension;

    const mimeType =
        extension === "jpg"
            ? "image/jpeg"
            : `image/${extension}`;

    const buffer =
        Buffer.from(
            match[2].replace(
                /\s+/g,
                ""
            ),
            "base64"
        );

    if (
        buffer.length >
        5 * 1024 * 1024
    ) {

        const error =
            new Error(
                `Ukuran ${type} LPJ terlalu besar. Maksimal 5 MB.`
            );

        error.status = 400;

        throw error;
    }

    const drive =
        getPkmItemImagesDriveClient();

    const safeType =
        String(
            type || "FOTO"
        )
            .toUpperCase()
            .replace(
                /[^A-Z0-9_ -]/g,
                ""
            )
            .replace(
                /\s+/g,
                "_"
            );

    const fileName =
        `${pkmId}.${lpjId}.${safeType}.${Date.now()}.${extension}`;

    const uploaded =
        await drive.files.create({

            requestBody: {

                name:
                    fileName,

                parents: [
                    LPJ_IMAGES_DRIVE_ID
                ],

                mimeType:
                    mimeType
            },

            media: {

                mimeType:
                    mimeType,

                body:
                    Readable.from(
                        buffer
                    )
            },

            fields:
                "id,name,mimeType"
        });

    if (
        !uploaded.data ||
        !uploaded.data.id
    ) {

        const error =
            new Error(
                `File ${type} LPJ gagal disimpan ke Google Drive.`
            );

        error.status = 500;

        throw error;
    }

    return {
        path:
            `LPJ_Images/${fileName}`,

        fileId:
            uploaded.data.id,

        fileName:
            uploaded.data.name
    };
}

/* --------------------------------------------------------------------------
| GOOGLE DRIVE OAUTH
| -------------------------------------------------------------------------- */

const GOOGLE_OAUTH_SCOPE =
    "https://www.googleapis.com/auth/drive";

function getGoogleOAuthClient() {

    const clientId =
        process.env.GOOGLE_OAUTH_CLIENT_ID;

    const clientSecret =
        process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    const redirectUri =
        process.env.GOOGLE_OAUTH_REDIRECT_URI;

    if (
        !clientId ||
        !clientSecret ||
        !redirectUri
    ) {
        const error =
            new Error(
                "Konfigurasi Google OAuth belum lengkap."
            );

        error.status = 500;

        throw error;
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
}


function createOAuthState() {

    const timestamp =
        String(Date.now());

    const secret =
        process.env.GOOGLE_OAUTH_SETUP_SECRET;

    if (!secret) {
        throw new Error(
            "GOOGLE_OAUTH_SETUP_SECRET belum dikonfigurasi."
        );
    }

    const signature =
        crypto
            .createHmac(
                "sha256",
                secret
            )
            .update(timestamp)
            .digest("hex");

    return `${timestamp}.${signature}`;
}


function verifyOAuthState(state) {

    const secret =
        process.env.GOOGLE_OAUTH_SETUP_SECRET;

    if (
        !secret ||
        !state
    ) {
        return false;
    }

    const parts =
        String(state).split(".");

    if (parts.length !== 2) {
        return false;
    }

    const timestamp =
        parts[0];

    const signature =
        parts[1];

    const age =
        Date.now() -
        Number(timestamp);

    // Maksimal 10 menit
    if (
        !Number.isFinite(age) ||
        age < 0 ||
        age > 10 * 60 * 1000
    ) {
        return false;
    }

    const expected =
        crypto
            .createHmac(
                "sha256",
                secret
            )
            .update(timestamp)
            .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
}

/* --------------------------------------------------------------------------
| GOOGLE OAUTH START
| -------------------------------------------------------------------------- */

async function googleOAuthHandler(
    request,
    response
) {

    const setupSecret =
        String(
            request.query?.key ||
            ""
        ).trim();

    if (
        !setupSecret ||
        setupSecret !==
            process.env.GOOGLE_OAUTH_SETUP_SECRET
    ) {
        return response
            .status(403)
            .send(
                "OAuth setup tidak diizinkan."
            );
    }

    const oauth2Client =
        getGoogleOAuthClient();

    const state =
        createOAuthState();

    const authorizationUrl =
        oauth2Client.generateAuthUrl({

            access_type:
                "offline",

            prompt:
                "consent",

            scope: [
                GOOGLE_OAUTH_SCOPE
            ],

            state,

            login_hint:
                "cahaya.marketing.ho@gmail.com"
        });

    return response
        .redirect(
            authorizationUrl
        );
}

/* --------------------------------------------------------------------------
| GOOGLE OAUTH CALLBACK
| -------------------------------------------------------------------------- */

async function googleOAuthCallbackHandler(
    request,
    response
) {

    const code =
        String(
            request.query?.code ||
            ""
        ).trim();

    const state =
        String(
            request.query?.state ||
            ""
        ).trim();

    const oauthError =
        String(
            request.query?.error ||
            ""
        ).trim();

    if (oauthError) {
        return response
            .status(400)
            .send(
                `Google OAuth gagal: ${oauthError}`
            );
    }

    if (
        !verifyOAuthState(state)
    ) {
        return response
            .status(403)
            .send(
                "OAuth state tidak valid atau sudah kedaluwarsa."
            );
    }

    if (!code) {
        return response
            .status(400)
            .send(
                "Authorization code tidak ditemukan."
            );
    }

    try {

        const oauth2Client =
            getGoogleOAuthClient();

        const {
            tokens
        } =
            await oauth2Client.getToken(
                code
            );

        const refreshToken =
            String(
                tokens.refresh_token ||
                ""
            ).trim();

        if (!refreshToken) {

            return response
                .status(500)
                .send(
                    "Refresh token tidak diberikan Google. Ulangi authorization."
                );
        }

        return response
            .status(200)
            .send(`
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Google Drive OAuth Berhasil</title>
                </head>
                <body style="
                    font-family: Arial, sans-serif;
                    padding: 40px;
                ">

                    <h2>Google Drive OAuth berhasil.</h2>

                    <p>
                        Copy refresh token berikut ke
                        Vercel Environment Variables:
                    </p>

                    <textarea
                        readonly
                        style="
                            width:100%;
                            min-height:120px;
                            font-family:monospace;
                            font-size:14px;
                        "
                    >${refreshToken}</textarea>

                    <p>
                        Variable name:
                    </p>

                    <pre>GOOGLE_DRIVE_REFRESH_TOKEN</pre>

                    <p>
                        Setelah disimpan di Vercel,
                        jangan bagikan token ini kepada siapa pun.
                    </p>

                </body>
                </html>
            `);

    } catch (error) {

        console.error(
            "[GOOGLE OAUTH CALLBACK]",
            error
        );

        return response
            .status(
                error?.response?.status ||
                error?.status ||
                500
            )
            .send(
                error?.message ||
                "Google OAuth callback gagal."
            );
    }
}

// Supabase helper kept inside the single Vercel Function.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseConfig() {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL belum diatur di Vercel.");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diatur di Vercel.");
  return { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY };
}

async function supabaseRequest(path, options = {}) {
  const config = getSupabaseConfig();
  const headers = {
    "Content-Type": "application/json",
    "apikey": config.key,
    "Authorization": `Bearer ${config.key}`,
    ...(options.headers || {})
  };
  const response = await fetch(`${config.url}${path}`, { ...options, headers });
  const responseText = await response.text();
  let data = null;
  if (responseText) { try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; } }
  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.msg || `Supabase HTTP ${response.status}`;
    const error = new Error(message); error.status = response.status; error.data = data; throw error;
  }
  return data;
}

// ===== auth =====
const authHandler = (() => {



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

return async function handler(req, res) {

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
})();

// ===== authMigrate =====
const authMigrateHandler = (() => {



const INITIAL_PASSWORD = "123456";
const BATCH_SIZE = 100;

return async function handler(req, res) {
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
})();

// ===== gas =====
const gasHandler = (() => {

return async function handler(
    request,
    response
) {
    const apiStartedAt =
        performance.now();

    if (
        request.method !== "POST"
    ) {
        return response.status(405).json({
            success: false,
            message:
                "Gunakan method POST."
        });
    }

    const appsScriptUrl =
        process.env.GAS_WEB_APP_URL;

    if (!appsScriptUrl) {
        return response.status(500).json({
            success: false,
            message:
                "GAS_WEB_APP_URL belum diatur di Vercel."
        });
    }

    const traceId =
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    try {

        /*
        |--------------------------------------------------------------------------
        | REQUEST BODY
        |--------------------------------------------------------------------------
        */

        let requestBody =
            request.body || {};

        if (
            typeof requestBody ===
            "string"
        ) {
            requestBody =
                JSON.parse(
                    requestBody
                );
        }

        requestBody._traceId =
            traceId;

        console.log(
            "[VERCEL] START",
            traceId,
            requestBody.action
        );

        console.log(
            "[VERCEL] REQUEST BODY READY",
            traceId,
            requestBody.action,
            JSON.stringify(
                requestBody
            ).length,
            "chars"
        );


        if (requestBody.action === "getMyProfile") {
            try {
                const token =
                    String(
                        requestBody.token ||
                        ""
                    ).trim();

                if (!token) {
                    return response.status(401).json({
                        success: false,
                        message: "Session token tidak ditemukan."
                    });
                }

                /*
                * Untuk sementara identitas user diambil
                * dari session frontend yang sekarang.
                *
                * Nanti bisa kita perketat dengan
                * Supabase Auth.
                */
                const payload =
                    requestBody.payload || {};

                const nik =
                    String(
                        payload.nik ||
                        requestBody.userNik ||
                        ""
                    ).trim();

                if (!nik) {
                    return response.status(400).json({
                        success: false,
                        message: "NIK user tidak ditemukan."
                    });
                }

                const rows =
                    await supabaseRequest(
                        "/rest/v1/salesman" +
                        "?select=nik,nama_marketing,ttd_file_id,ttd_url,ttd_storage_path,source_updated_at" +
                        "&nik=eq." +
                        encodeURIComponent(nik) +
                        "&limit=1"
                    );

                if (
                    !Array.isArray(rows) ||
                    !rows.length
                ) {
                    return response.status(404).json({
                        success: false,
                        message: "Data salesman tidak ditemukan."
                    });
                }

                const user =
                    rows[0];

                const ttdFileId =
                    String(
                        user.ttd_file_id ||
                        ""
                    ).trim();

                const ttdUrl =
                    String(
                        user.ttd_url ||
                        ""
                    ).trim();

                const ttdStoragePath =
                    String(
                        user.ttd_storage_path ||
                        ""
                    ).trim();

                let signatureUrl = "";

                /*
                |--------------------------------------------------------------------------
                | PRIORITAS:
                | 1. Supabase Storage
                | 2. Google Drive lama
                |--------------------------------------------------------------------------
                */

                if (ttdStoragePath) {

                    const SUPABASE_URL =
                        process.env.SUPABASE_URL;

                    const SUPABASE_SERVICE_ROLE_KEY =
                        process.env.SUPABASE_SERVICE_ROLE_KEY;

                    if (
                        !SUPABASE_URL ||
                        !SUPABASE_SERVICE_ROLE_KEY
                    ) {
                        throw new Error(
                            "Konfigurasi Supabase belum lengkap."
                        );
                    }

                    const signResponse =
                        await fetch(
                            `${SUPABASE_URL}/storage/v1/object/sign/ttd/${encodeURIComponent(ttdStoragePath).replace(/%2F/g, "/")}`,
                            {
                                method: "POST",

                                headers: {
                                    "Authorization":
                                        `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

                                    "apikey":
                                        SUPABASE_SERVICE_ROLE_KEY,

                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        expiresIn: 3600
                                    })
                            }
                        );

                    const signText =
                        await signResponse.text();

                    let signResult = null;

                    if (signText) {
                        try {
                            signResult =
                                JSON.parse(
                                    signText
                                );
                        } catch (error) {
                            signResult = {
                                raw:
                                    signText
                            };
                        }
                    }

                    if (!signResponse.ok) {

                        console.error(
                            "[VERCEL] STORAGE SIGN ERROR",
                            traceId,
                            signResponse.status,
                            signResult
                        );

                        throw new Error(
                            signResult?.message ||
                            signResult?.error ||
                            `Gagal membuat signed URL TTD (${signResponse.status}).`
                        );
                    }

                    const signedPath =
                        signResult?.signedURL ||
                        signResult?.signedUrl ||
                        "";

                    if (signedPath) {

                        if (
                            signedPath.startsWith("http://") ||
                            signedPath.startsWith("https://")
                        ) {

                            signatureUrl =
                                signedPath;

                        } else {

                            let normalizedPath =
                                String(
                                    signedPath
                                ).trim();

                            /*
                            |--------------------------------------------------------------------------
                            | Supabase bisa mengembalikan:
                            |
                            | /storage/v1/object/sign/ttd/...
                            | atau
                            | /object/sign/ttd/...
                            |--------------------------------------------------------------------------
                            */

                            if (
                                normalizedPath.startsWith(
                                    "/storage/v1/"
                                )
                            ) {

                                signatureUrl =
                                    `${SUPABASE_URL}${normalizedPath}`;

                            } else if (
                                normalizedPath.startsWith(
                                    "/object/"
                                )
                            ) {

                                signatureUrl =
                                    `${SUPABASE_URL}/storage/v1${normalizedPath}`;

                            } else {

                                signatureUrl =
                                    `${SUPABASE_URL}/storage/v1/${normalizedPath.replace(/^\/+/, "")}`;
                            }
                        }
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | FALLBACK KE GOOGLE DRIVE LAMA
                |--------------------------------------------------------------------------
                */

                if (!signatureUrl) {
                    signatureUrl =
                        ttdUrl;
                }

                return response.status(200).json({
                    success: true,

                    nik:
                        String(
                            user.nik || ""
                        ).trim(),

                    name:
                        String(
                            user.nama_marketing || ""
                        ).trim(),

                    hasSignature:
                        Boolean(
                            ttdStoragePath ||
                            ttdFileId ||
                            ttdUrl
                        ),

                    signatureData:
                        signatureUrl,

                    signatureUrl:
                        signatureUrl,

                    signatureUpdatedAt:
                        String(
                            user.source_updated_at ||
                            ""
                        ).trim()
                });

            } catch (error) {

                console.error(
                    "GET MY PROFILE SUPABASE ERROR:",
                    error
                );

                return response.status(
                    error.status || 500
                ).json({
                    success: false,
                    message:
                        error.message ||
                        "Gagal mengambil profil user."
                });
            }
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE PROFILE → NAMA + PASSWORD + TTD
        |--------------------------------------------------------------------------
        */

        if (
            requestBody.action ===
            "updateMyProfile"
        ) {
            try {

                const payload =
                    requestBody.payload || {};

                const nik =
                    String(
                        payload.nik ||
                        requestBody.userNik ||
                        ""
                    ).trim();

                if (!nik) {
                    return response.status(400).json({
                        success: false,
                        message:
                            "NIK user tidak ditemukan."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | DATA PROFILE
                |--------------------------------------------------------------------------
                */

                const name =
                    String(
                        payload.name ||
                        ""
                    ).trim();

                const newPassword =
                    String(
                        payload.newPassword ||
                        ""
                    ).trim();

                const signatureData =
                    String(
                        payload.signatureData ||
                        ""
                    ).trim();

                /*
                |--------------------------------------------------------------------------
                | HARUS ADA MINIMAL SATU PERUBAHAN
                |--------------------------------------------------------------------------
                */

                if (
                    !name &&
                    !newPassword &&
                    !signatureData
                ) {
                    return response.status(400).json({
                        success: false,
                        message:
                            "Tidak ada perubahan profile."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | AMBIL USER
                |--------------------------------------------------------------------------
                */

                const userRows =
                    await supabaseRequest(
                        "/rest/v1/salesman" +
                        "?select=nik,nama_marketing,auth_user_id,ttd_storage_path" +
                        "&nik=eq." +
                        encodeURIComponent(nik) +
                        "&limit=1"
                    );

                if (
                    !Array.isArray(userRows) ||
                    !userRows.length
                ) {
                    return response.status(404).json({
                        success: false,
                        message:
                            "Data salesman tidak ditemukan."
                    });
                }

                const user =
                    userRows[0];

                const authUserId =
                    String(
                        user.auth_user_id ||
                        ""
                    ).trim();

                /*
                |--------------------------------------------------------------------------
                | AUTH USER WAJIB ADA UNTUK UPDATE PASSWORD
                |--------------------------------------------------------------------------
                */

                if (
                    newPassword &&
                    !authUserId
                ) {
                    return response.status(400).json({
                        success: false,
                        message:
                            "Akun ini belum terhubung ke Supabase Auth."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | VALIDASI PASSWORD
                |--------------------------------------------------------------------------
                */

                if (newPassword) {

                    if (
                        newPassword.length < 6
                    ) {
                        return response.status(400).json({
                            success: false,
                            message:
                                "Password minimal 6 karakter."
                        });
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | UPDATE NAMA
                |--------------------------------------------------------------------------
                */

                if (name) {

                    await supabaseRequest(
                        "/rest/v1/salesman?nik=eq." +
                        encodeURIComponent(nik),
                        {
                            method: "PATCH",

                            headers: {
                                "Prefer":
                                    "return=minimal"
                            },

                            body:
                                JSON.stringify({
                                    nama_marketing:
                                        name,

                                    source_updated_at:
                                        new Date().toISOString()
                                })
                        }
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | UPDATE PASSWORD → SUPABASE AUTH
                |--------------------------------------------------------------------------
                */

                if (newPassword) {

                    const SUPABASE_URL =
                        process.env.SUPABASE_URL;

                    const SUPABASE_SERVICE_ROLE_KEY =
                        process.env.SUPABASE_SERVICE_ROLE_KEY;

                    if (
                        !SUPABASE_URL ||
                        !SUPABASE_SERVICE_ROLE_KEY
                    ) {
                        throw new Error(
                            "Konfigurasi Supabase belum lengkap."
                        );
                    }

                    const authResponse =
                        await fetch(
                            `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Authorization":
                                        `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

                                    "apikey":
                                        SUPABASE_SERVICE_ROLE_KEY,

                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        password:
                                            newPassword
                                    })
                            }
                        );

                    const authText =
                        await authResponse.text();

                    let authResult = null;

                    if (authText) {
                        try {
                            authResult =
                                JSON.parse(
                                    authText
                                );
                        } catch (error) {
                            authResult = {
                                raw:
                                    authText
                            };
                        }
                    }

                    if (
                        !authResponse.ok
                    ) {

                        console.error(
                            "[VERCEL] AUTH PASSWORD UPDATE ERROR",
                            traceId,
                            authResponse.status,
                            authResult
                        );

                        throw new Error(
                            authResult?.message ||
                            authResult?.msg ||
                            authResult?.error_description ||
                            `Gagal mengubah password (${authResponse.status}).`
                        );
                    }

                    console.log(
                        "[VERCEL] PASSWORD UPDATED",
                        traceId,
                        nik
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | UPDATE TTD → SUPABASE STORAGE
                |--------------------------------------------------------------------------
                */

                if (signatureData) {

                    const match =
                        signatureData.match(
                            /^data:(image\/(?:webp|png|jpeg|jpg));base64,(.+)$/i
                        );

                    if (!match) {
                        return response.status(400).json({
                            success: false,
                            message:
                                "Format TTD tidak valid."
                        });
                    }

                    const mimeType =
                        match[1].toLowerCase();

                    const base64Data =
                        match[2];

                    /*
                    |--------------------------------------------------------------------------
                    | BATAS UKURAN TTD
                    |--------------------------------------------------------------------------
                    */

                    const estimatedSize =
                        Math.ceil(
                            (base64Data.length * 3) / 4
                        );

                    if (
                        estimatedSize >
                        1024 * 1024
                    ) {
                        return response.status(400).json({
                            success: false,
                            message:
                                "Ukuran TTD terlalu besar. Maksimal 1 MB."
                        });
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | KONVERSI BASE64 → BINARY
                    |--------------------------------------------------------------------------
                    */

                    const binaryString =
                        Buffer.from(
                            base64Data,
                            "base64"
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | SUPABASE CONFIG
                    |--------------------------------------------------------------------------
                    */

                    const SUPABASE_URL =
                        process.env.SUPABASE_URL;

                    const SUPABASE_SERVICE_ROLE_KEY =
                        process.env.SUPABASE_SERVICE_ROLE_KEY;

                    if (
                        !SUPABASE_URL ||
                        !SUPABASE_SERVICE_ROLE_KEY
                    ) {
                        throw new Error(
                            "Konfigurasi Supabase belum lengkap."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | EXTENSION
                    |--------------------------------------------------------------------------
                    */

                    const extension =
                        mimeType === "image/png"
                            ? "png"
                            : mimeType === "image/jpeg" ||
                            mimeType === "image/jpg"
                                ? "jpg"
                                : "webp";

                    /*
                    |--------------------------------------------------------------------------
                    | PATH
                    |--------------------------------------------------------------------------
                    |
                    | Contoh:
                    | 911227/signature.webp
                    |
                    */

                    const storagePath =
                        `${nik}/signature.${extension}`;

                    /*
                    |--------------------------------------------------------------------------
                    | UPLOAD / REPLACE TTD
                    |--------------------------------------------------------------------------
                    */

                    const uploadResponse =
                        await fetch(
                            `${SUPABASE_URL}/storage/v1/object/ttd/${encodeURIComponent(storagePath)}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Authorization":
                                        `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

                                    "apikey":
                                        SUPABASE_SERVICE_ROLE_KEY,

                                    "Content-Type":
                                        mimeType,

                                    "x-upsert":
                                        "true",

                                    "cache-control":
                                        "3600"
                                },

                                body:
                                    binaryString
                            }
                        );

                    const uploadText =
                        await uploadResponse.text();

                    let uploadResult =
                        null;

                    if (uploadText) {
                        try {
                            uploadResult =
                                JSON.parse(
                                    uploadText
                                );
                        } catch (error) {
                            uploadResult = {
                                raw:
                                    uploadText
                            };
                        }
                    }

                    if (
                        !uploadResponse.ok
                    ) {

                        console.error(
                            "[VERCEL] STORAGE UPLOAD ERROR",
                            traceId,
                            uploadResponse.status,
                            uploadResult
                        );

                        throw new Error(
                            uploadResult?.message ||
                            uploadResult?.error ||
                            uploadResult?.statusCode ||
                            `Upload TTD gagal (${uploadResponse.status}).`
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | SIMPAN PATH TTD
                    |--------------------------------------------------------------------------
                    */

                    await supabaseRequest(
                        "/rest/v1/salesman?nik=eq." +
                        encodeURIComponent(nik),
                        {
                            method: "PATCH",

                            headers: {
                                "Prefer":
                                    "return=minimal"
                            },

                            body:
                                JSON.stringify({
                                    ttd_storage_path:
                                        storagePath,

                                    source_updated_at:
                                        new Date().toISOString()
                                })
                        }
                    );

                    console.log(
                        "[VERCEL] TTD UPDATED",
                        traceId,
                        nik,
                        storagePath
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | RESPONSE
                |--------------------------------------------------------------------------
                */

                console.log(
                    "[VERCEL] UPDATE PROFILE SUCCESS",
                    traceId,
                    nik,
                    {
                        nameUpdated:
                            Boolean(name),

                        passwordUpdated:
                            Boolean(newPassword),

                        signatureUpdated:
                            Boolean(signatureData)
                    }
                );

                return response
                    .status(200)
                    .json({
                        success: true,

                        message:
                            "Profile berhasil diperbarui.",

                        nik:
                            nik,

                        nameUpdated:
                            Boolean(name),

                        passwordUpdated:
                            Boolean(newPassword),

                        signatureUpdated:
                            Boolean(signatureData)
                    });

            } catch (error) {

                console.error(
                    "[VERCEL] UPDATE PROFILE ERROR",
                    traceId,
                    error
                );

                return response
                    .status(
                        error.status || 500
                    )
                    .json({
                        success: false,

                        message:
                            error.message ||
                            "Gagal memperbarui profile."
                    });
            }
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE PKM → SUPABASE
        |--------------------------------------------------------------------------
        | Untuk sementara hanya action createPkm yang
        | dibypass dari Apps Script.
        */

        if (
            requestBody.action ===
            "createPkm"
        ) {
            try {
                const payload =
                    requestBody.payload ||
                    {};

                const pkmId =
                    String(
                        payload.id ||
                        ""
                    ).trim();

                if (!pkmId) {
                    return response.status(400).json({
                        success: false,
                        message:
                            "ID PKM tidak ditemukan."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | USER
                |--------------------------------------------------------------------------
                */

                const userNik =
                    String(
                        requestBody.userNik ||
                        payload.createdBy ||
                        ""
                    ).trim();

                if (!userNik) {
                    return response.status(401).json({
                        success: false,
                        message:
                            "User pembuat PKM tidak ditemukan."
                    });
                }

                const userRows =
                    await supabaseRequest(
                        "/rest/v1/salesman" +
                        "?select=nik,nama_marketing,cab,jab,role_pkm,status" +
                        "&nik=eq." +
                        encodeURIComponent(
                            userNik
                        ) +
                        "&limit=1"
                    );

                const user =
                    Array.isArray(userRows)
                        ? userRows[0]
                        : null;

                if (!user) {
                    return response.status(401).json({
                        success: false,
                        message:
                            "User tidak ditemukan."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | ROLE CRM
                |--------------------------------------------------------------------------
                */

                const rolePkm =
                    String(
                        user.role_pkm ||
                        ""
                    )
                        .trim()
                        .toUpperCase();

                const jabatan =
                    String(
                        user.jab ||
                        ""
                    )
                        .trim()
                        .toUpperCase();

                const isCrm =
                    rolePkm === "CRM" ||
                    jabatan.includes("PIC CRM") ||
                    jabatan.includes("CRM");

                if (!isCrm) {
                    return response.status(403).json({
                        success: false,
                        message:
                            "Hanya CRM yang dapat membuat pengajuan PKM."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | STATUS USER
                |--------------------------------------------------------------------------
                */

                const userStatus =
                    String(
                        user.status ||
                        "AKTIF"
                    )
                        .trim()
                        .toUpperCase()
                        .replace(
                            /\s+/g,
                            ""
                        );

                if (
                    ![
                        "AKTIF",
                        "ACTIVE"
                    ].includes(
                        userStatus
                    )
                ) {
                    return response.status(403).json({
                        success: false,
                        message:
                            "Akun ini berstatus nonaktif."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | CABANG
                |--------------------------------------------------------------------------
                */

                const branch =
                    String(
                        user.cab ||
                        ""
                    ).trim();

                if (
                    !branch ||
                    branch === "ALL" ||
                    branch === "HO"
                ) {
                    return response.status(400).json({
                        success: false,
                        message:
                            "Cabang pengajuan tidak valid."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | VALIDASI NAMA
                |--------------------------------------------------------------------------
                */

                const name =
                    String(
                        payload.name ||
                        ""
                    ).trim();

                if (!name) {
                    return response.status(400).json({
                        success: false,
                        message:
                            "Nama PKM wajib diisi."
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | CEK ID DUPLIKAT
                |--------------------------------------------------------------------------
                */

                const existingRows =
                    await supabaseRequest(
                        "/rest/v1/pkm" +
                        "?select=id,id_pkm" +
                        "&id_pkm=eq." +
                        encodeURIComponent(
                            pkmId
                        ) +
                        "&limit=1"
                    );

                if (
                    Array.isArray(
                        existingRows
                    ) &&
                    existingRows.length
                ) {
                    return response.status(200).json({
                        success: true,
                        message:
                            "PKM sudah tersimpan. Melanjutkan proses TTD CRM.",
                        pkmId: pkmId,
                        status:
                            "MENUNGGU CRM",
                        alreadyExists:
                            true
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | HELPER ARRAY → TEXT
                |--------------------------------------------------------------------------
                */

                const arrayToText =
                    function (value) {
                        if (
                            !Array.isArray(
                                value
                            )
                        ) {
                            return String(
                                value ||
                                ""
                            ).trim();
                        }

                        return value
                            .map(
                                function (
                                    item
                                ) {
                                    if (
                                        item &&
                                        typeof item ===
                                            "object"
                                    ) {
                                        return String(
                                            item.name ||
                                            ""
                                        ).trim();
                                    }

                                    return String(
                                        item ||
                                        ""
                                    ).trim();
                                }
                            )
                            .filter(Boolean)
                            .join(
                                " , "
                            );
                    };

                /*
                |--------------------------------------------------------------------------
                | PEOPLE
                |--------------------------------------------------------------------------
                */

                const people =
                    Array.isArray(
                        payload.people
                    )
                        ? payload.people
                            .map(
                                function (
                                    person
                                ) {
                                    const personName =
                                        String(
                                            person?.name ||
                                            ""
                                        ).trim();

                                    const personNik =
                                        String(
                                            person?.nik ||
                                            ""
                                        ).trim();

                                    if (
                                        !personName &&
                                        !personNik
                                    ) {
                                        return "";
                                    }

                                    return (
                                        `${personName} - ${personNik}`
                                    );
                                }
                            )
                            .filter(Boolean)
                            .join(
                                " , "
                            )
                        : "";

                /*
                |--------------------------------------------------------------------------
                | INSERT PKM
                |--------------------------------------------------------------------------
                */

                const pkmRecord = {
                    id_pkm:
                        pkmId,

                    nama:
                        name,

                    cabang:
                        branch,

                    type_pkm:
                        arrayToText(
                            payload.type
                        ),

                    jenis_pkm:
                        String(
                            payload.jenisPkm ||
                            ""
                        ).trim(),

                    jenis_kegiatan:
                        String(
                            payload.kegiatan ||
                            ""
                        ).trim(),

                    tanggal_mulai:
                        payload.startDate ||
                        null,

                    tanggal_selesai:
                        payload.endDate ||
                        null,

                    tanggal_pengajuan:
                        new Date().toISOString(),

                    lokasi:
                        String(
                            payload.location ||
                            ""
                        ).trim(),

                    kabupaten:
                        String(
                            payload.kabupaten ||
                            ""
                        ).trim(),

                    kecamatan:
                        String(
                            payload.kecamatan ||
                            ""
                        ).trim(),

                    kelurahan:
                        String(
                            payload.kelurahan ||
                            ""
                        ).trim(),

                    alasan:
                        String(
                            payload.alasan ||
                            ""
                        ).trim(),

                    konsep:
                        String(
                            payload.konsep ||
                            ""
                        ).trim(),

                    people:
                        people,

                    fokus_type:
                        arrayToText(
                            payload.focusType
                        ),

                    program_h1:
                        String(
                            payload.programH1 ||
                            ""
                        ).trim(),

                    program_h23:
                        String(
                            payload.programH23 ||
                            ""
                        ).trim(),

                    publikasi:
                        arrayToText(
                            payload.publication
                        ),

                    leasing:
                        arrayToText(
                            payload.leasing
                        ),

                    dana_ls:
                        Number(
                            payload.danaLeasing
                        ) || 0,

                    dana_md:
                        Number(
                            payload.danaMd
                        ) || 0,

                    dana_csm:
                        Number(
                            payload.danaCsm
                        ) || 0,

                    dana_ll:
                        Number(
                            payload.danaLain
                        ) || 0,

                    target_db:
                        Number(
                            payload.targetDb
                        ) || 0,

                    target_deal:
                        Number(
                            payload.targetDeal
                        ) || 0,

                    target_ue:
                        Number(
                            payload.targetUe
                        ) || 0,

                    pengajuan:
                        "DIAJUKAN",

                    status:
                        "MENUNGGU CRM",

                    source:
                        "WEB",

                    created_at:
                        new Date().toISOString(),

                    updated_at:
                        new Date().toISOString(),

                    synced_at:
                        new Date().toISOString(),

                    raw_data:
                        payload
                };

                await supabaseRequest(
                    "/rest/v1/pkm",
                    {
                        method: "POST",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        },

                        body:
                            JSON.stringify(
                                pkmRecord
                            )
                    }
                );

                /*
                |--------------------------------------------------------------------------
                | INSERT PKM ITEM
                |--------------------------------------------------------------------------
                */

                const budgetDetails =
                    Array.isArray(
                        payload.budgetDetails
                    )
                        ? payload.budgetDetails
                        : [];

                if (
                    budgetDetails.length
                ) {
                    const itemRows =
                        budgetDetails
                            .map(
                                function (
                                    item
                                ) {
                                    return {
                                        id:
                                            String(
                                                item.id ||
                                                crypto.randomUUID()
                                            ).trim(),

                                        link_pkm:
                                            pkmId,

                                        link_lpj:
                                            null,

                                        jenis_item:
                                            String(
                                                item.itemType ||
                                                ""
                                            ).trim(),

                                        nama_item:
                                            String(
                                                item.itemName ||
                                                ""
                                            ).trim(),

                                        jumlah:
                                            Number(
                                                item.quantity
                                            ) || 0,

                                        harga_total:
                                            Number(
                                                item.totalPrice
                                            ) || 0,

                                        harga_realisasi:
                                            0,

                                        gambar_desain:
                                            "",

                                        foto:
                                            "",

                                        keterangan:
                                            "",

                                        source:
                                            "WEB",

                                        created_at:
                                            new Date().toISOString(),

                                        updated_at:
                                            new Date().toISOString(),

                                        synced_at:
                                            new Date().toISOString(),

                                        raw_data:
                                            item
                                    };
                                }
                            );

                    await supabaseRequest(
                        "/rest/v1/pkm_item",
                        {
                            method:
                                "POST",

                            headers: {
                                "Prefer":
                                    "return=minimal"
                            },

                            body:
                                JSON.stringify(
                                    itemRows
                                )
                        }
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | RESPONSE SAMA SEPERTI CREATE PKM LAMA
                |--------------------------------------------------------------------------
                */

                console.log(
                    "[VERCEL] CREATE PKM SUPABASE SUCCESS",
                    traceId,
                    pkmId
                );

                return response
                    .status(200)
                    .json({
                        success: true,

                        message:
                            "Pengajuan PKM berhasil disimpan.",

                        pkmId:
                            pkmId,

                        status:
                            "MENUNGGU CRM"
                    });

            } catch (error) {

                console.error(
                    "[VERCEL] CREATE PKM SUPABASE ERROR",
                    traceId,
                    error
                );

                return response
                    .status(
                        error.status ||
                        500
                    )
                    .json({
                        success: false,

                        message:
                            error.message ||
                            "Gagal menyimpan PKM ke Supabase."
                    });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | LPJ → SUPABASE
        |--------------------------------------------------------------------------
        */

        if (
            requestBody.action ===
            "getLpjCandidates"
        ) {
            console.log(
                "[VERCEL] LPJ SUPABASE",
                traceId
            );

            const payload =
                requestBody.payload ||
                {};

            const page =
                Math.max(
                    Number(payload.page) || 1,
                    1
                );

            const pageSize =
                Math.max(
                    Number(payload.pageSize) || 7,
                    1
                );

            /*
            |--------------------------------------------------------------------------
            | HELPER: AMBIL DATA SUPABASE > 1000 ROW
            |--------------------------------------------------------------------------
            */

            async function fetchAllSupabaseRows(
                basePath,
                pageLimit = 1000
            ) {
                const allRows = [];
                let offset = 0;

                while (true) {
                    const rows =
                        await supabaseRequest(
                            basePath +
                            `&offset=${offset}&limit=${pageLimit}`
                        );

                    if (
                        !Array.isArray(rows) ||
                        rows.length === 0
                    ) {
                        break;
                    }

                    allRows.push(...rows);

                    if (
                        rows.length < pageLimit
                    ) {
                        break;
                    }

                    offset += pageLimit;
                }

                return allRows;
            }

            /*
            |--------------------------------------------------------------------------
            | 1. AMBIL PKM
            |--------------------------------------------------------------------------
            */

            const pkmRows =
                await fetchAllSupabaseRows(
                    "/rest/v1/pkm" +
                    "?select=" +
                    [
                        "id_pkm",
                        "nama",
                        "cabang",
                        "type_pkm",
                        "jenis_pkm",
                        "tanggal_mulai",
                        "tanggal_selesai",
                        "lokasi",
                        "kabupaten",
                        "kecamatan",
                        "kelurahan",
                        "people",
                        "fokus_type",
                        "program_h1",
                        "program_h23",
                        "publikasi",
                        "leasing",
                        "dana_ls",
                        "dana_md",
                        "dana_csm",
                        "dana_ll",
                        "target_db",
                        "target_deal",
                        "target_ue",
                        "status",
                        "acc_manager_h1",
                        "acc_koordinator_h23",
                        "acc_manager_h23"
                    ].join(",") +
                    "&order=tanggal_mulai.desc"
                );

            /*
            |--------------------------------------------------------------------------
            | 2. AMBIL LPJ
            |--------------------------------------------------------------------------
            */

            const lpjRows =
                await fetchAllSupabaseRows(
                    "/rest/v1/lpj" +
                    "?select=id_lpj,id_pkm"
                );

            const lpjPkmIds =
                new Set(
                    lpjRows
                        .map(
                            row =>
                                String(
                                    row.id_pkm || ""
                                ).trim()
                        )
                        .filter(Boolean)
                );

            /*
            |--------------------------------------------------------------------------
            | 3. FILTER DASAR LPJ
            |--------------------------------------------------------------------------
            */

            const now =
                new Date();

            let candidates =
                pkmRows.filter(
                    function (row) {

                        const idPkm =
                            String(
                                row.id_pkm || ""
                            ).trim();

                        /*
                        | Harus punya ID PKM
                        */
                        if (!idPkm) {
                            return false;
                        }

                        /*
                        | Sudah punya LPJ → jangan tampil
                        */
                        if (
                            lpjPkmIds.has(idPkm)
                        ) {
                            return false;
                        }

                        /*
                        | Harus sudah ACC Manager H1
                        */
                        if (
                            !String(
                                row.acc_manager_h1 ||
                                ""
                            ).trim()
                        ) {
                            return false;
                        }

                        /*
                        | Kegiatan harus sudah selesai
                        */
                        if (
                            !row.tanggal_selesai
                        ) {
                            return false;
                        }

                        const tanggalSelesai =
                            new Date(
                                row.tanggal_selesai
                            );

                        if (
                            Number.isNaN(
                                tanggalSelesai.getTime()
                            )
                        ) {
                            return false;
                        }

                        if (
                            tanggalSelesai > now
                        ) {
                            return false;
                        }

                        return true;
                    }
                );

            /*
            |--------------------------------------------------------------------------
            | 4. FILTER CABANG
            |--------------------------------------------------------------------------
            */

            const branches =
                Array.isArray(
                    payload.branches
                )
                    ? payload.branches
                        .map(
                            value =>
                                String(
                                    value || ""
                                )
                                    .trim()
                                    .toUpperCase()
                        )
                        .filter(Boolean)
                    : [];

            if (branches.length > 0) {
                const branchSet =
                    new Set(branches);

                candidates =
                    candidates.filter(
                        function (row) {
                            return branchSet.has(
                                String(
                                    row.cabang || ""
                                )
                                    .trim()
                                    .toUpperCase()
                            );
                        }
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | 5. FILTER SEARCH
            |--------------------------------------------------------------------------
            */

            const search =
                String(
                    payload.search || ""
                )
                    .trim()
                    .toLowerCase();

            if (search) {
                candidates =
                    candidates.filter(
                        function (row) {

                            const text = [
                                row.id_pkm,
                                row.nama,
                                row.cabang,
                                row.lokasi,
                                row.kabupaten,
                                row.kecamatan,
                                row.kelurahan,
                                row.jenis_pkm,
                                row.type_pkm
                            ]
                                .map(
                                    value =>
                                        String(
                                            value || ""
                                        ).toLowerCase()
                                )
                                .join(" ");

                            return text.includes(
                                search
                            );
                        }
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | 6. FILTER JENIS PKM
            |--------------------------------------------------------------------------
            */

            const jenisPkm =
                String(
                    payload.jenisPkm || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                jenisPkm &&
                jenisPkm !== "all"
            ) {
                candidates =
                    candidates.filter(
                        function (row) {
                            return (
                                String(
                                    row.jenis_pkm ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                jenisPkm
                            );
                        }
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | 7. FILTER TYPE PKM
            |--------------------------------------------------------------------------
            */

            const typePkm =
                String(
                    payload.typePkm || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                typePkm &&
                typePkm !== "all"
            ) {
                candidates =
                    candidates.filter(
                        function (row) {
                            return (
                                String(
                                    row.type_pkm ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                typePkm
                            );
                        }
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | 8. FILTER TANGGAL
            |--------------------------------------------------------------------------
            */

            const startDate =
                String(
                    payload.startDate || ""
                ).trim();

            const endDate =
                String(
                    payload.endDate || ""
                ).trim();

            if (startDate) {
                const start =
                    new Date(
                        startDate +
                        "T00:00:00"
                    );

                candidates =
                    candidates.filter(
                        function (row) {
                            if (
                                !row.tanggal_selesai
                            ) {
                                return false;
                            }

                            return (
                                new Date(
                                    row.tanggal_selesai
                                ) >= start
                            );
                        }
                    );
            }

            if (endDate) {
                const end =
                    new Date(
                        endDate +
                        "T23:59:59"
                    );

                candidates =
                    candidates.filter(
                        function (row) {
                            if (
                                !row.tanggal_selesai
                            ) {
                                return false;
                            }

                            return (
                                new Date(
                                    row.tanggal_selesai
                                ) <= end
                            );
                        }
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | 9. SORT
            |--------------------------------------------------------------------------
            */

            candidates.sort(
                function (a, b) {
                    return (
                        new Date(
                            b.tanggal_mulai || 0
                        ) -
                        new Date(
                            a.tanggal_mulai || 0
                        )
                    );
                }
            );

            /*
            |--------------------------------------------------------------------------
            | 10. PAGINATION
            |--------------------------------------------------------------------------
            */

            const total =
                candidates.length;

            const totalPages =
                Math.max(
                    Math.ceil(
                        total / pageSize
                    ),
                    1
                );

            const safePage =
                Math.min(
                    page,
                    totalPages
                );

            const startIndex =
                (safePage - 1) *
                pageSize;

            const pageRows =
                candidates.slice(
                    startIndex,
                    startIndex + pageSize
                );

            /*
            |--------------------------------------------------------------------------
            | 11. AMBIL BUDGET ITEM HANYA UNTUK PKM DI HALAMAN AKTIF
            |--------------------------------------------------------------------------
            */

            const pagePkmIds =
                pageRows
                    .map(
                        row =>
                            String(
                                row.id_pkm || ""
                            ).trim()
                    )
                    .filter(Boolean);

            let itemRows = [];

            if (
                pagePkmIds.length > 0
            ) {
                const itemFilter =
                    pagePkmIds
                        .map(
                            id =>
                                encodeURIComponent(id)
                        )
                        .join(",");

                itemRows =
                    await supabaseRequest(
                        "/rest/v1/pkm_item" +
                        "?select=*" +
                        "&link_pkm=in.(" +
                        itemFilter +
                        ")"
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | 12. BENTUK RESPONSE SESUAI FRONTEND LPJ
            |--------------------------------------------------------------------------
            */

            const data =
                pageRows.map(
                    function (row) {

                        const idPkm =
                            String(
                                row.id_pkm || ""
                            ).trim();

                        const budgetDetails =
                            itemRows
                                .filter(
                                    function (item) {
                                        return (
                                            String(
                                                item.link_pkm ||
                                                ""
                                            ).trim() ===
                                            idPkm
                                        );
                                    }
                                )
                                .map(
                                    function (item) {
                                        return {
                                            id:
                                                item.id,
                                            jenisItem:
                                                item.jenis_item,
                                            namaItem:
                                                item.nama_item,
                                            jumlah:
                                                Number(
                                                    item.jumlah
                                                ) || 0,
                                            hargaTotal:
                                                Number(
                                                    item.harga_total
                                                ) || 0,
                                            hargaRealisasi:
                                                Number(
                                                    item.harga_realisasi
                                                ) || 0,
                                            gambarDesain:
                                                item.gambar_desain ||
                                                "",
                                            foto:
                                                item.foto ||
                                                "",
                                            keterangan:
                                                item.keterangan ||
                                                ""
                                        };
                                    }
                                );

                        return {
                            id:
                                idPkm,

                            name:
                                row.nama || "",

                            branch:
                                row.cabang || "",

                            type:
                                row.type_pkm || "",

                            jenisPkm:
                                row.jenis_pkm || "",

                            startDate:
                                row.tanggal_mulai || "",

                            endDate:
                                row.tanggal_selesai || "",

                            location:
                                row.lokasi || "",

                            kabupaten:
                                row.kabupaten || "",

                            kecamatan:
                                row.kecamatan || "",

                            kelurahan:
                                row.kelurahan || "",

                            people:
                                row.people || "",

                            focusType:
                                row.fokus_type || "",

                            programH1:
                                row.program_h1 || "",

                            programH23:
                                row.program_h23 || "",

                            publikasi:
                                row.publikasi || "",

                            leasing:
                                row.leasing || "",

                            danaLs:
                                Number(
                                    row.dana_ls
                                ) || 0,

                            danaMd:
                                Number(
                                    row.dana_md
                                ) || 0,

                            danaCsm:
                                Number(
                                    row.dana_csm
                                ) || 0,

                            danaLl:
                                Number(
                                    row.dana_ll
                                ) || 0,

                            targetDb:
                                Number(
                                    row.target_db
                                ) || 0,

                            targetDeal:
                                Number(
                                    row.target_deal
                                ) || 0,

                            targetUe:
                                Number(
                                    row.target_ue
                                ) || 0,

                            status:
                                row.status ||
                                "Belum LPJ",

                            budgetDetails:
                                budgetDetails
                        };
                    }
                );

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            console.log(
                "[VERCEL] LPJ SUPABASE RESULT",
                traceId,
                "PKM=",
                pkmRows.length,
                "LPJ=",
                lpjRows.length,
                "CANDIDATES=",
                total,
                "PAGE=",
                safePage
            );

            return response
                .status(200)
                .json({
                    success: true,
                    data: data,
                    page: safePage,
                    pageSize: pageSize,
                    totalPages: totalPages,
                    total: total,
                    branches: [
                        ...new Set(
                            candidates
                                .map(
                                    row =>
                                        row.cabang
                                )
                                .filter(Boolean)
                        )
                    ],
                    isHeadOffice:
                        branches.length === 0
                });
        }

        /* 
        |--------------------------------------------------------------------------
        | CREATE LPJ → SUPABASE
        |--------------------------------------------------------------------------
        */

        if (
            requestBody.action ===
            "createLpj"
        ) {
            try {

                console.log(
                    "[VERCEL] CREATE LPJ SUPABASE",
                    traceId
                );

                const payload =
                    requestBody.payload ||
                    {};

                const pkmId =
                    String(
                        payload.pkmId ||
                        ""
                    ).trim();

                if (!pkmId) {
                    return response
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "ID PKM tidak tersedia."
                        });
                }

                /*
                |--------------------------------------------------------------------------
                | CEK PKM
                |--------------------------------------------------------------------------
                */

                const pkmRows =
                    await supabaseRequest(
                        "/rest/v1/pkm" +
                        "?select=id_pkm" +
                        "&id_pkm=eq." +
                        encodeURIComponent(pkmId) +
                        "&limit=1"
                    );

                if (
                    !Array.isArray(pkmRows) ||
                    pkmRows.length === 0
                ) {
                    return response
                        .status(404)
                        .json({
                            success: false,
                            message:
                                "PKM tidak ditemukan."
                        });
                }

                /*
                |--------------------------------------------------------------------------
                | CEK APAKAH SUDAH ADA LPJ
                |--------------------------------------------------------------------------
                */

                const existingLpj =
                    await supabaseRequest(
                        "/rest/v1/lpj" +
                        "?select=id_lpj" +
                        "&id_pkm=eq." +
                        encodeURIComponent(pkmId) +
                        "&limit=1"
                    );

                if (
                    Array.isArray(existingLpj) &&
                    existingLpj.length > 0
                ) {
                    return response
                        .status(409)
                        .json({
                            success: false,
                            message:
                                "LPJ untuk PKM ini sudah dibuat."
                        });
                }

                /*
                |--------------------------------------------------------------------------
                | GENERATE ID LPJ
                |--------------------------------------------------------------------------
                */

                const lpjId =
                    crypto.randomUUID();

                const now =
                    new Date().toISOString();

                /*
                |--------------------------------------------------------------------------
                | DATA LPJ
                |--------------------------------------------------------------------------
                */

                const lpjRecord = {

                    id_lpj:
                        lpjId,

                    id_pkm:
                        pkmId,

                    foto_tenda_full:
                        "",

                    foto_kegiatan_1:
                        "",

                    foto_kegiatan_2:
                        "",

                    evaluasi:
                        String(
                            payload.evaluation ||
                            ""
                        ).trim(),

                    pdf:
                        "",

                    print:
                        "",

                    act_db:
                        Number(
                            payload.actualDb
                        ) || 0,

                    act_deal:
                        Number(
                            payload.actualDeal
                        ) || 0,

                    act_ue:
                        Number(
                            payload.actualUe
                        ) || 0,

                    tanggal_lpj:
                        now,

                    source:
                        "WEB",

                    created_at:
                        now,

                    updated_at:
                        now,

                    synced_at:
                        now,

                    raw_data:
                        payload
                };

                /*
                |--------------------------------------------------------------------------
                | INSERT LPJ
                |--------------------------------------------------------------------------
                */

                await supabaseRequest(
                    "/rest/v1/lpj",
                    {
                        method:
                            "POST",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        },

                        body:
                            JSON.stringify(
                                lpjRecord
                            )
                    }
                );

                /*
                |--------------------------------------------------------------------------
                | UPLOAD FOTO LPJ KE GOOGLE DRIVE
                |--------------------------------------------------------------------------
                */

                const lpjPhotoUpdate = {};

                if (
                    String(
                        payload.tentPhoto ||
                        ""
                    ).trim()
                ) {

                    const tentResult =
                        await uploadLpjImage({

                            pkmId:
                                pkmId,

                            lpjId:
                                lpjId,

                            imageData:
                                payload.tentPhoto,

                            type:
                                "TENT"
                        });

                    if (
                        tentResult &&
                        tentResult.path
                    ) {
                        lpjPhotoUpdate.foto_tenda_full =
                            tentResult.path;
                    }
                }

                if (
                    String(
                        payload.activityPhoto1 ||
                        ""
                    ).trim()
                ) {

                    const activity1Result =
                        await uploadLpjImage({

                            pkmId:
                                pkmId,

                            lpjId:
                                lpjId,

                            imageData:
                                payload.activityPhoto1,

                            type:
                                "KEGIATAN_1"
                        });

                    if (
                        activity1Result &&
                        activity1Result.path
                    ) {
                        lpjPhotoUpdate.foto_kegiatan_1 =
                            activity1Result.path;
                    }
                }

                if (
                    String(
                        payload.activityPhoto2 ||
                        ""
                    ).trim()
                ) {

                    const activity2Result =
                        await uploadLpjImage({

                            pkmId:
                                pkmId,

                            lpjId:
                                lpjId,

                            imageData:
                                payload.activityPhoto2,

                            type:
                                "KEGIATAN_2"
                        });

                    if (
                        activity2Result &&
                        activity2Result.path
                    ) {
                        lpjPhotoUpdate.foto_kegiatan_2 =
                            activity2Result.path;
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | UPDATE PATH FOTO LPJ
                |--------------------------------------------------------------------------
                */

                if (
                    Object.keys(
                        lpjPhotoUpdate
                    ).length > 0
                ) {

                    lpjPhotoUpdate.updated_at =
                        now;

                    lpjPhotoUpdate.synced_at =
                        now;

                    await supabaseRequest(
                        "/rest/v1/lpj" +
                        "?id_lpj=eq." +
                        encodeURIComponent(
                            lpjId
                        ),
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Prefer":
                                    "return=minimal"
                            },

                            body:
                                JSON.stringify(
                                    lpjPhotoUpdate
                                )
                        }
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | UPDATE PKM ITEM
                |--------------------------------------------------------------------------
                */

                const budgetDetails =
                    Array.isArray(
                        payload.budgetDetails
                    )
                        ? payload.budgetDetails
                        : [];

                for (
                    const item
                    of budgetDetails
                ) {

                    const itemId =
                        String(
                            item.id ||
                            ""
                        ).trim();

                    if (!itemId) {
                        continue;
                    }

                    const updateItem = {

                        link_lpj:
                            lpjId,

                        harga_realisasi:
                            Number(
                                item.actualPrice
                            ) || 0,

                        keterangan:
                            String(
                                item.note ||
                                ""
                            ).trim(),

                        updated_at:
                            now,

                        synced_at:
                            now
                    };

                    /*
                    |--------------------------------------------------------------------------
                    | UPLOAD GAMBAR DESAIN
                    |--------------------------------------------------------------------------
                    */

                    if (
                        String(
                            item.designImage ||
                            ""
                        ).trim()
                    ) {

                        const designResult =
                            await uploadPkmItemImage({
                                pkmId:
                                    pkmId,

                                itemId:
                                    itemId,

                                imageData:
                                    item.designImage,

                                type:
                                    "design"
                            });

                        if (
                            designResult &&
                            designResult.path
                        ) {
                            updateItem.gambar_desain =
                                designResult.path;
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UPLOAD FOTO ITEM
                    |--------------------------------------------------------------------------
                    */

                    if (
                        String(
                            item.photo ||
                            ""
                        ).trim()
                    ) {

                        const photoResult =
                            await uploadPkmItemImage({
                                pkmId:
                                    pkmId,

                                itemId:
                                    itemId,

                                imageData:
                                    item.photo,

                                type:
                                    "photo"
                            });

                        if (
                            photoResult &&
                            photoResult.path
                        ) {
                            updateItem.foto =
                                photoResult.path;
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE PKM ITEM
                    |--------------------------------------------------------------------------
                    */

                    await supabaseRequest(
                        "/rest/v1/pkm_item" +
                        "?id=eq." +
                        encodeURIComponent(
                            itemId
                        ),
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Prefer":
                                    "return=minimal"
                            },

                            body:
                                JSON.stringify(
                                    updateItem
                                )
                        }
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | RESPONSE
                |--------------------------------------------------------------------------
                */

                console.log(
                    "[VERCEL] CREATE LPJ SUPABASE SUCCESS",
                    traceId,
                    lpjId,
                    pkmId
                );

                return response
                    .status(200)
                    .json({
                        success:
                            true,

                        message:
                            "LPJ berhasil difinalisasi.",

                        lpjId:
                            lpjId,

                        pkmId:
                            pkmId
                    });

            } catch (error) {

                console.error(
                    "[VERCEL] CREATE LPJ SUPABASE ERROR",
                    traceId,
                    error
                );

                return response
                    .status(
                        error.status ||
                        500
                    )
                    .json({
                        success:
                            false,

                        message:
                            error.message ||
                            "Gagal menyimpan LPJ ke Supabase."
                    });
            }
        }

        /* ================================================================
        PKM PDF → SUPABASE
        PDF tetap berada di GOOGLE DRIVE.
        Supabase hanya menyimpan URL PDF.
        ================================================================ */

        if (
            requestBody.action ===
            "getPkmPdfFile"
        ) {
            try {

                const payload =
                    requestBody.payload ||
                    {};

                const pkmId =
                    String(
                        payload.pkmId ||
                        ""
                    ).trim();

                if (!pkmId) {
                    return response
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "ID PKM tidak tersedia."
                        });
                }

                const rows =
                    await supabaseRequest(
                        "/rest/v1/pkm" +
                        "?select=id_pkm,pdf" +
                        "&id_pkm=eq." +
                        encodeURIComponent(pkmId) +
                        "&limit=1"
                    );

                const row =
                    Array.isArray(rows)
                        ? rows[0]
                        : null;

                if (!row) {
                    return response
                        .status(404)
                        .json({
                            success: false,
                            found: false,
                            message:
                                "Data PKM tidak ditemukan."
                        });
                }

                const pdfUrl =
                    String(
                        row.pdf ||
                        ""
                    ).trim();

                if (!pdfUrl) {
                    return response
                        .status(200)
                        .json({
                            success: true,
                            found: false,
                            message:
                                "PDF belum tersedia."
                        });
                }

                return response
                    .status(200)
                    .json({
                        success: true,
                        found: true,
                        pdfUrl: pdfUrl,
                        pkmId: pkmId
                    });

            } catch (error) {

                console.error(
                    "[VERCEL] GET PKM PDF ERROR",
                    traceId,
                    error
                );

                return response
                    .status(
                        error.status ||
                        500
                    )
                    .json({
                        success: false,
                        message:
                            error.message ||
                            "Gagal mengambil link PDF."
                    });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | APPS SCRIPT REQUEST
        |--------------------------------------------------------------------------
        |
        | Jangan retry 3x secara membabi buta.
        |
        | Endpoint Apps Script yang baru sudah terbukti
        | normal ketika diakses langsung.
        |
        */

        const gasStartedAt =
            performance.now();

        const controller =
            new AbortController();

        /*
        | Batas maksimum satu request ke Apps Script.
        |
        | Normal PKM sekarang < 3 detik.
        | Kita beri ruang sampai 15 detik.
        */

        const timeoutId =
            setTimeout(
                function () {
                    controller.abort();
                },
                30000
            );

        let appsScriptResponse;

        try {

            console.log(
                "[VERCEL] GAS REQUEST",
                traceId,
                requestBody.action
            );

            appsScriptResponse =
                await fetch(
                    appsScriptUrl,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify(
                                requestBody
                            ),

                        redirect: "follow",

                        signal:
                            controller.signal
                    }
                );

        } finally {

            clearTimeout(
                timeoutId
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GAS RESPONSE TIMING
        |--------------------------------------------------------------------------
        */

        const gasResponseAt =
            performance.now();

        console.log(
            "[VERCEL] GAS RESPONSE",
            traceId,
            requestBody.action,
            "STATUS=",
            appsScriptResponse.status,
            "OK=",
            appsScriptResponse.ok,
            `${(
                (gasResponseAt -
                    gasStartedAt) /
                1000
            ).toFixed(2)}s`
        );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE TEXT
        |--------------------------------------------------------------------------
        */

        const responseText =
            await appsScriptResponse.text();

        console.log(
            "[VERCEL] GAS TEXT",
            traceId,
            requestBody.action,
            `${responseText.length} chars`
        );


        /*
        |--------------------------------------------------------------------------
        | VALIDASI HTTP
        |--------------------------------------------------------------------------
        */

        if (
            !appsScriptResponse.ok
        ) {

            console.error(
                "[VERCEL] GAS HTTP ERROR",
                traceId,
                requestBody.action,
                "STATUS=",
                appsScriptResponse.status,
                responseText.substring(
                    0,
                    500
                )
            );

            return response
                .status(502)
                .json({
                    success: false,
                    message:
                        `Apps Script mengembalikan HTTP ${appsScriptResponse.status}.`
                });
        }


        /*
        |--------------------------------------------------------------------------
        | PARSE JSON
        |--------------------------------------------------------------------------
        */

        let result;

        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            console.error(
                "[VERCEL] GAS INVALID JSON",
                traceId,
                requestBody.action,
                responseText.substring(
                    0,
                    500
                )
            );

            return response
                .status(502)
                .json({
                    success: false,
                    message:
                        "Respons Apps Script bukan JSON."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDASI APPS SCRIPT
        |--------------------------------------------------------------------------
        */

        if (
            !result ||
            result.success !== true
        ) {

            console.error(
                "[VERCEL] GAS APPLICATION ERROR",
                traceId,
                requestBody.action,
                result
            );

            return response
                .status(400)
                .json({
                    success: false,

                    message:
                        result?.message ||
                        "Apps Script gagal memproses data."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | TOTAL
        |--------------------------------------------------------------------------
        */

        const apiDuration =
            performance.now() -
            apiStartedAt;

        console.log(
            "[VERCEL] API TOTAL",
            traceId,
            requestBody.action,
            `${(
                apiDuration /
                1000
            ).toFixed(2)}s`
        );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE KE BROWSER
        |--------------------------------------------------------------------------
        */

        console.log(
            "[VERCEL] BEFORE BROWSER RESPONSE",
            traceId,
            requestBody.action,
            `${(
                apiDuration /
                1000
            ).toFixed(2)}s`
        );

        return response
            .status(200)
            .json(
                result.result
            );


    } catch (error) {

        const apiDuration =
            performance.now() -
            apiStartedAt;

        console.error(
            "[VERCEL] API ERROR",
            traceId,
            request.body?.action,
            error &&
            error.message
                ? error.message
                : error
        );

        console.error(
            "[VERCEL] API TOTAL ERROR",
            traceId,
            `${(
                apiDuration /
                1000
            ).toFixed(2)}s`
        );


        if (
            error &&
            error.name ===
            "AbortError"
        ) {

            return response
                .status(504)
                .json({
                    success: false,
                    message:
                        "Apps Script terlalu lama merespons."
                });
        }


        return response
            .status(500)
            .json({
                success: false,

                message:
                    error &&
                    error.message
                        ? error.message
                        : "Gagal menghubungi Apps Script."
            });
    }
}
})();

// ===== managed =====
const managedHandler = (() => {



function clean(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

function isMasterNik(nik) {
    return clean(nik) === "910000";
}

return async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const rows = await supabaseRequest(
            "/rest/v1/salesman" +
            "?select=" +
            [
                "nik",
                "nama_marketing",
                "cab",
                "jab",
                "role_pkm",
                "status",
                "ttd_file_id",
                "ttd_url"
            ].join(",") +
            "&order=nama_marketing.asc" +
            "&limit=2000"
        );

        const accounts = Array.isArray(rows)
            ? rows
                .filter(function (row) {
                    return clean(row.nik);
                })
                .map(function (row) {
                    const nik = clean(row.nik);

                    return {
                        nik: nik,

                        name: clean(
                            row.nama_marketing
                        ),

                        branch: clean(
                            row.cab
                        ),

                        jabatan: clean(
                            row.jab
                        ),

                        role: clean(
                            row.role_pkm
                        ).toUpperCase(),

                        status: (
                            clean(row.status) ||
                            "AKTIF"
                        )
                            .toUpperCase()
                            .replace(/\s+/g, ""),

                        hasSignature: Boolean(
                            clean(row.ttd_file_id) ||
                            clean(row.ttd_url)
                        ),

                        isMaster: isMasterNik(nik)
                    };
                })
                .sort(function (a, b) {
                    return a.name.localeCompare(
                        b.name,
                        "id"
                    );
                })
            : [];

        return res.status(200).json({
            success: true,
            message:
                "Data akun berhasil diambil dari Supabase.",
            accounts: accounts,
            total: accounts.length
        });

    } catch (error) {
        console.error(
            "MANAGED ACCOUNTS API ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil data akun dari Supabase."
        });
    }
}
})();

// ===== master =====
const masterHandler = (() => {

    const MASTER_CONFIG = {

        LEASING: {
            table: "master_leasing",
            key: "kode",
            headers: [
                "INIT",
                "KODE",
                "NAMA"
            ],
            select:
                "init,kode,nama",
            order:
                "init.asc"
        },

        PKM: {
            table: "master_pkm",
            key: "id",
            headers: [
                "ID PKM",
                "PKM",
                "JENIS PKM"
            ],
            select:
                "id,pkm,jenis_pkm",
            order:
                "id.asc"
        },

        EVENT: {
            table: "master_activity",
            key: "id_event",
            headers: [
                "ID EVENT",
                "KODE EVENT",
                "NAMA EVENT",
                "NAMA EVENT MD",
                "JENIS EVENT"
            ],
            select:
                "id_event,kode_event,nama_event,nama_event_md,jenis_event",
            order:
                "id_event.asc"
        },

        KPI_CRM: {
            table: "master_kpi_crm",
            key: "id",
            headers: [
                "ID",
                "PILAR UTAMA",
                "INDIKATOR KPI",
                "TARGET",
                "%",
                "BOBOT",
                "JENIS TARGET",
                "UNDER TARGET"
            ],
            select:
                "id,pilar_utama,indikator_kpi,target,target_persen,bobot,jenis_target,under_target",
            order:
                "id.asc"
        }
    };


    function clean(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value).trim();
    }


    function toDbValues(
        type,
        values
    ) {

        const config =
            MASTER_CONFIG[type];

        if (!config) {
            throw new Error(
                `Jenis master "${type}" tidak tersedia.`
            );
        }

        const source =
            values || {};

        if (type === "LEASING") {

            return {
                init:
                    clean(source["INIT"]),

                kode:
                    clean(source["KODE"]),

                nama:
                    clean(source["NAMA"])
            };
        }


        if (type === "PKM") {

            return {
                id:
                    clean(source["ID PKM"]),

                pkm:
                    clean(source["PKM"]),

                jenis_pkm:
                    clean(source["JENIS PKM"])
            };
        }


        if (type === "EVENT") {

            return {
                id_event:
                    clean(source["ID EVENT"]),

                kode_event:
                    clean(source["KODE EVENT"]),

                nama_event:
                    clean(source["NAMA EVENT"]),

                nama_event_md:
                    clean(source["NAMA EVENT MD"]),

                jenis_event:
                    clean(source["JENIS EVENT"])
            };
        }


        if (type === "KPI_CRM") {

            return {
                id:
                    source["ID"] === "" ||
                    source["ID"] === null ||
                    source["ID"] === undefined
                        ? null
                        : Number(
                            source["ID"]
                        ),

                pilar_utama:
                    clean(
                        source["PILAR UTAMA"]
                    ),

                indikator_kpi:
                    clean(
                        source["INDIKATOR KPI"]
                    ),

                target:
                    source["TARGET"] === ""
                        ? null
                        : Number(
                            source["TARGET"]
                        ),

                target_persen:
                    source["%"] === ""
                        ? null
                        : Number(
                            source["%"]
                        ),

                bobot:
                    source["BOBOT"] === ""
                        ? null
                        : Number(
                            source["BOBOT"]
                        ),

                jenis_target:
                    clean(
                        source["JENIS TARGET"]
                    ),

                under_target:
                    clean(
                        source["UNDER TARGET"]
                    )
            };
        }

        return {};
    }


    function toFrontendRow(
        type,
        row
    ) {

        if (type === "LEASING") {

            return {
                "INIT":
                    clean(row.init),

                "KODE":
                    clean(row.kode),

                "NAMA":
                    clean(row.nama)
            };
        }


        if (type === "PKM") {

            return {
                "ID PKM":
                    clean(row.id),

                "PKM":
                    clean(row.pkm),

                "JENIS PKM":
                    clean(row.jenis_pkm)
            };
        }


        if (type === "EVENT") {

            return {
                "ID EVENT":
                    clean(row.id_event),

                "KODE EVENT":
                    clean(row.kode_event),

                "NAMA EVENT":
                    clean(row.nama_event),

                "NAMA EVENT MD":
                    clean(row.nama_event_md),

                "JENIS EVENT":
                    clean(row.jenis_event)
            };
        }


        if (type === "KPI_CRM") {

            return {
                "ID":
                    row.id,

                "PILAR UTAMA":
                    clean(row.pilar_utama),

                "INDIKATOR KPI":
                    clean(row.indikator_kpi),

                "TARGET":
                    row.target ?? "",

                "%":
                    row.target_persen ?? "",

                "BOBOT":
                    row.bobot ?? "",

                "JENIS TARGET":
                    clean(row.jenis_target),

                "UNDER TARGET":
                    clean(row.under_target)
            };
        }

        return {};
    }


    return async function handler(
        req,
        res
    ) {

        try {

            const type =
                String(
                    req.query?.type ||
                    req.body?.type ||
                    req.body?.payload?.type ||
                    ""
                )
                .trim()
                .toUpperCase();


            // ==================================================
            // GET REFERENCE MASTER LAMA
            // GET /api/master
            // tanpa ?type
            // ==================================================

            if (
                req.method === "GET" &&
                !type
            ) {

                const pkmTypes =
                    await supabaseRequest(
                        "/rest/v1/master_pkm" +
                        "?select=id,pkm,jenis_pkm" +
                        "&order=id.asc"
                    );


                const events =
                    await supabaseRequest(
                        "/rest/v1/master_activity" +
                        "?select=id_event,kode_event,nama_event,nama_event_md,jenis_event" +
                        "&order=id_event.asc"
                    );


                const unitRows =
                    await supabaseRequest(
                        "/rest/v1/master_unit" +
                        "?select=gab" +
                        "&order=gab.asc"
                    );


                const result = {

                    leasing: [],

                    focusTypes:
                        unitRows
                            .map(function (row) {
                                return String(
                                    row.gab || ""
                                ).trim();
                            })
                            .filter(Boolean),

                    pkmTypes:
                        pkmTypes
                            .map(function (row) {
                                return {
                                    id:
                                        String(
                                            row.id || ""
                                        ).trim(),

                                    category:
                                        String(
                                            row.pkm || ""
                                        ).trim(),

                                    name:
                                        String(
                                            row.jenis_pkm || ""
                                        ).trim()
                                };
                            })
                            .filter(function (item) {
                                return Boolean(
                                    item.name
                                );
                            }),

                    events:
                        events
                            .map(function (row) {
                                return {
                                    id:
                                        String(
                                            row.id_event || ""
                                        ).trim(),

                                    code:
                                        String(
                                            row.kode_event || ""
                                        ).trim(),

                                    name:
                                        String(
                                            row.nama_event || ""
                                        ).trim(),

                                    mdName:
                                        String(
                                            row.nama_event_md || ""
                                        ).trim(),

                                    category:
                                        String(
                                            row.jenis_event || ""
                                        ).trim()
                                };
                            })
                            .filter(function (item) {
                                return Boolean(
                                    item.name
                                );
                            })
                };


                return res.status(200).json({
                    success: true,
                    message:
                        "Master data berhasil diambil dari Supabase.",
                    data: result
                });
            }


            // ==================================================
            // MASTER DATA INDIVIDUAL
            // ==================================================

            const config =
                MASTER_CONFIG[type];


            if (!config) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Jenis master "${type}" tidak tersedia.`
                });
            }


            // ==================================================
            // GET
            // ==================================================

            if (req.method === "GET") {

                const rows =
                    await supabaseRequest(
                        "/rest/v1/" +
                        config.table +
                        "?select=" +
                        encodeURIComponent(
                            config.select
                        ) +
                        "&order=" +
                        encodeURIComponent(
                            config.order
                        )
                    );


                const data =
                    Array.isArray(rows)
                        ? rows.map(function (row) {

                            return toFrontendRow(
                                type,
                                row
                            );

                        })
                        : [];


                return res.status(200).json({

                    success:
                        true,

                    type:
                        type,

                    headers:
                        config.headers,

                    data:
                        data
                });
            }


            // ==================================================
            // POST = TAMBAH / EDIT
            // ==================================================

            if (req.method === "POST") {

                const body =
                    req.body || {};

                const payload =
                    body.payload ||
                    body;

                const values =
                    payload.values ||
                    {};

                const mode =
                    String(
                        payload.mode ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                const dbValues =
                    toDbValues(
                        type,
                        values
                    );


                const keyValue =
                    clean(
                        dbValues[
                            config.key
                        ]
                    );


                if (!keyValue) {

                    return res.status(400).json({

                        success:
                            false,

                        message:
                            `${config.headers[0]} wajib diisi.`
                    });
                }


                // --------------------------------------------------
                // EDIT
                // --------------------------------------------------

                if (mode === "UPDATE") {

                    const result =
                        await supabaseRequest(

                            "/rest/v1/" +
                            config.table +
                            "?" +
                            encodeURIComponent(
                                config.key
                            ) +
                            "=eq." +
                            encodeURIComponent(
                                keyValue
                            ),

                            {
                                method:
                                    "PATCH",

                                headers: {
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        dbValues
                                    )
                            }
                        );


                    return res.status(200).json({

                        success:
                            true,

                        mode:
                            "UPDATE",

                        data:
                            Array.isArray(
                                result
                            )
                                ? result[0]
                                : result
                    });
                }


                // --------------------------------------------------
                // TAMBAH
                // --------------------------------------------------

                const result =
                    await supabaseRequest(

                        "/rest/v1/" +
                        config.table,

                        {
                            method:
                                "POST",

                            headers: {
                                "Prefer":
                                    "return=representation"
                            },

                            body:
                                JSON.stringify(
                                    dbValues
                                )
                        }
                    );


                return res.status(201).json({

                    success:
                        true,

                    mode:
                        "INSERT",

                    data:
                        Array.isArray(
                            result
                        )
                            ? result[0]
                            : result
                });
            }


            // ==================================================
            // DELETE
            // ==================================================

            if (req.method === "DELETE") {

                const body =
                    req.body || {};

                const payload =
                    body.payload ||
                    body;

                const keyValue =
                    clean(
                        payload.keyValue
                    );


                if (!keyValue) {

                    return res.status(400).json({

                        success:
                            false,

                        message:
                            `${config.headers[0]} tidak ditemukan.`
                    });
                }


                await supabaseRequest(

                    "/rest/v1/" +
                    config.table +
                    "?" +
                    encodeURIComponent(
                        config.key
                    ) +
                    "=eq." +
                    encodeURIComponent(
                        keyValue
                    ),

                    {
                        method:
                            "DELETE",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        }
                    }
                );


                return res.status(200).json({

                    success:
                        true,

                    mode:
                        "DELETE",

                    message:
                        "Master data berhasil dihapus."
                });
            }


            return res.status(405).json({

                success:
                    false,

                message:
                    "Method tidak diizinkan."
            });


        } catch (error) {

            console.error(
                "MASTER API ERROR:",
                error
            );


            return res.status(
                error.status || 500
            ).json({

                success:
                    false,

                message:
                    error.message ||
                    "Gagal memproses master data."
            });
        }
    };

})();

// ===== salesman =====
const salesmanHandler = (() => {



function clean(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

return async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {

        const branch =
            clean(req.query?.branch);

        let query =
            "/rest/v1/salesman" +
            "?select=nik,gab,nama_marketing,id_tl,tl,jab,pos,cab,sebagai,status,role_pkm,ttd_file_id,ttd_url,source_updated_at" +
            "&order=nama_marketing.asc" +
            "&limit=2000";

        /*
        |--------------------------------------------------------------------------
        | FILTER CABANG
        |--------------------------------------------------------------------------
        |
        | Jika branch kosong / ALL:
        |   ambil semua salesman
        |
        | Jika branch tertentu:
        |   hanya salesman dengan cab yang sama
        |
        */

        if (
            branch &&
            branch.toUpperCase() !== "ALL"
        ) {
            query +=
                "&cab=eq." +
                encodeURIComponent(branch);
        }

        const rows =
            await supabaseRequest(query);

        const data =
            Array.isArray(rows)
                ? rows.map(function (row) {

                    const name =
                        clean(
                            row.nama_marketing
                        );

                    return {

                        /*
                        |--------------------------------------------------------------------------
                        | FIELD LAMA / FRONTEND
                        |--------------------------------------------------------------------------
                        */

                        nik:
                            clean(row.nik),

                        name:
                            name,

                        branch:
                            clean(row.cab),

                        gab:
                            clean(row.gab),

                        idTl:
                            clean(row.id_tl),

                        tl:
                            clean(row.tl),

                        jab:
                            clean(row.jab),

                        pos:
                            clean(row.pos),

                        cab:
                            clean(row.cab),

                        sebagai:
                            clean(row.sebagai),

                        status:
                            clean(row.status),

                        rolePkm:
                            clean(row.role_pkm),

                        ttdFileId:
                            clean(row.ttd_file_id),

                        ttdUrl:
                            clean(row.ttd_url),

                        updatedAt:
                            clean(row.source_updated_at),

                        /*
                        |--------------------------------------------------------------------------
                        | FIELD SUPABASE
                        |--------------------------------------------------------------------------
                        |
                        | Tetap dikirim agar kode baru bisa
                        | memakai nama field yang lebih jelas.
                        |
                        */

                        namaMarketing:
                            name
                    };
                })
                : [];

        return res.status(200).json({

            success:
                true,

            message:
                "Data salesman berhasil diambil dari Supabase.",

            data:
                data,

            branch:
                branch || "ALL",

            total:
                data.length

        });

    } catch (error) {

        console.error(
            "SALESMAN API ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({

            success:
                false,

            message:
                error.message ||
                "Gagal mengambil data salesman dari Supabase."
        });
    }
}
})();

// ===== pkm =====
const pkmHandler = (() => {



/**
 * PKM API
 *
 * Sumber data:
 *   Supabase -> public.pkm
 *
 * Belum mengubah app.js.
 * Endpoint ini hanya untuk testing migrasi getPkmData.
 */

function textValue(value) {
    return String(value ?? "").trim();
}

function numberValue(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function splitTextValue(value) {
    const text = textValue(value);

    if (!text) {
        return [];
    }

    return text
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

function normalizeBranch(value) {
    return textValue(value).toUpperCase();
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return textValue(value);
    }

    return date.toISOString().slice(0, 10);
}


/**
 * Untuk sementara branchName mengikuti branch.
 *
 * Nanti bisa kita ambil dari master_unit jika memang
 * ada mapping kode -> nama cabang yang dibutuhkan UI.
 */
function getBranchName(branch) {
    return branch;
}


/**
 * Menghitung status berdasarkan data approval,
 * mengikuti logic getPkmData lama.
 */
function getApprovalStep(row) {

    const typePkm =
        textValue(row.type_pkm)
            .replace(/\s+/g, "")
            .toUpperCase();

    const accCrm =
        textValue(row.acc_crm);

    const accKacab =
        textValue(row.acc_kacab);

    const accMsmc =
        textValue(row.acc_msmc);

    const accKoordinatorH23 =
        textValue(row.acc_koordinator_h23);

    const accManagerH1 =
        textValue(row.acc_manager_h1);

    const accManagerH23 =
        textValue(row.acc_manager_h23);


    /*
    |--------------------------------------------------------------------------
    | STEP 1 — CRM
    |--------------------------------------------------------------------------
    */

    if (!accCrm) {
        return "CRM";
    }


    /*
    |--------------------------------------------------------------------------
    | STEP 2 — KACAB
    |--------------------------------------------------------------------------
    */

    if (!accKacab) {
        return "KACAB";
    }


    /*
    |--------------------------------------------------------------------------
    | STEP 3 — MSMC
    |--------------------------------------------------------------------------
    */

    if (!accMsmc) {
        return "MSMC";
    }


    /*
    |--------------------------------------------------------------------------
    | H23 / H123
    |--------------------------------------------------------------------------
    | Setelah MSMC harus melalui Koordinator H23.
    */

    if (
        typePkm === "H23" ||
        typePkm === "H123"
    ) {

        if (!accKoordinatorH23) {
            return "PIC_H23";
        }
    }


    /*
    |--------------------------------------------------------------------------
    | MANAGER
    |--------------------------------------------------------------------------
    */

    if (typePkm === "H23") {

        if (!accManagerH23) {
            return "MGR_H23";
        }

    } else {

        /*
        | H1 dan H123 berakhir di Manager H1
        */

        if (!accManagerH1) {
            return "MGR_H1";
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SELESAI
    |--------------------------------------------------------------------------
    */

    return "SELESAI";
}

function getStatus(row) {

    const savedStatus = textValue(
        row.status || row.pengajuan
    ).toUpperCase();

    if (savedStatus.includes("TOLAK")) {
        return "DITOLAK";
    }

    const approvalStep = getApprovalStep(row);

    return approvalStep === "SELESAI"
        ? "ACC"
        : `MENUNGGU ${approvalStep}`;
}


function mapPkmRecord(row) {

    const branch =
        normalizeBranch(row.cabang);

    const danaLeasing =
        numberValue(row.dana_ls);

    const danaMd =
        numberValue(row.dana_md);

    const danaCsm =
        numberValue(row.dana_csm);

    const danaLain =
        numberValue(row.dana_ll);

    const status =
        getStatus(row);

    const approvalStep =
        getApprovalStep(row);

    return {

        id:
            textValue(row.id_pkm),

        name:
            textValue(row.nama),

        branch:
            branch,

        branchName:
            getBranchName(branch),

        type:
            splitTextValue(row.type_pkm),

        jenisPkm:
            textValue(row.jenis_pkm),

        kegiatan:
            textValue(row.jenis_kegiatan),

        startDate:
            formatDate(row.tanggal_mulai),

        endDate:
            formatDate(row.tanggal_selesai),

        createdAt:
            formatDate(row.tanggal_pengajuan),

        location:
            textValue(row.lokasi),

        kabupaten:
            textValue(row.kabupaten),

        kecamatan:
            textValue(row.kecamatan),

        kelurahan:
            textValue(row.kelurahan),

        alasan:
            textValue(row.alasan),

        konsep:
            textValue(row.konsep),

        people:
            splitTextValue(row.people),

        fokusType:
            splitTextValue(row.fokus_type),

        programH1:
            splitTextValue(row.program_h1),

        programH23:
            splitTextValue(row.program_h23),

        publikasi:
            splitTextValue(row.publikasi),

        leasing:
            splitTextValue(row.leasing),

        danaLeasing:
            danaLeasing,

        danaMd:
            danaMd,

        danaCsm:
            danaCsm,

        danaLain:
            danaLain,

        totalFund:
            danaLeasing +
            danaMd +
            danaCsm +
            danaLain,

        targetDb:
            numberValue(row.target_db),

        targetDeal:
            numberValue(row.target_deal),

        targetUe:
            numberValue(row.target_ue),

        status:
            status,

        approvalStep:
            approvalStep,

        source:
            textValue(row.source) || "SUPABASE",

        pengajuan:
            textValue(row.pengajuan),

        approvals: {
            crm:
                textValue(row.acc_crm),

            kacab:
                textValue(row.acc_kacab),

            msmc:
                textValue(row.acc_msmc),

            koordinatorH23:
                textValue(row.acc_koordinator_h23),

            managerH1:
                textValue(row.acc_manager_h1),

            managerH23:
                textValue(row.acc_manager_h23)
        },

        pdf:
            textValue(row.pdf),

        print:
            textValue(row.print)
    };
}


function createSummary(records) {

    const pending =
        records.filter(item =>
            String(item.status)
                .startsWith("MENUNGGU")
        ).length;

    const approved =
        records.filter(item =>
            ["ACC", "DISETUJUI"]
                .includes(item.status)
        ).length;

    const totalFund =
        records.reduce(
            (total, item) =>
                total + numberValue(item.totalFund),
            0
        );

    return {
        totalSubmission:
            records.length,

        pendingSubmission:
            pending,

        approvedSubmission:
            approved,

        totalFund:
            totalFund
    };
}


function createAppliedFilters(query) {

    const startDate =
        textValue(query.startDate);

    const endDate =
        textValue(query.endDate);

    const jenisPkm =
        textValue(query.jenisPkm || "ALL")
            .toUpperCase();

    let branches = [];

    if (query.branches) {

        branches = String(query.branches)
            .split(",")
            .map(normalizeBranch)
            .filter(Boolean);
    }

    return {
        startDate,
        endDate,
        jenisPkm,
        branches
    };
}


function dateRangesOverlap(
    eventStart,
    eventEnd,
    filterStart,
    filterEnd
) {

    if (!filterStart && !filterEnd) {
        return true;
    }

    const start =
        eventStart
            ? new Date(eventStart)
            : null;

    const end =
        eventEnd
            ? new Date(eventEnd)
            : start;

    if (!start || Number.isNaN(start.getTime())) {
        return false;
    }

    if (!end || Number.isNaN(end.getTime())) {
        return false;
    }

    if (filterStart) {

        const filterStartDate =
            new Date(`${filterStart}T00:00:00`);

        if (end < filterStartDate) {
            return false;
        }
    }

    if (filterEnd) {

        const filterEndDate =
            new Date(`${filterEnd}T23:59:59`);

        if (start > filterEndDate) {
            return false;
        }
    }

    return true;
}


async function getPkmRows() {

    const pageSize = 1000;
    const allRows = [];

    let offset = 0;

    while (true) {

        const rows = await supabaseRequest(
            "/rest/v1/pkm" +
            "?select=*" +
            "&order=tanggal_mulai.desc,id.desc" +
            "&offset=" + offset +
            "&limit=" + pageSize
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            break;
        }

        allRows.push(...rows);

        console.log(
            `PKM pagination: offset=${offset}, rows=${rows.length}, total=${allRows.length}`
        );

        if (rows.length < pageSize) {
            break;
        }

        offset += pageSize;
    }

    return allRows;
}


return async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {

        const filters =
            createAppliedFilters(req.query || {});

        const rows =
            await getPkmRows();

        let records =
            rows
                .filter(row => {

                    const branch =
                        normalizeBranch(row.cabang);

                    /*
                     * Kalau branches dikirim,
                     * filter berdasarkan branch.
                     */
                    if (
                        filters.branches.length &&
                        !filters.branches.includes(branch)
                    ) {
                        return false;
                    }

                    /*
                     * Filter jenis PKM.
                     */
                    const jenisPkm =
                        textValue(row.jenis_pkm)
                            .toUpperCase();

                    if (
                        filters.jenisPkm !== "ALL" &&
                        jenisPkm !== filters.jenisPkm
                    ) {
                        return false;
                    }

                    /*
                     * Filter tanggal menggunakan
                     * tanggal pelaksanaan.
                     */
                    return dateRangesOverlap(
                        row.tanggal_mulai,
                        row.tanggal_selesai ||
                            row.tanggal_mulai,
                        filters.startDate,
                        filters.endDate
                    );
                })
                .map(mapPkmRecord);

        /*
         * Pastikan terbaru berada di atas.
         */
        records.sort((a, b) => {

            const dateA =
                new Date(a.startDate || 0).getTime();

            const dateB =
                new Date(b.startDate || 0).getTime();

            return dateB - dateA;
        });


        /*
         * Ambil daftar branch dari data PKM.
         *
         * Untuk tahap test ini kita tidak memakai
         * getBranchOptions_() dari GAS.
         */
        const branchSet =
            new Set(
                rows
                    .map(row =>
                        normalizeBranch(row.cabang)
                    )
                    .filter(Boolean)
            );

        const branches =
            Array.from(branchSet)
                .sort()
                .map(code => ({
                    code,
                    name: getBranchName(code)
                }));


        const summary =
            createSummary(records);


        return res.status(200).json({

            success: true,

            message:
                "Data PKM berhasil diambil dari Supabase.",

            data: {
                data: records,

                summary,

                branches,

                isHeadOffice: true,

                appliedFilters:
                    filters,

                totalRows:
                    records.length
            }

        });

    } catch (error) {

        console.error(
            "PKM API ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Gagal mengambil data PKM dari Supabase."

        });
    }
}
})();

// ===== pkmDownload =====
const pkmDownloadHandler = (() => {




const GOOGLE_SERVICE_ACCOUNT_EMAIL =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const GOOGLE_PRIVATE_KEY =
    process.env.GOOGLE_PRIVATE_KEY;

const PKM_DRIVE_FOLDER_ID =
    process.env.PKM_DRIVE_FOLDER_ID;


/*
|--------------------------------------------------------------------------
| GOOGLE DRIVE AUTH
|--------------------------------------------------------------------------
*/

function getDriveClient() {

    if (
        !GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !GOOGLE_PRIVATE_KEY ||
        !PKM_DRIVE_FOLDER_ID
    ) {
        throw new Error(
            "Google Drive environment variable belum lengkap."
        );
    }


    const auth =
        new google.auth.GoogleAuth({

            credentials: {

                client_email:
                    GOOGLE_SERVICE_ACCOUNT_EMAIL,

                private_key:
                    GOOGLE_PRIVATE_KEY.replace(
                        /\\n/g,
                        "\n"
                    )
            },

            scopes: [
                "https://www.googleapis.com/auth/drive.readonly"
            ]
        });


    return google.drive({
        version: "v3",
        auth
    });
}


/*
|--------------------------------------------------------------------------
| AMBIL DATA PKM
|--------------------------------------------------------------------------
*/

async function getPkm(
    pkmId
) {

    const rows =
        await supabaseRequest(
            "/rest/v1/pkm" +
            "?select=id_pkm,pdf,print,link" +
            "&id_pkm=eq." +
            encodeURIComponent(
                pkmId
            ) +
            "&limit=1"
        );


    if (
        !rows ||
        !rows.length
    ) {
        return null;
    }


    return rows[0];
}


/*
|--------------------------------------------------------------------------
| AMBIL NAMA FILE DARI PRINT
|--------------------------------------------------------------------------
*/

function getFileNameFromPrint(
    printPath
) {

    return String(
        printPath || ""
    )
        .replace(
            /\\/g,
            "/"
        )
        .split("/")
        .pop()
        .trim();
}


/*
|--------------------------------------------------------------------------
| CARI FILE DI GOOGLE DRIVE
|--------------------------------------------------------------------------
*/

async function findDriveFile(
    drive,
    fileName
) {

    const escapedName =
        String(
            fileName
        )
            .replace(
                /\\/g,
                "\\\\"
            )
            .replace(
                /'/g,
                "\\'"
            );


    const escapedFolder =
        String(
            PKM_DRIVE_FOLDER_ID
        )
            .replace(
                /\\/g,
                "\\\\"
            )
            .replace(
                /'/g,
                "\\'"
            );


    const result =
        await drive.files.list({

            q:
                `'${escapedFolder}' in parents` +
                ` and name = '${escapedName}'` +
                ` and trashed = false`,

            fields:
                "files(id,name,mimeType,modifiedTime)",

            pageSize:
                20,

            orderBy:
                "modifiedTime desc"
        });


    return (
        result.data.files &&
        result.data.files.length
            ? result.data.files[0]
            : null
    );
}


/*
|--------------------------------------------------------------------------
| HANDLER
|--------------------------------------------------------------------------
*/

return async function handler(
    req,
    res
) {

    try {

        if (
            req.method !== "GET"
        ) {

            res.setHeader(
                "Allow",
                "GET"
            );

            return res
                .status(405)
                .json({

                    success:
                        false,

                    message:
                        "Method tidak diizinkan."
                });
        }


        const pkmId =
            String(
                req.query?.pkmId ||
                ""
            ).trim();


        if (!pkmId) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "pkmId wajib diisi."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | SUPABASE
        |--------------------------------------------------------------------------
        */

        const pkm =
            await getPkm(
                pkmId
            );


        if (!pkm) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    found:
                        false,

                    message:
                        "Data PKM tidak ditemukan."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | LINK SUDAH ADA
        |--------------------------------------------------------------------------
        */

        const existingLink =
            String(
                pkm.link ||
                ""
            ).trim();


        if (existingLink) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    found:
                        true,

                    source:
                        "supabase",

                    pkmId:
                        pkmId,

                    pdfUrl:
                        existingLink
                });
        }


        /*
        |--------------------------------------------------------------------------
        | PDF LAMA
        |--------------------------------------------------------------------------
        */

        const fileName =
            getFileNameFromPrint(
                pkm.print
            );


        if (!fileName) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    found:
                        false,

                    message:
                        "Nama file PDF tidak tersedia."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | GOOGLE DRIVE
        |--------------------------------------------------------------------------
        */

        const drive =
            getDriveClient();


        const driveFile =
            await findDriveFile(
                drive,
                fileName
            );


        if (!driveFile) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    found:
                        false,

                    pkmId:
                        pkmId,

                    fileName:
                        fileName,

                    message:
                        "PDF tidak ditemukan di Google Drive."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | DRIVE URL
        |--------------------------------------------------------------------------
        */

        const driveUrl =
            "https://drive.google.com/file/d/" +
            encodeURIComponent(
                driveFile.id
            ) +
            "/view";


        /*
        |--------------------------------------------------------------------------
        | SIMPAN LINK
        |--------------------------------------------------------------------------
        */

        await supabaseRequest(

            "/rest/v1/pkm" +
            "?id_pkm=eq." +
            encodeURIComponent(
                pkmId
            ),

            {

                method:
                    "PATCH",

                headers: {

                    "Prefer":
                        "return=minimal"
                },

                body:
                    JSON.stringify({

                        link:
                            driveUrl
                    })
            }
        );


        /*
        |--------------------------------------------------------------------------
        | RETURN
        |--------------------------------------------------------------------------
        */

        return res
            .status(200)
            .json({

                success:
                    true,

                found:
                    true,

                source:
                    "google_drive",

                pkmId:
                    pkmId,

                fileId:
                    driveFile.id,

                fileName:
                    driveFile.name,

                pdfUrl:
                    driveUrl
            });


    } catch (error) {

        console.error(
            "PKM DOWNLOAD ERROR:",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                message:
                    error?.message ||
                    "Gagal mengambil PDF PKM."
            });
    }
}
})();

// ===== discord =====
const discordHandler = (() => {
return async function handler(
    request,
    response
) {
    if (request.method !== "POST") {
        return response.status(405).json({
            success: false,
            message: "Gunakan method POST."
        });
    }

    const receivedSecret =
        request.headers[
            "x-discord-notify-secret"
        ];

    const expectedSecret =
        process.env
            .DISCORD_NOTIFY_SECRET;

    if (
        !expectedSecret ||
        receivedSecret !== expectedSecret
    ) {
        return response.status(401).json({
            success: false,
            message: "Akses tidak diizinkan."
        });
    }

    const botToken =
        process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
        return response.status(500).json({
            success: false,
            message:
                "DISCORD_BOT_TOKEN belum diatur."
        });
    }

    try {
        let body =
            request.body || {};

        if (typeof body === "string") {
            body = JSON.parse(body);
        }

        const target =
            String(
                body.target || ""
            ).trim().toUpperCase();

        const channelMap = {
            MSMC:
                process.env
                    .DISCORD_CHANNEL_MSMC,

            MGR:
                process.env
                    .DISCORD_CHANNEL_MANAGER
        };

        const channelId =
            channelMap[target];

        if (!channelId) {
            return response.status(400).json({
                success: false,
                message:
                    "Target Discord tidak tersedia."
            });
        }

        const messageData =
            body.messageData;

        if (
            !messageData ||
            typeof messageData !== "object"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Isi pesan Discord belum tersedia."
            });
        }

        const discordResponse =
            await fetch(
                "https://discord.com/api/v10/channels/" +
                    channelId +
                    "/messages",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            "Bot " + botToken
                    },

                    body:
                        JSON.stringify(
                            messageData
                        )
                }
            );

        const responseText =
            await discordResponse.text();

        let discordResult = null;

        if (responseText) {
            try {
                discordResult =
                    JSON.parse(
                        responseText
                    );
            } catch (error) {
                discordResult = {
                    raw: responseText
                };
            }
        }

        if (!discordResponse.ok) {
            return response
                .status(discordResponse.status)
                .json({
                    success: false,

                    message:
                        discordResult &&
                        discordResult.message
                            ? discordResult.message
                            : "Discord gagal menerima pesan.",

                    discordCode:
                        discordResult &&
                        discordResult.code
                            ? discordResult.code
                            : null
                });
        }

        return response.status(200).json({
            success: true,

            result: {
                messageId:
                    discordResult.id,

                channelId:
                    discordResult.channel_id,

                target: target
            }
        });
    } catch (error) {
        return response.status(500).json({
            success: false,

            message:
                error &&
                error.message
                    ? error.message
                    : "Gagal mengirim reminder Discord."
        });
    }
}
})();


/*
|---------------------------------------------------------------------------
| GOOGLE DRIVE CLIENT UNTUK TTD PKM
|---------------------------------------------------------------------------
*/

function getPkmItemDriveClient() {

    const refreshToken =
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!refreshToken) {

        const error =
            new Error(
                "GOOGLE_DRIVE_REFRESH_TOKEN belum dikonfigurasi di Vercel."
            );

        error.status = 500;

        throw error;
    }

    const auth =
        getGoogleOAuthClient();

    auth.setCredentials({
        refresh_token:
            refreshToken
    });

    return google.drive({
        version: "v3",
        auth
    });
}


/*
|---------------------------------------------------------------------------
| CARI / BUAT FOLDER PKM_Images
|---------------------------------------------------------------------------
*/

/*
|---------------------------------------------------------------------------
| PARSE DATA URL TTD
|---------------------------------------------------------------------------
*/

function parseDataUrlImage(
    dataUrl
) {

    const value =
        String(
            dataUrl || ""
        ).trim();


    const match =
        value.match(
            /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\r\n]+)$/i
        );


    if (!match) {

        const error =
            new Error(
                "Format tanda tangan tidak valid."
            );

        error.status = 400;

        throw error;
    }


    const rawExtension =
        match[1]
            .toLowerCase();


    const extension =
        rawExtension === "jpeg" ||
        rawExtension === "jpg"
            ? "jpg"
            : rawExtension;


    const mimeType =
        extension === "jpg"
            ? "image/jpeg"
            : `image/${extension}`;


    const buffer =
        Buffer.from(
            match[2]
                .replace(
                    /\s+/g,
                    ""
                ),
            "base64"
        );


    return {

        buffer:
            buffer,

        extension:
            extension,

        mimeType:
            mimeType
    };
}


/*
|---------------------------------------------------------------------------
| AMBIL TTD TERSIMPAN USER
|---------------------------------------------------------------------------
*/

async function downloadSavedProfileSignature(
    userNik
) {

    const rows =
        await supabaseRequest(

            "/rest/v1/salesman" +

            "?select=" +
                "nik," +
                "nama_marketing," +
                "ttd_storage_path," +
                "ttd_url" +

            "&nik=eq." +
                encodeURIComponent(
                    userNik
                ) +

            "&limit=1"
        );


    const user =
        Array.isArray(rows)
            ? rows[0]
            : null;


    if (!user) {

        const error =
            new Error(
                "Data profil user tidak ditemukan."
            );

        error.status = 404;

        throw error;
    }


    const storagePath =
        String(
            user.ttd_storage_path ||
            ""
        ).trim();


    const legacyUrl =
        String(
            user.ttd_url ||
            ""
        ).trim();


    let response;


    /*
    |-----------------------------------------------------------------------
    | PRIORITAS 1: SUPABASE STORAGE
    |-----------------------------------------------------------------------
    */

    if (
        storagePath
    ) {

        const storageUrl =
            `${SUPABASE_URL}/storage/v1/object/ttd/${storagePath
                .split("/")
                .map(
                    encodeURIComponent
                )
                .join("/")}`;


        response =
            await fetch(
                storageUrl
            );

    }


    /*
    |-----------------------------------------------------------------------
    | PRIORITAS 2: URL LAMA
    |-----------------------------------------------------------------------
    */

    if (
        !response &&
        legacyUrl
    ) {

        response =
            await fetch(
                legacyUrl
            );
    }


    if (
        !response ||
        !response.ok
    ) {

        const error =
            new Error(
                "TTD tersimpan tidak dapat diambil. Silakan gambar TTD secara manual."
            );

        error.status = 400;

        throw error;
    }


    const buffer =
        Buffer.from(
            await response.arrayBuffer()
        );


    if (
        !buffer.length
    ) {

        const error =
            new Error(
                "File TTD tersimpan kosong."
            );

        error.status = 400;

        throw error;
    }


    const contentType =
        String(
            response.headers.get(
                "content-type"
            ) ||
            "image/png"
        )
            .split(";")[0]
            .trim()
            .toLowerCase();


    const extension =
        contentType === "image/jpeg" ||
        contentType === "image/jpg"
            ? "jpg"
            : contentType === "image/webp"
                ? "webp"
                : "png";


    return {

        buffer:
            buffer,

        extension:
            extension,

        mimeType:
            extension === "jpg"
                ? "image/jpeg"
                : `image/${extension}`
    };
}


/*
|---------------------------------------------------------------------------
| UPLOAD TTD APPROVAL KE GOOGLE DRIVE
|---------------------------------------------------------------------------
*/

async function uploadPkmApprovalSignature({
    pkmId,
    role,
    userNik,
    signatureMode,
    signatureData
}) {

    let image;


    /*
    |-----------------------------------------------------------------------
    | DRAWN
    |-----------------------------------------------------------------------
    */

    if (
        String(
            signatureMode
        )
            .toUpperCase() ===
        "DRAWN"
    ) {

        image =
            parseDataUrlImage(
                signatureData
            );
    }


    /*
    |-----------------------------------------------------------------------
    | SAVED
    |-----------------------------------------------------------------------
    */

    else if (
        String(
            signatureMode
        )
            .toUpperCase() ===
        "SAVED"
    ) {

        image =
            await downloadSavedProfileSignature(
                userNik
            );
    }


    else {

        const error =
            new Error(
                "Metode tanda tangan tidak valid."
            );

        error.status = 400;

        throw error;
    }


    /*
    |-----------------------------------------------------------------------
    | MAX 1 MB
    |-----------------------------------------------------------------------
    */

    if (
        image.buffer.length >
        1024 * 1024
    ) {

        const error =
            new Error(
                "Ukuran tanda tangan terlalu besar. Maksimal 1 MB."
            );

        error.status = 400;

        throw error;
    }


    const drive =
        getPkmItemDriveClient();


    const imagesFolderId =
        getPkmImagesFolderId();


    const now =
        new Date();


    const time = [

        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        ),

        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        ),

        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        )

    ].join("");


    /*
    |-----------------------------------------------------------------------
    | LABEL FILE
    |
    | ROLE SISTEM TETAP PIC_H23
    | Nama file memakai label KOORDINATOR H23
    |-----------------------------------------------------------------------
    */

    const roleLabel = {

        CRM:
            "CRM",

        KACAB:
            "KACAB",

        MSMC:
            "MSMC",

        PIC_H23:
            "KOORDINATOR H23",

        MGR_H1:
            "MANAGER H1",

        MGR_H23:
            "MANAGER H23"

    }[role] || role;


    const fileName =
        `${pkmId}.ACC ${roleLabel}.${time}.${image.extension}`;


    const uploaded =
        await drive.files.create({

            requestBody: {

                name:
                    fileName,

                parents: [
                    imagesFolderId
                ],

                mimeType:
                    image.mimeType
            },

            media: {

                mimeType:
                    image.mimeType,

                body:
                    Readable.from(
                        image.buffer
                    )
            },

            fields:
                "id,name,mimeType"
        });


    if (
        !uploaded.data ||
        !uploaded.data.id
    ) {

        const error =
            new Error(
                "File TTD gagal disimpan ke Google Drive."
            );

        error.status = 500;

        throw error;
    }


    return {

        path:
            `PKM_Images/${fileName}`,

        fileId:
            uploaded.data.id,

        fileName:
            fileName
    };
}

// ============================================================
// PKM APPROVAL HANDLER
// ROLE SISTEM:
// CRM
// KACAB
// MSMC
// PIC_H23
// MGR_H1
// MGR_H23
//
// CATATAN:
// PIC_H23 = ROLE SISTEM
// acc_koordinator_h23 = KOLOM DATABASE
// ============================================================

function normalizeApprovalRole(value) {
    const role = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

    if (role.includes("CRM")) {
        return "CRM";
    }

    if (role === "PIC_H23") {
        return "PIC_H23";
    }

    return role;
}


function getApprovalColumn(role) {
    const map = {
        CRM: "acc_crm",
        KACAB: "acc_kacab",
        MSMC: "acc_msmc",
        PIC_H23: "acc_koordinator_h23",
        MGR_H1: "acc_manager_h1",
        MGR_H23: "acc_manager_h23"
    };

    return map[role] || null;
}


function getApprovalDateColumn(role) {
    const map = {
        CRM: "tgl_acc_crm",
        KACAB: "tgl_acc_kacab",
        MSMC: "tgl_acc_msmc",

        // ROLE SISTEM = PIC_H23
        // KOLOM DATABASE = tgl_acc_koordinator_h23
        PIC_H23: "tgl_acc_koordinator_h23",

        MGR_H1: "tgl_acc_manager_h1",
        MGR_H23: "tgl_acc_manager_h23"
    };

    return map[role] || null;
}


function getApprovalRoleFromUser(user) {

    const candidates = [
        user?.approval_role,
        user?.role_pkm,
        user?.role,
        user?.jabatan,
        user?.jab
    ];

    for (const candidate of candidates) {

        const role =
            normalizeApprovalRole(candidate);

        if (
            [
                "CRM",
                "KACAB",
                "MSMC",
                "PIC_H23",
                "MGR_H1",
                "MGR_H23"
            ].includes(role)
        ) {
            return role;
        }
    }

    return "";
}


/*
|--------------------------------------------------------------------------
| AUTH USER UNTUK APPROVAL
|--------------------------------------------------------------------------
*/

async function getApprovalUser(requestBody) {

    const token =
        String(
            requestBody?.token || ""
        ).trim();

    const requestedNik =
        String(
            requestBody?.userNik ||
            requestBody?.payload?.userNik ||
            requestBody?.payload?.nik ||
            ""
        ).trim();

    if (!token) {

        const error =
            new Error(
                "Session token tidak ditemukan."
            );

        error.status = 401;

        throw error;
    }

    if (!requestedNik) {

        const error =
            new Error(
                "NIK user tidak ditemukan."
            );

        error.status = 400;

        throw error;
    }

    const rows =
        await supabaseRequest(
            "/rest/v1/salesman" +
            "?select=*" +
            "&nik=eq." +
            encodeURIComponent(
                requestedNik
            ) +
            "&limit=1"
        );

    if (
        !Array.isArray(rows) ||
        !rows.length
    ) {

        const error =
            new Error(
                "Data user tidak ditemukan."
            );

        error.status = 404;

        throw error;
    }

    return rows[0];
}


/*
|--------------------------------------------------------------------------
| HITUNG STEP APPROVAL
|--------------------------------------------------------------------------
*/

function getPkmApprovalState(row) {

    const typePkm =
        String(
            row.type_pkm ||
            row.jenis_pkm ||
            ""
        )
            .trim()
            .toUpperCase();

    const accCrm =
        String(
            row.acc_crm || ""
        ).trim();

    const accKacab =
        String(
            row.acc_kacab || ""
        ).trim();

    const accMsmc =
        String(
            row.acc_msmc || ""
        ).trim();

    const accKoordinatorH23 =
        String(
            row.acc_koordinator_h23 || ""
        ).trim();

    const accManagerH1 =
        String(
            row.acc_manager_h1 || ""
        ).trim();

    const accManagerH23 =
        String(
            row.acc_manager_h23 || ""
        ).trim();


    if (!accCrm) {

        return {
            currentRole: "CRM",
            column: "acc_crm",
            final: false
        };
    }


    if (!accKacab) {

        return {
            currentRole: "KACAB",
            column: "acc_kacab",
            final: false
        };
    }


    if (!accMsmc) {

        return {
            currentRole: "MSMC",
            column: "acc_msmc",
            final: false
        };
    }


    /*
    |--------------------------------------------------------------------------
    | H23 / H123
    |
    | ROLE SISTEM = PIC_H23
    | DATABASE     = acc_koordinator_h23
    |--------------------------------------------------------------------------
    */

    if (
        typePkm === "H23" ||
        typePkm === "H123"
    ) {

        if (!accKoordinatorH23) {

            return {
                currentRole: "PIC_H23",
                column: "acc_koordinator_h23",
                final: false
            };
        }
    }


    if (
        typePkm === "H1" ||
        typePkm === "H123"
    ) {

        if (!accManagerH1) {

            return {
                currentRole: "MGR_H1",
                column: "acc_manager_h1",
                final: false
            };
        }
    }


    if (
        typePkm === "H23"
    ) {

        if (!accManagerH23) {

            return {
                currentRole: "MGR_H23",
                column: "acc_manager_h23",
                final: false
            };
        }
    }


    /*
    |--------------------------------------------------------------------------
    | H123
    |
    | Setelah PIC_H23 → MGR_H1
    | lalu MGR_H23
    |--------------------------------------------------------------------------
    */

    if (
        typePkm === "H123"
    ) {

        if (!accManagerH23) {

            return {
                currentRole: "MGR_H23",
                column: "acc_manager_h23",
                final: false
            };
        }
    }


    return {
        currentRole: "SELESAI",
        column: null,
        final: true
    };
}

async function approvalNotificationHandler(
    request,
    response
) {

    if (request.method !== "POST") {

        return response.status(405).json({
            success: false,
            message:
                "Gunakan method POST."
        });
    }

    try {

        let body =
            request.body || {};

        if (
            typeof body === "string"
        ) {
            body =
                JSON.parse(body);
        }

        const user =
            await getApprovalUser(
                body
            );

        const role =
            getApprovalRoleFromUser(
                user
            );

        const approvalRoles = [
            "KACAB",
            "MSMC",
            "PIC_H23",
            "MGR_H1",
            "MGR_H23"
        ];

        if (
            !approvalRoles.includes(
                role
            )
        ) {
            return response.status(200).json({
                success: true,
                role: role,
                total: 0,
                notifications: []
            });
        }


        const userBranch =
            String(
                user.cab ||
                user.branch ||
                ""
            )
                .trim()
                .toUpperCase();

        const isHeadOffice =
            userBranch === "HO" ||
            userBranch === "ALL";


        // ==========================================
        // FILTER TANGGAL NOTIFIKASI
        // H     = hari ini
        // H-2   = 2 hari lagi
        // ==========================================

        const jakartaFormatter =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone:
                        "Asia/Jakarta",

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit"
                }
            );


        const todayKey =
            jakartaFormatter.format(
                new Date()
            );


        const todayStart =
            new Date(
                `${todayKey}T00:00:00+07:00`
            );


        const h2Start =
            new Date(
                todayStart
            );

        h2Start.setDate(
            h2Start.getDate() + 2
        );


        const h3Start =
            new Date(
                todayStart
            );

        h3Start.setDate(
            h3Start.getDate() + 3
        );


        const h2Key =
            jakartaFormatter.format(
                h2Start
            );


        // ==========================================
        // AMBIL PKM YANG BERADA DALAM RANGE H s/d H-2
        // ==========================================

        const rows =
            await supabaseRequest(
                "/rest/v1/pkm" +
                "?select=" +
                [
                    "id_pkm",
                    "nama",
                    "cabang",
                    "type_pkm",
                    "tanggal_mulai",
                    "created_at",
                    "acc_crm",
                    "acc_kacab",
                    "acc_msmc",
                    "acc_koordinator_h23",
                    "acc_manager_h1",
                    "acc_manager_h23"
                ].join(",") +

                "&tanggal_mulai=gte." +
                encodeURIComponent(
                    todayStart.toISOString()
                ) +

                "&tanggal_mulai=lt." +
                encodeURIComponent(
                    h3Start.toISOString()
                ) +

                "&order=created_at.asc" +
                "&limit=5000"
            );


        const notifications =
            Array.isArray(rows)
                ? rows
                    .map(function (row) {


                        const kegiatanDate =
                            row.tanggal_mulai
                                ? jakartaFormatter.format(
                                    new Date(
                                        row.tanggal_mulai
                                    )
                                )
                                : "";


                        if (
                            kegiatanDate !== todayKey &&
                            kegiatanDate !== h2Key
                        ) {
                            return null;
                        }

                        const state =
                            getPkmApprovalState(
                                row
                            );

                        if (
                            state.final ||
                            state.currentRole !==
                                role
                        ) {
                            return null;
                        }


                        if (
                            role === "KACAB" &&
                            String(
                                row.cabang || ""
                            )
                                .trim()
                                .toUpperCase() !==
                                userBranch
                        ) {
                            return null;
                        }


                        if (
                            role !== "KACAB" &&
                            !isHeadOffice
                        ) {
                            return null;
                        }


                        return {
                            id:
                                String(
                                    row.id_pkm || ""
                                ).trim(),

                            name:
                                String(
                                    row.nama || ""
                                ).trim(),

                            branch:
                                String(
                                    row.cabang || ""
                                ).trim(),

                            type:
                                String(
                                    row.type_pkm || ""
                                ).trim(),

                            role:
                                role,

                            roleLabel:
                                role === "PIC_H23"
                                    ? "PIC H23"
                                    : role === "MGR_H1"
                                        ? "MANAGER H1"
                                        : role === "MGR_H23"
                                            ? "MANAGER H23"
                                            : role,

                            createdAt:
                                row.created_at || null
                        };
                    })
                    .filter(Boolean)
                : [];


        return response.status(200).json({
            success: true,
            role: role,
            total:
                notifications.length,
            notifications:
                notifications.slice(
                    0,
                    20
                )
        });

    } catch (error) {

        console.error(
            "APPROVAL NOTIFICATION ERROR:",
            error
        );

        return response.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil notifikasi approval."
        });
    }
}


/*
|--------------------------------------------------------------------------
| APPROVE PKM
|--------------------------------------------------------------------------
*/

async function approvePkmHandler(
    request,
    response
) {

    if (
        request.method !== "POST"
    ) {

        return response
            .status(405)
            .json({

                success:
                    false,

                message:
                    "Gunakan method POST."
            });
    }


    try {

        let body =
            request.body ||
            {};


        if (
            typeof body ===
            "string"
        ) {

            body =
                JSON.parse(
                    body
                );
        }


        const payload =
            body.payload ||
            {};


        const pkmId =
            String(
                payload.pkmId ||
                ""
            ).trim();


        if (
            !pkmId
        ) {

            return response
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "ID PKM tidak ditemukan."
                });
        }


        /*
        |-----------------------------------------------------------------------
        | USER
        |-----------------------------------------------------------------------
        */

        const user =
            await getApprovalUser(
                body
            );


        const role =
            getApprovalRoleFromUser(
                user
            );


        const userNik =
            String(
                user.nik ||
                body.userNik ||
                payload.userNik ||
                ""
            ).trim();


        const allowedRoles = [

            "CRM",
            "KACAB",
            "MSMC",
            "PIC_H23",
            "MGR_H1",
            "MGR_H23"

        ];


        if (
            !allowedRoles.includes(
                role
            )
        ) {

            return response
                .status(403)
                .json({

                    success:
                        false,

                    message:
                        "Role Anda tidak memiliki akses approval PKM."
                });
        }


        /*
        |-----------------------------------------------------------------------
        | AMBIL PKM
        |-----------------------------------------------------------------------
        */

        const rows =
            await supabaseRequest(

                "/rest/v1/pkm" +

                "?select=*" +

                "&id_pkm=eq." +
                    encodeURIComponent(
                        pkmId
                    ) +

                "&limit=1"
            );


        const row =
            Array.isArray(rows)
                ? rows[0]
                : null;


        if (
            !row
        ) {

            return response
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        "Data PKM tidak ditemukan."
                });
        }


        /*
        |-----------------------------------------------------------------------
        | CEK STEP APPROVAL
        |-----------------------------------------------------------------------
        */

        const state =
            getPkmApprovalState(
                row
            );


        if (
            state.final
        ) {

            return response
                .status(409)
                .json({

                    success:
                        false,

                    message:
                        "PKM ini sudah selesai di-approve.",

                    approvalRole:
                        role,

                    nextRole:
                        "SELESAI"
                });
        }


        if (
            state.currentRole !==
            role
        ) {

            return response
                .status(409)
                .json({

                    success:
                        false,

                    message:
                        `Approval belum pada giliran ${state.currentRole}.`,

                    approvalRole:
                        role,

                    nextRole:
                        state.currentRole
                });
        }


        /*
        |-----------------------------------------------------------------------
        | KACAB HANYA CABANG SENDIRI
        |-----------------------------------------------------------------------
        */

        if (
            role ===
            "KACAB"
        ) {

            const userBranch =
                String(
                    user.cab ||
                    user.branch ||
                    user.cabang ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            const pkmBranch =
                String(
                    row.cabang ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            if (
                !userBranch ||
                userBranch === "HO" ||
                userBranch === "ALL" ||
                userBranch !==
                    pkmBranch
            ) {

                return response
                    .status(403)
                    .json({

                        success:
                            false,

                        message:
                            "KACAB hanya dapat menyetujui PKM dari cabangnya sendiri."
                    });
            }
        }


        /*
        |-----------------------------------------------------------------------
        | TTD
        |-----------------------------------------------------------------------
        */

        const signatureData =
            String(
                payload.signatureData ||
                ""
            ).trim();


        const signatureMode =
            String(
                payload.signatureMode ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            signatureMode !==
            "DRAWN" &&
            signatureMode !==
            "SAVED"
        ) {

            return response
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Metode tanda tangan tidak valid."
                });
        }


        if (
            signatureMode ===
            "DRAWN" &&
            !signatureData
        ) {

            return response
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Tanda tangan tidak ditemukan."
                });
        }


        if (
            !userNik
        ) {

            return response
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "NIK user tidak ditemukan."
                });
        }


        /*
        |-----------------------------------------------------------------------
        | UPLOAD TTD KE GOOGLE DRIVE
        |-----------------------------------------------------------------------
        */

        const uploadedSignature =
            await uploadPkmApprovalSignature({

                pkmId:
                    pkmId,

                role:
                    role,

                userNik:
                    userNik,

                signatureMode:
                    signatureMode,

                signatureData:
                    signatureData
            });


        /*
        |-----------------------------------------------------------------------
        | HASIL DATABASE
        |
        | DB menyimpan PATH,
        | BUKAN BASE64.
        |-----------------------------------------------------------------------
        */

        const approvalPath =
            uploadedSignature.path;


        const now =
            new Date()
                .toISOString();


        const approvalColumn =
            getApprovalColumn(
                role
            );


        const dateColumn =
            getApprovalDateColumn(
                role
            );


        if (
            !approvalColumn
        ) {

            return response
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        `Kolom approval untuk role ${role} tidak ditemukan.`
                });
        }


        const updateRecord = {

            [approvalColumn]:
                approvalPath,

            updated_at:
                now
        };


        if (
            dateColumn
        ) {

            updateRecord[
                dateColumn
            ] =
                now;
        }


        /*
        |-----------------------------------------------------------------------
        | HITUNG STATUS BERIKUTNYA
        |-----------------------------------------------------------------------
        */

        const simulatedRow = {

            ...row,

            [approvalColumn]:
                approvalPath
        };


        const nextState =
            getPkmApprovalState(
                simulatedRow
            );


        const nextRole =
            nextState.currentRole;


        updateRecord.status =
            nextState.final
                ? "ACC"
                : `MENUNGGU ${nextRole}`;


        /*
        |-----------------------------------------------------------------------
        | UPDATE SUPABASE
        |-----------------------------------------------------------------------
        */

        await supabaseRequest(

            "/rest/v1/pkm" +

            "?id_pkm=eq." +
                encodeURIComponent(
                    pkmId
                ),

            {

                method:
                    "PATCH",

                headers: {

                    "Prefer":
                        "return=minimal"
                },

                body:
                    JSON.stringify(
                        updateRecord
                    )
            }
        );


        console.log(
            "[BACKEND] APPROVE PKM SUCCESS",
            {

                pkmId:
                    pkmId,

                role:
                    role,

                approvalPath:
                    approvalPath,

                nextRole:
                    nextRole
            }
        );


        return response
            .status(200)
            .json({

                success:
                    true,

                message:
                    nextState.final
                        ? "Approval final berhasil. PKM sudah ACC."
                        : `Approval ${role} berhasil. Menunggu ${nextRole}.`,

                pkmId:
                    pkmId,

                approvalRole:
                    role,

                nextRole:
                    nextRole,

                status:
                    nextState.final
                        ? "ACC"
                        : `MENUNGGU ${nextRole}`,

                approvalPath:
                    approvalPath,

                fileId:
                    uploadedSignature.fileId,

                fileName:
                    uploadedSignature.fileName

            });


    } catch (
        error
    ) {

        console.error(
            "[BACKEND] APPROVE PKM ERROR",
            error
        );


        return response
            .status(
                error.status ||
                500
            )
            .json({

                success:
                    false,

                message:
                    error.message ||
                    "Gagal memproses approval PKM."

            });
    }
}


/*
|--------------------------------------------------------------------------
| APPROVE PKM FROM DISCORD
|--------------------------------------------------------------------------
*/

async function approvePkmFromDiscordHandler(
    request,
    response
) {

    /*
    | Untuk sementara gunakan handler approval
    | yang sama.
    |
    | Endpoint Discord tetap dipisahkan
    | agar frontend/router tidak berubah.
    */

    return approvePkmHandler(
        request,
        response
    );
}


/*
|--------------------------------------------------------------------------
| CRM KPI
|--------------------------------------------------------------------------
*/

async function crmKpiHandler(req, res) {

    try {

        let body = req.body || {};

        if (typeof body === "string") {
            body = JSON.parse(body);
        }

        const action =
            String(
                req.query?.action ||
                body.action ||
                ""
            )
                .trim();

        const payload =
            body.payload ||
            body;

        const branch =
            String(
                payload.branch ||
                ""
            )
                .trim()
                .toUpperCase();

        const year =
            Number(
                payload.year
            );

        const month =
            Number(
                payload.month
            );

        const week =
            payload.week === null ||
            payload.week === undefined ||
            payload.week === ""
                ? null
                : Number(payload.week);

        const snapshotType =
            String(
                payload.snapshotType ||
                "WEEKLY"
            )
                .trim()
                .toUpperCase();

        if (!branch) {
            throw new Error(
                "Branch KPI CRM belum dipilih."
            );
        }

        if (
            !Number.isFinite(year) ||
            !Number.isFinite(month)
        ) {
            throw new Error(
                "Periode KPI CRM tidak valid."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | ID SNAPSHOT
        |--------------------------------------------------------------------------
        */

        const periodKey =
            [
                branch,
                year,
                month,
                snapshotType === "CLOSING"
                    ? "CLOSING"
                    : `W${week}`
            ].join("-");


        /*
        |--------------------------------------------------------------------------
        | GET DATA
        |--------------------------------------------------------------------------
        */

        if (
            action ===
            "getCrmKpiData"
        ) {

            const hoRows =
                await supabaseRequest(
                    "/rest/v1/kpi_crm_ho" +
                    "?select=*" +
                    `&id_input=eq.${encodeURIComponent(periodKey)}` +
                    "&order=id_detail.asc"
                );


            /*
            | CRM actual disimpan di raw_data
            | atau kpi_crm berdasarkan id_input.
            */

            const crmRows =
                await supabaseRequest(
                    "/rest/v1/kpi_crm" +
                    "?select=*" +
                    `&id_input=eq.${encodeURIComponent(periodKey)}` +
                    "&order=id_detail.asc"
                );


            const hoMap =
                new Map();

            (Array.isArray(hoRows)
                ? hoRows
                : []
            ).forEach(
                function (row) {

                    const code =
                        String(
                            row.kode_kpi ||
                            ""
                        )
                            .trim()
                            .toUpperCase();

                    if (code) {
                        hoMap.set(
                            code,
                            row
                        );
                    }
                }
            );


            const crmMap =
                new Map();

            (Array.isArray(crmRows)
                ? crmRows
                : []
            ).forEach(
                function (row) {

                    const code =
                        String(
                            row.id_detail ||
                            row.indikator_kpi ||
                            ""
                        )
                            .trim()
                            .toUpperCase();

                    if (code) {
                        crmMap.set(
                            code,
                            row
                        );
                    }
                }
            );


            const data =
                CRM_KPI_METRICS.map(
                    function (metric) {

                        const crm =
                            crmMap.get(
                                metric.code
                            );

                        const ho =
                            hoMap.get(
                                metric.code
                            );


                        let actualCrm =
                            crm
                                ? crm.aktual
                                : "";

                        let scoreCrm =
                            crm
                                ? crm.skor
                                : "";

                        let actualHo =
                            ho
                                ? ho.aktual_ho
                                : "";

                        let scoreHo =
                            ho
                                ? ho.skor_ho
                                : "";


                        /*
                        | KPB = 4 nilai
                        */

                        if (
                            metric.code ===
                            "KPB"
                        ) {

                            actualCrm =
                                crm?.raw_data
                                    ?.actualCrm ||
                                crm?.raw_data
                                    ?.actual_crm ||
                                [
                                    "",
                                    "",
                                    "",
                                    ""
                                ];

                            actualHo =
                                ho?.raw_data
                                    ?.actualHo ||
                                ho?.raw_data
                                    ?.actual_ho ||
                                [
                                    "",
                                    "",
                                    "",
                                    ""
                                ];
                        }


                        return {

                            code:
                                metric.code,

                            target:
                                crm?.raw_data
                                    ?.target ??
                                metric.target,

                            actualCrm:
                                actualCrm,

                            actualHo:
                                actualHo,

                            scoreCrm:
                                scoreCrm,

                            scoreHo:
                                scoreHo,

                            status:
                                String(
                                    ho?.status ||
                                    ""
                                )
                                    .trim()
                                    .toUpperCase()
                        };
                    }
                );


            const verifiedRow =
                Array.isArray(hoRows)
                    ? hoRows.find(
                        function (row) {

                            return (
                                String(
                                    row.status ||
                                    ""
                                )
                                    .trim()
                                    .toUpperCase() ===
                                "TERVERIFIKASI"
                            );
                        }
                    )
                    : null;


            const status =
                verifiedRow
                    ? "TERVERIFIKASI"
                    : (
                        Array.isArray(
                            hoRows
                        ) &&
                        hoRows.length
                    )
                        ? String(
                            hoRows[0]
                                ?.status ||
                            "MENUNGGU VERIFIKASI MSCM"
                        )
                        : "";


            const snapshotNote =
                Array.isArray(hoRows) &&
                hoRows.length
                    ? String(
                        hoRows[0]
                            ?.catatan ||
                        ""
                    )
                    : "";


            return res.status(200).json({

                success:
                    true,

                data:
                    data,

                status:
                    status,

                snapshotType:
                    snapshotType,

                snapshotNote:
                    snapshotNote,

                canViewHo:
                    branch === "ALL" ||
                    branch === "HO"

            });
        }


        /*
        |--------------------------------------------------------------------------
        | SAVE CRM
        |--------------------------------------------------------------------------
        */

        if (
            action ===
            "saveCrmKpi"
        ) {

            const metrics =
                Array.isArray(
                    payload.metrics
                )
                    ? payload.metrics
                    : [];


            if (!metrics.length) {
                throw new Error(
                    "Data KPI CRM kosong."
                );
            }


            const snapshotNote =
                String(
                    payload.snapshotNote ||
                    ""
                )
                    .trim();


            const now =
                new Date()
                    .toISOString();


            /*
            | Simpan Actual CRM
            */

            const crmPayload =
                metrics.map(
                    function (metric) {

                        const code =
                            String(
                                metric.code ||
                                ""
                            )
                                .trim()
                                .toUpperCase();

                        let actual =
                            metric.actualCrm;


                        let rawData = {
                            code:
                                code,

                            target:
                                metric.target,

                            actualCrm:
                                metric.actualCrm,

                            snapshotType:
                                snapshotType,

                            branch:
                                branch,

                            year:
                                year,

                            month:
                                month,

                            week:
                                week
                        };


                        /*
                        | KPB menyimpan array
                        | di raw_data.
                        */

                        if (
                            code === "KPB"
                        ) {

                            actual =
                                null;
                        }


                        return {

                            id_input:
                                periodKey,

                            id_detail:
                                code,

                            tanggal:
                                now
                                    .slice(
                                        0,
                                        10
                                    ),

                            nik:
                                String(
                                    body.nik ||
                                    body.userNik ||
                                    ""
                                ).trim(),

                            nama:
                                String(
                                    body.nama ||
                                    body.userName ||
                                    ""
                                ).trim(),

                            cabang:
                                branch,

                            indikator_kpi:
                                code,

                            aktual:
                                actual === "" ||
                                actual === null ||
                                Array.isArray(
                                    actual
                                )
                                    ? null
                                    : Number(
                                        actual
                                    ),

                            skor:
                                metric.scoreCrm === "" ||
                                metric.scoreCrm === null
                                    ? null
                                    : Number(
                                        metric.scoreCrm
                                    ),

                            source:
                                "SUPABASE",

                            raw_data:
                                rawData
                        };
                    }
                );


            /*
            | Hapus snapshot CRM lama,
            | lalu insert versi terbaru.
            */

            await supabaseRequest(
                "/rest/v1/kpi_crm" +
                `?id_input=eq.${encodeURIComponent(periodKey)}`,
                {
                    method:
                        "DELETE"
                }
            );


            await supabaseRequest(
                "/rest/v1/kpi_crm",
                {
                    method:
                        "POST",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            crmPayload
                        )
                }
            );


            /*
            | Buat / reset status HO
            | menjadi MENUNGGU VERIFIKASI.
            */

            const hoPayload =
                metrics.map(
                    function (metric) {

                        const code =
                            String(
                                metric.code ||
                                ""
                            )
                                .trim()
                                .toUpperCase();

                        const actualCrm =
                            metric.actualCrm;

                        return {

                            id_input:
                                periodKey,

                            id_detail:
                                `${periodKey}-${code}`,

                            kode_kpi:
                                code,

                            cabang:
                                branch,

                            tahun:
                                year,

                            bulan:
                                month,

                            week:
                                week,

                            target_input:
                                Array.isArray(
                                    metric.target
                                )
                                    ? JSON.stringify(
                                        metric.target
                                    )
                                    : String(
                                        metric.target ??
                                        ""
                                    ),

                            realisasi_crm:
                                Array.isArray(
                                    actualCrm
                                )
                                    ? JSON.stringify(
                                        actualCrm
                                    )
                                    : String(
                                        actualCrm ??
                                        ""
                                    ),

                            aktual_ho:
                                String(
                                    metric.actualHo ??
                                    ""
                                ),

                            skor_ho:
                                metric.scoreHo === "" ||
                                metric.scoreHo === null
                                    ? null
                                    : Number(
                                        metric.scoreHo
                                    ),

                            status:
                                "MENUNGGU VERIFIKASI MSCM",

                            tipe_snapshot:
                                snapshotType,

                            catatan:
                                snapshotNote,

                            tanggal_input:
                                now,

                            raw_data:
                                {
                                    branch:
                                        branch,

                                    year:
                                        year,

                                    month:
                                        month,

                                    week:
                                        week,

                                    snapshotType:
                                        snapshotType,

                                    actualCrm:
                                        actualCrm
                                }
                        };
                    }
                );


            await supabaseRequest(
                "/rest/v1/kpi_crm_ho" +
                `?id_input=eq.${encodeURIComponent(periodKey)}`,
                {
                    method:
                        "DELETE"
                }
            );


            await supabaseRequest(
                "/rest/v1/kpi_crm_ho",
                {
                    method:
                        "POST",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            hoPayload
                        )
                }
            );


            return res.status(200).json({

                success:
                    true,

                message:
                    "KPI CRM berhasil disimpan dan menunggu verifikasi MSCM."
            });
        }


        /*
        |--------------------------------------------------------------------------
        | VERIFY MSCM
        |--------------------------------------------------------------------------
        */

        if (
            action ===
            "verifyCrmKpi"
        ) {

            const metrics =
                Array.isArray(
                    payload.metrics
                )
                    ? payload.metrics
                    : [];


            if (!metrics.length) {
                throw new Error(
                    "Data KPI CRM kosong."
                );
            }


            const now =
                new Date()
                    .toISOString();


            const hoRows =
                await supabaseRequest(
                    "/rest/v1/kpi_crm_ho" +
                    "?select=*" +
                    `&id_input=eq.${encodeURIComponent(periodKey)}`
                );


            const updates =
                metrics.map(
                    function (metric) {

                        const code =
                            String(
                                metric.code ||
                                ""
                            )
                                .trim()
                                .toUpperCase();

                        const existing =
                            (
                                Array.isArray(
                                    hoRows
                                )
                                    ? hoRows
                                    : []
                            ).find(
                                function (row) {

                                    return (
                                        String(
                                            row.kode_kpi ||
                                            ""
                                        )
                                            .trim()
                                            .toUpperCase() ===
                                        code
                                    );
                                }
                            );


                        if (!existing) {
                            return null;
                        }


                        return {

                            id:
                                existing.id,

                            aktual_ho:
                                Array.isArray(
                                    metric.actualHo
                                )
                                    ? JSON.stringify(
                                        metric.actualHo
                                    )
                                    : String(
                                        metric.actualHo ??
                                        ""
                                    ),

                            skor_ho:
                                metric.scoreHo === "" ||
                                metric.scoreHo === null
                                    ? null
                                    : Number(
                                        metric.scoreHo
                                    ),

                            status:
                                "TERVERIFIKASI",

                            tanggal_verifikasi:
                                now,

                            updated_at:
                                now
                        };
                    }
                )
                .filter(
                    Boolean
                );


            if (!updates.length) {
                throw new Error(
                    "Data KPI CRM belum tersedia untuk diverifikasi."
                );
            }


            for (
                const update
                of updates
            ) {

                await supabaseRequest(
                    `/rest/v1/kpi_crm_ho?id=eq.${update.id}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Prefer":
                                "return=minimal"
                        },

                        body:
                            JSON.stringify(
                                update
                            )
                    }
                );
            }


            return res.status(200).json({

                success:
                    true,

                message:
                    "KPI CRM berhasil diverifikasi MSCM."
            });
        }


        throw new Error(
            `Action KPI CRM tidak dikenal: ${action}`
        );

    } catch (error) {

        console.error(
            "[CRM KPI HANDLER ERROR]",
            error
        );

        return res.status(
            error?.status ||
            500
        ).json({

            success:
                false,

            message:
                error?.message ||
                "Gagal memproses KPI CRM."
        });
    }
}


// ===== SINGLE VERCEL FUNCTION ROUTER =====
function normalizeAction(value) {
  return String(value || "").trim();
}

function getRequestAction(req) {
  const queryAction = normalizeAction(req.query?.action);
  if (queryAction) return queryAction;
  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  return normalizeAction(body.action);
}

async function runHandler(handler, req, res) {
  return handler(req, res);
}

module.exports = async function handler(req, res) {
  const action = getRequestAction(req);

  try {
    switch (action) {

      case "login":
        return await runHandler(
          authHandler,
          req,
          res
        );

      case "authMigrate":
      case "auth-migrate-batch":
        return await runHandler(
          authMigrateHandler,
          req,
          res
        );

      case "gas":
        return await runHandler(
          gasHandler,
          req,
          res
        );

      case "getManagedAccounts":
        return await runHandler(
          managedHandler,
          req,
          res
        );

      case "getMasterData":
      case "getReferenceMasters":
        return await runHandler(
          masterHandler,
          req,
          res
        );

      case "saveMasterData":
        return await runHandler(
          masterHandler,
          req,
          res
        );

      case "deleteMasterData":
        return await runHandler(
          masterHandler,
          req,
          res
        );

      case "getSalesmen":
        return await runHandler(
          salesmanHandler,
          req,
          res
        );

      case "getPkmData":
        return await runHandler(
          pkmHandler,
          req,
          res
        );

      case "getPkmPdfData":
      case "pkmDownload":
        return await runHandler(
          pkmDownloadHandler,
          req,
          res
        );

      case "discord":
        return await runHandler(
          discordHandler,
          req,
          res
        );

    case "googleOAuth":
        return await runHandler(
            googleOAuthHandler,
            req,
            res
        );

    case "googleOAuthCallback":
        return await runHandler(
            googleOAuthCallbackHandler,
            req,
            res
        );

    case "getApprovalNotifications":
        return await runHandler(
            approvalNotificationHandler,
            req,
            res
        );

      // ==================================================
      // PKM APPROVAL
      // ==================================================

      case "approvePkm":
        return await runHandler(
          approvePkmHandler,
          req,
          res
        );

      case "approvePkmFromDiscord":
        return await runHandler(
          approvePkmFromDiscordHandler,
          req,
          res
        );

    case "getCrmKpiData":
        return await runHandler(
            crmKpiHandler,
            req,
            res
        );

    case "saveCrmKpi":
        return await runHandler(
            crmKpiHandler,
            req,
            res
        );

    case "verifyCrmKpi":
        return await runHandler(
            crmKpiHandler,
            req,
            res
        );

      default:
        return res.status(400).json({
          success: false,
          message:
            `Unknown backend action: ${action || "(empty)"}`
        });
    }

  } catch (error) {

    console.error(
      "[BACKEND] UNHANDLED ERROR",
      action,
      error
    );

    return res.status(
      error?.status || 500
    ).json({
      success: false,
      message:
        error?.message ||
        "Backend error."
    });
  }
};
