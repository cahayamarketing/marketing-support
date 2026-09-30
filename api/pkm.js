"use strict";

import { supabaseRequest } from "../src/backend/services/supabase.js";

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

    const typePkm = textValue(row.type_pkm)
        .replace(/\s+/g, "")
        .toUpperCase();

    const needsPicH23 =
        typePkm === "H23" ||
        typePkm === "H123";

    const accCrm =
        textValue(row.acc_crm);

    const accKacab =
        textValue(row.acc_kacab);

    const accMsmc =
        textValue(row.acc_msmc);

    const accManagerH1 =
        textValue(row.acc_manager_h1);

    const accManagerH23 =
        textValue(row.acc_manager_h23);

    /*
     * H23 / H123
     */
    if (needsPicH23) {

        if (!accCrm) {
            return "CRM";
        }

        if (!accKacab) {
            return "KACAB";
        }

        if (!accMsmc) {
            return "MSMC";
        }

        if (!accManagerH23) {
            return "MGR_H23";
        }

        return "SELESAI";
    }

    /*
     * H1
     */
    if (!accCrm) {
        return "CRM";
    }

    if (!accKacab) {
        return "KACAB";
    }

    if (!accMsmc) {
        return "MSMC";
    }

    if (!accManagerH1) {
        return "MGR_H1";
    }

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

    /*
     * Supabase REST default limit bisa membatasi jumlah row.
     *
     * Kita ambil sampai 5000 karena data PKM sekarang
     * sekitar 3216 row.
     */
    return await supabaseRequest(
        "/rest/v1/pkm" +
        "?select=*" +
        "&order=tanggal_mulai.desc" +
        "&limit=5000"
    );
}


export default async function handler(req, res) {

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