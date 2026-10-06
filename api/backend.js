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

const PKM_DRIVE_FOLDER_ID =
    process.env.PKM_DRIVE_FOLDER_ID;

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

function getPkmPdfDriveClient() {

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
                "Konfigurasi Google Drive OAuth PDF belum lengkap."
            );

        error.status = 500;

        throw error;
    }

    if (!PKM_DRIVE_FOLDER_ID) {
        const error =
            new Error(
                "PKM_DRIVE_FOLDER_ID belum dikonfigurasi."
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


async function savePkmPdf({
    pkmId,
    fileName,
    pdfBase64
}) {

    if (!pkmId) {
        const error =
            new Error(
                "ID PKM tidak tersedia."
            );

        error.status = 400;

        throw error;
    }

    if (!pdfBase64) {
        const error =
            new Error(
                "Data PDF tidak tersedia."
            );

        error.status = 400;

        throw error;
    }

    if (!PKM_DRIVE_FOLDER_ID) {
        const error =
            new Error(
                "PKM_DRIVE_FOLDER_ID belum dikonfigurasi."
            );

        error.status = 500;

        throw error;
    }


    /*
    |----------------------------------------------------------------------
    | BERSIHKAN BASE64
    |----------------------------------------------------------------------
    */

    const cleanBase64 =
        String(
            pdfBase64
        )
            .replace(
                /^data:application\/pdf;base64,/i,
                ""
            )
            .replace(
                /\s+/g,
                ""
            );


    let pdfBuffer;

    try {

        pdfBuffer =
            Buffer.from(
                cleanBase64,
                "base64"
            );

    } catch (error) {

        const err =
            new Error(
                "Format data PDF tidak valid."
            );

        err.status = 400;

        throw err;
    }


    if (
        !pdfBuffer.length
    ) {

        const error =
            new Error(
                "File PDF kosong."
            );

        error.status = 400;

        throw error;
    }


    /*
    |----------------------------------------------------------------------
    | BATAS UKURAN
    |----------------------------------------------------------------------
    */

    if (
        pdfBuffer.length >
        2.8 * 1024 * 1024
    ) {

        const error =
            new Error(
                "Ukuran PDF melebihi batas 2.8 MB."
            );

        error.status = 400;

        throw error;
    }


    /*
    |----------------------------------------------------------------------
    | NAMA FILE
    |----------------------------------------------------------------------
    */

    const safeFileName =
        String(
            fileName ||
            `${pkmId}.PKM.pdf`
        )
            .replace(
                /[<>:"/\\|?*\x00-\x1F]/g,
                "_"
            )
            .trim();


    const finalFileName =
        safeFileName
            .toLowerCase()
            .endsWith(".pdf")
                ? safeFileName
                : `${safeFileName}.pdf`;


    /*
    |----------------------------------------------------------------------
    | GOOGLE DRIVE
    |----------------------------------------------------------------------
    */

    const drive =
        getPkmPdfDriveClient();


    /*
    |----------------------------------------------------------------------
    | HAPUS FILE PDF LAMA DENGAN NAMA SAMA
    |----------------------------------------------------------------------
    */

    const escapedName =
        finalFileName
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


    const existing =
        await drive.files.list({

            q:
                `'${escapedFolder}' in parents` +
                ` and name = '${escapedName}'` +
                ` and trashed = false`,

            fields:
                "files(id,name)",

            pageSize:
                20
        });


    const oldFiles =
        existing.data.files || [];


    for (
        const oldFile
        of oldFiles
    ) {

        await drive.files.update({

            fileId:
                oldFile.id,

            requestBody: {
                trashed:
                    true
            }
        });

    }


    /*
    |----------------------------------------------------------------------
    | UPLOAD PDF
    |----------------------------------------------------------------------
    */

    const uploaded =
        await drive.files.create({

            requestBody: {

                name:
                    finalFileName,

                parents: [
                    PKM_DRIVE_FOLDER_ID
                ],

                mimeType:
                    "application/pdf"
            },

            media: {

                mimeType:
                    "application/pdf",

                body:
                    Readable.from(
                        pdfBuffer
                    )
            },

            fields:
                "id,name,mimeType,webViewLink"
        });


    if (
        !uploaded.data ||
        !uploaded.data.id
    ) {

        const error =
            new Error(
                "PDF gagal disimpan ke Google Drive."
            );

        error.status = 500;

        throw error;
    }


    const fileId =
        uploaded.data.id;


    const pdfUrl =
        uploaded.data.webViewLink ||
        `https://drive.google.com/file/d/${fileId}/view`;


    /*
    |----------------------------------------------------------------------
    | SET DESKRIPSI FILE
    |----------------------------------------------------------------------
    */

    try {

        await drive.files.update({

            fileId:
                fileId,

            requestBody: {

                description:
                    JSON.stringify({

                        type:
                            "PKM_PDF",

                        pkmId:
                            pkmId,

                        generatedAt:
                            new Date()
                                .toISOString()

                    })
            }
        });

    } catch (error) {

        console.warn(
            "[PKM PDF] Gagal set description:",
            error.message
        );

    }


    /*
    |----------------------------------------------------------------------
    | SIMPAN LINK KE SUPABASE
    |----------------------------------------------------------------------
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

                "Content-Type":
                    "application/json",

                "Prefer":
                    "return=minimal"

            },

            body:
                JSON.stringify({

                    pdf:
                        pdfUrl,

                    link:
                        pdfUrl,

                    print:
                        `/PKM/${finalFileName}`

                })

        }
    );


    console.log(
        "[PKM PDF] BERHASIL UPLOAD",
        {
            pkmId,
            fileId,
            fileName:
                finalFileName,
            pdfUrl
        }
    );


    return {

        saved:
            true,

        pkmId:

            pkmId,

        fileId:

            fileId,

        fileName:

            finalFileName,

        pdfUrl:

            pdfUrl,

        path:

            `/PKM/${finalFileName}`,

        createdAt:

            new Date()
                .toISOString()

    };
}

const savePkmPdfHandler = async (req, res) => {
    try {

        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: "Method tidak diizinkan."
            });
        }

        const body =
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : (req.body || {});

        const payload =
            body.payload || {};

        const pkmId =
            String(
                payload.pkmId ||
                body.pkmId ||
                ""
            ).trim();

        const fileName =
            String(
                payload.fileName ||
                body.fileName ||
                ""
            ).trim();

        const pdfBase64 =
            String(
                payload.pdfBase64 ||
                body.pdfBase64 ||
                ""
            ).trim();

        if (!pkmId) {
            return res.status(400).json({
                success: false,
                message: "ID PKM tidak tersedia."
            });
        }

        if (!pdfBase64) {
            return res.status(400).json({
                success: false,
                message: "Data PDF tidak tersedia."
            });
        }

        console.log(
            "[PKM PDF] SAVE REQUEST",
            {
                pkmId,
                fileName,
                pdfLength: pdfBase64.length
            }
        );

        const result =
            await savePkmPdf({
                pkmId,
                fileName,
                pdfBase64
            });

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        console.error(
            "[PKM PDF] SAVE ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal menyimpan PDF PKM."
        });
    }
};

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

            if (
                requestBody.action ===
                "savePkmPdf"
            ) {

                try {

                    const payload =
                        requestBody.payload ||
                        {};

                    const result =
                        await savePkmPdf({

                            pkmId:
                                payload.pkmId,

                            fileName:
                                payload.fileName,

                            pdfBase64:
                                payload.pdfBase64

                        });

                    return response
                        .status(200)
                        .json({

                            success:
                                true,

                            ...result

                        });

                } catch (error) {

                    console.error(
                        "[VERCEL] SAVE PKM PDF ERROR",
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
                                "Gagal menyimpan PDF ke Google Drive."

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

            // ================================================================
            // FINAL ERROR HANDLER
            // Supabase / Vercel only
            // ================================================================

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
                            "Request ke backend terlalu lama. Silakan coba lagi."
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
                            : "Terjadi kesalahan pada backend."
                });
        }
    }
})();

// ===== managed =====
// ===== managed =====
const managedHandler = (() => {

    function clean(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value).trim();
    }


    function isMasterNik(nik) {
        return clean(nik) === "910000";
    }


    // ==========================================================
    // GET MANAGED ACCOUNTS
    // ==========================================================

    async function getManagedAccounts() {

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


        const accounts =
            Array.isArray(rows)
                ? rows
                    .filter(function (row) {
                        return clean(row.nik);
                    })
                    .map(function (row) {

                        const nik =
                            clean(row.nik);

                        return {
                            nik: nik,

                            name:
                                clean(
                                    row.nama_marketing
                                ),

                            branch:
                                clean(
                                    row.cab
                                ),

                            jabatan:
                                clean(
                                    row.jab
                                ),

                            role:
                                clean(
                                    row.role_pkm
                                )
                                    .toUpperCase(),

                            status:
                                (
                                    clean(
                                        row.status
                                    ) ||
                                    "AKTIF"
                                )
                                    .toUpperCase()
                                    .replace(
                                        /\s+/g,
                                        ""
                                    ),

                            hasSignature:
                                Boolean(
                                    clean(
                                        row.ttd_file_id
                                    ) ||
                                    clean(
                                        row.ttd_url
                                    )
                                ),

                            isMaster:
                                isMasterNik(
                                    nik
                                )
                        };
                    })
                    .sort(function (a, b) {

                        return a.name.localeCompare(
                            b.name,
                            "id"
                        );

                    })
                : [];


        return {
            success: true,

            message:
                "Data akun berhasil diambil dari Supabase.",

            accounts:
                accounts,

            total:
                accounts.length
        };
    }


    // ==========================================================
    // UPDATE MANAGED ACCOUNT
    // ==========================================================

    async function updateManagedAccount(
        req,
        payload
    ) {

        /*
        |----------------------------------------------------------
        | TOKEN / MASTER USER
        |----------------------------------------------------------
        */

        const token =
            clean(
                req.body?.token ||
                req.headers?.authorization
            )
                .replace(/^Bearer\s+/i, "")
                .trim();


        if (!token) {
            const error =
                new Error(
                    "Token autentikasi wajib diisi."
                );

            error.status = 401;

            throw error;
        }


        /*
        |----------------------------------------------------------
        | PAYLOAD
        |----------------------------------------------------------
        */

        const originalNik =
            clean(
                payload.originalNik
            );

        const newNik =
            clean(
                payload.nik
            );

        const name =
            clean(
                payload.name
            );

        const branch =
            clean(
                payload.branch
            )
                .toUpperCase();


        let role =
            clean(
                payload.role
            )
                .toUpperCase();


        const status =
            (
                clean(
                    payload.status
                ) ||
                "AKTIF"
            )
                .toUpperCase()
                .replace(
                    /\s+/g,
                    ""
                );


        /*
        |----------------------------------------------------------
        | VALIDASI
        |----------------------------------------------------------
        */

        if (
            !originalNik ||
            !newNik ||
            !name ||
            !branch
        ) {

            const error =
                new Error(
                    "NIK, nama, dan cabang wajib diisi."
                );

            error.status = 400;

            throw error;
        }


        const allowedRoles = [
            "",
            "CRM",
            "KACAB",
            "MSMC",
            "MGR_H1",
            "MGR_H23",
            "PIC_H23"
        ];


        if (
            !allowedRoles.includes(
                role
            )
        ) {

            const error =
                new Error(
                    `Role approval tidak valid: "${role}"`
                );

            error.status = 400;

            throw error;
        }


        if (
            ![
                "AKTIF",
                "NONAKTIF"
            ].includes(
                status
            )
        ) {

            const error =
                new Error(
                    "Status akun tidak valid."
                );

            error.status = 400;

            throw error;
        }


        /*
        |----------------------------------------------------------
        | AKUN MASTER
        |----------------------------------------------------------
        */

        if (
            isMasterNik(
                originalNik
            ) &&
            newNik !== originalNik
        ) {

            const error =
                new Error(
                    "NIK akun master tidak boleh diubah."
                );

            error.status = 400;

            throw error;
        }


        if (
            isMasterNik(
                originalNik
            ) &&
            status !== "AKTIF"
        ) {

            const error =
                new Error(
                    "Akun master tidak boleh dinonaktifkan."
                );

            error.status = 400;

            throw error;
        }


        /*
        |----------------------------------------------------------
        | VALIDASI CABANG
        |----------------------------------------------------------
        */

        if (
            [
                "CRM",
                "KACAB"
            ].includes(
                role
            ) &&
            branch === "HO"
        ) {

            const error =
                new Error(
                    "CRM dan KACAB harus menggunakan cabang, bukan HO."
                );

            error.status = 400;

            throw error;
        }


        if (
            [
                "MSMC",
                "MGR_H1",
                "MGR_H23",
                "PIC_H23"
            ].includes(
                role
            ) &&
            branch !== "HO"
        ) {

            const error =
                new Error(
                    "MSMC, Manager, dan PIC H23 harus menggunakan cabang HO."
                );

            error.status = 400;

            throw error;
        }


        /*
        |----------------------------------------------------------
        | CEK AKUN LAMA
        |----------------------------------------------------------
        */

        const existingRows =
            await supabaseRequest(
                "/rest/v1/salesman" +
                "?nik=eq." +
                encodeURIComponent(
                    originalNik
                ) +
                "&select=*" +
                "&limit=1"
            );


        if (
            !Array.isArray(
                existingRows
            ) ||
            !existingRows.length
        ) {

            const error =
                new Error(
                    "Akun yang akan diedit tidak ditemukan."
                );

            error.status = 404;

            throw error;
        }


        /*
        |----------------------------------------------------------
        | CEK NIK BARU
        |----------------------------------------------------------
        */

        if (
            newNik !== originalNik
        ) {

            const duplicateRows =
                await supabaseRequest(
                    "/rest/v1/salesman" +
                    "?nik=eq." +
                    encodeURIComponent(
                        newNik
                    ) +
                    "&select=nik" +
                    "&limit=1"
                );


            if (
                Array.isArray(
                    duplicateRows
                ) &&
                duplicateRows.length
            ) {

                const error =
                    new Error(
                        "NIK baru sudah digunakan oleh akun lain."
                    );

                error.status = 400;

                throw error;
            }
        }


        /*
        |----------------------------------------------------------
        | UPDATE SUPABASE
        |----------------------------------------------------------
        */

        const updateData = {

            nik:
                newNik,

            nama_marketing:
                name,

            cab:
                branch,

            role_pkm:
                role,

            status:
                status

        };


        /*
        | Jika frontend mengirim jabatan,
        | pertahankan nilai tersebut.
        */

        if (
            Object.prototype.hasOwnProperty.call(
                payload,
                "jabatan"
            )
        ) {

            updateData.jab =
                clean(
                    payload.jabatan
                );
        }


        await supabaseRequest(

            "/rest/v1/salesman" +
            "?nik=eq." +
            encodeURIComponent(
                originalNik
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
                        updateData
                    )
            }
        );


        /*
        |----------------------------------------------------------
        | RETURN
        |----------------------------------------------------------
        */

        return {
            success: true,

            message:
                "Akun berhasil diperbarui.",

            account: {
                nik:
                    newNik,

                name:
                    name,

                branch:
                    branch,

                role:
                    role,

                status:
                    status
            }
        };
    }


    // ==========================================================
    // ROUTER MANAGED
    // ==========================================================

    return async function handler(
        req,
        res
    ) {

        try {

            /*
            |======================================================
            | GET
            |======================================================
            */

            if (
                req.method === "GET"
            ) {

                const result =
                    await getManagedAccounts();

                return res
                    .status(200)
                    .json(result);
            }


            /*
            |======================================================
            | POST
            |======================================================
            */

            if (
                req.method === "POST"
            ) {

                const body =
                    req.body || {};

                const payload =
                    body.payload || {};


                /*
                | Hanya updateManagedAccount
                | yang diproses di POST.
                */

                if (
                    clean(
                        body.action
                    ) !==
                    "updateManagedAccount"
                ) {

                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                "Action managed tidak valid."
                        });
                }


                const result =
                    await updateManagedAccount(
                        req,
                        payload
                    );


                return res
                    .status(200)
                    .json(result);
            }


            /*
            |======================================================
            | METHOD LAIN
            |======================================================
            */

            res.setHeader(
                "Allow",
                "GET, POST"
            );

            return res
                .status(405)
                .json({
                    success: false,

                    message:
                        "Method tidak diizinkan."
                });


        } catch (error) {

            console.error(
                "MANAGED ACCOUNTS API ERROR:",
                error
            );


            return res
                .status(
                    error.status ||
                    500
                )
                .json({

                    success: false,

                    message:
                        error.message ||
                        "Gagal memproses akun."
                });
        }
    };

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

                const leasingRows =
                    await supabaseRequest(
                        "/rest/v1/master_leasing" +
                        "?select=init,kode,nama" +
                        "&order=init.asc"
                    );

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

                    leasing:
                        Array.isArray(leasingRows)
                            ? leasingRows
                                .map(function (row) {
                                    return {
                                        init:
                                            String(
                                                row.init || ""
                                            ).trim(),

                                        code:
                                            String(
                                                row.kode || ""
                                            ).trim(),

                                        name:
                                            String(
                                                row.nama || ""
                                            ).trim()
                                    };
                                })
                                .filter(function (item) {
                                    return Boolean(
                                        item.name
                                    );
                                })
                            : [],

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

const getPkmPdfDataHandler = async (req, res) => {
    try {

        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: "Method tidak diizinkan."
            });
        }

        const body =
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : (req.body || {});

        const payload =
            body.payload || {};

        const pkmId =
            String(
                payload.pkmId ||
                body.pkmId ||
                ""
            ).trim();

        if (!pkmId) {
            return res.status(400).json({
                success: false,
                message: "ID PKM tidak tersedia."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | AMBIL DATA PKM
        |--------------------------------------------------------------------------
        */

        const rows =
            await supabaseRequest(
                "/rest/v1/pkm" +
                "?id_pkm=eq." +
                encodeURIComponent(pkmId) +
                "&limit=1"
            );

        if (
            !Array.isArray(rows) ||
            !rows.length
        ) {
            return res.status(404).json({
                success: false,
                message: "Data PKM tidak ditemukan."
            });
        }

        const row = rows[0];

        /*
        |--------------------------------------------------------------------------
        | TYPE PKM
        |--------------------------------------------------------------------------
        */

        const typePkm =
            String(
                row.type_pkm || ""
            )
                .trim()
                .replace(/\s+/g, "")
                .toUpperCase();

        /*
        |--------------------------------------------------------------------------
        | VALIDASI MANAGER
        |--------------------------------------------------------------------------
        */

        const managerH1 =
            String(
                row.acc_manager_h1 || ""
            ).trim();

        const managerH23 =
            String(
                row.acc_manager_h23 || ""
            ).trim();

        const managerApproved =
            typePkm === "H23"
                ? Boolean(managerH23)
                : Boolean(managerH1);

        if (!managerApproved) {
            return res.status(400).json({
                success: false,
                message:
                    typePkm === "H23"
                        ? "PDF hanya tersedia setelah ACC Manager H23."
                        : "PDF hanya tersedia setelah ACC Manager H1."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | DATA DANA
        |--------------------------------------------------------------------------
        */

        const danaLeasing =
            Number(row.dana_ls) || 0;

        const danaMd =
            Number(row.dana_md) || 0;

        const danaCsm =
            Number(row.dana_csm) || 0;

        const danaLain =
            Number(row.dana_ll) || 0;

        /*
        |--------------------------------------------------------------------------
        | HELPER ARRAY
        |--------------------------------------------------------------------------
        */

        const splitValue = value => {

            const text =
                String(value || "").trim();

            if (!text) {
                return [];
            }

            return text
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
        };

        /*
        |--------------------------------------------------------------------------
        | BUDGET ITEM
        |--------------------------------------------------------------------------
        */

        let budgetDetails = [];

        try {

            const itemRows =
                await supabaseRequest(
                    "/rest/v1/pkm_item" +
                    "?link_pkm=eq." +
                    encodeURIComponent(pkmId) +
                    "&select=*"
                );

            if (Array.isArray(itemRows)) {

                budgetDetails =
                    itemRows.map(item => ({
                        id:
                            String(
                                item.id || ""
                            ).trim(),

                        pkmId:
                            pkmId,

                        itemType:
                            String(
                                item.jenis_item ||
                                ""
                            ).trim(),

                        itemName:
                            String(
                                item.nama_item ||
                                ""
                            ).trim(),

                        quantity:
                            Number(
                                item.jumlah
                            ) || 0,

                        totalPrice:
                            Number(
                                item.harga_total
                            ) || 0,

                        actualPrice:
                            Number(
                                item.harga_actual ||
                                item.actual_price
                            ) || 0,

                        designImage:
                            String(
                                item.gambar_desain ||
                                ""
                            ).trim(),

                        photo:
                            String(
                                item.foto ||
                                ""
                            ).trim(),

                        notes:
                            String(
                                item.keterangan ||
                                ""
                            ).trim()
                    }));

            }

        } catch (error) {

            console.warn(
                "[PDF] pkm_item gagal:",
                error.message
            );

            budgetDetails = [];
        }

        /*
        |--------------------------------------------------------------------------
        | SIGNATURE LOADER
        |--------------------------------------------------------------------------
        |
        | Referensi approval disimpan pada kolom acc_*.
        | Formatnya bisa berupa:
        | - URL
        | - path
        | - nama file
        |
        */

        const emptySignature = role => ({
            role: role,
            name: "-",
            dataUrl: ""
        });

        const loadSignature =
            async function (
                reference,
                role,
                fallbackName
            ) {

                const ref =
                    String(
                        reference || ""
                    ).trim();

                const result = {
                    role:
                        String(
                            role || "-"
                        ).trim(),

                    name:
                        String(
                            fallbackName || "-"
                        ).trim() || "-",

                    dataUrl:
                        ""
                };

                if (!ref) {
                    return result;
                }


                /*
                |----------------------------------------------------------------------
                | DATA URL
                |----------------------------------------------------------------------
                */

                if (
                    ref.startsWith(
                        "data:image/"
                    )
                ) {

                    result.dataUrl =
                        ref;

                    return result;
                }


                /*
                |----------------------------------------------------------------------
                | URL LANGSUNG
                |----------------------------------------------------------------------
                */

                if (
                    /^https?:\/\//i.test(ref)
                ) {

                    try {

                        const response =
                            await fetch(ref);

                        if (
                            response.ok
                        ) {

                            const arrayBuffer =
                                await response.arrayBuffer();

                            const buffer =
                                Buffer.from(
                                    arrayBuffer
                                );

                            const contentType =
                                response.headers.get(
                                    "content-type"
                                ) ||
                                "image/png";

                            result.dataUrl =
                                "data:" +
                                contentType +
                                ";base64," +
                                buffer.toString(
                                    "base64"
                                );

                            return result;
                        }

                    } catch (error) {

                        console.warn(
                            "[PDF] Gagal mengambil URL TTD:",
                            {
                                role,
                                ref,
                                error:
                                    error.message
                            }
                        );
                    }
                }


                /*
                |----------------------------------------------------------------------
                | AMBIL NAMA FILE
                |----------------------------------------------------------------------
                */

                const fileName =
                    ref
                        .replace(
                            /\\/g,
                            "/"
                        )
                        .split("/")
                        .pop()
                        .trim();

                if (!fileName) {
                    return result;
                }


                /*
                |----------------------------------------------------------------------
                | GOOGLE DRIVE
                |----------------------------------------------------------------------
                */

                try {

                    const drive =
                        getPkmItemDriveClient();


                    /*
                    |------------------------------------------------------------------
                    | CARI FILE
                    |------------------------------------------------------------------
                    */

                    const escapedFileName =
                        fileName.replace(
                            /'/g,
                            "\\'"
                        );


                    const response =
                        await drive.files.list({

                            q:
                                "name = '" +
                                escapedFileName +
                                "' and trashed = false",

                            fields:
                                "files(id,name,mimeType,description,modifiedTime)",

                            pageSize:
                                20
                        });


                    const files =
                        response.data &&
                        Array.isArray(
                            response.data.files
                        )
                            ? response.data.files
                            : [];


                    if (!files.length) {

                        console.warn(
                            "[PDF] TTD tidak ditemukan di Drive:",
                            {
                                role,
                                fileName
                            }
                        );

                        return result;
                    }


                    const file =
                        files[0];


                    console.log(
                        "[PDF] TTD FILE DITEMUKAN:",
                        {
                            role,
                            fileId:
                                file.id,
                            fileName:
                                file.name,
                            mimeType:
                                file.mimeType
                        }
                    );


                    /*
                    |------------------------------------------------------------------
                    | NAMA APPROVER
                    |
                    | Jika description mempunyai metadata nama,
                    | gunakan nama tersebut.
                    |------------------------------------------------------------------
                    */

                    if (
                        file.description
                    ) {

                        try {

                            const metadata =
                                JSON.parse(
                                    file.description
                                );

                            result.name =
                                String(
                                    metadata.approverName ||
                                    metadata.name ||
                                    fallbackName ||
                                    "-"
                                ).trim() || "-";

                        } catch (error) {

                            // Description bukan JSON.
                        }
                    }


                    /*
                    |------------------------------------------------------------------
                    | DOWNLOAD FILE
                    |------------------------------------------------------------------
                    */

                    const downloaded =
                        await drive.files.get({

                            fileId:
                                file.id,

                            alt:
                                "media"
                        });


                    let buffer =
                        downloaded.data;


                    if (
                        !Buffer.isBuffer(
                            buffer
                        )
                    ) {

                        if (
                            buffer instanceof Uint8Array
                        ) {

                            buffer =
                                Buffer.from(
                                    buffer
                                );

                        } else {

                            console.warn(
                                "[PDF] Format TTD tidak valid:",
                                {
                                    role,
                                    fileName
                                }
                            );

                            return result;
                        }
                    }


                    const mimeType =
                        file.mimeType ||
                        "image/png";


                    result.dataUrl =
                        "data:" +
                        mimeType +
                        ";base64," +
                        buffer.toString(
                            "base64"
                        );


                    /*
                    |------------------------------------------------------------------
                    | LOG HASIL
                    |------------------------------------------------------------------
                    */

                    console.log(
                        "[PDF] TTD berhasil dimuat:",
                        {
                            role,
                            fileName,
                            hasDataUrl:
                                Boolean(
                                    result.dataUrl
                                ),
                            name:
                                result.name
                        }
                    );


                    return result;

                } catch (error) {

                    console.error(
                        "[PDF] Gagal mengambil TTD:",
                        {
                            role,
                            fileName,
                            error:
                                error.message
                        }
                    );

                    return result;
                }
            };

        /*
        |--------------------------------------------------------------------------
        | TTD CRM
        |--------------------------------------------------------------------------
        */

        const crmSignature =
            await loadSignature(
                row.acc_crm,
                "CRM",
                "-"
            );

        /*
        |--------------------------------------------------------------------------
        | TTD KACAB
        |--------------------------------------------------------------------------
        */

        const kacabSignature =
            await loadSignature(
                row.acc_kacab,
                "KEPALA CABANG",
                "-"
            );

        /*
        |--------------------------------------------------------------------------
        | TTD MSMC
        |--------------------------------------------------------------------------
        |
        | Jika acc_msmc berisi reference, gunakan itu.
        */

        const msmcSignature =
            await loadSignature(
                row.acc_msmc,
                "MSMC",
                "-"
            );

        /*
        |--------------------------------------------------------------------------
        | TTD MANAGER
        |--------------------------------------------------------------------------
        */

        const managerReference =
            typePkm === "H23"
                ? managerH23
                : managerH1;

        const managerSignature =
            await loadSignature(
                managerReference,

                typePkm === "H23"
                    ? "MANAGER H23"
                    : "MANAGER H1",

                "-"
            );

        /*
        |--------------------------------------------------------------------------
        | BUILD OBJECT PKM
        |--------------------------------------------------------------------------
        */

        const pkm = {

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
                ).trim().toUpperCase(),

            branchName:
                String(
                    row.cabang || ""
                ).trim(),

            type:
                splitValue(
                    row.type_pkm
                ),

            jenisPkm:
                String(
                    row.jenis_pkm || ""
                ).trim(),

            kegiatan:
                String(
                    row.jenis_kegiatan || ""
                ).trim(),

            startDate:
                row.tanggal_mulai || "",

            endDate:
                row.tanggal_selesai || "",

            createdAt:
                row.tanggal_pengajuan ||
                row.created_at ||
                "",

            location:
                String(
                    row.lokasi || ""
                ).trim(),

            kabupaten:
                String(
                    row.kabupaten || ""
                ).trim(),

            kecamatan:
                String(
                    row.kecamatan || ""
                ).trim(),

            kelurahan:
                String(
                    row.kelurahan || ""
                ).trim(),

            alasan:
                String(
                    row.alasan || ""
                ).trim(),

            konsep:
                String(
                    row.konsep || ""
                ).trim(),

            people:
                splitValue(
                    row.people
                ),

            fokusType:
                splitValue(
                    row.fokus_type
                ),

            programH1:
                splitValue(
                    row.program_h1
                ),

            programH23:
                splitValue(
                    row.program_h23
                ),

            publikasi:
                splitValue(
                    row.publikasi
                ),

            leasing:
                splitValue(
                    row.leasing
                ),

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
                String(
                    row.status || ""
                ).trim(),

            approvalStep:
                "SELESAI",

            approvals: {

                crm:
                    String(
                        row.acc_crm || ""
                    ).trim(),

                kacab:
                    String(
                        row.acc_kacab || ""
                    ).trim(),

                msmc:
                    String(
                        row.acc_msmc || ""
                    ).trim(),

                koordinatorH23:
                    String(
                        row.acc_koordinator_h23 ||
                        ""
                    ).trim(),

                managerH1:
                    managerH1,

                managerH23:
                    managerH23
            },

            budgetDetails:
                budgetDetails,

            signatures: {

                crm:
                    crmSignature,

                kacab:
                    kacabSignature,

                MSMC:
                    msmcSignature,

                manager:
                    managerSignature

            },

            pdf:
                String(
                    row.pdf || ""
                ).trim(),

            print:
                String(
                    row.print || ""
                ).trim()
        };

        console.log(
            "[PDF] getPkmPdfData SUCCESS",
            {
                pkmId,
                typePkm,

                signatures: {
                    crm:
                        Boolean(
                            crmSignature.dataUrl
                        ),

                    kacab:
                        Boolean(
                            kacabSignature.dataUrl
                        ),

                    msmc:
                        Boolean(
                            msmcSignature.dataUrl
                        ),

                    manager:
                        Boolean(
                            managerSignature.dataUrl
                        )
                },

                budgetItems:
                    budgetDetails.length
            }
        );

        return res.status(200).json({

            success:
                true,

            pkm:
                pkm

        });

    } catch (error) {

        console.error(
            "[PDF] getPkmPdfData ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({

            success:
                false,

                message:
                    error.message ||
                    "Gagal mengambil data PDF PKM."

        });
    }
};



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
        !refreshToken ||
        !PKM_DRIVE_FOLDER_ID
    ) {
        throw new Error(
            "Konfigurasi Google Drive OAuth belum lengkap."
        );
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


// ==========================================================================
// PUSH PKM DISCORD REMINDER
// ==========================================================================

async function pushPkmDiscordReminderHandler(
    request,
    response
) {

    if (request.method !== "POST") {
        return response.status(405).json({
            success: false,
            message: "Gunakan method POST."
        });
    }

    try {

        /*
        |--------------------------------------------------------------------------
        | BODY
        |--------------------------------------------------------------------------
        */

        let body =
            request.body || {};

        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch (error) {
                return response.status(400).json({
                    success: false,
                    message: "Format request tidak valid."
                });
            }
        }

        /*
        |--------------------------------------------------------------------------
        | PKM ID
        |--------------------------------------------------------------------------
        */

        const pkmId =
            String(
                body.pkmId || ""
            ).trim();

        if (!pkmId) {
            return response.status(400).json({
                success: false,
                message: "PKM ID wajib diisi."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | AMBIL DATA PKM DARI SUPABASE
        |--------------------------------------------------------------------------
        */

        const rows =
            await supabaseRequest(
                "/rest/v1/pkm" +
                "?id_pkm=eq." +
                encodeURIComponent(pkmId) +
                "&select=*",
                {
                    method: "GET"
                }
            );

        if (
            !Array.isArray(rows) ||
            rows.length === 0
        ) {
            return response.status(404).json({
                success: false,
                message:
                    "Data PKM tidak ditemukan."
            });
        }

        const pkm =
            rows[0];

        /*
        |--------------------------------------------------------------------------
        | STATUS PKM
        |--------------------------------------------------------------------------
        */

        const status =
            String(
                pkm.status ||
                ""
            )
                .trim()
                .toUpperCase();

        const approvalStep =
            String(
                pkm.approval_step ||
                pkm.next_role ||
                ""
            )
                .trim()
                .toUpperCase();

        console.log(
            "[PUSH DISCORD] PKM:",
            pkmId,
            "STATUS:",
            status,
            "APPROVAL_STEP:",
            approvalStep
        );

        /*
        |--------------------------------------------------------------------------
        | TENTUKAN TARGET DISCORD
        |--------------------------------------------------------------------------
        */

        let target = "";

        if (
            approvalStep === "MSMC" ||
            status.includes("MSMC")
        ) {

            target = "MSMC";

        }

        else if (
            approvalStep === "MGR_H1" ||
            status.includes("MGR_H1")
        ) {

            target = "MGR";

        }

        else {

            return response.status(400).json({
                success: false,

                message:
                    "PKM ini tidak sedang berada pada tahap yang menggunakan reminder Discord.",

                pkmId:
                    pkmId,

                status:
                    status || null,

                approvalStep:
                    approvalStep || null
            });

        }

        /*
        |--------------------------------------------------------------------------
        | DATA PESAN
        |--------------------------------------------------------------------------
        */

        const name =
            String(
                pkm.nama ||
                pkm.nama_pkm ||
                pkm.name ||
                "-"
            ).trim();

        const branch =
            String(
                pkm.cabang ||
                pkm.branch ||
                "-"
            ).trim();

        const typePkm =
            String(
                pkm.type_pkm ||
                pkm.typePkm ||
                "-"
            ).trim();

        const activityType =
            String(
                pkm.jenis_kegiatan ||
                pkm.activity_type ||
                "-"
            ).trim();

        /*
        |--------------------------------------------------------------------------
        | LINK APPROVAL
        |--------------------------------------------------------------------------
        */

        const webUrl =
            String(
                process.env.PKM_WEB_URL ||
                ""
            ).trim();

        const approvalUrl =
            webUrl
                ? `${webUrl}/index.html?approvalPkm=${encodeURIComponent(pkmId)}`
                : "";

        /*
        |--------------------------------------------------------------------------
        | MESSAGE DISCORD
        |--------------------------------------------------------------------------
        */

        const messageData = {

            content:
                target === "MSMC"
                    ? "🔔 **Reminder Approval PKM untuk MSMC**"
                    : "🔔 **Reminder Approval PKM untuk Manager**",

            embeds: [
                {
                    title:
                        "Pengajuan PKM Menunggu Approval",

                    description:
                        name,

                    color:
                        target === "MSMC"
                            ? 16753920
                            : 14423100,

                    fields: [

                        {
                            name:
                                "ID PKM",

                            value:
                                pkmId,

                            inline:
                                true
                        },

                        {
                            name:
                                "Cabang",

                            value:
                                branch,

                            inline:
                                true
                        },

                        {
                            name:
                                "Type",

                            value:
                                typePkm,

                            inline:
                                true
                        },

                        {
                            name:
                                "Kegiatan",

                            value:
                                activityType,

                            inline:
                                false
                        },

                        {
                            name:
                                "Tahap",

                            value:
                                target === "MSMC"
                                    ? "Menunggu Approval MSMC"
                                    : "Menunggu Approval Manager",

                            inline:
                                false
                        }

                    ],

                    footer: {
                        text:
                            "CSM Marketing Support"
                    },

                    timestamp:
                        new Date().toISOString()
                }
            ],

            components:
                approvalUrl
                    ? [
                        {
                            type:
                                1,

                            components: [
                                {
                                    type:
                                        2,

                                    style:
                                        5,

                                    label:
                                        "Buka Pengajuan",

                                    url:
                                        approvalUrl
                                }
                            ]
                        }
                    ]
                    : []
        };

        /*
        |--------------------------------------------------------------------------
        | KIRIM KE DISCORD
        |--------------------------------------------------------------------------
        */

        console.log(
            "[PUSH DISCORD] Sending:",
            {
                pkmId,
                target
            }
        );

        return await sendDiscordFromBackend_(
            target,
            messageData
        );

    } catch (error) {

        console.error(
            "PUSH PKM DISCORD ERROR:",
            error
        );

        return response.status(
            error?.status || 500
        ).json({

            success:
                false,

            message:
                error?.message ||
                "Gagal mengirim reminder Discord."
        });
    }
}

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

// ===== whatsapp fonnte =====

async function sendManagerH23WhatsappApproval(pkmData) {

    const fonnteToken =
        String(
            process.env.FONNTE_TOKEN || ""
        ).trim();

    const target =
        String(
            process.env.FONNTE_TARGET_MANAGER_H23 || ""
        )
            .replace(/[^0-9]/g, "");

    if (!fonnteToken) {
        throw new Error(
            "FONNTE_TOKEN belum diatur di Vercel."
        );
    }

    if (!target) {
        throw new Error(
            "FONNTE_TARGET_MANAGER_H23 belum diatur di Vercel."
        );
    }

    const message =
        "🔔 *Approval PKM Manager H23*\n\n" +

        "ID PKM: " +
        (pkmData.id || "-") +
        "\n" +

        "Nama: " +
        (pkmData.name || "-") +
        "\n" +

        "Cabang: " +
        (pkmData.branch || "-") +
        "\n" +

        "Type: " +
        (pkmData.typePkm || "-") +
        "\n" +

        "Kegiatan: " +
        (pkmData.activityType || "-") +
        "\n\n" +

        "Silakan buka CSM Marketing Support untuk melakukan approval.";

    const fonnteResponse =
        await fetch(
            "https://api.fonnte.com/send",
            {
                method: "POST",

                headers: {
                    Authorization: fonnteToken
                },

                body: new URLSearchParams({
                    target: target,
                    message: message,
                    countryCode: "62"
                })
            }
        );

    const responseText =
        await fonnteResponse.text();

    let result;

    try {
        result = JSON.parse(responseText);
    } catch (error) {
        result = {
            raw: responseText
        };
    }

    if (!fonnteResponse.ok) {
        throw new Error(
            "Fonnte gagal. HTTP " +
            fonnteResponse.status +
            " - " +
            responseText
        );
    }

    if (
        result &&
        result.status === false
    ) {
        throw new Error(
            result.reason ||
            result.message ||
            "Fonnte menolak pengiriman WhatsApp."
        );
    }

    return result;
}


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

        /* ---------------------------------------------------------
        H23 → WHATSAPP MANAGER H23
        --------------------------------------------------------- */

        if (
            nextRole === "MGR_H23"
        ) {
            try {

                await sendManagerH23WhatsappApproval({
                    id:
                        pkmId,

                    name:
                        row.name ||
                        row.nama ||
                        "-",

                    branch:
                        row.branch ||
                        row.cabang ||
                        "-",

                    typePkm:
                        row.type_pkm ||
                        row.typePkm ||
                        "-",

                    activityType:
                        row.activity_type ||
                        row.activityType ||
                        "-"
                });

                console.log(
                    "[BACKEND] WA MANAGER H23 BERHASIL",
                    pkmId
                );

            } catch (waError) {

                console.error(
                    "[BACKEND] Approval berhasil, tetapi WA Manager H23 gagal:",
                    waError
                );

            }
        }


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


/* ==========================================================================
| CRM KPI - SUPABASE
| ========================================================================== */

const KPI_CRM_DEFINITIONS = Object.freeze({
    RO: {
        index: 1,
        name: "Repeat Order (RO) Sales",
        target: 20,
        weight: 20,
        type: "PERCENT"
    },

    SIPEDE: {
        index: 2,
        name: "Sipede Performance (salesman digital)",
        target: 100,
        weight: 10,
        type: "PERCENT"
    },

    KPB: {
        index: 3,
        name: "Unit Entry KPB (KPB-1 sampai KPB-4)",
        target: [60, 50, 30, 40],
        weight: 5,
        type: "KPB"
    },

    REGISTER_USER: {
        index: 4,
        name: "Register User MotorkuX/Brompit",
        target: 100,
        weight: 3,
        type: "PERCENT"
    },

    REGISTER_MOTOR: {
        index: 5,
        name: "Register Motor MotorkuX/Brompit",
        target: 100,
        weight: 3,
        type: "PERCENT"
    },

    TOTAL_BOOKING: {
        index: 6,
        name: "Total Booking MotorkuX/Brompit",
        target: 100,
        weight: 3,
        type: "PERCENT"
    },

    KPB_DIGITAL: {
        index: 7,
        name: "KPB Digital",
        target: 100,
        weight: 3,
        type: "PERCENT"
    },

    WORKLOAD_STAR: {
        index: 8,
        name: "Workload STAR/SDMS FLP",
        target: 5,
        weight: 5,
        type: "PERCENT",
        inverse: true
    },

    UTILISASI_STAR: {
        index: 9,
        name: "Utilisasi STAR/SDMS FLP",
        target: 100,
        weight: 3,
        type: "PERCENT"
    },

    END_TO_END: {
        index: 10,
        name: "End to End Sales",
        target: 100,
        weight: 5,
        type: "NUMBER"
    },

    LEAD_MANAGEMENT: {
        index: 11,
        name: "Lead Management (overdue pending FU)",
        target: 20,
        weight: 5,
        type: "PERCENT",
        inverse: true
    },

    CDB_QUALITY: {
        index: 12,
        name: "CDB Quality",
        target: 95,
        weight: 15,
        type: "PERCENT"
    },

    DISTRIBUSI_LEADS: {
        index: 13,
        name: "Distribusi Leads",
        target: 100,
        weight: 5,
        type: "PERCENT"
    },

    GMB: {
        index: 14,
        name: "Penambahan Review Google My Business (GMB)",
        target: 100,
        weight: 10,
        type: "NUMBER"
    },

    NOS: {
        index: 15,
        name: "NOS (Network Operational Standard)",
        target: 90,
        weight: 5,
        type: "PERCENT"
    },

    PDCA: {
        index: 16,
        name: "PDCA – Project Improvement CRM",
        target: 1,
        weight: 10,
        type: "NUMBER"
    },

    WORKLOAD_STNK: {
        index: 17,
        name: "Workloads STNK & Voice Customer Insight",
        target: 10,
        weight: 5,
        type: "PERCENT"
    }
});


function crmKpiNormalizeBranch_(value) {
    const raw = String(value || "").trim().toUpperCase();

    const branchMap = {
        SLO: "Solo",
        RJM: "Rajiman",
        SRG: "Sragen",
        KRA: "Karanganyar",
        KPD: "Karangpandan",
        WNG: "Wonogiri",
        NGW: "Ngawi",
        CRB: "Caruban",
        STY: "Sutoyo",
        KSM: "Kusuma"
    };

    return branchMap[raw] || String(value || "").trim();
}


function crmKpiIsHO_(user) {

    const role =
        String(
            user?.role ||
            user?.approvalRole ||
            ""
        )
            .trim()
            .toUpperCase();

    const branch =
        crmKpiNormalizeBranch_(
            user?.originalBranch ||
            user?.branch ||
            ""
        );

    return (
        branch === "HO" ||
        user?.branch === "ALL" ||
        role === "MSMC"
    );
}


async function crmKpiGetUser_(token) {

    const value =
        String(token || "").trim();

    if (!value) {
        const error =
            new Error(
                "Token login tidak ditemukan."
            );

        error.status = 401;

        throw error;
    }

    const authResponse =
        await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                method: "GET",

                headers: {
                    "apikey":
                        SUPABASE_SERVICE_ROLE_KEY,

                    "Authorization":
                        `Bearer ${value}`
                }
            }
        );

    const authText =
        await authResponse.text();

    let authData = null;

    try {
        authData =
            authText
                ? JSON.parse(authText)
                : null;
    } catch {
        authData = null;
    }

    if (!authResponse.ok) {

        const error =
            new Error(
                "Sesi login tidak valid atau sudah berakhir."
            );

        error.status = 401;

        throw error;
    }

    const authUser =
        authData;

    if (!authUser?.id) {

        const error =
            new Error(
                "User Supabase tidak ditemukan."
            );

        error.status = 401;

        throw error;
    }

    const profiles =
        await supabaseRequest(
            `/rest/v1/v_user_profile?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=*`,
            {
                method: "GET"
            }
        );

    if (
        !Array.isArray(profiles) ||
        !profiles.length
    ) {

        const error =
            new Error(
                "Profile user tidak ditemukan."
            );

        error.status = 403;

        throw error;
    }

    const profile =
        profiles[0];

    return {

        id:
            profile.nik ||
            authUser.id,

        nik:
            profile.nik ||
            "",

        username:
            profile.nik ||
            "",

        name:
            profile.nama_marketing ||
            "",

        role:
            profile.approval_role ||
            "USER",

        approvalRole:
            profile.approval_role ||
            "USER",

        originalBranch:
            profile.cab ||
            "",

        branch:
            String(
                profile.cab ||
                ""
            )
                .trim()
                .toUpperCase() === "HO"
                ? "ALL"
                : String(
                    profile.cab ||
                    ""
                )
                    .trim()
                    .toUpperCase(),

        authUserId:
            profile.auth_user_id ||
            authUser.id
    };
}


function crmKpiParseValue_(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    if (Array.isArray(value)) {

        return value.map(
            function (item) {

                if (
                    item === null ||
                    item === undefined ||
                    item === ""
                ) {
                    return "";
                }

                const number =
                    Number(item);

                return Number.isFinite(number)
                    ? number
                    : item;
            }
        );
    }

    if (
        typeof value === "number"
    ) {
        return value;
    }

    const text =
        String(value).trim();

    if (!text) {
        return "";
    }

    try {

        const parsed =
            JSON.parse(text);

        return parsed;

    } catch {

        const number =
            Number(text);

        return Number.isFinite(number)
            ? number
            : text;
    }
}


function crmKpiSerializeValue_(value) {

    if (Array.isArray(value)) {

        return JSON.stringify(
            value
        );
    }

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}


function crmKpiHasValue_(value) {

    if (Array.isArray(value)) {

        return value.some(
            function (item) {

                return (
                    item !== "" &&
                    item !== null &&
                    item !== undefined
                );
            }
        );
    }

    return (
        value !== "" &&
        value !== null &&
        value !== undefined
    );
}


function crmKpiRound_(value) {

    return Math.round(
        Number(value || 0) * 100
    ) / 100;
}


function crmKpiRatio_(
    target,
    actual,
    inverse
) {

    if (
        !target ||
        actual < 0
    ) {
        return 0;
    }

    if (inverse) {

        if (
            actual <= target
        ) {
            return 1;
        }

        return Math.min(
            target / actual,
            1
        );
    }

    return Math.min(
        actual / target,
        1
    );
}


function crmKpiScore_(
    definition,
    target,
    actual
) {

    if (
        !crmKpiHasValue_(actual)
    ) {
        return 0;
    }

    if (
        definition.type === "KPB"
    ) {

        const targets =
            Array.isArray(target)
                ? target
                : definition.target;

        const actuals =
            Array.isArray(actual)
                ? actual
                : [];

        const achievements =
            targets.map(
                function (
                    targetValue,
                    index
                ) {

                    return crmKpiRatio_(
                        Number(targetValue),
                        Number(
                            actuals[index] || 0
                        ),
                        false
                    );
                }
            );

        const average =
            achievements.reduce(
                function (
                    total,
                    value
                ) {
                    return total + value;
                },
                0
            ) /
            achievements.length;

        return crmKpiRound_(
            average *
            definition.weight
        );
    }

    const targetNumber =
        Number(target || 0);

    const actualNumber =
        Number(actual || 0);

    const ratio =
        crmKpiRatio_(
            targetNumber,
            actualNumber,
            definition.inverse === true
        );

    return crmKpiRound_(
        ratio *
        definition.weight
    );
}


function crmKpiActualPercentage_(
    definition,
    target,
    actual
) {

    if (
        definition.type === "KPB"
    ) {

        const actuals =
            Array.isArray(actual)
                ? actual
                    .slice(0, 4)
                    .filter(
                        function (value) {
                            return (
                                value !== "" &&
                                value !== null &&
                                value !== undefined
                            );
                        }
                    )
                    .map(Number)
                : [];

        if (!actuals.length) {
            return 0;
        }

        return crmKpiRound_(
            actuals.reduce(
                function (
                    total,
                    value
                ) {
                    return total + value;
                },
                0
            ) /
            actuals.length
        );
    }

    if (
        definition.type === "NUMBER"
    ) {

        const targetNumber =
            Number(target || 0);

        if (!targetNumber) {
            return 0;
        }

        return (
            Number(actual || 0) /
            targetNumber
        ) * 100;
    }

    return Number(actual || 0);
}


function crmKpiNormalizeKpb_(value) {

    if (Array.isArray(value)) {

        const firstFour = [
            value[0] ?? "",
            value[1] ?? "",
            value[2] ?? "",
            value[3] ?? ""
        ];

        const valid =
            firstFour
                .filter(
                    function (item) {
                        return (
                            item !== "" &&
                            item !== null &&
                            item !== undefined &&
                            Number.isFinite(
                                Number(item)
                            )
                        );
                    }
                )
                .map(Number);

        const average =
            valid.length
                ? crmKpiRound_(
                    valid.reduce(
                        (a, b) => a + b,
                        0
                    ) /
                    valid.length
                )
                : "";

        return [
            ...firstFour,
            average
        ];
    }

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {
        return [
            "",
            "",
            "",
            "",
            ""
        ];
    }

    return [
        "",
        "",
        "",
        "",
        Number(value)
    ];
}


/* ==========================================================================
| GET KPI CRM
| ========================================================================== */

async function crmKpiGetData_(user, payload) {

    const requestedBranch =
        crmKpiNormalizeBranch_(payload.branch);

    const branch =
        crmKpiIsHO_(user)
            ? requestedBranch ||
              crmKpiNormalizeBranch_(
                  user.originalBranch
              )
            : crmKpiNormalizeBranch_(
                  user.originalBranch ||
                  user.branch
              );

    if (!branch) {
        throw new Error(
            "Cabang KPI tidak valid."
        );
    }

    const year =
        Number(
            payload.year ||
            new Date().getFullYear()
        );

    const month =
        Number(
            payload.month ||
            new Date().getMonth() + 1
        );

    /*
    |------------------------------------------------------------
    | SNAPSHOT
    |------------------------------------------------------------
    | WEEKLY = input sementara
    | CLOSING = input final
    |
    | Tidak ada lagi filter WEEK.
    */
    const snapshotType =
        String(
            payload.snapshotType ||
            "WEEKLY"
        )
            .trim()
            .toUpperCase();

    let query =
        "/rest/v1/kpi_crm_ho" +
        "?select=*" +
        `&cabang=eq.${encodeURIComponent(branch)}` +
        `&tahun=eq.${year}` +
        `&bulan=eq.${month}` +
        "&order=id_detail.asc";

    const rows =
        await supabaseRequest(
            query,
            {
                method: "GET"
            }
        );

    const data =
        Object.keys(
            KPI_CRM_DEFINITIONS
        ).map(function (code) {

            const definition =
                KPI_CRM_DEFINITIONS[code];

            const matched =
                Array.isArray(rows)
                    ? rows.find(function (row) {

                        return (
                            String(
                                row.kode_kpi ||
                                ""
                            )
                                .trim()
                                .toUpperCase() ===
                            code
                        );

                    })
                    : null;

            if (!matched) {

                return {
                    code,

                    target:
                        definition.target,

                    actualCrm:
                        definition.unit === "KPB"
                            ? [
                                "",
                                "",
                                "",
                                "",
                                ""
                            ]
                            : "",

                    actualHo:
                        definition.unit === "KPB"
                            ? [
                                "",
                                "",
                                "",
                                "",
                                ""
                            ]
                            : "",

                    scoreCrm: 0,
                    scoreHo: 0,

                    status: "",

                    snapshotType: "",

                    snapshotNote: "",

                    inputDate: null
                };
            }

            const target =
                crmKpiParseValue_(
                    matched.target_input
                );

            const actualCrm =
                crmKpiParseValue_(
                    matched.realisasi_crm
                );

            const actualHo =
                crmKpiParseValue_(
                    matched.aktual_ho
                );

            return {

                code,

                target:
                    crmKpiHasValue_(target)
                        ? target
                        : definition.target,

                actualCrm,

                actualHo,

                scoreCrm:
                    crmKpiScore_(
                        definition,
                        crmKpiHasValue_(target)
                            ? target
                            : definition.target,
                        actualCrm
                    ),

                scoreHo:
                    crmKpiScore_(
                        definition,
                        crmKpiHasValue_(target)
                            ? target
                            : definition.target,
                        actualHo
                    ),

                status:
                    String(
                        matched.status ||
                        ""
                    )
                        .trim()
                        .toUpperCase(),

                snapshotType:
                    String(
                        matched.tipe_snapshot ||
                        ""
                    )
                        .trim()
                        .toUpperCase(),

                snapshotNote:
                    String(
                        matched.catatan ||
                        ""
                    ).trim(),

                inputDate:
                    matched.tanggal_input ||
                    matched.created_at ||
                    null
            };
        });

    const matchedRows =
        Array.isArray(rows)
            ? rows
            : [];

    const status =
        matchedRows.length &&
        matchedRows.every(function (row) {

            return (
                String(
                    row.status ||
                    ""
                )
                    .trim()
                    .toUpperCase() ===
                "TERVERIFIKASI"
            );

        })
            ? "TERVERIFIKASI"
            : matchedRows.length
                ? "MENUNGGU VERIFIKASI MSMC"
                : "";

    /*
    | snapshotType sebenarnya mengikuti
    | record terakhir yang tersimpan.
    */
    const latestSnapshot =
        matchedRows.length
            ? String(
                matchedRows[0].tipe_snapshot ||
                snapshotType
            )
                .trim()
                .toUpperCase()
            : snapshotType;

    return {

        data,

        status,

        maximumScore: 115,

        branch,

        year,

        month,

        week: null,

        snapshotType:
            latestSnapshot,

        canViewHo:
            crmKpiIsHO_(user)
    };
}

/* ==========================================================================
| SAVE KPI CRM
| ========================================================================== */

async function crmKpiSave_(
    user,
    payload
) {

    const role =
        String(
            user.role ||
            user.approvalRole ||
            ""
        )
            .trim()
            .toUpperCase();

    if (role !== "CRM") {

        const error =
            new Error(
                "Hanya CRM yang dapat mengisi KPI CRM."
            );

        error.status = 403;

        throw error;
    }

    const branch =
        crmKpiNormalizeBranch_(
            user.originalBranch ||
            user.branch ||
            payload.branch
        );

    const year =
        Number(payload.year);

    const month =
        Number(payload.month);

    const snapshotType =
        String(
            payload.snapshotType ||
            "WEEKLY"
        )
            .trim()
            .toUpperCase();

    if (
        ![
            "WEEKLY",
            "CLOSING"
        ].includes(snapshotType)
    ) {
        throw new Error(
            "Snapshot KPI tidak valid."
        );
    }

    const metrics =
        Array.isArray(
            payload.metrics
        )
            ? payload.metrics
            : [];

    if (!metrics.length) {

        throw new Error(
            "Data KPI belum diisi."
        );
    }

    const nik =
        String(
            user.nik ||
            user.username ||
            ""
        ).trim();

    /*
    |------------------------------------------------------------
    | SATU ID UNTUK SATU PERIODE
    |------------------------------------------------------------
    |
    | Tidak menggunakan NIK.
    | Tidak menggunakan WEEK.
    |
    | Contoh:
    | Solo-2026-09
    |
    */
    const idInput =
        [
            branch,
            year,
            String(month)
                .padStart(2, "0")
        ].join("-");

    const now =
        new Date().toISOString();

    let savedRows = 0;

    for (
        const metricPayload of metrics
    ) {

        const code =
            String(
                metricPayload.code ||
                ""
            )
                .trim()
                .toUpperCase();

        const definition =
            KPI_CRM_DEFINITIONS[
                code
            ];

        if (!definition) {
            continue;
        }

        const target =
            metricPayload.target !== undefined
                ? metricPayload.target
                : definition.target;

        const actualCrm =
            metricPayload.actualCrm;

        const scoreCrm =
            crmKpiScore_(
                definition,
                target,
                actualCrm
            );

        const actualPercentage =
            crmKpiActualPercentage_(
                definition,
                target,
                actualCrm
            );

        /*
        |--------------------------------------------------------
        | ID DETAIL
        |--------------------------------------------------------
        */
        const idDetail =
            `${idInput}-${definition.index}`;

        /*
        |--------------------------------------------------------
        | KPI CRM
        |--------------------------------------------------------
        */

        const crmRows =
            await supabaseRequest(
                `/rest/v1/kpi_crm?id_detail=eq.${encodeURIComponent(idDetail)}&select=id`,
                {
                    method: "GET"
                }
            );

        const crmRecord = {

            id_input:
                idInput,

            id_detail:
                idDetail,

            tanggal:
                now,

            nik:
                nik,

            nama:
                user.name ||
                "",

            cabang:
                branch,

            indikator_kpi:
                definition.name,

            aktual:
                actualPercentage / 100,

            target:
                crmKpiSerializeValue_(
                    target
                ),

            score:
                scoreCrm,

            tipe_snapshot:
                snapshotType,

            week:
                null
        };

        if (
            Array.isArray(crmRows) &&
            crmRows.length
        ) {

            await supabaseRequest(
                `/rest/v1/kpi_crm?id_detail=eq.${encodeURIComponent(idDetail)}`,
                {
                    method: "PATCH",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            crmRecord
                        )
                }
            );

        } else {

            await supabaseRequest(
                "/rest/v1/kpi_crm",
                {
                    method: "POST",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            crmRecord
                        )
                }
            );
        }

        /*
        |--------------------------------------------------------
        | KPI CRM HO
        |--------------------------------------------------------
        */

        const hoRows =
            await supabaseRequest(
                `/rest/v1/kpi_crm_ho?id_detail=eq.${encodeURIComponent(idDetail)}&select=id`,
                {
                    method: "GET"
                }
            );

        const hoRecord = {

            id_input:
                idInput,

            id_detail:
                idDetail,

            kode_kpi:
                code,

            cabang:
                branch,

            tahun:
                year,

            bulan:
                month,

            week:
                null,

            target_input:
                crmKpiSerializeValue_(
                    target
                ),

            realisasi_crm:
                crmKpiSerializeValue_(
                    actualCrm
                ),

            aktual_ho:
                "",

            skor_crm:
                scoreCrm,

            skor_ho:
                null,

            status:
                "MENUNGGU VERIFIKASI MSMC",

            nik_verifikator:
                "",

            nama_verifikator:
                "",

            tanggal_verifikasi:
                null,

            tipe_snapshot:
                snapshotType,

            catatan:
                String(
                    payload.snapshotNote ||
                    ""
                ).trim(),

            tanggal_input:
                now,

            raw_data:
                metricPayload
        };

        if (
            Array.isArray(hoRows) &&
            hoRows.length
        ) {

            await supabaseRequest(
                `/rest/v1/kpi_crm_ho?id_detail=eq.${encodeURIComponent(idDetail)}`,
                {
                    method: "PATCH",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            hoRecord
                        )
                }
            );

        } else {

            await supabaseRequest(
                "/rest/v1/kpi_crm_ho",
                {
                    method: "POST",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            hoRecord
                        )
                }
            );
        }

        savedRows += 1;
    }

    return {

        saved: true,

        savedRows,

        idInput,

        status:
            "MENUNGGU VERIFIKASI MSMC"
    };
}

/* ==========================================================================
| VERIFY KPI CRM
| ========================================================================== */

async function crmKpiVerify_(
    user,
    payload
) {

    const role =
        String(
            user.role ||
            user.approvalRole ||
            ""
        )
            .trim()
            .toUpperCase();

    if (
        role !== "MSMC"
    ) {
        const error =
            new Error(
                "Hanya MSMC yang dapat memverifikasi KPI CRM."
            );

        error.status = 403;

        throw error;
    }

    const branch =
        crmKpiNormalizeBranch_(
            payload.branch
        );

    const year =
        Number(payload.year);

    const month =
        Number(payload.month);

    const snapshotType =
        String(
            payload.snapshotType ||
            "WEEKLY"
        )
            .trim()
            .toUpperCase();


    const metrics =
        Array.isArray(
            payload.metrics
        )
            ? payload.metrics
            : [];

    if (!metrics.length) {
        throw new Error(
            "Data Actual HO belum tersedia."
        );
    }

    let updatedRows = 0;

    for (
        const metricPayload of metrics
    ) {

        const code =
            String(
                metricPayload.code ||
                ""
            )
                .trim()
                .toUpperCase();

        const definition =
            KPI_CRM_DEFINITIONS[
                code
            ];

        if (!definition) {
            continue;
        }

        let query =
            "/rest/v1/kpi_crm_ho" +
            "?select=*" +
            `&kode_kpi=eq.${encodeURIComponent(code)}` +
            `&cabang=eq.${encodeURIComponent(branch)}` +
            `&tahun=eq.${year}` +
            `&bulan=eq.${month}`;

        const rows =
            await supabaseRequest(
                query,
                {
                    method: "GET"
                }
            );

        if (
            !Array.isArray(rows) ||
            !rows.length
        ) {
            continue;
        }

        for (
            const record of rows
        ) {

            const target =
                crmKpiHasValue_(
                    crmKpiParseValue_(
                        record.target_input
                    )
                )
                    ? crmKpiParseValue_(
                        record.target_input
                    )
                    : definition.target;

            const actualHo =
                metricPayload.actualHo;

            const scoreHo =
                crmKpiScore_(
                    definition,
                    target,
                    actualHo
                );

            await supabaseRequest(
                `/rest/v1/kpi_crm_ho?id_detail=eq.${encodeURIComponent(record.id_detail)}`,
                {
                    method: "PATCH",

                    headers: {
                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify({

                            aktual_ho:
                                crmKpiSerializeValue_(
                                    actualHo
                                ),

                            skor_ho:
                                scoreHo,

                            status:
                                "TERVERIFIKASI",

                            nik_verifikator:
                                user.nik ||
                                user.username ||
                                "",

                            nama_verifikator:
                                user.name ||
                                "",

                            tanggal_verifikasi:
                                new Date()
                                    .toISOString(),

                            updated_at:
                                new Date()
                                    .toISOString()
                        })
                }
            );

            updatedRows += 1;
        }
    }

    if (!updatedRows) {
        throw new Error(
            "Data KPI CRM periode tersebut belum tersimpan di Supabase."
        );
    }

    return {
        verified: true,
        updatedRows,
        status: "TERVERIFIKASI"
    };
}


/* ==========================================================================
| SINGLE CRM KPI HANDLER
| ========================================================================== */

async function crmKpiHandler(
    req,
    res
) {

    try {

        const body =
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : (
                    req.body ||
                    {}
                );

        const action =
            String(
                body.action ||
                req.query?.action ||
                ""
            ).trim();

        const token =
            String(
                body.token ||
                ""
            ).trim();

        const payload =
            body.payload ||
            {};

        const user =
            await crmKpiGetUser_(
                token
            );

        let result;

        switch (action) {

            case "getCrmKpiData":

                result =
                    await crmKpiGetData_(
                        user,
                        payload
                    );

                break;

            case "saveCrmKpi":

                result =
                    await crmKpiSave_(
                        user,
                        payload
                    );

                break;

            case "verifyCrmKpi":

                result =
                    await crmKpiVerify_(
                        user,
                        payload
                    );

                break;

            default: {

                const error =
                    new Error(
                        `CRM KPI action tidak dikenal: ${action}`
                    );

                error.status = 400;

                throw error;
            }
        }

        return res
            .status(200)
            .json({
                success: true,
                ...result
            });

    } catch (error) {

        console.error(
            "[CRM KPI]",
            error
        );

        return res
            .status(
                error?.status ||
                500
            )
            .json({
                success: false,
                message:
                    error?.message ||
                    "CRM KPI backend gagal."
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
    
      case "updateManagedAccount":
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
        return await runHandler(
            getPkmPdfDataHandler,
            req,
            res
        );

      case "pkmDownload":
        return await runHandler(
            pkmDownloadHandler,
            req,
            res
        );

      case "savePkmPdf":
        return await runHandler(
            savePkmPdfHandler,
            req,
            res
        );

      case "discord":
        return await runHandler(
          discordHandler,
          req,
          res
        );

    case "pushPkmDiscordReminder":
        return await runHandler(
            pushPkmDiscordReminderHandler,
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

    case "getLpjCandidates":
        return await runHandler(
            gasHandler,
            req,
            res
        );

    case "createLpj":
        return await runHandler(
            gasHandler,
            req,
            res
        );

    case "getMyProfile":
    case "createPkm":
    case "getLpjCandidates":
    case "createLpj":
        return await runHandler(
          gasHandler,
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
