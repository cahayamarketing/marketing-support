"use strict";

async function downloadPkmPdf(
    pkmId,
    button
) {
    const originalContent =
        button.innerHTML;

    try {
        button.disabled = true;

        button.innerHTML = `
            <span class="flex items-center gap-2">
                <span class="ui-spinner"></span>
                <span>Membuat PDF...</span>
            </span>
        `;

        const result =
            await requestBackend(
                "getPkmPdfData",
                {
                    pkmId: pkmId
                }
            );

        if (
            !result ||
            !result.pkm
        ) {
            throw new Error(
                "Data PDF PKM tidak ditemukan."
            );
        }

        const headerImage =
            await loadImageAsDataUrl(
                "data/header-pkm.png"
            );

        generatePkmPdf(
            result.pkm,
            headerImage
        );
    } catch (error) {
        showToast(
            error.message ||
            "PDF gagal dibuat."
        );
    } finally {
        button.disabled = false;
        button.innerHTML =
            originalContent;
    }
}


function generatePkmPdf(
    pkm,
    headerImage
) {
    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {
        throw new Error(
            "Library PDF belum berhasil dimuat."
        );
    }

    const {
        jsPDF
    } = window.jspdf;

    const documentPdf =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

    const pageWidth =
        documentPdf.internal
            .pageSize.getWidth();

    const pageHeight =
        documentPdf.internal
            .pageSize.getHeight();

    const margin = 14;
    const usableWidth =
        pageWidth -
        margin * 2;

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    documentPdf.addImage(
        headerImage,
        "PNG",
        margin,
        10,
        usableWidth,
        18.7
    );

    let y = 38;

    /*
    |--------------------------------------------------------------------------
    | INFORMASI UTAMA
    |--------------------------------------------------------------------------
    */

    drawPdfField(
        documentPdf,
        "ID PKM",
        `${pkm.id} / ${formatArrayText(pkm.type)}`,
        margin,
        y,
        28,
        72
    );

    drawPdfField(
        documentPdf,
        "Tanggal Mulai",
        formatPdfDate(pkm.startDate),
        117,
        y,
        30,
        48
    );

    y += 6;

    drawPdfField(
        documentPdf,
        "Nama PKM",
        pkm.name,
        margin,
        y,
        28,
        72
    );

    drawPdfField(
        documentPdf,
        "Tanggal Selesai",
        formatPdfDate(pkm.endDate),
        117,
        y,
        30,
        48
    );

    y += 6;

    drawPdfField(
        documentPdf,
        "PKM",
        `${pkm.jenisPkm || "-"} / ${pkm.kegiatan || "-"}`,
        margin,
        y,
        28,
        72
    );

    drawPdfField(
        documentPdf,
        "Kecamatan",
        pkm.kecamatan || "-",
        117,
        y,
        30,
        48
    );

    y += 6;

    drawPdfField(
        documentPdf,
        "Lokasi",
        pkm.location || "-",
        margin,
        y,
        28,
        152
    );

    y += 9;

    /*
    |--------------------------------------------------------------------------
    | BUDGET DAN TARGET
    |--------------------------------------------------------------------------
    */

    documentPdf.setFont(
        "helvetica",
        "bold"
    );

    documentPdf.setFontSize(9);

    documentPdf.text(
        "Budget & Target PKM:",
        margin,
        y
    );

    y += 6;

    const budgetStartY = y;

    drawPdfField(
        documentPdf,
        "Dana Leasing",
        rupiahPdf(
            pkm.danaLeasing
        ),
        margin,
        y,
        34,
        45
    );

    drawPdfField(
        documentPdf,
        "Tgt Database",
        String(
            pkm.targetDb || 0
        ),
        126,
        y,
        31,
        25
    );

    y += 6;

    drawPdfField(
        documentPdf,
        "Dana Main Dealer",
        rupiahPdf(
            pkm.danaMd
        ),
        margin,
        y,
        34,
        45
    );

    drawPdfField(
        documentPdf,
        "Tgt Deal",
        String(
            pkm.targetDeal || 0
        ),
        126,
        y,
        31,
        25
    );

    y += 6;

    drawPdfField(
        documentPdf,
        "Dana CSM",
        rupiahPdf(
            pkm.danaCsm
        ),
        margin,
        y,
        34,
        45
    );

    drawPdfField(
        documentPdf,
        "Tgt Unit Entry",
        String(
            pkm.targetUe || 0
        ),
        126,
        y,
        31,
        25
    );

    y += 6;

    drawPdfField(
        documentPdf,
        "Dana Lain Lain",
        rupiahPdf(
            pkm.danaLain
        ),
        margin,
        y,
        34,
        45
    );

    drawPdfField(
        documentPdf,
        "Total Dana Sumber",
        rupiahPdf(
            pkm.totalFund
        ),
        117,
        y,
        40,
        28
    );

    y = Math.max(
        y,
        budgetStartY + 18
    ) + 7;

    /*
    |--------------------------------------------------------------------------
    | DETAIL BUDGET
    |--------------------------------------------------------------------------
    */

    documentPdf.setFont(
        "helvetica",
        "bold"
    );

    documentPdf.text(
        "Detail / Breakdown Budget:",
        margin,
        y
    );

    documentPdf.setFont(
        "helvetica",
        "italic"
    );

    documentPdf.setFontSize(7);

    documentPdf.text(
        "*Kegiatan ATL dan Kebutuhan NOS/Marketing, silakan lampirkan foto/gambar/desain",
        83,
        y
    );

    y += 2;

    const budgetRows =
        Array.isArray(
            pkm.budgetDetails
        ) &&
        pkm.budgetDetails.length
            ? pkm.budgetDetails.map(
                function (item) {
                    return [
                        item.itemType || "-",
                        item.itemName || "-",
                        item.quantity || "",
                        rupiahPdf(
                            item.totalPrice
                        ),
                        item.note || ""
                    ];
                }
            )
            : [
                [
                    "-",
                    "Detail budget tidak tersedia",
                    "",
                    rupiahPdf(
                        pkm.totalFund
                    ),
                    ""
                ]
            ];

    documentPdf.autoTable({
        startY: y + 1,

        margin: {
            left: margin,
            right: margin
        },

        head: [
            [
                "JENIS ITEM",
                "NAMA ITEM",
                "JUMLAH",
                "HARGA",
                "KET"
            ]
        ],

        body:
            budgetRows,

        theme:
            "grid",

        styles: {
            font:
                "helvetica",

            fontSize:
                7.5,

            cellPadding:
                1.4,

            lineColor:
                [0, 0, 0],

            lineWidth:
                0.2,

            textColor:
                [0, 0, 0]
        },

        headStyles: {
            fillColor:
                [255, 255, 255],

            textColor:
                [0, 0, 0],

            fontStyle:
                "normal",

            halign:
                "center"
        },

        columnStyles: {
            0: {
                cellWidth: 32,
                halign: "center"
            },

            1: {
                cellWidth: 58,
                halign: "center"
            },

            2: {
                cellWidth: 18,
                halign: "center"
            },

            3: {
                cellWidth: 34,
                halign: "center"
            },

            4: {
                cellWidth: 40,
                halign: "center"
            }
        }
    });

    y =
        documentPdf.lastAutoTable
            .finalY + 8;

    /*
    |--------------------------------------------------------------------------
    | KETERANGAN
    |--------------------------------------------------------------------------
    */

    documentPdf.setFont(
        "helvetica",
        "bold"
    );

    documentPdf.setFontSize(9);

    documentPdf.text(
        "Keterangan PKM:",
        margin,
        y
    );

    documentPdf.setFillColor(
        255,
        241,
        0
    );

    documentPdf.rect(
        94,
        y - 4,
        56,
        6,
        "F"
    );

    documentPdf.text(
        "Total Dana Keluar :",
        95,
        y
    );

    documentPdf.text(
        rupiahPdf(
            pkm.totalFund
        ),
        132,
        y,
        {
            align: "right"
        }
    );

    y += 8;

    y =
        drawPdfWrappedField(
            documentPdf,
            "Alasan",
            pkm.alasan || "-",
            margin,
            y
        );

    y += 3;

    y =
        drawPdfWrappedField(
            documentPdf,
            "Konsep",
            pkm.konsep || "-",
            margin,
            y
        );

    y += 3;

    drawPdfField(
        documentPdf,
        "Program",
        `${formatArrayText(pkm.programH1)} / ${formatArrayText(pkm.programH23)}`,
        margin,
        y,
        28,
        70
    );

    drawPdfField(
        documentPdf,
        "Publikasi",
        formatArrayText(
            pkm.publikasi
        ),
        110,
        y,
        22,
        58
    );

    y += 10;

    y =
        drawPdfWrappedField(
            documentPdf,
            "Pelaksana",
            formatArrayText(
                pkm.people
            ),
            margin,
            y
        );

    /*
    |--------------------------------------------------------------------------
    | TANDA TANGAN
    |--------------------------------------------------------------------------
    */

    y += 12;

    if (y > pageHeight - 48) {
        documentPdf.addPage();
        y = 25;
    }

    drawPdfSignatures(
        documentPdf,
        pkm.signatures,
        y,
        pageWidth
    );

    const safeName =
        String(
            pkm.name || "PKM"
        )
            .replace(
                /[\\/:*?"<>|]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    documentPdf.save(
        `${pkm.id} PKM ${safeName}.pdf`
    );
}


function drawPdfField(
    documentPdf,
    label,
    value,
    x,
    y,
    labelWidth,
    valueWidth
) {
    documentPdf.setFontSize(8.5);

    documentPdf.setFont(
        "helvetica",
        "normal"
    );

    documentPdf.text(
        String(label),
        x,
        y
    );

    documentPdf.text(
        ":",
        x + labelWidth - 3,
        y
    );

    const safeValue =
        String(
            value || "-"
        );

    documentPdf.text(
        safeValue,
        x + labelWidth + 3,
        y,
        {
            maxWidth:
                valueWidth
        }
    );
}


function drawPdfWrappedField(
    documentPdf,
    label,
    value,
    x,
    y
) {
    documentPdf.setFontSize(8.5);

    documentPdf.setFont(
        "helvetica",
        "normal"
    );

    documentPdf.text(
        label,
        x,
        y
    );

    documentPdf.text(
        ":",
        x + 26,
        y
    );

    const lines =
        documentPdf.splitTextToSize(
            String(value || "-"),
            145
        );

    documentPdf.text(
        lines,
        x + 31,
        y
    );

    return y +
        Math.max(
            5,
            lines.length * 4
        );
}


function drawPdfSignatures(
    documentPdf,
    signatures,
    startY,
    pageWidth
) {
    const items = [
        signatures?.crm || {
            role: "CRM"
        },

        signatures?.kacab || {
            role: "KEPALA CABANG"
        },

        signatures?.mscm || {
            role: "MSCM"
        },

        signatures?.manager || {
            role: "MANAGER"
        }
    ];

    const margin = 12;

    const columnWidth =
        (
            pageWidth -
            margin * 2
        ) /
        items.length;

    items.forEach(function (
        item,
        index
    ) {
        const centerX =
            margin +
            columnWidth * index +
            columnWidth / 2;

        if (item.dataUrl) {
            try {
                documentPdf.addImage(
                    item.dataUrl,
                    "PNG",
                    centerX - 13,
                    startY,
                    26,
                    14
                );
            } catch (error) {
                // Tetap tampilkan nama dan role.
            }
        }

        documentPdf.setFont(
            "helvetica",
            "normal"
        );

        documentPdf.setFontSize(7.5);

        const name =
            item.name ||
            "-";

        documentPdf.text(
            documentPdf.splitTextToSize(
                name,
                columnWidth - 4
            ),
            centerX,
            startY + 19,
            {
                align: "center"
            }
        );

        documentPdf.setFont(
            "helvetica",
            "bold"
        );

        documentPdf.text(
            item.role || "-",
            centerX,
            startY + 28,
            {
                align: "center"
            }
        );
    });
}


function loadImageAsDataUrl(url) {
    return fetch(url)
        .then(function (response) {
            if (!response.ok) {
                throw new Error(
                    "Header PDF tidak ditemukan."
                );
            }

            return response.blob();
        })
        .then(function (blob) {
            return new Promise(
                function (
                    resolve,
                    reject
                ) {
                    const reader =
                        new FileReader();

                    reader.onload =
                        function () {
                            resolve(
                                reader.result
                            );
                        };

                    reader.onerror =
                        reject;

                    reader.readAsDataURL(
                        blob
                    );
                }
            );
        });
}


function formatArrayText(value) {
    if (
        Array.isArray(value)
    ) {
        return value.length
            ? value.join(", ")
            : "-";
    }

    return String(
        value || "-"
    );
}


function rupiahPdf(value) {
    const amount =
        Number(value) || 0;

    return `Rp${new Intl.NumberFormat(
        "id-ID"
    ).format(amount)}`;
}


function formatPdfDate(value) {
    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    )
        .format(date)
        .replace(/\./g, ":");
}

async function createAndStorePkmPdf(pkmId) {
    if (!pkmId) {
        throw new Error("ID PKM tidak tersedia.");
    }

    const pdfData = await requestBackend(
        "getPkmPdfData",
        {
            pkmId: pkmId
        }
    );

    const headerDataUrl = await loadImageAsDataUrl(
        "data/header-pkm.png"
    );

    const generated = generatePkmPdf(
        pdfData,
        headerDataUrl
    );

    const pdfDataUrl = generated.doc.output("datauristring");

    const pdfBase64 = pdfDataUrl.split(",")[1];

    const saveResult = await requestBackend(
        "savePkmPdf",
        {
            pkmId: pkmId,
            pdfBase64: pdfBase64
        }
    );

    return saveResult;
}


async function downloadStoredPkmPdf(
    pkmId,
    button = null
) {
    const originalContent = button
        ? button.innerHTML
        : "";

    try {
        if (button) {
            button.disabled = true;

            button.innerHTML = `
                <span class="flex items-center gap-2">
                    <span class="ui-spinner"></span>
                    Mengambil PDF...
                </span>
            `;
        }

        const result = await requestBackend(
            "getPkmPdfFile",
            {
                pkmId: pkmId
            }
        );

        const binaryString = atob(
            result.pdfBase64
        );

        const bytes = new Uint8Array(
            binaryString.length
        );

        for (
            let index = 0;
            index < binaryString.length;
            index += 1
        ) {
            bytes[index] =
                binaryString.charCodeAt(index);
        }

        const blob = new Blob(
            [bytes],
            {
                type: "application/pdf"
            }
        );

        const downloadUrl =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = downloadUrl;
        anchor.download =
            result.fileName ||
            pkmId + ".pdf";

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        showToast(
            getApiErrorMessage(error),
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalContent;
        }
    }
}


window.createAndStorePkmPdf =
    createAndStorePkmPdf;

window.downloadStoredPkmPdf =
    downloadStoredPkmPdf;


window.downloadPkmPdf =
    downloadPkmPdf;