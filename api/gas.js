import { supabaseRequest } from "../src/backend/supabase.js";

export default async function handler(
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
                            `${SUPABASE_URL}/storage/v1/object/sign/ttd/${encodeURIComponent(ttdStoragePath)}`,
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
                        "acc_manager_h1"
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