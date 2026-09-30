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
        const type =
            clean(req.query?.type).toUpperCase();

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Parameter type wajib diisi."
            });
        }

        let headers = [];
        let data = [];

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
                    "&order=id.asc" +
                    "&limit=2000"
                );

            headers = [
                "ID PKM",
                "PKM",
                "JENIS PKM"
            ];

            data = Array.isArray(rows)
                ? rows.map(function (row) {
                    return {
                        "ID PKM":
                            clean(row.id),

                        "PKM":
                            clean(row.pkm),

                        "JENIS PKM":
                            clean(row.jenis_pkm)
                    };
                })
                : [];
        }

        /*
        |--------------------------------------------------------------------------
        | MASTER EVENT
        |--------------------------------------------------------------------------
        */

        else if (type === "EVENT") {

            const rows =
                await supabaseRequest(
                    "/rest/v1/master_activity" +
                    "?select=id_event,kode_event,nama_event,nama_event_md,jenis_event" +
                    "&order=id_event.asc" +
                    "&limit=2000"
                );

            headers = [
                "ID EVENT",
                "KODE EVENT",
                "NAMA EVENT",
                "NAMA EVENT MD",
                "JENIS EVENT"
            ];

            data = Array.isArray(rows)
                ? rows.map(function (row) {
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
                })
                : [];
        }

        /*
        |--------------------------------------------------------------------------
        | MASTER KPI CRM
        |--------------------------------------------------------------------------
        */

        else if (type === "KPI_CRM") {

            const rows =
                await supabaseRequest(
                    "/rest/v1/master_kpi_crm" +
                    "?select=id,pilar_utama,indikator_kpi,target,target_persen,bobot,jenis_target,under_target" +
                    "&order=id.asc" +
                    "&limit=2000"
                );

            /*
             * Hanya gunakan kolom yang memang
             * sudah ada di Supabase.
             *
             * KODE KPI, SATUAN, STATUS
             * belum ada di schema master_kpi_crm.
             */

            headers = [
                "ID",
                "PILAR UTAMA",
                "INDIKATOR KPI",
                "TARGET",
                "%",
                "BOBOT",
                "JENIS TARGET",
                "UNDER TARGET"
            ];

            data = Array.isArray(rows)
                ? rows.map(function (row) {
                    return {
                        "ID":
                            row.id,

                        "PILAR UTAMA":
                            clean(row.pilar_utama),

                        "INDIKATOR KPI":
                            clean(row.indikator_kpi),

                        "TARGET":
                            clean(row.target),

                        "%":
                            row.target_persen === null ||
                            row.target_persen === undefined
                                ? ""
                                : row.target_persen,

                        "BOBOT":
                            row.bobot === null ||
                            row.bobot === undefined
                                ? ""
                                : row.bobot,

                        "JENIS TARGET":
                            clean(row.jenis_target),

                        "UNDER TARGET":
                            clean(row.under_target)
                    };
                })
                : [];
        }

        /*
        |--------------------------------------------------------------------------
        | MASTER YANG BELUM DIMIGRASIKAN
        |--------------------------------------------------------------------------
        */

        else if (
            type === "LEASING" ||
            type === "KPI_SIPEDE"
        ) {

            return res.status(200).json({
                success: true,
                type: type,
                headers: [],
                data: [],
                message:
                    `Master ${type} belum tersedia di Supabase.`
            });
        }

        else {
            return res.status(400).json({
                success: false,
                message:
                    `Jenis master "${type}" tidak tersedia.`
            });
        }

        return res.status(200).json({
            success: true,
            type: type,
            headers: headers,
            data: data
        });

    } catch (error) {

        console.error(
            "MASTER DATA API ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil Master Data dari Supabase."
        });
    }
}