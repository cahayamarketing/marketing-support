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
        | FORMAT AGAR 100% KOMPATIBEL DENGAN app.js LAMA
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


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,
            message: "Master data berhasil diambil dari Supabase.",
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