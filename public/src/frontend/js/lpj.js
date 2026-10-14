"use strict";

const LPJ_PAGE_SIZE = 7;

let lpjCandidates = [];
let lpjCurrentPage = 1;
let lpjTotalPages = 1;
let activeLpjItem = null;
let lpjBudgetItems = [];
let lpjReviewConfirmed = false;

function initializeLpjFrontend() {
    window.renderBranchFilter(
        "lpj"
    );

    /*
    |--------------------------------------------------------------
    | MOBILE FILTER TOGGLE
    |--------------------------------------------------------------
    */

    const lpjFilterToggle =
        document.getElementById(
            "lpjFilterToggle"
        );

    const lpjFilterContent =
        document.getElementById(
            "lpjFilterContent"
        );

    const lpjFilterChevron =
        document.getElementById(
            "lpjFilterChevron"
        );

    if (
        lpjFilterToggle &&
        lpjFilterContent
    ) {

        lpjFilterToggle.addEventListener(
            "click",
            function () {

                const isHidden =
                    lpjFilterContent
                        .classList
                        .contains("hidden");

                lpjFilterContent
                    .classList
                    .toggle(
                        "hidden",
                        !isHidden
                    );

                lpjFilterToggle
                    .setAttribute(
                        "aria-expanded",
                        String(isHidden)
                    );

                if (lpjFilterChevron) {

                    lpjFilterChevron
                        .classList
                        .toggle(
                            "rotate-180",
                            isHidden
                        );

                }

            }
        );

    }

    document
        .querySelectorAll('[data-page="lpjPage"]')
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    loadLpjCandidates(1);
                }
            );
        });

    document
        .getElementById("applyLpjFilter")
        .addEventListener(
            "click",
            function () {
                loadLpjCandidates(1);
            }
        );

    document
        .getElementById("resetLpjFilter")
        .addEventListener(
            "click",
            resetLpjFilter
        );

    document
        .getElementById("previousLpjPage")
        .addEventListener(
            "click",
            function () {
                if (lpjCurrentPage > 1) {
                    loadLpjCandidates(
                        lpjCurrentPage - 1
                    );
                }
            }
        );

    document
        .getElementById("nextLpjPage")
        .addEventListener(
            "click",
            function () {
                if (
                    lpjCurrentPage <
                    lpjTotalPages
                ) {
                    loadLpjCandidates(
                        lpjCurrentPage + 1
                    );
                }
            }
        );

    document
        .getElementById("lpjTableBody")
        .addEventListener(
            "click",
            function (event) {
                const button =
                    event.target.closest(
                        "[data-create-lpj]"
                    );

                if (!button) {
                    return;
                }

                openLpjModal(
                    button.dataset.createLpj
                );
            }
        );

    document
        .getElementById("lpjMobileList")
        .addEventListener(
            "click",
            function (event) {
                const button =
                    event.target.closest(
                        "[data-create-lpj]"
                    );

                if (!button) {
                    return;
                }

                openLpjModal(
                    button.dataset.createLpj
                );
            }
        );

    document
        .getElementById("closeLpjModal")
        .addEventListener(
            "click",
            closeLpjModal
        );

    document
        .getElementById("cancelLpjButton")
        .addEventListener(
            "click",
            closeLpjModal
        );

    document
        .getElementById("lpjModalBackdrop")
        .addEventListener(
            "click",
            closeLpjModal
        );

    document
        .getElementById("finalizeLpjButton")
        .addEventListener(
            "click",
            function () {
                finalizeLpj();
            }
        );

    document
        .getElementById(
            "lpjBackToEditButton"
        )
        .addEventListener(
            "click",
            function () {

                lpjReviewConfirmed = false;

                const panel =
                    document.getElementById(
                        "lpjReviewPanel"
                    );

                if (panel) {
                    panel.classList.add("hidden");
                }

                const button =
                    document.getElementById(
                        "finalizeLpjButton"
                    );

                if (button) {
                    button.textContent =
                        "Review & Finalisasi LPJ";
                }
            }
        );

    document
        .getElementById(
            "lpjConfirmFinalizeButton"
        )
        .addEventListener(
            "click",
            function () {

                lpjReviewConfirmed = true;

                const panel =
                    document.getElementById(
                        "lpjReviewPanel"
                    );

                if (panel) {
                    panel.classList.add("hidden");
                }

                const button =
                    document.getElementById(
                        "finalizeLpjButton"
                    );

                if (button) {
                    button.textContent =
                        "Finalisasi LPJ";
                }

                finalizeLpj();
            }
        );

    const evaluationInput =
        document.getElementById(
            "lpjEvaluation"
        );

    if (evaluationInput) {
        evaluationInput.addEventListener(
            "input",
            function () {

                const count =
                    evaluationInput.value.length;

                const countElement =
                    document.getElementById(
                        "lpjEvaluationCount"
                    );

                const statusElement =
                    document.getElementById(
                        "lpjEvaluationStatus"
                    );

                if (countElement) {
                    countElement.textContent =
                        `${count} karakter`;
                }

                if (statusElement) {
                    statusElement.textContent =
                        count > 0
                            ? "Siap difinalisasi"
                            : "Belum diisi";

                    statusElement.className =
                        count > 0
                            ? "text-[11px] font-bold text-emerald-600"
                            : "text-[11px] font-bold text-slate-400";
                }
            }
        );
    }

    [
        ["lpjTentPhoto", "lpjTentPhotoPreview"],
        ["lpjActivityPhoto1", "lpjActivityPhoto1Preview"],
        ["lpjActivityPhoto2", "lpjActivityPhoto2Preview"]
    ].forEach(function (config) {

        const input =
            document.getElementById(config[0]);

        if (!input) {
            return;
        }

        input.addEventListener(
            "change",
            function () {
                previewLpjImage(
                    config[0],
                    config[1]
                );
            }
        );

    });

    document.addEventListener(
        "input",
        function (event) {
            if (
                event.target.matches(
                    ".lpj-actual-price"
                )
            ) {
                formatLpjCurrencyInput(
                    event.target
                );
            }
        }
    );

    [
        ["lpjActualDb", "lpjTargetDb", "lpjProgressDbText", "lpjProgressDbBar"],
        ["lpjActualDeal", "lpjTargetDeal", "lpjProgressDealText", "lpjProgressDealBar"],
        ["lpjActualUe", "lpjTargetUe", "lpjProgressUeText", "lpjProgressUeBar"]
    ].forEach(function (config) {

        const input =
            document.getElementById(config[0]);

        if (!input) {
            return;
        }

        input.addEventListener(
            "input",
            function () {
                updateLpjAchievement(
                    config[0],
                    config[1],
                    config[2],
                    config[3]
                );
            }
        );

    });
}






async function loadLpjCandidates(
    page = 1
) {
    setLpjLoading(true);

    try {
        const result =
            await requestBackend(
                "getLpjCandidates",
                {
                    search:
                        document
                            .getElementById(
                                "lpjSearch"
                            )
                            .value
                            .trim(),

                    startDate:
                        document
                            .getElementById(
                                "lpjStartDate"
                            )
                            .value,

                    endDate:
                        document
                            .getElementById(
                                "lpjEndDate"
                            )
                            .value,

                    jenisPkm:
                        document
                            .getElementById(
                                "lpjJenisPkm"
                            )
                            .value,

                    typePkm:
                        document
                            .getElementById(
                                "lpjTypePkm"
                            )
                            .value,

                    branches:
                        getSelectedBranches(
                            "lpj"
                        ),

                    page: page,
                    pageSize:
                        LPJ_PAGE_SIZE
                }
            );

        lpjCandidates =
            Array.isArray(result.data)
                ? result.data
                : [];

        lpjCurrentPage =
            Number(result.page) || 1;

        lpjTotalPages =
            Number(
                result.totalPages
            ) || 1;

        document.getElementById(
            "lpjResultCount"
        ).textContent =
            `${Number(result.total) || 0} data`;

        renderLpjTable();
        renderLpjPagination();
    } catch (error) {
        lpjCandidates = [];

        renderLpjTable();

        showToast(
            error.message ||
            "Data LPJ gagal dimuat."
        );
    } finally {
        setLpjLoading(false);
    }
}

function renderLpjTable() {
    const tbody =
        document.getElementById(
            "lpjTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyLpj"
        );

    emptyState.classList.toggle(
        "hidden",
        lpjCandidates.length > 0
    );

    tbody.innerHTML =
        lpjCandidates
            .map(function (item) {
                return `
                    <tr>
                        <td class="font-black text-red-600">
                            ${escapeHtml(item.id)}
                        </td>

                        <td>
                            <p class="font-black text-slate-900">
                                ${escapeHtml(item.name)}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                ${escapeHtml(item.jenisPkm || "")}
                            </p>
                        </td>

                        <td class="font-bold">
                            ${escapeHtml(item.branch)}
                        </td>

                        <td>
                            ${escapeHtml(
                                Array.isArray(item.type)
                                    ? item.type.join(", ")
                                    : item.type || ""
                            )}
                        </td>

                        <td>
                            ${formatLpjDate(item.startDate)}
                            <br>
                            <span class="text-xs text-slate-400">
                                sampai ${formatLpjDate(item.endDate)}
                            </span>
                        </td>

                        <td>
                            ${escapeHtml(item.location || "-")}
                        </td>

                        <td>
                            <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                ${Number(item.daysOverdue) || 0} hari
                            </span>
                        </td>

                        <td>
                            <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                                Belum LPJ
                            </span>
                        </td>

                        <td class="text-right">
                            <button
                                type="button"
                                data-create-lpj="${escapeHtml(item.id)}"
                                class="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
                            >
                                Buat LPJ
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

    const mobileList =
        document.getElementById("lpjMobileList");

    if (mobileList) {
        mobileList.innerHTML =
            lpjCandidates
                .map(function (item) {
                    const overdue =
                        Number(item.daysOverdue) || 0;

                    let overdueClass =
                        "bg-slate-100 text-slate-600";

                    if (overdue >= 4 && overdue <= 7) {
                        overdueClass =
                            "bg-amber-50 text-amber-700";
                    }

                    if (overdue > 7) {
                        overdueClass =
                            "bg-red-50 text-red-700";
                    }

                    return `
                        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="text-xs font-black uppercase tracking-wider text-red-600">
                                        ${escapeHtml(item.id)}
                                    </p>

                                    <p class="mt-1 font-black text-slate-900">
                                        ${escapeHtml(item.name)}
                                    </p>

                                    <p class="mt-1 text-xs text-slate-500">
                                        ${escapeHtml(item.jenisPkm || "-")}
                                    </p>
                                </div>

                                <span class="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600">
                                    Belum LPJ
                                </span>
                            </div>

                            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">

                                <div>
                                    <p class="text-[11px] font-bold uppercase text-slate-400">
                                        Cabang
                                    </p>
                                    <p class="mt-1 font-bold text-slate-800">
                                        ${escapeHtml(item.branch || "-")}
                                    </p>
                                </div>

                                <div>
                                    <p class="text-[11px] font-bold uppercase text-slate-400">
                                        Type
                                    </p>
                                    <p class="mt-1 font-bold text-slate-800">
                                        ${escapeHtml(
                                            Array.isArray(item.type)
                                                ? item.type.join(", ")
                                                : item.type || "-"
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p class="text-[11px] font-bold uppercase text-slate-400">
                                        Pelaksanaan
                                    </p>
                                    <p class="mt-1 font-bold text-slate-800">
                                        ${formatLpjDate(item.startDate)}
                                    </p>
                                </div>

                                <div>
                                    <p class="text-[11px] font-bold uppercase text-slate-400">
                                        Terlambat
                                    </p>

                                    <span class="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${overdueClass}">
                                        ${overdue} hari
                                    </span>
                                </div>

                            </div>

                            <div class="mt-3">
                                <p class="text-[11px] font-bold uppercase text-slate-400">
                                    Lokasi
                                </p>
                                <p class="mt-1 text-sm font-semibold text-slate-700">
                                    ${escapeHtml(item.location || "-")}
                                </p>
                            </div>

                            <button
                                type="button"
                                data-create-lpj="${escapeHtml(item.id)}"
                                class="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 active:scale-[0.99]"
                            >
                                Buat LPJ
                            </button>

                        </div>
                    `;
                })
                .join("");
    }        
}

function updateLpjAchievement(
    actualId,
    targetId,
    textId,
    barId
) {
    const actualElement =
        document.getElementById(actualId);

    const targetElement =
        document.getElementById(targetId);

    const textElement =
        document.getElementById(textId);

    const barElement =
        document.getElementById(barId);

    if (
        !actualElement ||
        !targetElement ||
        !textElement ||
        !barElement
    ) {
        return;
    }

    const actual =
        Number(actualElement.value) || 0;

    const target =
        Number(targetElement.textContent) || 0;

    if (target <= 0) {
        textElement.textContent = "0%";
        barElement.style.width = "0%";
        return;
    }

    const percentage =
        (actual / target) * 100;

    textElement.textContent =
        `${Math.round(percentage)}%`;

    barElement.style.width =
        `${Math.min(percentage, 100)}%`;
}

function renderLpjPagination() {
    document.getElementById(
        "currentLpjPage"
    ).textContent =
        lpjCurrentPage;

    document.getElementById(
        "lpjPaginationInfo"
    ).textContent =
        `Halaman ${lpjCurrentPage} dari ${lpjTotalPages}`;

    document.getElementById(
        "previousLpjPage"
    ).disabled =
        lpjCurrentPage <= 1;

    document.getElementById(
        "nextLpjPage"
    ).disabled =
        lpjCurrentPage >=
        lpjTotalPages;
}

let lpjLoadingProgress = 0;
let lpjLoadingInterval = null;
let lpjLoadingTimeout = null;


function updateLpjLoading(
    progress,
    message = ""
) {
    lpjLoadingProgress =
        Math.max(
            0,
            Math.min(
                100,
                progress
            )
        );

    const bar =
        document.getElementById(
            "lpjLoadingBar"
        );

    const percentage =
        document.getElementById(
            "lpjLoadingPercentage"
        );

    const messageElement =
        document.getElementById(
            "lpjLoadingMessage"
        );

    if (bar) {
        bar.style.width =
            `${lpjLoadingProgress}%`;
    }

    if (percentage) {
        percentage.textContent =
            `${Math.round(
                lpjLoadingProgress
            )}%`;
    }

    if (
        message &&
        messageElement
    ) {
        messageElement.textContent =
            message;
    }
}


function setLpjLoading(loading) {
    const panel =
        document.getElementById(
            "lpjTableLoading"
        );

    const searchButton =
        document.getElementById(
            "applyLpjFilter"
        );

    window.clearInterval(
        lpjLoadingInterval
    );

    window.clearTimeout(
        lpjLoadingTimeout
    );

    if (searchButton) {
        searchButton.disabled =
            loading;

        searchButton.classList.toggle(
            "cursor-wait",
            loading
        );

        searchButton.classList.toggle(
            "opacity-80",
            loading
        );
    }

    if (!panel) {
        return;
    }

    if (loading) {
        panel.classList.remove(
            "hidden"
        );

        panel.classList.add(
            "flex"
        );

        updateLpjLoading(
            8,
            "Menghubungkan ke Google Spreadsheet..."
        );

        lpjLoadingInterval =
            window.setInterval(
                function () {
                    if (
                        lpjLoadingProgress >=
                        92
                    ) {
                        return;
                    }

                    const addition =
                        Math.floor(
                            Math.random() *
                            6
                        ) + 2;

                    const nextProgress =
                        Math.min(
                            92,
                            lpjLoadingProgress +
                            addition
                        );

                    let message =
                        "Membaca data PKM...";

                    if (
                        nextProgress >= 45 &&
                        nextProgress < 75
                    ) {
                        message =
                            "Memeriksa PKM yang belum memiliki LPJ...";
                    }

                    if (
                        nextProgress >= 75
                    ) {
                        message =
                            "Menyiapkan tabel LPJ...";
                    }

                    updateLpjLoading(
                        nextProgress,
                        message
                    );
                },
                220
            );

        return;
    }

    updateLpjLoading(
        100,
        "Data LPJ berhasil dimuat."
    );

    lpjLoadingTimeout =
        window.setTimeout(
            function () {
                panel.classList.add(
                    "hidden"
                );

                panel.classList.remove(
                    "flex"
                );

                updateLpjLoading(
                    0,
                    ""
                );
            },
            350
        );
}

function resetLpjFilter() {
    document.getElementById(
        "lpjSearch"
    ).value = "";

    document.getElementById(
        "lpjStartDate"
    ).value = "";

    document.getElementById(
        "lpjEndDate"
    ).value = "";

    document.getElementById(
        "lpjJenisPkm"
    ).value = "ALL";

    document.getElementById(
        "lpjTypePkm"
    ).value = "ALL";

    window.renderBranchFilter(
        "lpj"
    );

    loadLpjCandidates(1);
}

function openLpjModal(pkmId) {
    activeLpjItem =
        lpjCandidates.find(
            function (item) {
                return item.id === pkmId;
            }
        );

    if (!activeLpjItem) {
        showToast(
            "Data PKM tidak ditemukan."
        );

        return;
    }


    lpjBudgetItems =
        Array.isArray(
            activeLpjItem.budgetDetails
        )
            ? activeLpjItem
                .budgetDetails
                .map(function (item) {
                    return {
                        ...item,

                        // Samakan nama properti backend
                        // dengan yang dibaca frontend LPJ
                        itemName:
                            item.itemName ??
                            item.namaItem ??
                            item.nama_item ??
                            item.name ??
                            "",

                        itemType:
                            item.itemType ??
                            item.jenisItem ??
                            item.jenis_item ??
                            item.type ??
                            "-",

                        quantity:
                            Number(
                                item.quantity ??
                                item.jumlah ??
                                0
                            ) || 0,

                        totalPrice:
                            Number(
                                item.totalPrice ??
                                item.hargaTotal ??
                                item.harga_total ??
                                0
                            ) || 0,

                        actualPrice: 0
                    };
                })
            : [];


    lpjReviewConfirmed = false;

    const reviewPanel =
        document.getElementById(
            "lpjReviewPanel"
        );

    if (reviewPanel) {
        reviewPanel.classList.add("hidden");
    }

    const finalizeButton =
        document.getElementById(
            "finalizeLpjButton"
        );

    if (finalizeButton) {
        finalizeButton.textContent =
            "Ajukan Finalisasi LPJ";
    }

    document.getElementById(
        "lpjModalPkmId"
    ).textContent =
        activeLpjItem.id;

    document.getElementById(
        "lpjPreviewName"
    ).textContent =
        activeLpjItem.name;

    document.getElementById(
        "lpjPreviewBranch"
    ).textContent =
        activeLpjItem.branch || "-";

    document.getElementById(
        "lpjPreviewDate"
    ).textContent =
        `${formatLpjDate(activeLpjItem.startDate)} – ${formatLpjDate(activeLpjItem.endDate)}`;

    document.getElementById(
        "lpjPreviewLocation"
    ).textContent =
        activeLpjItem.location || "-";

    document.getElementById(
        "lpjTargetDb"
    ).textContent =
        activeLpjItem.targetDb || 0;

    document.getElementById(
        "lpjTargetDeal"
    ).textContent =
        activeLpjItem.targetDeal || 0;

    document.getElementById(
        "lpjTargetUe"
    ).textContent =
        activeLpjItem.targetUe || 0;

    document.getElementById(
        "lpjActualDb"
    ).value = 0;

    document.getElementById(
        "lpjActualDeal"
    ).value = 0;

    document.getElementById(
        "lpjActualUe"
    ).value = 0;

    updateLpjAchievement(
        "lpjActualDb",
        "lpjTargetDb",
        "lpjProgressDbText",
        "lpjProgressDbBar"
    );

    updateLpjAchievement(
        "lpjActualDeal",
        "lpjTargetDeal",
        "lpjProgressDealText",
        "lpjProgressDealBar"
    );

    updateLpjAchievement(
        "lpjActualUe",
        "lpjTargetUe",
        "lpjProgressUeText",
        "lpjProgressUeBar"
    );

    document.getElementById(
        "lpjEvaluation"
    ).value = "";

    const evaluationCount =
        document.getElementById(
            "lpjEvaluationCount"
        );

    if (evaluationCount) {
        evaluationCount.textContent =
            "0 karakter";
    }

    const evaluationStatus =
        document.getElementById(
            "lpjEvaluationStatus"
        );

    if (evaluationStatus) {
        evaluationStatus.textContent =
            "Belum diisi";

        evaluationStatus.className =
            "text-[11px] font-bold text-slate-400";
    }

    document.getElementById(
        "lpjTentPhoto"
    ).value = "";

    document.getElementById(
        "lpjActivityPhoto1"
    ).value = "";

    document.getElementById(
        "lpjActivityPhoto2"
    ).value = "";

    [
        "lpjTentPhotoPreview",
        "lpjActivityPhoto1Preview",
        "lpjActivityPhoto2Preview"
    ].forEach(function (previewId) {

        const preview =
            document.getElementById(
                previewId
            );

        if (!preview) {
            return;
        }

        const image =
            preview.querySelector("img");

        if (image) {
            image.src = "";
        }

        preview.classList.add("hidden");

    });

    renderLpjBudgetTable();

    const modal =
        document.getElementById(
            "lpjModal"
        );

    modal.classList.remove("hidden");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );
}

function renderLpjBudgetTable() {
    const tbody =
        document.getElementById(
            "lpjBudgetTableBody"
        );

    const empty =
        document.getElementById(
            "emptyLpjBudget"
        );

    empty.classList.toggle(
        "hidden",
        lpjBudgetItems.length > 0
    );

    tbody.innerHTML =
        lpjBudgetItems
            .map(function (item, index) {
                return `
                    <tr data-lpj-budget-row="${index}">
                        <td class="font-black">
                            ${escapeHtml(item.itemName || item.name || "")}
                        </td>

                        <td>
                            ${escapeHtml(item.itemType || item.type || "-")}
                        </td>

                        <td>
                            ${Number(item.quantity) || 0}
                        </td>

                        <td class="font-black">
                            ${rupiah(Number(item.totalPrice) || 0)}
                        </td>

                        <td>
                            <input
                                class="form-input lpj-actual-price"
                                type="text"
                                inputmode="numeric"
                                placeholder="Rp 0"
                            >
                        </td>

                        <td>
                            <input
                                class="form-input lpj-design-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                            >
                        </td>

                        <td>
                            <input
                                class="form-input lpj-item-photo"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                            >
                        </td>

                        <td>
                            <textarea
                                class="form-input min-h-20 lpj-budget-note"
                                placeholder="Keterangan..."
                            ></textarea>
                            <p class="lpj-budget-note-error hidden mt-1 text-xs font-bold text-red-600">
                                Keterangan wajib diisi karena harga realisasi melebihi pengajuan.
                            </p>
                        </td>
                    </tr>
                `;
            })
            .join("");

    const mobileList =
        document.getElementById(
            "lpjBudgetMobileList"
        );

    if (mobileList) {
        mobileList.innerHTML =
            lpjBudgetItems
                .map(function (item, index) {
                    return `
                        <div
                            class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            data-lpj-budget-mobile-row="${index}"
                        >

                            <div class="flex items-start justify-between gap-3">

                                <div class="min-w-0">
                                    <p class="font-black text-slate-900">
                                        ${escapeHtml(
                                            item.itemName ||
                                            item.name ||
                                            "-"
                                        )}
                                    </p>

                                    <p class="mt-1 text-xs font-semibold text-slate-500">
                                        ${escapeHtml(
                                            item.itemType ||
                                            item.type ||
                                            "-"
                                        )}
                                        · Qty ${
                                            Number(item.quantity) || 0
                                        }
                                    </p>
                                </div>

                                <div class="text-right">
                                    <p class="text-[10px] font-bold uppercase text-slate-400">
                                        Pengajuan
                                    </p>

                                    <p class="mt-1 text-sm font-black text-slate-800">
                                        ${rupiah(
                                            Number(item.totalPrice) || 0
                                        )}
                                    </p>
                                </div>

                            </div>

                            <div class="mt-4">

                                <label class="text-xs font-bold text-slate-500">
                                    Harga Realisasi
                                </label>

                                <input
                                    class="form-input lpj-actual-price mt-1"
                                    type="text"
                                    inputmode="numeric"
                                    placeholder="Rp 0"
                                >

                            </div>

                            <div class="mt-4">

                                <label class="text-xs font-bold text-slate-500">
                                    Gambar Desain
                                </label>

                                <input
                                    class="form-input lpj-design-image mt-1"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                >

                            </div>

                            <div class="mt-4">

                                <label class="text-xs font-bold text-slate-500">
                                    Foto
                                </label>

                                <input
                                    class="form-input lpj-item-photo mt-1"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                >

                            </div>

                            <div class="mt-4">

                                <label class="text-xs font-bold text-slate-500">
                                    Keterangan
                                </label>

                                <textarea
                                    class="form-input lpj-budget-note mt-1 min-h-20"
                                    placeholder="Keterangan..."
                                ></textarea>
                                <p class="lpj-budget-note-error hidden mt-1 text-xs font-bold text-red-600">
                                    Keterangan wajib diisi karena harga realisasi melebihi pengajuan.
                                </p>
                            </div>

                        </div>
                    `;
                })
                .join("");
    }
}

function formatLpjCurrencyInput(input) {
    if (!input) {
        return;
    }

    input.value =
        input.value
            .replace(/\D/g, "")
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


function previewLpjImage(inputId, previewId) {
    const input =
        document.getElementById(inputId);

    const preview =
        document.getElementById(previewId);

    if (!input || !preview) {
        return;
    }

    const image =
        preview.querySelector("img");

    if (!image) {
        return;
    }

    const file = input.files[0];

    if (!file) {
        image.src = "";
        preview.classList.add("hidden");
        return;
    }

    image.src =
        URL.createObjectURL(file);

    preview.classList.remove("hidden");
}

function closeLpjModal() {
    const modal =
        document.getElementById(
            "lpjModal"
        );

    modal.classList.add("hidden");
    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    activeLpjItem = null;
    lpjBudgetItems = [];
}

function openLpjReview() {
    const panel =
        document.getElementById(
            "lpjReviewPanel"
        );

    const content =
        document.getElementById(
            "lpjReviewContent"
        );

    if (!panel || !content) {
        return;
    }

    const actualDb =
        Number(
            document.getElementById(
                "lpjActualDb"
            ).value
        ) || 0;

    const actualDeal =
        Number(
            document.getElementById(
                "lpjActualDeal"
            ).value
        ) || 0;

    const actualUe =
        Number(
            document.getElementById(
                "lpjActualUe"
            ).value
        ) || 0;

    const evaluation =
        document.getElementById(
            "lpjEvaluation"
        ).value.trim();

    const budgetRows =
        window.innerWidth < 768
            ? [
                  ...document.querySelectorAll(
                      "#lpjBudgetMobileList > div"
                  )
              ]
            : [
                  ...document.querySelectorAll(
                      "[data-lpj-budget-row]"
                  )
              ];

    const filledBudget =
        budgetRows.filter(function (row) {
            const input =
                row.querySelector(
                    ".lpj-actual-price"
                );

            return (
                input &&
                input.value.replace(/\D/g, "")
                    .length > 0
            );
        }).length;

    const photos = [
        "lpjTentPhoto",
        "lpjActivityPhoto1",
        "lpjActivityPhoto2"
    ].filter(function (id) {
        const input =
            document.getElementById(id);

        return (
            input &&
            input.files &&
            input.files.length > 0
        );
    }).length;

    content.innerHTML = `
        <div class="rounded-xl border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase text-slate-400">
                Database
            </p>
            <p class="mt-1 font-black text-slate-900">
                ${actualDb}
            </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase text-slate-400">
                Deal
            </p>
            <p class="mt-1 font-black text-slate-900">
                ${actualDeal}
            </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase text-slate-400">
                Unit Entry
            </p>
            <p class="mt-1 font-black text-slate-900">
                ${actualUe}
            </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase text-slate-400">
                Budget
            </p>
            <p class="mt-1 font-black text-slate-900">
                ${filledBudget} / ${budgetRows.length} item terisi
            </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase text-slate-400">
                Dokumentasi
            </p>
            <p class="mt-1 font-black text-slate-900">
                ${photos} / 3 foto dipilih
            </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase text-slate-400">
                Evaluasi
            </p>
            <p class="mt-1 font-black text-slate-900">
                ${
                    evaluation
                        ? "Sudah diisi"
                        : "Belum diisi"
                }
            </p>
        </div>
    `;

    panel.classList.remove("hidden");

    panel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

async function finalizeLpj() {
    if (!activeLpjItem) {
        return;
    }

    const evaluation =
        document
            .getElementById(
                "lpjEvaluation"
            )
            .value
            .trim();

    if (!evaluation) {
        showToast(
            "Evaluasi dan tindak lanjut wajib diisi."
        );

        return;
    }

    const confirmed = window.confirm(
        "Ajukan Finalisasi LPJ?\n\n" +
        "Pastikan data realisasi, budget, dokumentasi, dan evaluasi sudah benar."
    );

    if (!confirmed) {
        return;
    }

    const button =
        document.getElementById(
            "finalizeLpjButton"
        );

    try {
        button.disabled = true;

        button.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                <span class="ui-spinner"></span>
                <span>Finalisasi LPJ...</span>
            </span>
        `;

        const budgetRows =
            window.innerWidth < 768
                ? [
                    ...document.querySelectorAll(
                        "#lpjBudgetMobileList > div"
                    )
                ]
                : [
                    ...document.querySelectorAll(
                        "[data-lpj-budget-row]"
                    )
                ];


        const budgetValidationErrors = [];

        budgetRows.forEach(function (row, index) {
            const item = lpjBudgetItems[index];

            const actualPrice =
                Number(
                    row
                        .querySelector(".lpj-actual-price")
                        .value.replace(/\D/g, "")
                ) || 0;

            const totalPrice =
                Number(item.totalPrice) || 0;

            const noteInput =
                row.querySelector(".lpj-budget-note");

            const errorMessage =
                row.querySelector(".lpj-budget-note-error");

            const note = noteInput.value.trim();

            const isInvalid =
                actualPrice > totalPrice && !note;

            noteInput.classList.toggle(
                "border-red-500",
                isInvalid
            );

            noteInput.classList.toggle(
                "ring-2",
                isInvalid
            );

            noteInput.classList.toggle(
                "ring-red-100",
                isInvalid
            );

            if (errorMessage) {
                errorMessage.classList.toggle(
                    "hidden",
                    !isInvalid
                );
            }

            if (isInvalid) {
                budgetValidationErrors.push({
                    input: noteInput,
                    itemName:
                        item.itemName ||
                        item.name ||
                        "Item"
                });
            }
        });

        if (budgetValidationErrors.length > 0) {
            const firstError = budgetValidationErrors[0];

            showToast(
                "Keterangan wajib diisi karena harga realisasi melebihi pengajuan."
            );

            firstError.input.focus();

            firstError.input.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return;
        }

        const pkmId = String(activeLpjItem.id);
        const lpjId = crypto.randomUUID();

        const budgetDetails = [];

        for (let index = 0; index < budgetRows.length; index++) {
            const row = budgetRows[index];
            const item = lpjBudgetItems[index];
            const itemId = String(item.id || "").trim();

            const designFile =
                row.querySelector(".lpj-design-image").files[0];

            const photoFile =
                row.querySelector(".lpj-item-photo").files[0];

            const designImagePath = itemId
                ? await uploadLpjAsset({
                    pkmId,
                    lpjId,
                    itemId,
                    file: designFile,
                    type: "DESIGN"
                })
                : "";

            const photoPath = itemId
                ? await uploadLpjAsset({
                    pkmId,
                    lpjId,
                    itemId,
                    file: photoFile,
                    type: "PHOTO"
                })
                : "";

            budgetDetails.push({
                ...item,

                actualPrice:
                    Number(
                        row.querySelector(".lpj-actual-price")
                            .value.replace(/\D/g, "")
                    ) || 0,

                designImagePath,
                photoPath,

                note:
                    row.querySelector(".lpj-budget-note")
                        .value.trim()
            });
        }

        const tentPhotoPath = await uploadLpjAsset({
            pkmId,
            lpjId,
            file: document.getElementById("lpjTentPhoto").files[0],
            type: "TENT"
        });

        const activityPhoto1Path = await uploadLpjAsset({
            pkmId,
            lpjId,
            file: document.getElementById("lpjActivityPhoto1").files[0],
            type: "KEGIATAN_1"
        });

        const activityPhoto2Path = await uploadLpjAsset({
            pkmId,
            lpjId,
            file: document.getElementById("lpjActivityPhoto2").files[0],
            type: "KEGIATAN_2"
        });

        const payload = {
            pkmId,
            lpjId,

            actualDb:
                Number(document.getElementById("lpjActualDb").value) || 0,

            actualDeal:
                Number(document.getElementById("lpjActualDeal").value) || 0,

            actualUe:
                Number(document.getElementById("lpjActualUe").value) || 0,

            evaluation,

            tentPhotoPath,
            activityPhoto1Path,
            activityPhoto2Path,

            budgetDetails
        };

        const result =
            await requestBackend(
                "createLpj",
                payload
            );

        closeLpjModal();

        await loadLpjCandidates(
            lpjCurrentPage
        );

        showToast(
            result.message ||
            "LPJ berhasil difinalisasi."
        );
    } catch (error) {
        showToast(
            error.message ||
            "Finalisasi LPJ gagal."
        );
    } finally {
        button.disabled = false;
        button.textContent =
            "Finalisasi LPJ";
    }
}

async function uploadLpjAsset({
    pkmId,
    lpjId,
    itemId = "",
    file,
    type
}) {
    if (!file) {
        return "";
    }

    const imageData = await compressLpjImage(file);

    const result = await requestBackend(
        "uploadLpjAsset",
        {
            pkmId,
            lpjId,
            itemId,
            imageData,
            type
        }
    );

    if (!result || !result.success || !result.path) {
        throw new Error(
            result?.message || `Upload gambar ${type} gagal.`
        );
    }

    return result.path;
}

async function compressLpjImage(file) {
    if (!file) {
        return "";
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("File yang dipilih bukan gambar.");
    }

    const image = await new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onload = function () {
            const img = new Image();

            img.onload = function () {
                resolve(img);
            };

            img.onerror = function () {
                reject(new Error("Gambar gagal dibaca."));
            };

            img.src = reader.result;
        };

        reader.onerror = function () {
            reject(new Error("Gambar gagal dibaca."));
        };

        reader.readAsDataURL(file);
    });

    const maxDimension = 1600;
    const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.8;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    while (dataUrl.length > 2_000_000 && quality > 0.35) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > 2_000_000) {
        throw new Error(
            "Ukuran gambar masih terlalu besar. Pilih gambar yang lebih kecil."
        );
    }

    return dataUrl;
}

function lpjFileToDataUrl(file) {
    if (!file) {
        return Promise.resolve("");
    }

    return new Promise(
        function (resolve, reject) {
            const reader =
                new FileReader();

            reader.onload =
                function () {
                    resolve(
                        reader.result
                    );
                };

            reader.onerror =
                function () {
                    reject(
                        new Error(
                            "Gambar gagal dibaca."
                        )
                    );
                };

            reader.readAsDataURL(file);
        }
    );
}

function formatLpjDate(value) {
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
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}

function startLpjFrontend() {
    if (
        typeof window.renderBranchFilter !==
            "function" ||
        typeof window.getSelectedBranches !==
            "function"
    ) {
        console.error(
            "Function filter cabang dari app.js belum tersedia."
        );

        return;
    }

    initializeLpjFrontend();
}

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        startLpjFrontend
    );
} else {
    startLpjFrontend();
}