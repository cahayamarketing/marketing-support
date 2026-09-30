"use strict";

import { supabaseRequest } from "../src/backend/supabase.js";

function clean(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

function isMasterNik(nik) {
    return clean(nik) === "910000";
}

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