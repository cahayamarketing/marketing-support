"use strict";

/*
|--------------------------------------------------------------------------
| KONFIGURASI KPI CRM
|--------------------------------------------------------------------------
| Total bobot maksimum: 115
*/

const CRM_KPI_MAX_SCORE = 115;

const CRM_KPI_METRICS = [
    {
        code: "RO",
        name: "Repeat Order (RO Sales)",
        target: 20,
        targetLabel: "20%",
        unit: "PERCENT",
        weight: 20
    },
    {
        code: "SIPEDE",
        name: "SiPede Performance",
        target: 100,
        targetLabel: "100%",
        unit: "PERCENT",
        weight: 10
    },
    {
        code: "KPB",
        name: "Unit Entry KPB-1 sampai KPB-4",
        target: [60, 50, 30, 40],
        targetLabel: "KPB1 60% · KPB2 50% · KPB3 30% · KPB4 40%",
        unit: "KPB",
        weight: 5
    },
    {
        code: "REGISTER_USER",
        name: "Register User MotorkuX/Brompit",
        target: 0,
        targetLabel: "Target MD",
        unit: "NUMBER",
        targetEditable: true,
        weight: 3
    },
    {
        code: "REGISTER_MOTOR",
        name: "Register Motor MotorkuX/Brompit",
        target: 0,
        targetLabel: "Target MD",
        unit: "NUMBER",
        targetEditable: true,
        weight: 3
    },
    {
        code: "TOTAL_BOOKING",
        name: "Total Booking MotorkuX/Brompit",
        target: 0,
        targetLabel: "Target MD",
        unit: "NUMBER",
        targetEditable: true,
        weight: 3
    },
    {
        code: "KPB_DIGITAL",
        name: "KPB Digital",
        target: 0,
        targetLabel: "Target MD",
        unit: "NUMBER",
        targetEditable: true,
        weight: 3
    },
    {
        code: "WORKLOAD_STAR",
        name: "Workload STAR/SDMS FLP",
        target: 5,
        targetLabel: "< 5%",
        unit: "PERCENT",
        lowerIsBetter: true,
        weight: 5
    },
    {
        code: "UTILISASI_STAR",
        name: "Utilisasi STAR/SDMS FLP",
        target: 100,
        targetLabel: "100%",
        unit: "PERCENT",
        weight: 3
    },
    {
        code: "END_TO_END",
        name: "End to End Sales",
        target: 0,
        targetLabel: "Target MD",
        unit: "NUMBER",
        targetEditable: true,
        weight: 5
    },
    {
        code: "LEAD_MANAGEMENT",
        name: "Lead Management (Overdue Pending FU)",
        target: 20,
        targetLabel: "Maksimal 20%",
        unit: "PERCENT",
        lowerIsBetter: true,
        weight: 5
    },
    {
        code: "CDB_QUALITY",
        name: "CDB Quality",
        target: 95,
        targetLabel: "95% valid",
        unit: "PERCENT",
        weight: 15
    },
    {
        code: "DISTRIBUSI_LEADS",
        name: "Distribusi Leads",
        target: 100,
        targetLabel: "100%",
        unit: "PERCENT",
        weight: 5
    },
    {
        code: "GMB",
        name: "Penambahan Review Google My Business",
        target: 100,
        targetLabel: "100 review · ≥5 bintang · respon <2 hari",
        unit: "NUMBER",
        weight: 10
    },
    {
        code: "NOS",
        name: "Network Operational Standard (NOS)",
        target: 90,
        targetLabel: "Platinum >90%",
        unit: "PERCENT",
        weight: 5
    },
    {
        code: "PDCA",
        name: "PDCA – Project Improvement CRM",
        target: 1,
        targetLabel: "1 project per semester",
        unit: "NUMBER",
        weight: 10
    },
    {
        code: "WORKLOAD_STNK",
        name: "Workloads STNK & Voice Customer Insight",
        target: 10,
        targetLabel: "10% total sales M-1",
        unit: "PERCENT",
        weight: 5
    }
];


/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let crmKpiRows = [];
let crmKpiEditing = false;
let crmKpiVerifying = false;
let crmKpiInitialized = false;


/*
|--------------------------------------------------------------------------
| ELEMENT
|--------------------------------------------------------------------------
*/

const crmKpiBranch =
    document.getElementById("crmKpiBranch");

const crmKpiYear =
    document.getElementById("crmKpiYear");

const crmKpiMonth =
    document.getElementById("crmKpiMonth");

const crmKpiWeek =
    document.getElementById("crmKpiWeek");

const crmKpiTableBody =
    document.getElementById("crmKpiTableBody");

const newCrmKpiButton =
    document.getElementById("newCrmKpiButton");

const saveCrmKpiButton =
    document.getElementById("saveCrmKpiButton");

const verifyCrmKpiButton =
    document.getElementById("verifyCrmKpiButton");

const cancelCrmKpiButton =
    document.getElementById("cancelCrmKpiButton");


/*
|--------------------------------------------------------------------------
| ROLE
|--------------------------------------------------------------------------
*/

function getCrmKpiRole() {
    return String(
        currentUser.role ||
        currentUser.jabatan ||
        ""
    )
        .trim()
        .toUpperCase();
}

function canInputCrmKpi() {
    return getCrmKpiRole() === "CRM";
}

function canVerifyCrmKpi() {
    return getCrmKpiRole() === "MSCM";
}


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

function initializeCrmKpi() {
    if (crmKpiInitialized) {
        return;
    }

    crmKpiInitialized = true;

    initializeCrmKpiYear();
    initializeCrmKpiBranch();
    initializeCrmKpiPeriod();

    renderCrmKpiTable();
}

function initializeCrmKpiYear() {
    const currentYear = new Date().getFullYear();

    crmKpiYear.innerHTML = "";

    for (
        let year = currentYear - 2;
        year <= currentYear + 1;
        year += 1
    ) {
        const option =
            document.createElement("option");

        option.value = String(year);
        option.textContent = String(year);
        option.selected = year === currentYear;

        crmKpiYear.appendChild(option);
    }
}

function initializeCrmKpiPeriod() {
    const today = new Date();

    crmKpiMonth.value =
        String(today.getMonth() + 1);

    crmKpiWeek.value = "";
}

function initializeCrmKpiBranch() {
    const isHeadOffice =
        currentUser.branch === "ALL" ||
        currentUser.originalBranch === "HO";

    const userBranch = String(
        currentUser.originalBranch ||
        currentUser.branch ||
        ""
    ).toUpperCase();

    crmKpiBranch.innerHTML = "";

    sheetBranchOptions.forEach(function (branch) {
        const option =
            document.createElement("option");

        option.value = branch.code;
        option.textContent =
            `${branch.code} — ${branch.name}`;

        if (branch.code === userBranch) {
            option.selected = true;
        }

        crmKpiBranch.appendChild(option);
    });

    crmKpiBranch.disabled = !isHeadOffice;
    crmKpiBranch.classList.toggle(
        "bg-slate-100",
        !isHeadOffice
    );
}


/*
|--------------------------------------------------------------------------
| DATA KOSONG
|--------------------------------------------------------------------------
*/

function createEmptyCrmKpiRows() {
    return CRM_KPI_METRICS.map(function (metric) {
        return {
            code: metric.code,
            target: Array.isArray(metric.target)
                ? [...metric.target]
                : metric.target,
            actualCrm:
                metric.unit === "KPB"
                    ? ["", "", "", ""]
                    : "",
            actualHo:
                metric.unit === "KPB"
                    ? ["", "", "", ""]
                    : "",
            status: ""
        };
    });
}


/*
|--------------------------------------------------------------------------
| LOAD DATA
|--------------------------------------------------------------------------
*/

async function loadCrmKpiPage() {
    initializeCrmKpi();

    const branch = crmKpiBranch.value;
    const year = Number(crmKpiYear.value);
    const month = Number(crmKpiMonth.value);
    const week = crmKpiWeek.value;

    setCrmKpiLoading(true);

    try {
        const result = await requestBackend(
            "getCrmKpiData",
            {
                branch: branch,
                year: year,
                month: month,
                week: week
                    ? Number(week)
                    : null
            }
        );

        crmKpiRows =
            Array.isArray(result.data) &&
            result.data.length
                ? mergeCrmKpiRows(result.data)
                : createEmptyCrmKpiRows();

        crmKpiEditing = false;
        crmKpiVerifying = false;

        updateCrmKpiPeriodInformation(
            result.status || ""
        );

        renderCrmKpiTable();
        updateCrmKpiButtons(
            result.status || ""
        );
    } catch (error) {
        crmKpiRows =
            createEmptyCrmKpiRows();

        renderCrmKpiTable();

        showToast(
            error.message ||
            "Data KPI CRM gagal dimuat."
        );
    } finally {
        setCrmKpiLoading(false);
    }
}

function mergeCrmKpiRows(data) {
    return CRM_KPI_METRICS.map(function (metric) {
        const saved = data.find(function (item) {
            return item.code === metric.code;
        });

        return {
            code: metric.code,

            target:
                saved && saved.target !== undefined
                    ? saved.target
                    : Array.isArray(metric.target)
                        ? [...metric.target]
                        : metric.target,

            actualCrm:
                saved && saved.actualCrm !== undefined
                    ? saved.actualCrm
                    : metric.unit === "KPB"
                        ? ["", "", "", ""]
                        : "",

            actualHo:
                saved && saved.actualHo !== undefined
                    ? saved.actualHo
                    : metric.unit === "KPB"
                        ? ["", "", "", ""]
                        : "",

            status:
                saved
                    ? saved.status || ""
                    : ""
        };
    });
}


/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

function renderCrmKpiTable() {
    crmKpiTableBody.innerHTML =
        CRM_KPI_METRICS
            .map(function (metric, index) {
                const row =
                    crmKpiRows.find(function (item) {
                        return item.code === metric.code;
                    }) || {
                        target: metric.target,
                        actualCrm: "",
                        actualHo: ""
                    };

                const score =
                    calculateCrmKpiScore(
                        metric,
                        row
                    );

                return `
                    <tr>
                        <td class="font-black text-slate-400">
                            ${index + 1}
                        </td>

                        <td>
                            <p class="font-black text-slate-900">
                                ${escapeHtml(metric.name)}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                ${getMetricInformation(metric)}
                            </p>
                        </td>

                        <td>
                            ${renderCrmKpiTarget(metric, row)}
                        </td>

                        <td>
                            ${renderCrmKpiActual(
                                metric,
                                row.actualCrm,
                                "crm",
                                crmKpiEditing
                            )}
                        </td>

                        <td>
                            ${renderCrmKpiActual(
                                metric,
                                row.actualHo,
                                "ho",
                                crmKpiVerifying
                            )}
                        </td>

                        <td class="font-black ${getDifferenceClass(metric, row)}">
                            ${formatCrmKpiDifference(metric, row)}
                        </td>

                        <td class="font-black text-slate-900">
                            ${metric.weight}
                        </td>

                        <td class="font-black text-red-600">
                            ${formatKpiNumber(score)}
                        </td>
                    </tr>
                `;
            })
            .join("");

    document
        .getElementById("crmKpiTableTotal")
        .textContent =
            formatKpiNumber(
                calculateTotalCrmKpi()
            );

    document
        .getElementById("crmKpiTotal")
        .textContent =
            formatKpiNumber(
                calculateTotalCrmKpi()
            );
}

function renderCrmKpiTarget(metric, row) {
    if (
        metric.targetEditable &&
        crmKpiEditing
    ) {
        return `
            <input
                class="form-input min-w-[130px]"
                type="number"
                min="0"
                step="0.01"
                data-kpi-target="${metric.code}"
                value="${escapeHtml(row.target || "")}"
                placeholder="Target MD"
            >
        `;
    }

    return `
        <span class="font-bold text-slate-700">
            ${escapeHtml(
                formatCrmKpiTarget(metric, row.target)
            )}
        </span>
    `;
}

function renderCrmKpiActual(
    metric,
    value,
    owner,
    editable
) {
    if (metric.unit === "KPB") {
        const values =
            Array.isArray(value)
                ? value
                : ["", "", "", ""];

        return `
            <div class="grid min-w-[300px] grid-cols-4 gap-2">
                ${values.map(function (item, index) {
                    return `
                        <div>
                            <span class="mb-1 block text-[10px] font-black text-slate-400">
                                KPB${index + 1}
                            </span>

                            <input
                                class="form-input px-2 text-sm"
                                type="number"
                                min="0"
                                step="0.01"
                                data-kpi-actual="${owner}"
                                data-kpi-code="${metric.code}"
                                data-kpi-index="${index}"
                                value="${escapeHtml(item)}"
                                ${editable ? "" : "disabled"}
                            >
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    return `
        <div class="relative min-w-[140px]">
            <input
                class="form-input pr-10"
                type="number"
                min="0"
                step="0.01"
                data-kpi-actual="${owner}"
                data-kpi-code="${metric.code}"
                value="${escapeHtml(value)}"
                ${editable ? "" : "disabled"}
            >

            ${
                metric.unit === "PERCENT"
                    ? `
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                            %
                        </span>
                    `
                    : ""
            }
        </div>
    `;
}


/*
|--------------------------------------------------------------------------
| PERHITUNGAN
|--------------------------------------------------------------------------
*/

function calculateCrmKpiScore(metric, row) {
    const verified =
        String(row.status || "")
            .toUpperCase() === "TERVERIFIKASI";

    const selectedActual =
        verified &&
        hasKpiValue(row.actualHo)
            ? row.actualHo
            : row.actualCrm;

    if (metric.unit === "KPB") {
        const targets =
            Array.isArray(row.target)
                ? row.target
                : metric.target;

        const actuals =
            Array.isArray(selectedActual)
                ? selectedActual
                : [];

        const achievements =
            targets.map(function (target, index) {
                return calculateAchievement(
                    Number(target),
                    Number(actuals[index] || 0),
                    false
                );
            });

        const average =
            achievements.reduce(function (total, value) {
                return total + value;
            }, 0) / achievements.length;

        return average * metric.weight;
    }

    const target = Number(row.target || metric.target || 0);
    const actual = Number(selectedActual || 0);

    return (
        calculateAchievement(
            target,
            actual,
            metric.lowerIsBetter === true
        ) * metric.weight
    );
}

function calculateAchievement(
    target,
    actual,
    lowerIsBetter
) {
    if (!target || actual < 0) {
        return 0;
    }

    if (lowerIsBetter) {
        if (actual <= target) {
            return 1;
        }

        return Math.min(
            target / actual,
            1
        );
    }

    return Math.min(
        actual / target,
        1
    );
}

function calculateTotalCrmKpi() {
    return CRM_KPI_METRICS.reduce(
        function (total, metric) {
            const row =
                crmKpiRows.find(function (item) {
                    return item.code === metric.code;
                });

            return total +
                (
                    row
                        ? calculateCrmKpiScore(
                            metric,
                            row
                        )
                        : 0
                );
        },
        0
    );
}

function formatCrmKpiDifference(metric, row) {
    if (
        !hasKpiValue(row.actualCrm) ||
        !hasKpiValue(row.actualHo)
    ) {
        return "—";
    }

    if (metric.unit === "KPB") {
        const crmAverage =
            averageKpiArray(row.actualCrm);

        const hoAverage =
            averageKpiArray(row.actualHo);

        return formatSignedNumber(
            hoAverage - crmAverage
        );
    }

    return formatSignedNumber(
        Number(row.actualHo) -
        Number(row.actualCrm)
    );
}

function getDifferenceClass(metric, row) {
    const difference =
        Number(
            formatCrmKpiDifference(
                metric,
                row
            )
        );

    if (!Number.isFinite(difference)) {
        return "text-slate-400";
    }

    if (difference === 0) {
        return "text-slate-500";
    }

    return difference > 0
        ? "text-emerald-600"
        : "text-red-600";
}


/*
|--------------------------------------------------------------------------
| INPUT MODE
|--------------------------------------------------------------------------
*/

function startCrmKpiInput() {
    if (!crmKpiWeek.value) {
        showToast(
            "Pilih Week terlebih dahulu sebelum membuat input KPI."
        );

        return;
    }

    crmKpiEditing = true;
    crmKpiVerifying = false;

    updateCrmKpiButtons("");
    renderCrmKpiTable();
}

function startCrmKpiVerification() {
    if (!crmKpiWeek.value) {
        showToast(
            "Pilih Week yang akan diverifikasi."
        );

        return;
    }

    crmKpiEditing = false;
    crmKpiVerifying = true;

    updateCrmKpiButtons(
        "MENUNGGU VERIFIKASI MSCM"
    );

    renderCrmKpiTable();
}

function cancelCrmKpiInput() {
    crmKpiEditing = false;
    crmKpiVerifying = false;

    loadCrmKpiPage();
}


/*
|--------------------------------------------------------------------------
| AMBIL INPUT TABEL
|--------------------------------------------------------------------------
*/

function collectCrmKpiTableValues(owner) {
    const actualSelector =
        `[data-kpi-actual="${owner}"]`;

    document
        .querySelectorAll(actualSelector)
        .forEach(function (input) {
            const code = input.dataset.kpiCode;

            const row =
                crmKpiRows.find(function (item) {
                    return item.code === code;
                });

            if (!row) {
                return;
            }

            if (
                input.dataset.kpiIndex !== undefined
            ) {
                const index =
                    Number(input.dataset.kpiIndex);

                const property =
                    owner === "crm"
                        ? "actualCrm"
                        : "actualHo";

                if (!Array.isArray(row[property])) {
                    row[property] = [
                        "",
                        "",
                        "",
                        ""
                    ];
                }

                row[property][index] =
                    input.value;
            } else if (owner === "crm") {
                row.actualCrm =
                    input.value;
            } else {
                row.actualHo =
                    input.value;
            }
        });

    document
        .querySelectorAll(
            "[data-kpi-target]"
        )
        .forEach(function (input) {
            const row =
                crmKpiRows.find(function (item) {
                    return (
                        item.code ===
                        input.dataset.kpiTarget
                    );
                });

            if (row) {
                row.target =
                    input.value;
            }
        });
}


/*
|--------------------------------------------------------------------------
| SIMPAN CRM
|--------------------------------------------------------------------------
*/

async function saveCrmKpi() {
    collectCrmKpiTableValues("crm");

    setKpiButtonLoading(
        saveCrmKpiButton,
        true,
        "Menyimpan..."
    );

    try {
        await requestBackend(
            "saveCrmKpi",
            {
                branch:
                    crmKpiBranch.value,

                year:
                    Number(
                        crmKpiYear.value
                    ),

                month:
                    Number(
                        crmKpiMonth.value
                    ),

                week:
                    Number(
                        crmKpiWeek.value
                    ),

                metrics:
                    crmKpiRows
            }
        );

        showToast(
            "KPI CRM berhasil disimpan dan menunggu verifikasi MSCM."
        );

        await loadCrmKpiPage();
    } catch (error) {
        showToast(
            error.message ||
            "KPI CRM gagal disimpan."
        );
    } finally {
        setKpiButtonLoading(
            saveCrmKpiButton,
            false,
            "Simpan KPI"
        );
    }
}


/*
|--------------------------------------------------------------------------
| VERIFIKASI MSCM
|--------------------------------------------------------------------------
*/

async function verifyCrmKpi() {
    collectCrmKpiTableValues("ho");

    setKpiButtonLoading(
        verifyCrmKpiButton,
        true,
        "Memverifikasi..."
    );

    try {
        await requestBackend(
            "verifyCrmKpi",
            {
                branch:
                    crmKpiBranch.value,

                year:
                    Number(
                        crmKpiYear.value
                    ),

                month:
                    Number(
                        crmKpiMonth.value
                    ),

                week:
                    Number(
                        crmKpiWeek.value
                    ),

                metrics:
                    crmKpiRows
            }
        );

        showToast(
            "KPI CRM berhasil diverifikasi MSCM."
        );

        await loadCrmKpiPage();
    } catch (error) {
        showToast(
            error.message ||
            "KPI CRM gagal diverifikasi."
        );
    } finally {
        setKpiButtonLoading(
            verifyCrmKpiButton,
            false,
            "Verifikasi MSCM"
        );
    }
}


/*
|--------------------------------------------------------------------------
| BUTTON
|--------------------------------------------------------------------------
*/

function updateCrmKpiButtons(status) {
    const weekSelected =
        Boolean(crmKpiWeek.value);

    newCrmKpiButton.classList.toggle(
        "hidden",
        !canInputCrmKpi() ||
        !weekSelected ||
        crmKpiEditing
    );

    saveCrmKpiButton.classList.toggle(
        "hidden",
        !crmKpiEditing
    );

    verifyCrmKpiButton.classList.toggle(
        "hidden",
        !canVerifyCrmKpi() ||
        !weekSelected ||
        crmKpiVerifying ||
        status === "TERVERIFIKASI"
    );

    cancelCrmKpiButton.classList.toggle(
        "hidden",
        !crmKpiEditing &&
        !crmKpiVerifying
    );
}


/*
|--------------------------------------------------------------------------
| UI HELPER
|--------------------------------------------------------------------------
*/

function updateCrmKpiPeriodInformation(status) {
    const week = crmKpiWeek.value;

    document.getElementById(
        "crmKpiPeriodLabel"
    ).textContent =
        week
            ? `Week ${week}`
            : "Rata-rata MTD";

    document.getElementById(
        "crmKpiStatus"
    ).textContent =
        status ||
        "Belum ada data";

    document.getElementById(
        "crmKpiInformation"
    ).textContent =
        week
            ? "Nilai KPI mingguan cabang."
            : "Nilai merupakan rata-rata seluruh Week pada bulan terpilih.";
}

function setCrmKpiLoading(loading) {
    document
        .getElementById("crmKpiLoading")
        .classList.toggle(
            "hidden",
            !loading
        );

    document
        .getElementById(
            "crmKpiTableContainer"
        )
        .classList.toggle(
            "hidden",
            loading
        );
}

function setKpiButtonLoading(
    button,
    loading,
    label
) {
    button.disabled = loading;

    button.innerHTML = loading
        ? `
            <span class="flex items-center justify-center gap-2">
                <span class="ui-spinner"></span>
                <span>${label}</span>
            </span>
        `
        : label;
}

function getMetricInformation(metric) {
    return `Target ${metric.targetLabel} · Bobot maksimal ${metric.weight}`;
}

function formatCrmKpiTarget(metric, target) {
    if (Array.isArray(target)) {
        return metric.targetLabel;
    }

    if (metric.targetEditable) {
        return target
            ? Number(target).toLocaleString("id-ID")
            : "Target MD belum diisi";
    }

    return metric.targetLabel;
}

function hasKpiValue(value) {
    if (Array.isArray(value)) {
        return value.some(function (item) {
            return item !== "" &&
                item !== null &&
                item !== undefined;
        });
    }

    return (
        value !== "" &&
        value !== null &&
        value !== undefined
    );
}

function averageKpiArray(values) {
    const numbers =
        values.map(function (value) {
            return Number(value || 0);
        });

    return (
        numbers.reduce(function (total, value) {
            return total + value;
        }, 0) / numbers.length
    );
}

function formatSignedNumber(value) {
    const number = Number(value || 0);

    if (number > 0) {
        return `+${formatKpiNumber(number)}`;
    }

    return formatKpiNumber(number);
}

function formatKpiNumber(value) {
    return Number(value || 0)
        .toLocaleString(
            "id-ID",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
}


/*
|--------------------------------------------------------------------------
| EVENT
|--------------------------------------------------------------------------
*/

document
    .getElementById("kpiMenuButton")
    .addEventListener("click", function () {
        const submenu =
            document.getElementById(
                "kpiSubmenu"
            );

        submenu.classList.toggle(
            "hidden"
        );

        document.getElementById(
            "kpiArrow"
        ).textContent =
            submenu.classList.contains(
                "hidden"
            )
                ? "⌄"
                : "⌃";
    });

document
    .getElementById("loadCrmKpiButton")
    .addEventListener(
        "click",
        loadCrmKpiPage
    );

newCrmKpiButton.addEventListener(
    "click",
    startCrmKpiInput
);

saveCrmKpiButton.addEventListener(
    "click",
    saveCrmKpi
);

verifyCrmKpiButton.addEventListener(
    "click",
    startCrmKpiVerification
);

cancelCrmKpiButton.addEventListener(
    "click",
    cancelCrmKpiInput
);

window.loadCrmKpiPage =
    loadCrmKpiPage;