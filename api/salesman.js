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

        const rows = await supabaseRequest(
            "/rest/v1/salesman" +
            "?select=nik,gab,nama_marketing,id_tl,tl,jab,pos,cab,sebagai,status,role_pkm,ttd_file_id,ttd_url,source_updated_at" +
            "&order=nama_marketing.asc" +
            "&limit=2000"
        );

        const data = Array.isArray(rows)
            ? rows.map(row => ({
                nik: String(row.nik || "").trim(),
                gab: String(row.gab || "").trim(),
                namaMarketing: String(row.nama_marketing || "").trim(),
                idTl: String(row.id_tl || "").trim(),
                tl: String(row.tl || "").trim(),
                jab: String(row.jab || "").trim(),
                pos: String(row.pos || "").trim(),
                cab: String(row.cab || "").trim(),
                sebagai: String(row.sebagai || "").trim(),
                status: String(row.status || "").trim(),
                rolePkm: String(row.role_pkm || "").trim(),
                ttdFileId: String(row.ttd_file_id || "").trim(),
                ttdUrl: String(row.ttd_url || "").trim(),
                updatedAt: String(row.source_updated_at || "").trim()
            }))
            : [];

        return res.status(200).json({
            success: true,
            message: "Data salesman berhasil diambil dari Supabase.",
            data: data
        });

    } catch (error) {

        console.error(
            "SALESMAN API ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil data salesman dari Supabase."
        });
    }
}