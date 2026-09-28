"use strict";

/*
|--------------------------------------------------------------------------
| SIPEDE KPI
|--------------------------------------------------------------------------
*/

let sipedeKpiInitialized = false;
let sipedeKpiLoading = false;
let sipedeKpiLoadingTimer = null;
let sipedeKpiLoadingValue = 0;
let sipedeKpiEditing = false;
let sipedeKpiDirty = false;

let sipedeKpiMaster = null;
let sipedeKpiRows = [];
let sipedeKpiSavedRows = [];

let sipedeKpiSavedSales = {
    cash: 0,
    credit: 0,
    total: 0
};

const sipedeKpiBranch =
    document.getElementById("sipedeKpiBranch");

const sipedeKpiYear =
    document.getElementById("sipedeKpiYear");

const sipedeKpiMonth =
    document.getElementById("sipedeKpiMonth");

const sipedeKpiPeriodType =
    document.getElementById("sipedeKpiPeriodType");

const sipedeKpiWeek =
    document.getElementById("sipedeKpiWeek");

const sipedeKpiWeekWrapper =
    document.getElementById("sipedeKpiWeekWrapper");

const sipedeKpiNik =
    document.getElementById("sipedeKpiNik");

const sipedeKpiName =
    document.getElementById("sipedeKpiName");

const sipedeKpiCrmName =
    document.getElementById("sipedeKpiCrmName");

const sipedeKpiTableBody =
    document.getElementById("sipedeKpiTableBody");

const sipedeKpiTableTotal =
    document.getElementById("sipedeKpiTableTotal");

const sipedeKpiTotalScore =
    document.getElementById("sipedeKpiTotalScore");

const sipedeKpiTotalCash =
    document.getElementById("sipedeKpiTotalCash");

const sipedeKpiTotalCredit =
    document.getElementById("sipedeKpiTotalCredit");

const sipedeKpiTotalSales =
    document.getElementById("sipedeKpiTotalSales");

const sipedeKpiCashInput =
    document.getElementById("sipedeKpiCashInput");

const sipedeKpiCreditInput =
    document.getElementById("sipedeKpiCreditInput");

const sipedeKpiTotalSalesInput =
    document.getElementById("sipedeKpiTotalSalesInput");

const sipedeKpiIncentivePerUnit =
    document.getElementById("sipedeKpiIncentivePerUnit");

const sipedeKpiTotalIncentive =
    document.getElementById("sipedeKpiTotalIncentive");

const sipedeKpiBaseSalary =
    document.getElementById("sipedeKpiBaseSalary");

const sipedeKpiSalaryNote =
    document.getElementById("sipedeKpiSalaryNote");

const sipedeKpiTotalReceived =
    document.getElementById("sipedeKpiTotalReceived");

const sipedeKpiStatusBadge =
    document.getElementById("sipedeKpiStatusBadge");

const sipedeKpiModeBadge =
    document.getElementById("sipedeKpiModeBadge");

const sipedeKpiPeriodInformation =
    document.getElementById("sipedeKpiPeriodInformation");

const sipedeKpiMtdHelper =
    document.getElementById("sipedeKpiMtdHelper");

const sipedeKpiDirtyBadge =
    document.getElementById("sipedeKpiDirtyBadge");

const sipedeKpiInputBadge =
    document.getElementById("sipedeKpiInputBadge");

const sipedeKpiActionInformation =
    document.getElementById("sipedeKpiActionInformation");

const sipedeKpiIncentiveRules =
    document.getElementById("sipedeKpiIncentiveRules");

const sipedeKpiStatusRules =
    document.getElementById("sipedeKpiStatusRules");

const sipedeHoEvaluation =
    document.getElementById("sipedeHoEvaluation");

const sipedeHoTableBody =
    document.getElementById("sipedeHoTableBody");

const sipedeHoNote =
    document.getElementById("sipedeHoNote");

const loadSipedeKpiButton =
    document.getElementById("loadSipedeKpiButton");

const newSipedeKpiButton =
    document.getElementById("newSipedeKpiButton");

const saveSipedeKpiButton =
    document.getElementById("saveSipedeKpiButton");

const cancelSipedeKpiButton =
    document.getElementById("cancelSipedeKpiButton");

const verifySipedeKpiButton =
    document.getElementById("verifySipedeKpiButton");


/*
|--------------------------------------------------------------------------
| ROLE
|--------------------------------------------------------------------------
*/

function getSipedeKpiRole() {

    return String(
        currentUser.role ||
        currentUser.jabatan ||
        ""
    )
        .trim()
        .toUpperCase();
}


function canInputSipedeKpi() {

    return [
        "CRM",
        "SIPEDE"
    ].includes(
        getSipedeKpiRole()
    );
}


function canVerifySipedeKpi() {

    return [
        "MSCM",
        "MGR_H1",
        "MGR_H23",
        "PIC_H23"
    ].includes(
        getSipedeKpiRole()
    );
}


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

async function initializeSipedeKpi() {

    if (sipedeKpiInitialized) {
        return;
    }

    sipedeKpiInitialized = true;

    initializeSipedeKpiYear();
    initializeSipedeKpiBranch();

    sipedeKpiPeriodType.value =
        "CLOSING";

    updateSipedeKpiPeriodUI();

    sipedeKpiPeriodType.addEventListener(
        "change",
        function () {

            updateSipedeKpiPeriodUI();
            populateSipedeKpiWeeks();

        }
    );

    sipedeKpiYear.addEventListener(
        "change",
        function () {

            populateSipedeKpiWeeks();

        }
    );

    sipedeKpiMonth.addEventListener(
        "change",
        function () {

            populateSipedeKpiWeeks();

        }
    );

    sipedeKpiBranch.addEventListener(
        "change",
        function () {

            updateSipedeIdentity();

        }
    );

    sipedeKpiCashInput.addEventListener(
        "input",
        handleSipedeSalesInput
    );

    sipedeKpiCreditInput.addEventListener(
        "input",
        handleSipedeSalesInput
    );

    populateSipedeKpiWeeks();
    renderSipedeKpiRules();
    updateSipedeIdentity();


}


function handleSipedeSalesInput() {

    const cash =
        Number(
            sipedeKpiCashInput.value
        ) || 0;

    const credit =
        Number(
            sipedeKpiCreditInput.value
        ) || 0;

    const totalSales =
        cash + credit;

    sipedeKpiDirty =
        true;

    sipedeKpiEditing =
        true;

    sipedeKpiTotalCash.textContent =
        formatSipedeNumber(cash);

    sipedeKpiTotalCredit.textContent =
        formatSipedeNumber(credit);

    sipedeKpiTotalSales.textContent =
        formatSipedeNumber(totalSales);

    sipedeKpiTotalSalesInput.textContent =
        formatSipedeNumber(totalSales);

    renderSipedeKpiSummary();

    updateSipedeKpiButtons({});

}


/*
|--------------------------------------------------------------------------
| YEAR
|--------------------------------------------------------------------------
*/

function initializeSipedeKpiYear() {

    const currentYear =
        new Date().getFullYear();

    sipedeKpiYear.innerHTML = "";

    for (
        let year = currentYear - 2;
        year <= currentYear + 1;
        year += 1
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(year);

        option.textContent =
            String(year);

        option.selected =
            year === currentYear;

        sipedeKpiYear.appendChild(
            option
        );

    }

    sipedeKpiMonth.value =
        String(
            new Date().getMonth() + 1
        );
}


/*
|--------------------------------------------------------------------------
| BRANCH
|--------------------------------------------------------------------------
*/

function initializeSipedeKpiBranch() {

    const isHeadOffice =
        currentUser.branch === "ALL" ||
        currentUser.originalBranch === "HO";

    const userBranch =
        String(
            currentUser.originalBranch ||
            currentUser.branch ||
            ""
        )
            .trim()
            .toUpperCase();

    sipedeKpiBranch.innerHTML = "";

    sheetBranchOptions.forEach(
        function (branch) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                branch.code;

            option.textContent =
                `${branch.code} — ${branch.name}`;

            if (
                branch.code ===
                userBranch
            ) {

                option.selected = true;

            }

            sipedeKpiBranch.appendChild(
                option
            );

        }
    );

    sipedeKpiBranch.disabled =
        !isHeadOffice;

    sipedeKpiBranch.classList.toggle(
        "bg-slate-100",
        !isHeadOffice
    );
}


/*
|--------------------------------------------------------------------------
| WEEK
|--------------------------------------------------------------------------
*/

function getSipedeWeekStart(
    year,
    month,
    week
) {

    const firstDay =
        new Date(
            year,
            month - 1,
            1
        );

    const offset =
        (
            firstDay.getDay() + 1
        ) % 7;

    const firstSaturday =
        new Date(
            year,
            month - 1,
            1 - offset
        );

    return new Date(
        firstSaturday.getFullYear(),
        firstSaturday.getMonth(),
        firstSaturday.getDate() +
            (
                (week - 1) * 7
            )
    );
}


function getSipedeWeekEnd(
    year,
    month,
    week
) {

    const start =
        getSipedeWeekStart(
            year,
            month,
            week
        );

    return new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + 6
    );
}


function getSipedeCurrentWeek(
    year,
    month
) {

    const today =
        new Date();

    if (
        today.getFullYear() !==
            year ||
        today.getMonth() + 1 !==
            month
    ) {

        return 1;

    }

    const firstSaturday =
        getSipedeWeekStart(
            year,
            month,
            1
        );

    const diff =
        Math.floor(
            (
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                ) -
                firstSaturday
            ) /
            86400000
        );

    return Math.max(
        1,
        Math.floor(
            diff / 7
        ) + 1
    );
}


function populateSipedeKpiWeeks() {

    const year =
        Number(
            sipedeKpiYear.value
        );

    const month =
        Number(
            sipedeKpiMonth.value
        );

    sipedeKpiWeek.innerHTML = "";

    const daysInMonth =
        new Date(
            year,
            month,
            0
        ).getDate();

    let week = 1;

    while (true) {

        const start =
            getSipedeWeekStart(
                year,
                month,
                week
            );

        const end =
            getSipedeWeekEnd(
                year,
                month,
                week
            );

        if (
            start.getTime() >
            new Date(
                year,
                month - 1,
                daysInMonth
            ).getTime()
        ) {

            break;

        }

        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(week);

        option.textContent =
            `Week ${week} — ${formatSipedeDate(start)} s.d. ${formatSipedeDate(end)}`;

        sipedeKpiWeek.appendChild(
            option
        );

        week += 1;

        if (week > 6) {
            break;
        }

    }

    const currentWeek =
        getSipedeCurrentWeek(
            year,
            month
        );

    sipedeKpiWeek.value =
        String(
            Math.min(
                currentWeek,
                sipedeKpiWeek.options.length
            )
        );

}


function formatSipedeDate(
    date
) {

    return String(
        date.getDate()
    )
        .padStart(2, "0") +
        "/" +
        String(
            date.getMonth() + 1
        )
            .padStart(2, "0");
}


/*
|--------------------------------------------------------------------------
| PERIOD UI
|--------------------------------------------------------------------------
*/

function updateSipedeKpiPeriodUI() {

    const isClosing =
        sipedeKpiPeriodType.value ===
        "CLOSING";

    sipedeKpiWeekWrapper.classList.toggle(
        "hidden",
        isClosing
    );

    document.getElementById(
        "sipedeKpiPeriodModeHint"
    ).textContent =
        isClosing
            ? "Closing"
            : "Weekly";

    document.getElementById(
        "sipedeKpiPeriodHelper"
    ).textContent =
        isClosing
            ? "Closing menggunakan seluruh periode bulan acuan."
            : "Periode Weekly dihitung Sabtu–Jumat.";
}


function getSelectedSipedePeriod() {

    return {

        branch:
            sipedeKpiBranch.value,

        year:
            Number(
                sipedeKpiYear.value
            ),

        month:
            Number(
                sipedeKpiMonth.value
            ),

        week:
            sipedeKpiPeriodType.value ===
            "CLOSING"
                ? 0
                : Number(
                    sipedeKpiWeek.value
                ),

        snapshotType:
            sipedeKpiPeriodType.value

    };

}


/*
|--------------------------------------------------------------------------
| LOAD
|--------------------------------------------------------------------------
*/

async function loadSipedeKpiPage() {

    if (
        sipedeKpiLoading
    ) {
        return;
    }

    await initializeSipedeKpi();

    const period =
        getSelectedSipedePeriod();

    setSipedeKpiLoadButtonBusy(true);

    /*
    |--------------------------------------------------------------------------
    | TOMBOL TETAP "Tampilkan KPI"
    |--------------------------------------------------------------------------
    | Loading ditampilkan di dalam kolom tabel,
    | bukan mengganti isi tombol.
    */

    setSipedeKpiLoadButtonBusy(true);
    try {

        const result =
            await requestBackend(
                "getSipedeData",
                {
                    branch:
                        period.branch,

                    year:
                        period.year,

                    month:
                        period.month,

                    week:
                        period.week,

                    snapshotType:
                        period.snapshotType,

                    nik:
                        sipedeKpiNik.value
                }
            );

        sipedeKpiMaster =
            result.master;

        /*
        |--------------------------------------------------------------------------
        | IDENTITAS SIPEDE OTOMATIS
        |--------------------------------------------------------------------------
        | NIK diambil dari Salesman / master backend.
        | Tidak ada lagi dropdown NIK.
        */

        if (
            result.defaultNik
        ) {

            sipedeKpiNik.value =
                String(
                    result.defaultNik
                );

        }

        populateSipedePersons();
        updateSipedeIdentity();

        sipedeKpiRows =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];

        const sales =
            result.sales || {};

        sipedeKpiSavedSales = {
            cash:
                Number(
                    sales.cash
                ) || 0,

            credit:
                Number(
                    sales.credit
                ) || 0,

            total:
                Number(
                    sales.total
                ) || 0
        };

        sipedeKpiCashInput.value =
            Number(
                sales.cash
            ) || 0;

        sipedeKpiCreditInput.value =
            Number(
                sales.credit
            ) || 0;

        sipedeKpiTotalSalesInput.textContent =
            formatSipedeCurrency(
                Number(sales.total) || 0
            );

        sipedeKpiSavedRows =
            JSON.parse(
                JSON.stringify(
                    sipedeKpiRows
                )
            );

        sipedeKpiDirty =
            false;

        sipedeKpiEditing =
            false;

        renderSipedeKpiTable();

        renderSipedeKpiSummary(
            result
        );

        renderSipedeHo(
            result
        );

        updateSipedeKpiButtons(
            result
        );

        sipedeKpiPeriodInformation.textContent =
            result.periodLabel ||
            "Periode KPI";

    } catch (error) {

        console.error(
            "KPI SiPede gagal dimuat:",
            error
        );

        showToast(
            error.message ||
            "KPI SiPede gagal dimuat.",
            "error"
        );

    } finally {

        sipedeKpiLoading =
            false;

        setSipedeKpiLoading(
            false
        );

        setSipedeKpiLoadButtonBusy(
            false
        );

    }

}


/*
|--------------------------------------------------------------------------
| PERSON
|--------------------------------------------------------------------------
*/

function populateSipedePersons() {

    if (
        !sipedeKpiMaster ||
        !Array.isArray(
            sipedeKpiMaster.persons
        )
    ) {
        return;
    }

    const branch =
        String(
            sipedeKpiBranch.value ||
            ""
        )
            .trim()
            .toUpperCase();

    const currentNik =
        String(
            sipedeKpiNik.value ||
            ""
        ).trim();

    const persons =
        sipedeKpiMaster.persons.filter(
            function (person) {

                const personStatus =
                    String(
                        person.status ||
                        ""
                    )
                        .trim()
                        .toUpperCase();

                const personBranch =
                    String(
                        person.branch ||
                        ""
                    )
                        .trim()
                        .toUpperCase();

                return (
                    personStatus ===
                    "AKTIF"
                ) && (
                    !branch ||
                    personBranch ===
                    branch
                );

            }
        );

    /*
    |--------------------------------------------------------------------------
    | NIK BUKAN DROPDOWN
    |--------------------------------------------------------------------------
    | Sistem otomatis mengambil SiPede aktif
    | dari cabang yang sedang dipilih.
    */

    let person =
        persons.find(
            function (item) {

                return String(
                    item.nik ||
                    ""
                ).trim() ===
                currentNik;

            }
        );

    if (!person) {

        person =
            persons[0] ||
            null;

    }

    sipedeKpiNik.value =
        person
            ? person.nik
            : "";

    sipedeKpiName.value =
        person
            ? person.name
            : "";

    sipedeKpiCrmName.value =
        person
            ? person.crmName
            : "";

}


function updateSipedeIdentity() {

    if (
        !sipedeKpiMaster ||
        !Array.isArray(
            sipedeKpiMaster.persons
        )
    ) {

        return;

    }

    const branch =
        String(
            sipedeKpiBranch.value ||
            ""
        )
            .trim()
            .toUpperCase();

    const persons =
        sipedeKpiMaster.persons.filter(
            function (person) {

                const personBranch =
                    String(
                        person.branch ||
                        ""
                    )
                        .trim()
                        .toUpperCase();

                const personStatus =
                    String(
                        person.status ||
                        ""
                    )
                        .trim()
                        .toUpperCase();

                return (
                    personBranch ===
                    branch &&
                    personStatus ===
                    "AKTIF"
                );

            }
        );

    /*
    |--------------------------------------------------------------------------
    | Ambil SiPede pertama yang aktif
    |--------------------------------------------------------------------------
    */

    const person =
        persons[0] || null;

    if (!person) {

        sipedeKpiNik.value =
            "";

        sipedeKpiName.value =
            "";

        sipedeKpiCrmName.value =
            "";

        return;

    }

    sipedeKpiNik.value =
        person.nik || "";

    sipedeKpiName.value =
        person.name || "";

    sipedeKpiCrmName.value =
        person.crmName || "";

}


/*
|--------------------------------------------------------------------------
| LOADING SIPEDE
|--------------------------------------------------------------------------
| SAMA DENGAN KPI CRM
|--------------------------------------------------------------------------
*/

function setSipedeKpiLoading(
    loading,
    message = "Memuat data KPI..."
) {

    const loadingElement =
        document.getElementById(
            "sipedeKpiLoading"
        );

    const tableContainer =
        document.getElementById(
            "sipedeKpiTableContainer"
        );

    const emptyElement =
        document.getElementById(
            "emptySipedeKpi"
        );

    const percentageElement =
        document.getElementById(
            "sipedeKpiLoadingPercent"
        );

    const progressElement =
        document.getElementById(
            "sipedeKpiLoadingBar"
        );

    const textElement =
        document.getElementById(
            "sipedeKpiLoadingText"
        );


    window.clearInterval(
        sipedeKpiLoadingTimer
    );

    sipedeKpiLoadingTimer =
        null;


    if (loading) {

        sipedeKpiLoadingValue =
            8;


        loadingElement.classList.remove(
            "hidden"
        );

        tableContainer.classList.add(
            "hidden"
        );


        if (emptyElement) {

            emptyElement.classList.add(
                "hidden"
            );

        }


        if (textElement) {

            textElement.textContent =
                message;

        }


        updateSipedeKpiLoadingProgress(
            sipedeKpiLoadingValue
        );


        sipedeKpiLoadingTimer =
            window.setInterval(
                function () {

                    if (
                        sipedeKpiLoadingValue >=
                        90
                    ) {

                        return;

                    }


                    const increment =
                        sipedeKpiLoadingValue < 50
                            ? 7
                            : sipedeKpiLoadingValue < 75
                                ? 4
                                : 1;


                    sipedeKpiLoadingValue =
                        Math.min(
                            sipedeKpiLoadingValue +
                                increment,
                            90
                        );


                    updateSipedeKpiLoadingProgress(
                        sipedeKpiLoadingValue
                    );

                },
                280
            );


        return;

    }


    sipedeKpiLoadingValue =
        100;


    updateSipedeKpiLoadingProgress(
        100
    );


    if (textElement) {

        textElement.textContent =
            "Data KPI berhasil dimuat";

    }


    window.setTimeout(
        function () {

            loadingElement.classList.add(
                "hidden"
            );

            tableContainer.classList.remove(
                "hidden"
            );

            sipedeKpiLoadingValue =
                0;

        },
        250
    );

}


function updateSipedeKpiLoadingProgress(
    value
) {

    const percentageElement =
        document.getElementById(
            "sipedeKpiLoadingPercent"
        );

    const progressElement =
        document.getElementById(
            "sipedeKpiLoadingBar"
        );

    const percent =
        Math.max(
            0,
            Math.min(
                Number(value) || 0,
                100
            )
        );

    if (percentageElement) {

        percentageElement.textContent =
            `${Math.round(percent)}%`;

    }

    if (progressElement) {

        progressElement.style.width =
            `${percent}%`;

    }

}


function renderSipedeKpiLoadingTable(
    message,
    progress
) {

    if (
        !sipedeKpiTableBody
    ) {
        return;
    }

    const safeProgress =
        Math.max(
            0,
            Math.min(
                Number(
                    progress || 0
                ),
                100
            )
        );

    const progressText =
        `${Math.round(
            safeProgress
        )}%`;

    const skeleton =
        `
        <div class="h-3 w-full animate-pulse rounded-full bg-slate-200"></div>
        `;

    sipedeKpiTableBody.innerHTML =
        Array.from(
            {
                length: 5
            }
        )
            .map(
                function (_, index) {

                    return `
                        <tr>

                            <td class="text-center">

                                <span
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-400"
                                >
                                    ${index + 1}
                                </span>

                            </td>

                            <td class="min-w-[220px]">

                                <div
                                    class="mb-2 h-3 w-40 animate-pulse rounded bg-slate-200"
                                ></div>

                                <div
                                    class="h-2.5 w-20 animate-pulse rounded bg-slate-100"
                                ></div>

                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                            <td class="text-right">
                                ${skeleton}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

    /*
    |--------------------------------------------------------------------------
    | BAR LOADING DI BAGIAN KOLOM
    |--------------------------------------------------------------------------
    */

    const loadingRow =
        document.createElement(
            "tr"
        );

    loadingRow.innerHTML = `
        <td
            colspan="9"
            class="px-4 py-4"
        >

            <div
                class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >

                <div
                    class="flex items-center justify-between gap-3"
                >

                    <div
                        class="flex min-w-0 items-center gap-2"
                    >

                        <span
                            class="ui-spinner shrink-0"
                        ></span>

                        <span
                            class="truncate text-xs font-bold text-slate-500"
                        >
                            ${escapeHtmlSipede(message)}
                        </span>

                    </div>

                    <span
                        class="shrink-0 text-xs font-black text-slate-600"
                    >
                        ${progressText}
                    </span>

                </div>

                <div
                    class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
                >

                    <div
                        class="h-full rounded-full bg-red-500 transition-all duration-300"
                        style="width:${safeProgress}%"
                    ></div>

                </div>

            </div>

        </td>
    `;

    sipedeKpiTableBody.appendChild(
        loadingRow
    );

}


function setSipedeKpiLoadButtonBusy(
    loading
) {

    /*
    |--------------------------------------------------------------------------
    | Jangan ubah innerHTML tombol.
    | Tombol selalu tetap:
    | "Tampilkan KPI"
    |--------------------------------------------------------------------------
    */

    loadSipedeKpiButton.disabled =
        loading;

}


/*
|--------------------------------------------------------------------------
| TABLE
|--------------------------------------------------------------------------
*/

function renderSipedeKpiTable() {

    sipedeKpiTableBody.innerHTML = "";

    if (
        !sipedeKpiRows.length
    ) {

        document
            .getElementById(
                "emptySipedeKpi"
            )
            .classList.remove(
                "hidden"
            );

        return;

    }

    document
        .getElementById(
            "emptySipedeKpi"
        )
        .classList.add(
            "hidden"
        );

    sipedeKpiRows.forEach(
        function (
            row,
            index
        ) {

            const tr =
                document.createElement(
                    "tr"
                );

            const actualValue =
                Number(
                    row.actualMtd
                );

            const actualHtml =
                sipedeKpiEditing
                    ? `
                        <input
                            type="number"
                            min="0"
                            step="any"
                            class="form-input !h-9 !min-h-0 !py-1.5 text-right"
                            data-sipede-actual="${index}"
                            value="${
                                Number.isFinite(
                                    actualValue
                                )
                                    ? actualValue
                                    : ""
                            }"
                        >
                    `
                    : `
                        <span
                            class="font-black text-slate-900"
                        >
                            ${formatSipedeNumber(actualValue)}
                        </span>
                    `;

            tr.innerHTML = `
                <td
                    class="text-center font-bold text-slate-400"
                >
                    ${index + 1}
                </td>

                <td>

                    <div
                        class="font-black text-slate-900"
                    >
                        ${escapeHtmlSipede(row.kpi)}
                    </div>

                    <div
                        class="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    >
                        ${escapeHtmlSipede(row.code)}
                    </div>

                </td>

                <td
                    class="text-right font-bold text-slate-600"
                >
                    ${formatSipedeNumber(
                        row.targetMonth
                    )}
                </td>

                <td
                    class="text-right font-bold text-slate-600"
                >
                    ${formatSipedeNumber(
                        row.targetMtd
                    )}
                </td>

                <td class="text-right">
                    ${actualHtml}
                </td>

                <td
                    class="text-right font-black ${getSipedePercentClass(
                        row.percentMtd
                    )}"
                >
                    ${formatSipedePercent(
                        row.percentMtd
                    )}
                </td>

                <td
                    class="text-right font-black text-slate-700"
                >
                    ${formatSipedePercent(
                        row.percentMonth
                    )}
                </td>

                <td
                    class="text-right font-bold text-slate-600"
                >
                    ${formatSipedePercent(
                        row.weight
                    )}
                </td>

                <td
                    class="text-right font-black text-slate-900"
                >
                    ${formatSipedePercent(
                        row.score
                    )}
                </td>
            `;

            sipedeKpiTableBody.appendChild(
                tr
            );

        }
    );

    document
        .querySelectorAll(
            "[data-sipede-actual]"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "input",
                    function () {

                        const index =
                            Number(
                                input.dataset.sipedeActual
                            );

                        sipedeKpiRows[
                            index
                        ].actualMtd =
                            Number(
                                input.value
                            ) || 0;

                        recalculateSipedeRows();

                        sipedeKpiDirty =
                            true;

                        sipedeKpiEditing =
                            true;

                        renderSipedeKpiTable();

                        renderSipedeKpiSummary({
                            master:
                                sipedeKpiMaster
                        });

                        updateSipedeKpiButtons({});

                    }
                );

            }
        );

}


function recalculateSipedeRows() {

    sipedeKpiRows.forEach(
        function (row) {

            const actual =
                Number(
                    row.actualMtd
                ) || 0;

            const targetMonth =
                Number(
                    row.targetMonth
                ) || 0;

            const targetMtd =
                Number(
                    row.targetMtd
                ) || 0;

            row.percentMtd =
                targetMtd > 0
                    ? (
                        actual /
                        targetMtd
                    ) * 100
                    : 0;

            row.percentMonth =
                targetMonth > 0
                    ? (
                        actual /
                        targetMonth
                    ) * 100
                    : 0;

            row.score =
                (
                    row.percentMonth *
                    Number(
                        row.weight
                    )
                ) / 100;

        }
    );

}


function formatSipedeNumber(
    value
) {

    const number =
        Number(value) || 0;

    return number.toLocaleString(
        "id-ID",
        {
            maximumFractionDigits:
                2
        }
    );

}


function formatSipedePercent(
    value
) {

    const number =
        Number(value) || 0;

    return `${number.toLocaleString(
        "id-ID",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}%`;

}


function formatSipedeCurrency(
    value
) {

    return `Rp${(
        Number(value) || 0
    ).toLocaleString(
        "id-ID"
    )}`;

}


function getSipedePercentClass(
    value
) {

    const score =
        Number(value) || 0;

    if (
        score >= 100
    ) {
        return "text-emerald-600";
    }

    if (
        score >= 80
    ) {
        return "text-slate-700";
    }

    if (
        score >= 60
    ) {
        return "text-amber-600";
    }

    return "text-red-600";

}


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

function calculateSipedeTotalScore() {

    return sipedeKpiRows.reduce(
        function (
            total,
            row
        ) {

            return total +
                (
                    Number(
                        row.score
                    ) || 0
                );

        },
        0
    );

}


function getSipedeStatus(
    score
) {

    if (
        score >= 100
    ) {
        return "TERCAPAI";
    }

    if (
        score >= 80
    ) {
        return "AMAN";
    }

    if (
        score >= 60
    ) {
        return "EVALUASI";
    }

    return "SURAT TEGURAN";

}


function getSipedeIncentive(
    score
) {

    const rules =
        sipedeKpiMaster &&
        sipedeKpiMaster.payroll
            ? sipedeKpiMaster.payroll
            : {};

    if (
        score >= 150
    ) {

        return Number(
            rules.INSENTIF_150 || 0
        );

    }

    if (
        score >= 100
    ) {

        return Number(
            rules.INSENTIF_100 || 0
        );

    }

    if (
        score >= 80
    ) {

        return Number(
            rules.INSENTIF_80 || 0
        );

    }

    return Number(
        rules.INSENTIF_BELOW_80 || 0
    );

}


function renderSipedeKpiSummary() {

    const score =
        calculateSipedeTotalScore();

    const status =
        getSipedeStatus(
            score
        );

    const incentive =
        getSipedeIncentive(
            score
        );

    const payroll =
        sipedeKpiMaster &&
        sipedeKpiMaster.payroll
            ? sipedeKpiMaster.payroll
            : {};

    const cash =
        Number(
            sipedeKpiCashInput.value
        ) || 0;

    const credit =
        Number(
            sipedeKpiCreditInput.value
        ) || 0;

    const totalSales =
        cash + credit;

    const totalIncentive =
        totalSales *
        incentive;

    const baseSalary =
        score >=
        Number(
            payroll.BATAS_AMAN || 80
        )
            ? Number(
                payroll.GAJI_POKOK || 0
            )
            : 0;

    const totalReceived =
        baseSalary +
        totalIncentive;

    sipedeKpiTotalScore.textContent =
        formatSipedePercent(
            score
        );

    sipedeKpiTableTotal.textContent =
        formatSipedePercent(
            score
        );

    sipedeKpiIncentivePerUnit.textContent =
        formatSipedeCurrency(
            incentive
        );

    sipedeKpiTotalIncentive.textContent =
        formatSipedeCurrency(
            totalIncentive
        );

    sipedeKpiBaseSalary.textContent =
        formatSipedeCurrency(
            baseSalary
        );

    sipedeKpiTotalReceived.textContent =
        formatSipedeCurrency(
            totalReceived
        );

    sipedeKpiTotalCash.textContent =
        formatSipedeNumber(
            cash
        );

    sipedeKpiTotalCredit.textContent =
        formatSipedeNumber(
            credit
        );

    sipedeKpiTotalSales.textContent =
        formatSipedeNumber(
            totalSales
        );

    sipedeKpiMtdHelper.textContent =
        `Status: ${status}`;

    sipedeKpiSalaryNote.textContent =
        score < 80
            ? "Score di bawah 80%: gaji pokok tidak diberikan."
            : "Gaji pokok diberikan sesuai parameter master.";

}


/*
|--------------------------------------------------------------------------
| RULES
|--------------------------------------------------------------------------
*/

function renderSipedeKpiRules() {

    sipedeKpiIncentiveRules.innerHTML = `
        ${sipedeRule(
            "≥ 150%",
            "Rp400.000 / unit"
        )}

        ${sipedeRule(
            "≥ 100%",
            "Rp300.000 / unit"
        )}

        ${sipedeRule(
            "80% – 99,99%",
            "Rp200.000 / unit"
        )}

        ${sipedeRule(
            "< 80%",
            "Rp100.000 / unit"
        )}
    `;

    sipedeKpiStatusRules.innerHTML = `
        ${sipedeRule(
            "≥ 100%",
            "TERCAPAI"
        )}

        ${sipedeRule(
            "80% – 99,99%",
            "AMAN"
        )}

        ${sipedeRule(
            "60% – 79,99%",
            "EVALUASI"
        )}

        ${sipedeRule(
            "< 60%",
            "SURAT TEGURAN"
        )}
    `;

}


function sipedeRule(
    left,
    right
) {

    return `
        <div
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
        >

            <span
                class="text-sm font-bold text-slate-600"
            >
                ${left}
            </span>

            <span
                class="text-sm font-black text-slate-900"
            >
                ${right}
            </span>

        </div>
    `;

}


/*
|--------------------------------------------------------------------------
| HO
|--------------------------------------------------------------------------
*/

function renderSipedeHo(
    result
) {

    const canViewHo =
        result.canViewHo === true;

    if (
        !canViewHo
    ) {

        sipedeHoEvaluation.classList.add(
            "hidden"
        );

        return;

    }

    sipedeHoEvaluation.classList.remove(
        "hidden"
    );

    const rows =
        Array.isArray(
            result.data
        )
            ? result.data
            : [];

    sipedeHoTableBody.innerHTML = "";

    rows.forEach(
        function (
            row,
            index
        ) {

            const tr =
                document.createElement(
                    "tr"
                );

            const actualHo =
                Number(
                    row.actualHo
                );

            const scoreHo =
                Number(
                    row.scoreHo
                );

            tr.innerHTML = `
                <td
                    class="text-center font-bold text-slate-400"
                >
                    ${index + 1}
                </td>

                <td>

                    <div
                        class="font-black text-slate-900"
                    >
                        ${escapeHtmlSipede(
                            row.kpi
                        )}
                    </div>

                </td>

                <td class="text-right">
                    ${formatSipedeNumber(
                        row.targetMonth
                    )}
                </td>

                <td class="text-right">
                    ${formatSipedeNumber(
                        row.actualMtd
                    )}
                </td>

                <td>

                    <input
                        type="number"
                        min="0"
                        step="any"
                        class="form-input !h-9 !min-h-0 !py-1.5 text-right"
                        data-sipede-ho-index="${index}"
                        value="${
                            Number.isFinite(
                                actualHo
                            )
                                ? actualHo
                                : ""
                        }"
                    >

                </td>

                <td
                    class="text-right font-black text-slate-900"
                >
                    ${formatSipedePercent(
                        scoreHo
                    )}
                </td>

                <td>

                    <span
                        class="text-xs font-black text-slate-500"
                    >
                        ${escapeHtmlSipede(
                            getSipedeStatus(
                                scoreHo
                            )
                        )}
                    </span>

                </td>
            `;

            sipedeHoTableBody.appendChild(
                tr
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| BUTTONS
|--------------------------------------------------------------------------
*/

function updateSipedeKpiButtons(
    result
) {

    const canInput =
        canInputSipedeKpi();

    const canEditSales =
        canInput &&
        sipedeKpiEditing;

    sipedeKpiCashInput.disabled =
        !canEditSales;

    sipedeKpiCreditInput.disabled =
        !canEditSales;

    const canVerify =
        canVerifySipedeKpi();

    newSipedeKpiButton.classList.toggle(
        "hidden",
        !canInput ||
        sipedeKpiEditing
    );

    saveSipedeKpiButton.classList.toggle(
        "hidden",
        !canInput ||
        !sipedeKpiEditing
    );

    cancelSipedeKpiButton.classList.toggle(
        "hidden",
        !sipedeKpiEditing
    );

    verifySipedeKpiButton.classList.toggle(
        "hidden",
        !canVerify
    );

    sipedeKpiInputBadge.textContent =
        sipedeKpiEditing
            ? "EDIT"
            : "VIEW";

    sipedeKpiDirtyBadge.classList.toggle(
        "hidden",
        !sipedeKpiDirty
    );

}


/*
|--------------------------------------------------------------------------
| EDIT
|--------------------------------------------------------------------------
*/

function startSipedeKpiInput() {

    if (
        !canInputSipedeKpi()
    ) {

        showToast(
            "Akun ini tidak memiliki akses input KPI SiPede.",
            "error"
        );

        return;

    }

    sipedeKpiEditing =
        true;

    sipedeKpiDirty =
        false;

    renderSipedeKpiTable();

    updateSipedeKpiButtons({});

}


function cancelSipedeKpiInput() {

    sipedeKpiRows =
        JSON.parse(
            JSON.stringify(
                sipedeKpiSavedRows
            )
        );

    sipedeKpiEditing =
        false;

    sipedeKpiDirty =
        false;

    sipedeKpiCashInput.value =
        sipedeKpiSavedSales.cash;

    sipedeKpiCreditInput.value =
        sipedeKpiSavedSales.credit;

    sipedeKpiTotalSalesInput.textContent =
        formatSipedeNumber(
            sipedeKpiSavedSales.total
        );

    renderSipedeKpiTable();

    renderSipedeKpiSummary();

    updateSipedeKpiButtons({});

}


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

async function saveSipedeKpi() {

    if (
        !sipedeKpiDirty
    ) {

        showToast(
            "Belum ada perubahan yang perlu disimpan.",
            "error"
        );

        return;

    }

    const period =
        getSelectedSipedePeriod();

    const nik =
        String(
            sipedeKpiNik.value ||
            ""
        ).trim();

    if (
        !nik
    ) {

        showToast(
            "Identitas SiPede belum tersedia untuk cabang ini.",
            "error"
        );

        return;

    }

    try {

        saveSipedeKpiButton.disabled =
            true;

        const metrics =
            sipedeKpiRows.map(
                function (row) {

                    return {

                        code:
                            row.code,

                        actualMtd:
                            Number(
                                row.actualMtd
                            ) || 0

                    };

                }
            );

        await requestBackend(
            "saveSipedeKpi",
            {

                branch:
                    period.branch,

                year:
                    period.year,

                month:
                    period.month,

                week:
                    period.week,

                snapshotType:
                    period.snapshotType,

                nik:
                    nik,

                cash:
                    Number(
                        sipedeKpiCashInput.value
                    ) || 0,

                credit:
                    Number(
                        sipedeKpiCreditInput.value
                    ) || 0,

                metrics:
                    metrics

            }
        );

        showToast(
            "KPI SiPede berhasil disimpan."
        );

        sipedeKpiEditing =
            false;

        sipedeKpiDirty =
            false;

        await loadSipedeKpiPage();

    } catch (error) {

        showToast(
            error.message ||
            "KPI SiPede gagal disimpan.",
            "error"
        );

    } finally {

        saveSipedeKpiButton.disabled =
            false;

    }

}


/*
|--------------------------------------------------------------------------
| VERIFY HO
|--------------------------------------------------------------------------
*/

async function verifySipedeKpi() {

    if (
        !canVerifySipedeKpi()
    ) {

        return;

    }

    const period =
        getSelectedSipedePeriod();

    const metrics =
        sipedeKpiRows.map(
            function (
                row,
                index
            ) {

                const input =
                    document.querySelector(
                        `[data-sipede-ho-index="${index}"]`
                    );

                return {

                    code:
                        row.code,

                    actualHo:
                        input
                            ? Number(
                                input.value
                            ) || 0
                            : 0

                };

            }
        );

    try {

        verifySipedeKpiButton.disabled =
            true;

        await requestBackend(
            "verifySipedeKpi",
            {

                branch:
                    period.branch,

                year:
                    period.year,

                month:
                    period.month,

                week:
                    period.week,

                snapshotType:
                    period.snapshotType,

                nik:
                    sipedeKpiNik.value,

                metrics:
                    metrics,

                note:
                    sipedeHoNote.value || ""

            }
        );

        showToast(
            "Evaluasi HO berhasil disimpan."
        );

        await loadSipedeKpiPage();

    } catch (error) {

        showToast(
            error.message ||
            "Evaluasi HO gagal disimpan.",
            "error"
        );

    } finally {

        verifySipedeKpiButton.disabled =
            false;

    }

}


/*
|--------------------------------------------------------------------------
| ESCAPE
|--------------------------------------------------------------------------
*/

function escapeHtmlSipede(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

loadSipedeKpiButton.addEventListener(
    "click",
    loadSipedeKpiPage
);

newSipedeKpiButton.addEventListener(
    "click",
    startSipedeKpiInput
);

saveSipedeKpiButton.addEventListener(
    "click",
    saveSipedeKpi
);

cancelSipedeKpiButton.addEventListener(
    "click",
    cancelSipedeKpiInput
);

verifySipedeKpiButton.addEventListener(
    "click",
    verifySipedeKpi
);


window.loadSipedeKpiPage =
    loadSipedeKpiPage;