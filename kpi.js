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

function canViewCrmKpiHo() {
    return [
        "MSCM",
        "MGR"
    ].includes(
        getCrmKpiRole()
    );
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

    updateCrmKpiHoVisibility();
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

function updateCrmKpiHoVisibility() {
    const visible =
        canViewCrmKpiHo();

    document
        .querySelectorAll(
            "[data-kpi-ho-only]"
        )
        .forEach(function (element) {
            element.classList.toggle(
                "hidden",
                !visible
            );
        });
}

function mergeCrmKpiRows(data) {
    const sourceData =
        Array.isArray(data)
            ? data
            : [];

    return CRM_KPI_METRICS.map(
        function (metric) {
            const saved =
                sourceData.find(
                    function (item) {
                        return (
                            String(
                                item.code || ""
                            )
                                .trim()
                                .toUpperCase() ===
                            metric.code
                        );
                    }
                );

            const defaultActual =
                metric.unit === "KPB"
                    ? [
                        "",
                        "",
                        "",
                        ""
                    ]
                    : "";

            if (!saved) {
                return {
                    code: metric.code,

                    target:
                        Array.isArray(
                            metric.target
                        )
                            ? [
                                ...metric.target
                            ]
                            : metric.target,

                    actualCrm:
                        Array.isArray(
                            defaultActual
                        )
                            ? [
                                ...defaultActual
                            ]
                            : defaultActual,

                    actualHo:
                        Array.isArray(
                            defaultActual
                        )
                            ? [
                                ...defaultActual
                            ]
                            : defaultActual,

                    scoreCrm: "",
                    scoreHo: "",
                    status: ""
                };
            }

            return {
                code: metric.code,

                target:
                    saved.target !==
                        undefined &&
                    saved.target !==
                        null &&
                    saved.target !==
                        ""
                        ? saved.target
                        : Array.isArray(
                            metric.target
                        )
                            ? [
                                ...metric.target
                            ]
                            : metric.target,

                actualCrm:
                    saved.actualCrm !==
                        undefined &&
                    saved.actualCrm !==
                        null
                        ? saved.actualCrm
                        : Array.isArray(
                            defaultActual
                        )
                            ? [
                                ...defaultActual
                            ]
                            : defaultActual,

                /*
                | Backend tidak akan mengirim Actual HO
                | kepada akun cabang.
                */

                actualHo:
                    canViewCrmKpiHo() &&
                    saved.actualHo !==
                        undefined &&
                    saved.actualHo !==
                        null
                        ? saved.actualHo
                        : Array.isArray(
                            defaultActual
                        )
                            ? [
                                ...defaultActual
                            ]
                            : defaultActual,

                scoreCrm:
                    saved.scoreCrm !==
                        undefined &&
                    saved.scoreCrm !==
                        null
                        ? saved.scoreCrm
                        : "",

                scoreHo:
                    canViewCrmKpiHo() &&
                    saved.scoreHo !==
                        undefined &&
                    saved.scoreHo !==
                        null
                        ? saved.scoreHo
                        : "",

                status:
                    String(
                        saved.status || ""
                    )
                        .trim()
                        .toUpperCase()
            };
        }
    );
}


function renderCrmKpiTable() {
    const showHoColumns =
        canViewCrmKpiHo();

    if (
        !Array.isArray(crmKpiRows) ||
        !crmKpiRows.length
    ) {
        crmKpiRows =
            createEmptyCrmKpiRows();
    }

    crmKpiTableBody.innerHTML =
        CRM_KPI_METRICS
            .map(function (
                metric,
                index
            ) {
                const row =
                    crmKpiRows.find(
                        function (item) {
                            return (
                                item.code ===
                                metric.code
                            );
                        }
                    ) || {
                        code: metric.code,
                        target:
                            Array.isArray(
                                metric.target
                            )
                                ? [
                                    ...metric.target
                                ]
                                : metric.target,
                        actualCrm:
                            metric.unit ===
                            "KPB"
                                ? [
                                    "",
                                    "",
                                    "",
                                    ""
                                ]
                                : "",
                        actualHo:
                            metric.unit ===
                            "KPB"
                                ? [
                                    "",
                                    "",
                                    "",
                                    ""
                                ]
                                : "",
                        scoreCrm: "",
                        scoreHo: "",
                        status: ""
                    };

                const score =
                    calculateCrmKpiScore(
                        metric,
                        row
                    );

                const hoColumns =
                    showHoColumns
                        ? `
                            <td data-kpi-ho-only>
                                ${renderCrmKpiActual(
                                    metric,
                                    row.actualHo,
                                    "ho",
                                    crmKpiVerifying
                                )}
                            </td>

                            <td
                                data-kpi-ho-only
                                class="font-black ${getDifferenceClass(
                                    metric,
                                    row
                                )}"
                            >
                                ${formatCrmKpiDifference(
                                    metric,
                                    row
                                )}
                            </td>
                        `
                        : "";

                return `
                    <tr>
                        <td class="font-black text-slate-400">
                            ${index + 1}
                        </td>

                        <td>
                            <p class="font-black text-slate-900">
                                ${escapeHtml(
                                    metric.name
                                )}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                ${escapeHtml(
                                    getMetricInformation(
                                        metric
                                    )
                                )}
                            </p>
                        </td>

                        <td>
                            ${renderCrmKpiTarget(
                                metric,
                                row
                            )}
                        </td>

                        <td>
                            ${renderCrmKpiActual(
                                metric,
                                row.actualCrm,
                                "crm",
                                crmKpiEditing
                            )}
                        </td>

                        ${hoColumns}

                        <td class="font-black text-slate-900">
                            ${formatKpiNumber(
                                metric.weight
                            )}
                        </td>

                        <td class="font-black text-red-600">
                            ${formatKpiNumber(
                                score
                            )}
                        </td>
                    </tr>
                `;
            })
            .join("");

    const totalScore =
        calculateTotalCrmKpi();

    const totalPercentage =
        calculateCrmKpiPercentage(
            totalScore
        );

    const percentageText =
        `${formatKpiNumber(
            totalPercentage
        )}%`;

    document.getElementById(
        "crmKpiTableTotal"
    ).textContent =
        percentageText;

    document.getElementById(
        "crmKpiTotal"
    ).textContent =
        percentageText;

    const totalLabel =
        document.getElementById(
            "crmKpiTotalLabel"
        );

    if (totalLabel) {
        /*
        | Ada 8 kolom jika Actual HO tampil.
        | Ada 6 kolom jika Actual HO disembunyikan.
        | Kolom terakhir dipakai untuk nilai total.
        */

        totalLabel.colSpan =
            showHoColumns
                ? 7
                : 5;
    }

    updateCrmKpiHoVisibility();
}

/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

function renderCrmKpiTable() {
    const showHoColumns =
        canViewCrmKpiHo();

    if (
        !Array.isArray(crmKpiRows) ||
        !crmKpiRows.length
    ) {
        crmKpiRows =
            createEmptyCrmKpiRows();
    }

    crmKpiTableBody.innerHTML =
        CRM_KPI_METRICS
            .map(function (
                metric,
                index
            ) {
                const row =
                    crmKpiRows.find(
                        function (item) {
                            return (
                                item.code ===
                                metric.code
                            );
                        }
                    ) || {
                        code: metric.code,
                        target:
                            Array.isArray(
                                metric.target
                            )
                                ? [
                                    ...metric.target
                                ]
                                : metric.target,
                        actualCrm:
                            metric.unit ===
                            "KPB"
                                ? [
                                    "",
                                    "",
                                    "",
                                    ""
                                ]
                                : "",
                        actualHo:
                            metric.unit ===
                            "KPB"
                                ? [
                                    "",
                                    "",
                                    "",
                                    ""
                                ]
                                : "",
                        scoreCrm: "",
                        scoreHo: "",
                        status: ""
                    };

                const score =
                    calculateCrmKpiScore(
                        metric,
                        row
                    );

                const hoColumns =
                    showHoColumns
                        ? `
                            <td data-kpi-ho-only>
                                ${renderCrmKpiActual(
                                    metric,
                                    row.actualHo,
                                    "ho",
                                    crmKpiVerifying
                                )}
                            </td>

                            <td
                                data-kpi-ho-only
                                class="font-black ${getDifferenceClass(
                                    metric,
                                    row
                                )}"
                            >
                                ${formatCrmKpiDifference(
                                    metric,
                                    row
                                )}
                            </td>
                        `
                        : "";

                return `
                    <tr>
                        <td class="font-black text-slate-400">
                            ${index + 1}
                        </td>

                        <td>
                            <p class="font-black text-slate-900">
                                ${escapeHtml(
                                    metric.name
                                )}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                ${escapeHtml(
                                    getMetricInformation(
                                        metric
                                    )
                                )}
                            </p>
                        </td>

                        <td>
                            ${renderCrmKpiTarget(
                                metric,
                                row
                            )}
                        </td>

                        <td>
                            ${renderCrmKpiActual(
                                metric,
                                row.actualCrm,
                                "crm",
                                crmKpiEditing
                            )}
                        </td>

                        ${hoColumns}

                        <td class="font-black text-slate-900">
                            ${formatKpiNumber(
                                metric.weight
                            )}
                        </td>

                        <td class="font-black text-red-600">
                            ${formatKpiNumber(
                                score
                            )}
                        </td>
                    </tr>
                `;
            })
            .join("");

    const totalScore =
        calculateTotalCrmKpi();

    const totalPercentage =
        calculateCrmKpiPercentage(
            totalScore
        );

    const percentageText =
        `${formatKpiNumber(
            totalPercentage
        )}%`;

    document.getElementById(
        "crmKpiTableTotal"
    ).textContent =
        percentageText;

    document.getElementById(
        "crmKpiTotal"
    ).textContent =
        percentageText;

    const totalLabel =
        document.getElementById(
            "crmKpiTotalLabel"
        );

    if (totalLabel) {
        /*
        | Ada 8 kolom jika Actual HO tampil.
        | Ada 6 kolom jika Actual HO disembunyikan.
        | Kolom terakhir dipakai untuk nilai total.
        */

        totalLabel.colSpan =
            showHoColumns
                ? 7
                : 5;
    }

    updateCrmKpiHoVisibility();
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

function calculateCrmKpiScore(
    metric,
    row
) {
    if (!metric || !row) {
        return 0;
    }

    const status =
        String(row.status || "")
            .trim()
            .toUpperCase();

    const verified =
        status === "TERVERIFIKASI";

    const useHoResult =
        verified &&
        canViewCrmKpiHo() &&
        hasKpiValue(
            row.actualHo
        );

    /*
    |--------------------------------------------------------------------------
    | SAAT MODE LIHAT
    |--------------------------------------------------------------------------
    | Gunakan skor yang sudah disimpan di database.
    | Ini penting agar data historis AppSheet tidak dihitung ulang
    | dengan formula frontend yang baru.
    */

    if (
        !crmKpiEditing &&
        !crmKpiVerifying
    ) {
        if (
            useHoResult &&
            hasStoredCrmKpiScore(
                row.scoreHo
            )
        ) {
            return Number(
                row.scoreHo
            );
        }

        if (
            hasStoredCrmKpiScore(
                row.scoreCrm
            )
        ) {
            return Number(
                row.scoreCrm
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PILIH ACTUAL
    |--------------------------------------------------------------------------
    */

    const selectedActual =
        useHoResult ||
        crmKpiVerifying
            ? row.actualHo
            : row.actualCrm;

    /*
    |--------------------------------------------------------------------------
    | KPI KPB
    |--------------------------------------------------------------------------
    */

    if (metric.unit === "KPB") {
        const targets =
            Array.isArray(row.target)
                ? row.target
                : Array.isArray(
                    metric.target
                )
                    ? metric.target
                    : [
                        60,
                        50,
                        30,
                        40
                    ];

        const actuals =
            Array.isArray(
                selectedActual
            )
                ? selectedActual
                : [
                    selectedActual,
                    "",
                    "",
                    ""
                ];

        const achievements =
            targets.map(function (
                targetValue,
                index
            ) {
                const actualValue =
                    Number(
                        actuals[index] || 0
                    );

                return calculateAchievement(
                    Number(
                        targetValue || 0
                    ),
                    actualValue,
                    false
                );
            });

        if (!achievements.length) {
            return 0;
        }

        const averageAchievement =
            achievements.reduce(
                function (
                    total,
                    achievement
                ) {
                    return (
                        total +
                        achievement
                    );
                },
                0
            ) /
            achievements.length;

        return roundCrmKpiNumber(
            averageAchievement *
            Number(
                metric.weight || 0
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | KPI BIASA
    |--------------------------------------------------------------------------
    */

    const target =
        Number(
            row.target !== "" &&
            row.target !== null &&
            row.target !== undefined
                ? row.target
                : metric.target || 0
        );

    const actual =
        Number(
            selectedActual || 0
        );

    const achievement =
        calculateAchievement(
            target,
            actual,
            metric.lowerIsBetter ===
                true
        );

    return roundCrmKpiNumber(
        achievement *
        Number(metric.weight || 0)
    );
}

function calculateAchievement(
    target,
    actual,
    lowerIsBetter
) {
    const targetNumber =
        Number(target || 0);

    const actualNumber =
        Number(actual || 0);

    if (
        !Number.isFinite(
            targetNumber
        ) ||
        !Number.isFinite(
            actualNumber
        ) ||
        targetNumber <= 0 ||
        actualNumber < 0
    ) {
        return 0;
    }

    /*
    |--------------------------------------------------------------------------
    | SEMAKIN KECIL SEMAKIN BAIK
    |--------------------------------------------------------------------------
    | Contoh:
    | Target maksimal 5%, Actual 5%  = 100%
    | Target maksimal 5%, Actual 10% = 50%
    */

    if (lowerIsBetter) {
        if (
            actualNumber <=
            targetNumber
        ) {
            return 1;
        }

        return Math.min(
            targetNumber /
            actualNumber,
            1
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SEMAKIN BESAR SEMAKIN BAIK
    |--------------------------------------------------------------------------
    */

    return Math.min(
        actualNumber /
        targetNumber,
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
    if (!canInputCrmKpi()) {
        showToast(
            "Hanya CRM yang dapat mengisi KPI."
        );

        return;
    }

    const today =
        new Date();

    const currentYear =
        today.getFullYear();

    const currentMonth =
        today.getMonth() + 1;

    const currentWeek =
        getCurrentCrmKpiWeek();

    /*
    | Input baru selalu mengikuti tanggal
    | saat CRM melakukan input.
    */

    crmKpiYear.value =
        String(currentYear);

    crmKpiMonth.value =
        String(currentMonth);

    crmKpiWeek.value =
        String(currentWeek);

    crmKpiEditing = true;
    crmKpiVerifying = false;

    updateCrmKpiPeriodInformation(
        ""
    );

    updateCrmKpiButtons(
        ""
    );

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

function updateCrmKpiPeriodInformation(
    status
) {
    const week =
        Number(
            crmKpiWeek.value || 0
        );

    const year =
        Number(crmKpiYear.value);

    const month =
        Number(crmKpiMonth.value);

    const periodLabel =
        document.getElementById(
            "crmKpiPeriodLabel"
        );

    const information =
        document.getElementById(
            "crmKpiInformation"
        );

    document.getElementById(
        "crmKpiStatus"
    ).textContent =
        status ||
        "Belum ada data";

    if (!week) {
        periodLabel.textContent =
            "Rata-rata MTD";

        information.textContent =
            "Nilai merupakan rata-rata seluruh Week pada bulan terpilih.";

        return;
    }

    const range =
        getCrmKpiWeekRange(
            year,
            month,
            week
        );

    if (!range) {
        periodLabel.textContent =
            `Week ${week}`;

        information.textContent =
            "Week tidak tersedia pada bulan ini.";

        return;
    }

    const dateFormatter =
        new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    periodLabel.textContent =
        `Week ${week}`;

    information.textContent =
        `${dateFormatter.format(
            range.start
        )} – ${dateFormatter.format(
            range.end
        )} · Minggu sampai Sabtu`;
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

function getCrmKpiWeekRange(
    year,
    month,
    week
) {
    const firstDate =
        new Date(
            year,
            month - 1,
            1
        );

    const firstSunday =
        new Date(firstDate);

    firstSunday.setDate(
        firstDate.getDate() -
        firstDate.getDay()
    );

    const start =
        new Date(firstSunday);

    start.setDate(
        firstSunday.getDate() +
        ((week - 1) * 7)
    );

    const end =
        new Date(start);

    end.setDate(
        start.getDate() + 6
    );

    const monthStart =
        new Date(
            year,
            month - 1,
            1
        );

    const monthEnd =
        new Date(
            year,
            month,
            0
        );

    if (
        end < monthStart ||
        start > monthEnd
    ) {
        return null;
    }

    return {
        start:
            start < monthStart
                ? monthStart
                : start,

        end:
            end > monthEnd
                ? monthEnd
                : end
    };
}

function getCurrentCrmKpiWeek() {
    const today =
        new Date();

    const firstDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    const calculatedWeek =
        Math.floor(
            (
                today.getDate() +
                firstDate.getDay() -
                1
            ) / 7
        ) + 1;

    return Math.min(
        calculatedWeek,
        5
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