"use strict";

import { supabaseRequest } from "../src/backend/supabase.js";

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {

        const type =
            String(
                req.query?.type || ""
            ).trim().toUpperCase();


        /*
        |--------------------------------------------------------------------------
        | MODE GET MASTER DATA TABLE
        |--------------------------------------------------------------------------
        |
        | Dipakai oleh:
        | loadMasterDataTable()
        |
        | Contoh:
        | /api/master?type=PKM
        | /api/master?type=EVENT
        | /api/master?type=KPI_CRM
        |
        |--------------------------------------------------------------------------
        */

        if (type) {

            /*
            |--------------------------------------------------------------------------
            | MASTER PKM
            |--------------------------------------------------------------------------
            */

            if (type === "PKM") {

                const rows =
                    await supabaseRequest(
                        "/rest/v1/master_pkm" +
                        "?select=id,pkm,jenis_pkm" +
                        "&order=id.asc"
                    );

                const headers = [
                    "ID PKM",
                    "PKM",
                    "JENIS PKM"
                ];

                const data =
                    Array.isArray(rows)
                        ? rows.map(function (row) {
                            return {
                                "ID PKM":
                                    String(
                                        row.id ?? ""
                                    ).trim(),

                                "PKM":
                                    String(
                                        row.pkm ?? ""
                                    ).trim(),

                                "JENIS PKM":
                                    String(
                                        row.jenis_pkm ?? ""
                                    ).trim()
                            };
                        })
                        : [];

                return res.status(200).json({
                    success: true,
                    type: type,
                    headers: headers,
                    data: data
                });
            }


            /*
            |--------------------------------------------------------------------------
            | MASTER EVENT
            |--------------------------------------------------------------------------
            */

            if (type === "EVENT") {

                const rows =
                    await supabaseRequest(
                        "/rest/v1/master_activity" +
                        "?select=id_event,kode_event,nama_event,nama_event_md,jenis_event" +
                        "&order=id_event.asc"
                    );

                const headers = [
                    "ID EVENT",
                    "KODE EVENT",
                    "NAMA EVENT",
                    "NAMA EVENT MD",
                    "JENIS EVENT"
                ];

                const data =
                    Array.isArray(rows)
                        ? rows.map(function (row) {
                            return {
                                "ID EVENT":
                                    String(
                                        row.id_event ?? ""
                                    ).trim(),

                                "KODE EVENT":
                                    String(
                                        row.kode_event ?? ""
                                    ).trim(),

                                "NAMA EVENT":
                                    String(
                                        row.nama_event ?? ""
                                    ).trim(),

                                "NAMA EVENT MD":
                                    String(
                                        row.nama_event_md ?? ""
                                    ).trim(),

                                "JENIS EVENT":
                                    String(
                                        row.jenis_event ?? ""
                                    ).trim()
                            };
                        })
                        : [];

                return res.status(200).json({
                    success: true,
                    type: type,
                    headers: headers,
                    data: data
                });
            }


            /*
            |--------------------------------------------------------------------------
            | MASTER KPI CRM
            |--------------------------------------------------------------------------
            */

            if (type === "KPI_CRM") {

                const rows =
                    await supabaseRequest(
                        "/rest/v1/master_kpi_crm" +
                        "?select=id,pilar_utama,indikator_kpi,target,target_persen,bobot,jenis_target,under_target" +
                        "&order=id.asc"
                    );

                const headers = [
                    "ID",
                    "PILAR UTAMA",
                    "INDIKATOR KPI",
                    "TARGET",
                    "%",
                    "BOBOT",
                    "JENIS TARGET",
                    "UNDER TARGET"
                ];

                const data =
                    Array.isArray(rows)
                        ? rows.map(function (row) {
                            return {
                                "ID":
                                    row.id,

                                "PILAR UTAMA":
                                    String(
                                        row.pilar_utama ?? ""
                                    ).trim(),

                                "INDIKATOR KPI":
                                    String(
                                        row.indikator_kpi ?? ""
                                    ).trim(),

                                "TARGET":
                                    row.target ?? "",

                                "%":
                                    row.target_persen ?? "",

                                "BOBOT":
                                    row.bobot ?? "",

                                "JENIS TARGET":
                                    String(
                                        row.jenis_target ?? ""
                                    ).trim(),

                                "UNDER TARGET":
                                    String(
                                        row.under_target ?? ""
                                    ).trim()
                            };
                        })
                        : [];

                return res.status(200).json({
                    success: true,
                    type: type,
                    headers: headers,
                    data: data
                });
            }


            /*
            |--------------------------------------------------------------------------
            | LEASING
            |--------------------------------------------------------------------------
            */

            if (type === "LEASING") {

                return res.status(200).json({
                    success: true,
                    type: type,
                    headers: [
                        "INIT",
                        "KODE",
                        "NAMA"
                    ],
                    data: [],
                    message:
                        "Master Leasing belum dimigrasikan ke Supabase."
                });
            }


            /*
            |--------------------------------------------------------------------------
            | TYPE TIDAK DIKENAL
            |--------------------------------------------------------------------------
            */

            return res.status(400).json({
                success: false,
                message:
                    `Jenis master "${type}" tidak tersedia.`
            });
        }


        /*
        |--------------------------------------------------------------------------
        | MODE REFERENCE MASTER LAMA
        |--------------------------------------------------------------------------
        |
        | /api/master
        |
        | Jangan diubah bentuk responsenya karena app.js
        | loadReferenceMasters() sudah bergantung pada format ini.
        |
        |--------------------------------------------------------------------------
        */


        /*
        |--------------------------------------------------------------------------
        | MASTER PKM
        |--------------------------------------------------------------------------
        */

        const pkmTypes =
            await supabaseRequest(
                "/rest/v1/master_pkm" +
                "?select=id,pkm,jenis_pkm" +
                "&order=id.asc"
            );


        /*
        |--------------------------------------------------------------------------
        | MASTER ACTIVITY / EVENT
        |--------------------------------------------------------------------------
        */

        const events =
            await supabaseRequest(
                "/rest/v1/master_activity" +
                "?select=id_event,kode_event,nama_event,nama_event_md,jenis_event" +
                "&order=id_event.asc"
            );


        /*
        |--------------------------------------------------------------------------
        | MASTER UNIT / GAB
        |--------------------------------------------------------------------------
        */

        const unitRows =
            await supabaseRequest(
                "/rest/v1/master_unit" +
                "?select=gab" +
                "&order=gab.asc"
            );


        /*
        |--------------------------------------------------------------------------
        | FORMAT LAMA
        |--------------------------------------------------------------------------
        */

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

    } catch (error) {

        console.error(
            "MASTER API ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil master data dari Supabase."
        });
    }
}