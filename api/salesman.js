"use strict";

import { supabaseRequest } from "../src/backend/supabase.js";

function clean(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

export default async function handler(req, res) {

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