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
                    "?select=*" +
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
            | 11. AMBIL BUDGET ITEM UNTUK DATA YANG DITAMPILKAN
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
                itemRows =
                    await fetchAllSupabaseRows(
                        "/rest/v1/pkm_item" +
                        "?select=*" +
                        "&limit=1000"
                    );

                const pagePkmSet =
                    new Set(
                        pagePkmIds
                    );

                itemRows =
                    itemRows.filter(
                        function (item) {
                            return pagePkmSet.has(
                                String(
                                    item.link_pkm ||
                                    ""
                                ).trim()
                            );
                        }
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