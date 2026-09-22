"use strict";

/*
|--------------------------------------------------------------------------
| PEMERIKSAAN SESSION LOGIN
|--------------------------------------------------------------------------
| Login dan index menggunakan halaman terpisah.
*/

const savedSession =
    sessionStorage.getItem("currentUser");

const sessionToken =
    sessionStorage.getItem("sessionToken");

if (!savedSession || !sessionToken) {
    window.location.replace("login.html");

    throw new Error(
        "User belum login."
    );
}

let currentUser;
let activePageId = "";

let sheetPkmData = [];

let sheetBranchOptions = [
    { code: "SLO", name: "SOLO YOS" },
    { code: "RJM", name: "RAJIMAN" },
    { code: "KRA", name: "KARANGANYAR" },
    { code: "KRP", name: "KARANGPANDAN" },
    { code: "SRG", name: "SRAGEN" },
    { code: "WNG", name: "WONOGIRI" },
    { code: "NGA", name: "NGAWI" },
    { code: "CRB", name: "CARUBAN" },
    { code: "STY", name: "SUTOYO" },
    { code: "KSM", name: "KUSUMANEGARA" }
];
let activePkmFilters = {
    startDate: "",
    endDate: "",
    jenisPkm: "ALL",
    branches: []
};
let pkmDataLoading = false;
const PKM_PAGE_SIZE = 15;

let currentPkmPage = 1;

try {
    currentUser =
        JSON.parse(savedSession);
} catch (error) {
    sessionStorage.removeItem(
        "currentUser"
    );

    window.location.replace(
        "login.html"
    );

    throw new Error(
        "Session login tidak valid."
    );
}

if (
    !currentUser ||
    !currentUser.username ||
    !currentUser.role ||
    currentUser.status !== "AKTIF"
) {
    sessionStorage.removeItem(
        "currentUser"
    );

    window.location.replace(
        "login.html"
    );

    throw new Error(
        "Session login tidak valid."
    );
}

/*
|--------------------------------------------------------------------------
| DETAIL BUDGET
|--------------------------------------------------------------------------
*/

const budgetItemNameInput =
    document.getElementById(
        "budgetItemName"
    );

const budgetTotalPriceInput =
    document.getElementById(
        "budgetTotalPrice"
    );

const budgetQuantityInput =
    document.getElementById(
        "budgetQuantity"
    );

const budgetItemTypeInput =
    document.getElementById(
        "budgetItemType"
    );

const addBudgetDetailButton =
    document.getElementById(
        "addBudgetDetailButton"
    );

const cancelBudgetEditButton =
    document.getElementById(
        "cancelBudgetEditButton"
    );

const budgetDetailTableBody =
    document.getElementById(
        "budgetDetailTableBody"
    );

const emptyBudgetDetail =
    document.getElementById(
        "emptyBudgetDetail"
    );

let budgetDetails = [];
let editingBudgetId = null;

let salesmanData = [];

const leasingOptions = [
    "FIF",
    "OTO",
    "ADIRA",
    "MANDIRI UTAMA FINANCE",
    "INDOMOBIL FINANCE",
    "BCA FINANCE"
];

/*
|--------------------------------------------------------------------------
| CONTOH DATA LAMA
|--------------------------------------------------------------------------
| Data ini mensimulasikan data yang sudah ada sebelum web digunakan.
*/

const legacyPkm = [
    {
        id: "CRBATL3-0e30161225",
        name: "HIASAN NATAL",
        branch: "CRB",
        branchName: "CARUBAN",

        type: ["H1"],
        jenisPkm: "ATL BIASA",
        kegiatan: "Ajuan ATL",

        startDate: "2025-12-16T10:09:34",
        endDate: "2025-12-17T10:09:40",

        location: "CSM CARUBAN",
        kabupaten: "KAB. MADIUN",
        kecamatan: "Mejayan",
        kelurahan: "Bangunsari",

        alasan: "MENINGKATKAN MINAT KONSUMEN UNTUK BERKUNJUNG",
        konsep: "PEMASANGAN SLINGER DAN HIASAN BERTEMA NATAL",

        people: [],
        focusType: [],
        programH1: "GEMPITA HONDA DAN UNDIAN UMROH",
        programH23: "",
        publication: [],
        leasing: [],

        danaCsm: 89000,
        danaMd: 0,
        danaLeasing: 0,
        danaLain: 0,
        totalFund: 89000,

        targetDb: 0,
        targetDeal: 0,
        targetUe: 0,

        pengajuan: "ACC",
        status: "ACC",
        source: "LEGACY",

        createdBy: "IMPORT",
        createdAt: "2025-12-16T10:09:34"
    }
];

/*
|--------------------------------------------------------------------------
| ELEMENT HTML
|--------------------------------------------------------------------------
*/

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const pkmSubmenu = document.getElementById("pkmSubmenu");
const pkmForm = document.getElementById("pkmForm");

const peopleSearch =
    document.getElementById("peopleSearch");

const peopleSearchResults =
    document.getElementById("peopleSearchResults");

const selectedPeopleContainer =
    document.getElementById("selectedPeopleContainer");

const selectedPeopleCount =
    document.getElementById("selectedPeopleCount");

let selectedPeople = [];

const leasingContainer =
    document.getElementById("leasingContainer");

const pkmTableBody =
    document.getElementById("pkmTableBody");

const emptyPkm =
    document.getElementById("emptyPkm");


/*
|--------------------------------------------------------------------------
| VARIABEL PETA
|--------------------------------------------------------------------------
*/

let locationMap = null;
let locationMarker = null;

const defaultMapLocation = {
    latitude: -7.5666,
    longitude: 110.8167,
    zoom: 10
};


/*
|--------------------------------------------------------------------------
| INISIALISASI PETA
|--------------------------------------------------------------------------
*/

function initializeLocationMap() {
    if (locationMap) {
        locationMap.invalidateSize();
        return;
    }

    if (typeof L === "undefined") {
        setMapStatus(
            "Peta gagal dimuat. Periksa koneksi internet.",
            "error"
        );

        return;
    }

    locationMap = L.map("locationMap").setView(
        [
            defaultMapLocation.latitude,
            defaultMapLocation.longitude
        ],
        defaultMapLocation.zoom
    );

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(locationMap);

    /*
    |--------------------------------------------------------------------------
    | PILIH LOKASI DENGAN KLIK PETA
    |--------------------------------------------------------------------------
    */

    locationMap.on("click", async function (event) {
        const latitude = event.latlng.lat;
        const longitude = event.latlng.lng;

        await selectLocationFromCoordinates(
            latitude,
            longitude
        );
    });
}


function setMapStatus(message, type = "default") {
    const statusElement =
        document.getElementById("mapStatus");

    statusElement.textContent = message;

    statusElement.classList.remove(
        "map-loading",
        "map-success",
        "map-error"
    );

    if (type === "loading") {
        statusElement.classList.add("map-loading");
    }

    if (type === "success") {
        statusElement.classList.add("map-success");
    }

    if (type === "error") {
        statusElement.classList.add("map-error");
    }
}

function placeLocationMarker(
    latitude,
    longitude,
    popupText = "Lokasi kegiatan"
) {
    initializeLocationMap();

    if (!locationMap) {
        return;
    }

    const coordinates = [
        Number(latitude),
        Number(longitude)
    ];

    if (locationMarker) {
        locationMarker.setLatLng(coordinates);
    } else {
        locationMarker = L.marker(coordinates, {
            draggable: true
        }).addTo(locationMap);

        /*
        |--------------------------------------------------------------------------
        | MARKER DIGESER
        |--------------------------------------------------------------------------
        */

        locationMarker.on(
            "dragend",
            async function (event) {
                const markerPosition =
                    event.target.getLatLng();

                await selectLocationFromCoordinates(
                    markerPosition.lat,
                    markerPosition.lng
                );
            }
        );
    }

    locationMarker
        .bindPopup(escapeHtml(popupText))
        .openPopup();

    locationMap.setView(coordinates, 16);

    document.getElementById("latitude").value =
        Number(latitude).toFixed(7);

    document.getElementById("longitude").value =
        Number(longitude).toFixed(7);
}

async function selectLocationFromCoordinates(
    latitude,
    longitude
) {
    placeLocationMarker(
        latitude,
        longitude,
        "Mencari alamat..."
    );

    setMapStatus(
        "Mencari alamat dari titik yang dipilih...",
        "loading"
    );

    try {
        const url =
            "https://nominatim.openstreetmap.org/reverse" +
            "?format=jsonv2" +
            "&addressdetails=1" +
            "&accept-language=id" +
            `&lat=${encodeURIComponent(latitude)}` +
            `&lon=${encodeURIComponent(longitude)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Gagal mendapatkan alamat lokasi."
            );
        }

        const result = await response.json();

        fillLocationFields(result);

        placeLocationMarker(
            latitude,
            longitude,
            result.display_name || "Lokasi kegiatan"
        );

        setMapStatus(
            "Lokasi berhasil dipilih.",
            "success"
        );
    } catch (error) {
        document.getElementById("latitude").value =
            Number(latitude).toFixed(7);

        document.getElementById("longitude").value =
            Number(longitude).toFixed(7);

        setMapStatus(
            "Koordinat tersimpan, tetapi alamat belum berhasil ditemukan.",
            "error"
        );
    }
}

function fillLocationFields(location) {
    const address = location.address || {};

    const locationName =
        location.display_name ||
        [
            address.road,
            address.village,
            address.town,
            address.city
        ]
            .filter(Boolean)
            .join(", ");

    const kabupaten =
        address.city ||
        address.county ||
        address.municipality ||
        address.regency ||
        address.town ||
        "";

    const kecamatan =
        address.city_district ||
        address.district ||
        address.suburb ||
        "";

    const kelurahan =
        address.village ||
        address.hamlet ||
        address.neighbourhood ||
        address.quarter ||
        "";

    document.getElementById("lokasi").value =
        locationName;

    document.getElementById("kabupaten").value =
        kabupaten;

    document.getElementById("kecamatan").value =
        kecamatan;

    document.getElementById("kelurahan").value =
        kelurahan;

    if (location.lat) {
        document.getElementById("latitude").value =
            Number(location.lat).toFixed(7);
    }

    if (location.lon) {
        document.getElementById("longitude").value =
            Number(location.lon).toFixed(7);
    }

    validateFormState();
}

/*
|--------------------------------------------------------------------------
| UTILITAS
|--------------------------------------------------------------------------
*/

function rupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function selectedValues(selector) {
    return [
        ...document.querySelectorAll(`${selector}:checked`)
    ].map(function (input) {
        return input.value;
    });
}

function combineDateTime(date, time) {
    if (!date || !time) {
        return null;
    }

    return `${date}T${time}`;
}

function getStoredPkm() {
    try {
        return JSON.parse(
            localStorage.getItem("pkmData") || "[]"
        );
    } catch (error) {
        localStorage.removeItem("pkmData");
        return [];
    }
}

function saveStoredPkm(data) {
    localStorage.setItem(
        "pkmData",
        JSON.stringify(data)
    );
}

/*
|--------------------------------------------------------------------------
| API DAN FILTER DATA PKM
|--------------------------------------------------------------------------
*/

async function requestBackend(action, payload = {}) {
    const response = await fetch("/api/gas", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            action: action,
            token: sessionToken,
            payload: payload
        })
    });

const responseText =
    await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch (error) {
        throw new Error(
            responseText
                ? `Server HTTP ${response.status}: ${responseText.slice(0, 300)}`
                : `Server tidak memberikan respons. HTTP ${response.status}.`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TANGANI ERROR DARI VERCEL ATAU APPS SCRIPT
    |--------------------------------------------------------------------------
    */

    if (
        !response.ok ||
        data.success === false
    ) {
        const serverMessage =
            data.message ||
            data.error?.message ||
            (
                typeof data.error === "string"
                    ? data.error
                    : ""
            );

        throw new Error(
            serverMessage ||
            `Permintaan ke server gagal (HTTP ${response.status}).`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT RESPONSE
    |--------------------------------------------------------------------------
    | Apps Script biasanya:
    | { success: true, result: {...} }
    |
    | Proxy Vercel juga dapat langsung mengembalikan:
    | {...}
    */

    if (
        data.success === true &&
        Object.prototype.hasOwnProperty.call(
            data,
            "result"
        )
    ) {
        return data.result;
    }

    return data;
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
    const now = new Date();

    return {
        startDate: toDateInputValue(
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )
        ),
        endDate: toDateInputValue(
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            )
        )
    };
}

function isHeadOfficeUser() {
    return (
        currentUser.branch === "ALL" ||
        currentUser.originalBranch === "HO"
    );
}

function initializePkmFilters() {
    const range = getCurrentMonthRange();

    ["dashboard", "list"].forEach(
        function (prefix) {
            const startInput = document.getElementById(
                `${prefix}StartDate`
            );
            const endInput = document.getElementById(
                `${prefix}EndDate`
            );

            if (startInput) {
                startInput.value = range.startDate;
            }

            if (endInput) {
                endInput.value = range.endDate;
            }
        }
    );

    activePkmFilters = {
        startDate: range.startDate,
        endDate: range.endDate,
        jenisPkm: "ALL",
        branches: isHeadOfficeUser()
            ? []
            : [
                currentUser.originalBranch ||
                currentUser.branch
            ]
    };
}

function renderBranchFilter(prefix) {
    const container = document.getElementById(
        `${prefix}BranchFilter`
    );

    if (!container) {
        return;
    }

    if (!isHeadOfficeUser()) {
        container.innerHTML = `
            <input
                class="form-input bg-slate-100 font-bold text-slate-600"
                type="text"
                value="${escapeHtml(
                    `${currentUser.originalBranch || currentUser.branch} — ${currentUser.branchName}`
                )}"
                readonly
            >
        `;

        return;
    }

    container.innerHTML = `
        <details class="relative">
            <summary class="form-input flex cursor-pointer list-none items-center justify-between font-bold">
                <span id="${prefix}BranchSummary">Semua cabang</span>
                <span>⌄</span>
            </summary>

            <div class="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <label class="mb-2 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50">
                    <input type="checkbox" data-branch-all="${prefix}" checked>
                    <span class="font-black text-slate-800">Semua cabang</span>
                </label>

                <div class="border-t border-slate-100 pt-2">
                    ${sheetBranchOptions.map(function (branch) {
                        return `
                            <label class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    data-branch-option="${prefix}"
                                    value="${escapeHtml(branch.code)}"
                                >
                                <span class="text-sm font-bold text-slate-700">
                                    ${escapeHtml(branch.code)} — ${escapeHtml(branch.name)}
                                </span>
                            </label>
                        `;
                    }).join("")}
                </div>
            </div>
        </details>
    `;

    const allCheckbox = container.querySelector(
        `[data-branch-all="${prefix}"]`
    );

    const branchCheckboxes = [
        ...container.querySelectorAll(
            `[data-branch-option="${prefix}"]`
        )
    ];

    function updateSummary() {
        const selected = branchCheckboxes
            .filter(function (checkbox) {
                return checkbox.checked;
            })
            .map(function (checkbox) {
                return checkbox.value;
            });

        const summary = document.getElementById(
            `${prefix}BranchSummary`
        );

        if (allCheckbox.checked || !selected.length) {
            summary.textContent = "Semua cabang";
        } else if (selected.length <= 3) {
            summary.textContent = selected.join(", ");
        } else {
            summary.textContent = `${selected.length} cabang dipilih`;
        }
    }

    allCheckbox.addEventListener("change", function () {
        if (allCheckbox.checked) {
            branchCheckboxes.forEach(function (checkbox) {
                checkbox.checked = false;
            });
        }

        updateSummary();
    });

    branchCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                allCheckbox.checked = false;
            }

            if (
                !branchCheckboxes.some(function (item) {
                    return item.checked;
                })
            ) {
                allCheckbox.checked = true;
            }

            updateSummary();
        });
    });
}

function getSelectedBranches(prefix) {
    if (!isHeadOfficeUser()) {
        return [
            currentUser.originalBranch ||
            currentUser.branch
        ];
    }

    const allCheckbox = document.querySelector(
        `[data-branch-all="${prefix}"]`
    );

    if (!allCheckbox || allCheckbox.checked) {
        return [];
    }

    return [
        ...document.querySelectorAll(
            `[data-branch-option="${prefix}"]:checked`
        )
    ].map(function (checkbox) {
        return checkbox.value;
    });

    /*
    |--------------------------------------------------------------------------
    | BAGIKAN FUNCTION FILTER UNTUK LPJ.JS
    |--------------------------------------------------------------------------
    */

    window.renderBranchFilter =
        renderBranchFilter;

    window.getSelectedBranches =
        getSelectedBranches;
}

function readPkmFilters(prefix) {
    return {
        startDate:
            document.getElementById(
                `${prefix}StartDate`
            )?.value || "",

        endDate:
            document.getElementById(
                `${prefix}EndDate`
            )?.value || "",

        jenisPkm:
            document.getElementById(
                `${prefix}JenisPkm`
            )?.value || "ALL",

        branches: getSelectedBranches(prefix)
    };
}

function validatePkmFilter(filters) {
    if (
        filters.startDate &&
        filters.endDate &&
        filters.startDate > filters.endDate
    ) {
        throw new Error(
            "Tanggal pelaksanaan awal tidak boleh melebihi tanggal akhir."
        );
    }
}

let pkmLoadingProgress = 0;
let pkmLoadingInterval = null;
let pkmLoadingHideTimeout = null;


function updatePkmLoadingProgress(
    progress,
    message = ""
) {
    pkmLoadingProgress =
        Math.max(
            0,
            Math.min(100, progress)
        );

    const bar =
        document.getElementById(
            "pkmLoadingBar"
        );

    const percentage =
        document.getElementById(
            "pkmLoadingPercentage"
        );

    const messageElement =
        document.getElementById(
            "pkmLoadingMessage"
        );

    if (bar) {
        bar.style.width =
            `${pkmLoadingProgress}%`;
    }

    if (percentage) {
        percentage.textContent =
            `${Math.round(
                pkmLoadingProgress
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

function setPkmLoading(isLoading) {
    pkmDataLoading = isLoading;

    const loadingPanel =
        document.getElementById(
            "pkmTableLoading"
        );

    window.clearInterval(
        pkmLoadingInterval
    );

    window.clearTimeout(
        pkmLoadingHideTimeout
    );

    [
        "applyDashboardFilter",
        "applyPkmFilter"
    ].forEach(function (id) {
        const button =
            document.getElementById(id);

        if (!button) {
            return;
        }

        button.disabled = isLoading;

        button.classList.toggle(
            "cursor-wait",
            isLoading
        );

        button.classList.toggle(
            "opacity-80",
            isLoading
        );
    });

    if (!loadingPanel) {
        return;
    }

    if (isLoading) {
        loadingPanel.classList.remove(
            "hidden"
        );

        loadingPanel.classList.add(
            "flex"
        );

        updatePkmLoadingProgress(
            8,
            "Menghubungkan ke Google Spreadsheet..."
        );

        pkmLoadingInterval =
            window.setInterval(
                function () {
                    if (
                        pkmLoadingProgress >= 92
                    ) {
                        return;
                    }

                    const addition =
                        Math.floor(
                            Math.random() * 6
                        ) + 2;

                    updatePkmLoadingProgress(
                        Math.min(
                            92,
                            pkmLoadingProgress +
                            addition
                        ),
                        pkmLoadingProgress < 45
                            ? "Membaca data PKM..."
                            : pkmLoadingProgress < 75
                                ? "Memproses dan memfilter data..."
                                : "Menyiapkan tabel..."
                    );
                },
                220
            );

        return;
    }

    updatePkmLoadingProgress(
        100,
        "Data berhasil dimuat."
    );

    pkmLoadingHideTimeout =
        window.setTimeout(
            function () {
                loadingPanel.classList.add(
                    "hidden"
                );

                loadingPanel.classList.remove(
                    "flex"
                );

                updatePkmLoadingProgress(
                    0
                );
            },
            350
        );
}

async function loadPkmData(prefix = "dashboard") {
    if (pkmDataLoading) {
        return;
    }

    try {
        const filters = readPkmFilters(prefix);
        validatePkmFilter(filters);
        setPkmLoading(true);

        const result = await requestBackend(
            "getPkmData",
            filters
        );

        sheetPkmData = Array.isArray(result.data)
            ? result.data
            : [];

        if (
            Array.isArray(result.branches) &&
            result.branches.length
        ) {
            sheetBranchOptions = result.branches;
        }

        activePkmFilters = result.appliedFilters || filters;

        if (
            isHeadOfficeUser() &&
            !document.querySelector(
                '[data-branch-option="dashboard"]'
            )
        ) {
            renderBranchFilter("dashboard");
            renderBranchFilter("list");
        }

        renderAllData();
        updateFilterInformation(prefix);
    } catch (error) {
        if (
            String(error.message).includes(
                "Sesi login"
            )
        ) {
            sessionStorage.clear();
            window.location.replace("login.html");
            return;
        }

        showToast(
            error.message ||
            "Data PKM gagal dimuat."
        );
    } finally {
        setPkmLoading(false);
    }
}

function updateFilterInformation(prefix) {
    const branches = activePkmFilters.branches || [];
    const branchText = isHeadOfficeUser()
        ? (
            branches.length === sheetBranchOptions.length ||
            !branches.length
                ? "Semua cabang"
                : branches.join(", ")
        )
        : `${currentUser.originalBranch || currentUser.branch}`;

    const dateText =
        activePkmFilters.startDate &&
        activePkmFilters.endDate
            ? `${activePkmFilters.startDate} s.d. ${activePkmFilters.endDate}`
            : "Semua tanggal pelaksanaan";

    const message =
        `${dateText} • ${activePkmFilters.jenisPkm || "ALL"} • ${branchText}`;

    [
        "dashboardFilterInfo",
        "listFilterInfo"
    ].forEach(function (id) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = message;
        }
    });
}

function matchesActivePkmFilters(item) {
    const filter = activePkmFilters;
    const selectedBranches = filter.branches || [];

    if (
        selectedBranches.length &&
        !selectedBranches.includes(item.branch)
    ) {
        return false;
    }

    if (
        filter.jenisPkm !== "ALL" &&
        item.jenisPkm !== filter.jenisPkm
    ) {
        return false;
    }

    const start = item.startDate
        ? new Date(item.startDate)
        : null;
    const end = item.endDate
        ? new Date(item.endDate)
        : start;
    const filterStart = filter.startDate
        ? new Date(`${filter.startDate}T00:00:00`)
        : null;
    const filterEnd = filter.endDate
        ? new Date(`${filter.endDate}T23:59:59`)
        : null;

    if (!start && (filterStart || filterEnd)) {
        return false;
    }

    if (filterEnd && start > filterEnd) {
        return false;
    }

    if (filterStart && end < filterStart) {
        return false;
    }

    return true;
}

function escapeHtml(value) {
    const temporaryElement = document.createElement("div");

    temporaryElement.textContent = String(value ?? "");

    return temporaryElement.innerHTML;
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.remove("hidden");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(function () {
        toast.classList.add("hidden");
    }, 3500);
}

function generatePkmId(branch, jenisPkm) {
    const typeCode = jenisPkm
        .replaceAll(" ", "")
        .substring(0, 4)
        .toUpperCase();

    const randomCode = crypto
        .randomUUID()
        .replaceAll("-", "")
        .substring(0, 8);

    const dateCode = new Date()
        .toLocaleDateString("en-GB")
        .replaceAll("/", "");

    return `${branch}${typeCode}-${randomCode}${dateCode}`;
}

/*
|--------------------------------------------------------------------------
| OPSI JENIS PKM BERDASARKAN CABANG LOGIN
|--------------------------------------------------------------------------
*/

function populateJenisPkmOptions() {
    const jenisPkmSelect =
        document.getElementById("jenisPkm");

    if (!jenisPkmSelect) {
        return;
    }

    jenisPkmSelect.innerHTML = `
        <option value="" selected disabled>
            Pilih jenis PKM
        </option>

        <optgroup label="ATL">
            <option
                value="ATL BIASA"
                data-category="ATL"
            >
                ATL BIASA
            </option>

            <option
                value="ATL DEALER"
                data-category="ATL"
            >
                ATL DEALER
            </option>
        </optgroup>

        <optgroup label="BTL">
            <option
                value="BTL BIASA"
                data-category="BTL"
            >
                BTL BIASA
            </option>

            <option
                value="BTL DEALER"
                data-category="BTL"
            >
                BTL DEALER
            </option>
        </optgroup>
    `;
}

let salesmanLoadPromise = null;


function waitForSalesmanRetry(
    milliseconds
) {
    return new Promise(
        function (resolve) {
            window.setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}


function loadSalesmanData() {
    /*
    |--------------------------------------------------------------------------
    | CEGAH REQUEST GANDA
    |--------------------------------------------------------------------------
    */

    if (salesmanLoadPromise) {
        return salesmanLoadPromise;
    }

    salesmanLoadPromise =
        loadSalesmanWithRetry();

    return salesmanLoadPromise;
}


async function loadSalesmanWithRetry() {
    const maximumAttempts = 3;

    if (peopleSearch) {
        peopleSearch.placeholder =
            "Memuat data salesman...";
    }

    for (
        let attempt = 1;
        attempt <= maximumAttempts;
        attempt += 1
    ) {
        try {
            const result =
                await requestBackend(
                    "getSalesmen",
                    {
                        branch:
                            currentUser.branch
                    }
                );

            salesmanData =
                Array.isArray(
                    result.salesmen
                )
                    ? result.salesmen
                    : [];

            console.log(
                `Data salesman dimuat: ${salesmanData.length}`
            );

            if (peopleSearch) {
                peopleSearch.placeholder =
                    "Ketik nama atau NIK...";
            }

            return salesmanData;
        } catch (error) {
            console.warn(
                `Percobaan memuat salesman ${attempt}/${maximumAttempts} gagal:`,
                error
            );

            const emptyResponse =
                String(
                    error.message || ""
                ).includes(
                    "Server tidak memberikan respons"
                );

            /*
            | Error validasi seperti session habis atau action tidak tersedia
            | tidak perlu diulang.
            */

            if (
                !emptyResponse ||
                attempt === maximumAttempts
            ) {
                salesmanData = [];

                if (peopleSearch) {
                    peopleSearch.placeholder =
                        "Data salesman gagal dimuat";
                }

                showToast(
                    error.message ||
                    "Data salesman gagal dimuat."
                );

                throw error;
            }

            /*
            | Percobaan kedua: 700 ms
            | Percobaan ketiga: 1.400 ms
            */

            await waitForSalesmanRetry(
                700 * attempt
            );
        }
    }

    return [];
}

/*
|--------------------------------------------------------------------------
| INISIALISASI APLIKASI
|--------------------------------------------------------------------------
*/

async function initializeApplication() {
    document.getElementById(
        "sidebarUserName"
    ).textContent = currentUser.name;

    manageAccountsButton.classList.toggle(
        "hidden",
        !isMasterAccount()
    );

    document.getElementById(
        "sidebarBranch"
    ).textContent =
        `${currentUser.branch} — ${currentUser.branchName}`;

    document.getElementById(
        "headerUserName"
    ).textContent = currentUser.name;

    document.getElementById(
        "headerBranch"
    ).textContent = currentUser.branchName;

    document.getElementById(
        "dashboardUserName"
    ).textContent = currentUser.name;

    document.getElementById(
        "userInitial"
    ).textContent =
        currentUser.name
            .charAt(0)
            .toUpperCase();

    document.getElementById(
        "cabang"
    ).value =
        `${currentUser.branch} — ${currentUser.branchName}`;

    /*
    |--------------------------------------------------------------------------
    | BUAT OPSI JENIS PKM
    |--------------------------------------------------------------------------
    */

    populateJenisPkmOptions();
    initializePkmFilters();

    renderBranchFilter("dashboard");
    renderBranchFilter("list");

    /*
    |--------------------------------------------------------------------------
    | PEOPLE
    |--------------------------------------------------------------------------
    */

    try {
        await loadSalesmanData();
    } catch (error) {
        /*
        | Aplikasi tetap dibuka.
        | Hanya fitur People yang sementara tidak tersedia.
        */
    }
    selectedPeople = [];

    renderSelectedPeople();

    /*
    |--------------------------------------------------------------------------
    | LEASING
    |--------------------------------------------------------------------------
    */

    leasingContainer.innerHTML = "";

    addLeasingRow();

    calculateTotalFund();

    /*
    |--------------------------------------------------------------------------
    | INISIALISASI DETAIL BUDGET
    |--------------------------------------------------------------------------
    */

    budgetDetails = [];
    editingBudgetId = null;

    resetBudgetDetailForm();
    renderBudgetDetails();

    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN HALAMAN
    |--------------------------------------------------------------------------
    */

    if (!activePageId) {
        showPage(
            "dashboardPage"
        );
    }

    await loadPkmData("dashboard");

    /*
    |--------------------------------------------------------------------------
    | HIDE / SHOW SECTION BTL
    |--------------------------------------------------------------------------
    */

    updateBtlSections();

    validateFormState();
}


/*
|--------------------------------------------------------------------------
| MENU AKUN
|--------------------------------------------------------------------------
*/

const MASTER_ACCOUNT_NIKS = [
    "911117",
    "911120",
    "911147"
];

function isMasterAccount() {
    return (
        currentUser.isMaster === true ||
        MASTER_ACCOUNT_NIKS.includes(
            String(
                currentUser.nik ||
                currentUser.username ||
                ""
            )
        )
    );
}

const accountMenuButton =
    document.getElementById(
        "accountMenuButton"
    );

const accountMenu =
    document.getElementById(
        "accountMenu"
    );

const accountMenuArrow =
    document.getElementById(
        "accountMenuArrow"
    );

const manageAccountsButton =
    document.getElementById(
        "manageAccountsButton"
    );

accountMenuButton.addEventListener(
    "click",
    function (event) {
        event.stopPropagation();

        accountMenu.classList.toggle(
            "hidden"
        );

        accountMenuArrow.textContent =
            accountMenu.classList.contains(
                "hidden"
            )
                ? "⌃"
                : "⌄";
    }
);

document.addEventListener(
    "click",
    function (event) {
        if (
            !document
                .getElementById(
                    "accountMenuWrapper"
                )
                .contains(event.target)
        ) {
            accountMenu.classList.add(
                "hidden"
            );

            accountMenuArrow.textContent =
                "⌃";
        }
    }
);

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        async function () {
            const confirmed =
                window.confirm(
                    "Apakah Anda yakin ingin keluar?"
                );

            if (!confirmed) {
                return;
            }

            try {
                await requestBackend("logout");
            } catch (error) {
                // Session lokal tetap dibersihkan jika API logout gagal.
            }

            sessionStorage.removeItem("currentUser");
            sessionStorage.removeItem("sessionToken");

            window.location.replace(
                "login.html"
            );
        }
    );

document
    .getElementById(
        "updateProfileSignature"
    )
    .addEventListener(
        "click",
        function () {
            showProfileSignatureEditor();
        }
    );


document
    .getElementById(
        "deleteProfileSignature"
    )
    .addEventListener(
        "click",
        async function () {
            const confirmed =
                window.confirm(
                    "Hapus tanda tangan yang tersimpan?"
                );

            if (!confirmed) {
                return;
            }

            try {
                this.disabled = true;
                this.textContent =
                    "Menghapus...";

                await requestBackend(
                    "deleteMySignature"
                );

                hasCurrentProfileSignature =
                    false;

                showToast(
                    "Tanda tangan berhasil dihapus."
                );

                showProfileSignatureEditor();
            } catch (error) {
                showToast(
                    error.message ||
                    "Tanda tangan gagal dihapus."
                );
            } finally {
                this.disabled = false;
                this.textContent =
                    "Hapus TTD";
            }
        }
    );


/*
|--------------------------------------------------------------------------
| SIDEBAR
|--------------------------------------------------------------------------
*/

document
    .getElementById("openSidebar")
    .addEventListener("click", openSidebar);

document
    .getElementById("closeSidebar")
    .addEventListener("click", closeSidebar);

sidebarOverlay.addEventListener("click", closeSidebar);

function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.remove("hidden");
}

function closeSidebar() {
    if (window.innerWidth < 1024) {
        sidebar.classList.remove("open");
    }

    sidebarOverlay.classList.add("hidden");
}

document
    .getElementById("pkmMenuButton")
    .addEventListener("click", function () {
        pkmSubmenu.classList.toggle("hidden");

        document.getElementById("pkmArrow").textContent =
            pkmSubmenu.classList.contains("hidden")
                ? "⌄"
                : "⌃";
    });

/*
|--------------------------------------------------------------------------
| NAVIGASI HALAMAN
|--------------------------------------------------------------------------
*/

document.querySelectorAll("[data-page]").forEach(function (button) {
    button.addEventListener("click", function () {
        showPage(button.dataset.page);
        closeSidebar();
    });
});

function showPage(pageId) {
    const pageInformation = {
        dashboardPage: {
            title: "Dashboard",
            subtitle:
                "Ringkasan aktivitas marketing"
        },

        pengajuanPage: {
            title: "Pengajuan PKM",
            subtitle:
                "Buat pengajuan aktivitas marketing baru"
        },

        listPkmPage: {
            title: "List PKM",
            subtitle:
                "Telusuri dan pantau status pengajuan"
        },

        lpjPage: {
            title: "LPJ",
            subtitle:
                "Finalisasi hasil kegiatan marketing"
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SEMBUNYIKAN SEMUA HALAMAN
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(".app-content")
        .forEach(function (page) {
            page.classList.add("hidden");
            page.style.display = "none";
        });

    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN HALAMAN YANG DIPILIH
    |--------------------------------------------------------------------------
    */

    const selectedPage =
        document.getElementById(pageId);

    if (!selectedPage) {
        return;
    }

    activePageId = pageId;

    selectedPage.classList.remove("hidden");
    selectedPage.style.display = "block";

    /*
    |--------------------------------------------------------------------------
    | UBAH JUDUL HEADER
    |--------------------------------------------------------------------------
    */

    const information =
        pageInformation[pageId] || {
            title: "CSM Marketing System",
            subtitle: ""
        };

    document.getElementById(
        "pageTitle"
    ).textContent = information.title;

    document.getElementById(
        "pageSubtitle"
    ).textContent = information.subtitle;

    /*
    |--------------------------------------------------------------------------
    | MENU AKTIF
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            ".nav-item, .nav-subitem"
        )
        .forEach(function (item) {
            item.classList.remove("active");
        });

    document
        .querySelectorAll(
            `[data-page="${pageId}"]`
        )
        .forEach(function (item) {
            item.classList.add("active");
        });

    /*
    |--------------------------------------------------------------------------
    | BUKA SUBMENU PKM
    |--------------------------------------------------------------------------
    */

    if (
        pageId === "pengajuanPage" ||
        pageId === "listPkmPage" ||
        pageId === "lpjPage"
    ) {
        pkmSubmenu.classList.remove(
            "hidden"
        );

        document.getElementById(
            "pkmArrow"
        ).textContent = "⌃";
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH LIST PKM
    |--------------------------------------------------------------------------
    */

    if (pageId === "listPkmPage") {
        renderPkmTable();
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH MAP
    |--------------------------------------------------------------------------
    */

    if (pageId === "pengajuanPage") {
        window.setTimeout(function () {
            if (isBtlSelected()) {
                initializeLocationMap();

                if (locationMap) {
                    locationMap.invalidateSize();
                }
            }
        }, 150);
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/*
|--------------------------------------------------------------------------
| TYPE PKM
|--------------------------------------------------------------------------
*/

document
    .querySelectorAll(".type-pkm")
    .forEach(function (input) {
        input.addEventListener(
            "change",
            function () {
                const types =
                    selectedValues(".type-pkm");

                const useH23 =
                    types.includes("H23") ||
                    types.includes("H123");

                document
                    .getElementById(
                        "targetUeContainer"
                    )
                    .classList.toggle(
                        "hidden",
                        !useH23
                    );

                if (!useH23) {
                    document.getElementById(
                        "targetUe"
                    ).value = 0;
                }

                /*
                |----------------------------------------------------------
                | UPDATE LOKASI OTOMATIS KHUSUS ATL
                |----------------------------------------------------------
                */

                fillAutomaticAtlLocation();

                validateFormState();
            }
        );
    });

/*
|--------------------------------------------------------------------------
| FOKUS PROGRAM
|--------------------------------------------------------------------------
*/

document
    .querySelectorAll(".focus-type")
    .forEach(function (input) {
        input.addEventListener("change", function () {
            const focusTypes = selectedValues(".focus-type");

            const useH1 = focusTypes.includes("H1");
            const useH23 = focusTypes.includes("H23");

            document
                .getElementById("programH1Container")
                .classList.toggle("hidden", !useH1);

            document
                .getElementById("programH23Container")
                .classList.toggle("hidden", !useH23);

            if (!useH1) {
                document.getElementById("programH1").value = "";
            }

            if (!useH23) {
                document.getElementById("programH23").value = "";
            }
        });
    });

/*
|--------------------------------------------------------------------------
| PEOPLE
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| PEOPLE SEARCH PICKER
|--------------------------------------------------------------------------
*/

peopleSearch.addEventListener("input", function () {
    renderPeopleSearchResults(
        peopleSearch.value
    );

    validateFormState();
});

peopleSearch.addEventListener("focus", function () {
    renderPeopleSearchResults(
        peopleSearch.value
    );
});

document.addEventListener("click", function (event) {
    const peoplePicker =
        document.querySelector(".people-picker");

    if (
        peoplePicker &&
        !peoplePicker.contains(event.target)
    ) {
        peopleSearchResults.classList.add("hidden");
    }
});

function renderPeopleSearchResults(keyword = "") {
    if (peopleSearch.disabled) {
        peopleSearchResults.classList.add("hidden");
        return;
    }

    const searchText =
        keyword.trim().toLowerCase();

    const availableSalesmen =
        salesmanData;

    const filteredSalesmen = availableSalesmen
        .filter(function (salesman) {
            const alreadySelected =
                selectedPeople.some(function (person) {
                    return person.nik === salesman.nik;
                });

            if (alreadySelected) {
                return false;
            }

            const combinedText =
                `${salesman.name} ${salesman.nik}`
                    .toLowerCase();

            return combinedText.includes(searchText);
        })
        .slice(0, 8);

    if (!filteredSalesmen.length) {
        peopleSearchResults.innerHTML = `
            <div class="people-result-empty">
                Salesman tidak ditemukan.
            </div>
        `;

        peopleSearchResults.classList.remove("hidden");
        return;
    }

    peopleSearchResults.innerHTML =
        filteredSalesmen
            .map(function (salesman) {
                return `
                    <button
                        type="button"
                        class="people-search-result"
                        data-nik="${escapeHtml(salesman.nik)}"
                    >
                        <span class="people-result-avatar">
                            ${escapeHtml(
                                salesman.name.charAt(0).toUpperCase()
                            )}
                        </span>

                        <span class="people-result-information">
                            <strong>
                                ${escapeHtml(salesman.name)}
                            </strong>

                            <small>
                                ${escapeHtml(salesman.nik)}
                            </small>
                        </span>

                        <span class="people-result-add">
                            Tambah
                        </span>
                    </button>
                `;
            })
            .join("");

    peopleSearchResults.classList.remove("hidden");

    peopleSearchResults
        .querySelectorAll("[data-nik]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                selectPeople(button.dataset.nik);
            });
        });
}

function selectPeople(nik) {
    const availableSalesmen =
        salesmanData;

    const salesman = availableSalesmen.find(
        function (item) {
            return item.nik === nik;
        }
    );

    if (!salesman) {
        return;
    }

    const alreadySelected =
        selectedPeople.some(function (person) {
            return person.nik === salesman.nik;
        });

    if (alreadySelected) {
        showToast("Salesman sudah dipilih.");
        return;
    }

    selectedPeople.push({
        nik: salesman.nik,
        name: salesman.name
    });

    peopleSearch.value = "";
    peopleSearchResults.classList.add("hidden");

    renderSelectedPeople();
    validateFormState();
}

function removeSelectedPeople(nik) {
    selectedPeople = selectedPeople.filter(
        function (person) {
            return person.nik !== nik;
        }
    );

    renderSelectedPeople();
    validateFormState();
}

function renderSelectedPeople() {
    selectedPeopleCount.textContent =
        `${selectedPeople.length} orang`;

    if (!selectedPeople.length) {
        selectedPeopleContainer.innerHTML = `
            <div id="peopleEmptyState" class="people-empty-state">
                Belum ada salesman yang dipilih.
            </div>
        `;

        return;
    }

    selectedPeopleContainer.innerHTML =
        selectedPeople
            .map(function (person) {
                return `
                    <div class="people-chip">

                        <span class="people-chip-avatar">
                            ${escapeHtml(
                                person.name.charAt(0).toUpperCase()
                            )}
                        </span>

                        <span class="people-chip-information">
                            <strong>
                                ${escapeHtml(person.name)}
                            </strong>

                            <small>
                                ${escapeHtml(person.nik)}
                            </small>
                        </span>

                        <button
                            type="button"
                            class="people-chip-remove"
                            data-remove-nik="${escapeHtml(person.nik)}"
                            title="Hapus ${escapeHtml(person.name)}"
                        >
                            ×
                        </button>

                    </div>
                `;
            })
            .join("");

    selectedPeopleContainer
        .querySelectorAll("[data-remove-nik]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                removeSelectedPeople(
                    button.dataset.removeNik
                );
            });
        });
}

function collectPeople() {
    return selectedPeople.map(function (person) {
        return {
            nik: person.nik,
            name: person.name
        };
    });
}

/*
|--------------------------------------------------------------------------
| PENGATURAN ATL DAN BTL
|--------------------------------------------------------------------------
*/

function getSelectedPkmCategory() {
    const jenisPkmSelect =
        document.getElementById(
            "jenisPkm"
        );

    if (!jenisPkmSelect) {
        return "";
    }

    const selectedValue =
        String(
            jenisPkmSelect.value || ""
        )
            .trim()
            .toUpperCase();

    if (
        selectedValue.startsWith("BTL")
    ) {
        return "BTL";
    }

    if (
        selectedValue.startsWith("ATL")
    ) {
        return "ATL";
    }

    return "";
}


function isAtlSelected() {
    return getSelectedPkmCategory() === "ATL";
}


function isBtlSelected() {
    return getSelectedPkmCategory() === "BTL";
}


/*
|--------------------------------------------------------------------------
| HIDE ATAU SHOW BAGIAN KHUSUS BTL
|--------------------------------------------------------------------------
*/

function setBtlSectionVisibility(
    sectionId,
    isVisible
) {
    const section =
        document.getElementById(sectionId);

    if (!section) {
        return;
    }

    section.classList.toggle(
        "hidden",
        !isVisible
    );

    section.setAttribute(
        "aria-hidden",
        isVisible ? "false" : "true"
    );

    section
        .querySelectorAll(
            "input, select, textarea, button"
        )
        .forEach(function (element) {
            element.disabled = !isVisible;
        });
}


/*
|--------------------------------------------------------------------------
| LOKASI OTOMATIS KHUSUS ATL
|--------------------------------------------------------------------------
|
| ATL + H1  = DEALER NAMA CABANG
| ATL + H23 = AHASS NAMA CABANG
|
*/

function fillAutomaticAtlLocation() {
    if (!isAtlSelected()) {
        return;
    }

    const lokasiInput =
        document.getElementById("lokasi");

    if (!lokasiInput) {
        return;
    }

    const selectedTypes =
        selectedValues(".type-pkm");

    const branchName =
        currentUser.branchName ||
        currentUser.branch;

    const automaticLocations = [];

    const selectedType =
        selectedTypes[0] || "";

    if (
        selectedType === "H1" ||
        selectedType === "H123"
    ) {
        automaticLocations.push(
            `DEALER ${branchName}`
        );
    }

    if (selectedType === "H23") {
        automaticLocations.push(
            `AHASS ${branchName}`
        );
    }

    lokasiInput.value =
        automaticLocations.join(" & ");

    /*
    |----------------------------------------------------------------------
    | TANDA BAHWA LOKASI DIISI OTOMATIS
    |----------------------------------------------------------------------
    */

    lokasiInput.dataset.autoFilled = "true";

    /*
    |----------------------------------------------------------------------
    | ATL TIDAK MENGGUNAKAN TITIK MAP
    |----------------------------------------------------------------------
    */

    const latitude =
        document.getElementById("latitude");

    const longitude =
        document.getElementById("longitude");

    if (latitude) {
        latitude.value = "";
    }

    if (longitude) {
        longitude.value = "";
    }
}


/*
|--------------------------------------------------------------------------
| HAPUS LOKASI OTOMATIS SAAT PINDAH KE BTL
|--------------------------------------------------------------------------
*/

function clearAutomaticAtlLocation() {
    const lokasiInput =
        document.getElementById("lokasi");

    if (!lokasiInput) {
        return;
    }

    if (
        lokasiInput.dataset.autoFilled === "true"
    ) {
        lokasiInput.value = "";

        delete lokasiInput.dataset.autoFilled;
    }
}


/*
|--------------------------------------------------------------------------
| BERSIHKAN DATA KHUSUS BTL
|--------------------------------------------------------------------------
*/

function clearBtlFields() {
    const fieldIds = [
        "locationSearch",
        "lokasi",
        "kabupaten",
        "kecamatan",
        "kelurahan",
        "latitude",
        "longitude"
    ];

    fieldIds.forEach(function (fieldId) {
        const field =
            document.getElementById(fieldId);

        if (field) {
            field.value = "";
        }
    });

    /*
    |--------------------------------------------------------------------------
    | BERSIHKAN PEOPLE
    |--------------------------------------------------------------------------
    */

    selectedPeople = [];

    renderSelectedPeople();

    /*
    |--------------------------------------------------------------------------
    | BERSIHKAN PUBLIKASI
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(".publication")
        .forEach(function (checkbox) {
            checkbox.checked = false;
        });

    /*
    |--------------------------------------------------------------------------
    | HAPUS MARKER MAP
    |--------------------------------------------------------------------------
    */

    if (
        locationMarker &&
        locationMap
    ) {
        locationMap.removeLayer(
            locationMarker
        );

        locationMarker = null;
    }

    if (
        typeof setMapStatus === "function"
    ) {
        setMapStatus(
            "Belum ada titik lokasi yang dipilih."
        );
    }
}


/*
|--------------------------------------------------------------------------
| UPDATE ATL DAN BTL
|--------------------------------------------------------------------------
*/

function updateBtlSections() {
    const atlSelected =
        isAtlSelected();

    const btlSelected =
        isBtlSelected();

    /*
    |--------------------------------------------------------------------------
    | LOKASI MANUAL, PEOPLE, DAN PUBLIKASI HANYA MUNCUL UNTUK BTL
    |--------------------------------------------------------------------------
    */

    setBtlSectionVisibility(
        "locationSection",
        btlSelected
    );

    setBtlSectionVisibility(
        "peopleSection",
        btlSelected
    );

    setBtlSectionVisibility(
        "publicationSection",
        btlSelected
    );

    /*
    |--------------------------------------------------------------------------
    | ATL
    |--------------------------------------------------------------------------
    | Data BTL dibersihkan, kemudian lokasi diisi otomatis berdasarkan
    | pilihan H1 atau H23.
    */

    if (atlSelected) {
        clearBtlFields();
        fillAutomaticAtlLocation();
    }

    /*
    |--------------------------------------------------------------------------
    | BTL
    |--------------------------------------------------------------------------
    | Lokasi otomatis ATL dihapus. Pengguna memilih lokasi melalui maps.
    */

    if (btlSelected) {
        clearAutomaticAtlLocation();

        window.setTimeout(function () {
            initializeLocationMap();

            if (locationMap) {
                locationMap.invalidateSize();
            }
        }, 150);
    }

    /*
    |--------------------------------------------------------------------------
    | BELUM MEMILIH JENIS PKM
    |--------------------------------------------------------------------------
    */

    if (
        !atlSelected &&
        !btlSelected
    ) {
        clearBtlFields();
    }

    validateFormState();
}


/*
|--------------------------------------------------------------------------
| EVENT PERUBAHAN JENIS PKM
|--------------------------------------------------------------------------
*/

const jenisPkmSelect =
    document.getElementById("jenisPkm");

if (jenisPkmSelect) {
    jenisPkmSelect.addEventListener(
        "change",
        updateBtlSections
    );
}



/*
|--------------------------------------------------------------------------
| LEASING
|--------------------------------------------------------------------------
*/

document
    .getElementById("addLeasingButton")
    .addEventListener("click", addLeasingRow);

function addLeasingRow() {
    const row = document.createElement("div");

    row.className = "leasing-compact-row";

    row.innerHTML = `
        <div class="leasing-select-wrapper">
            <select
                class="form-input leasing-name"
                aria-label="Nama leasing"
            >
                <option value="">
                    Pilih leasing
                </option>

                ${leasingOptions.map(function (leasing) {
                    return `
                        <option value="${escapeHtml(leasing)}">
                            ${escapeHtml(leasing)}
                        </option>
                    `;
                }).join("")}
            </select>
        </div>

        <div class="currency-input leasing-currency-input">
            <span>Rp</span>

            <input
                class="leasing-fund"
                type="number"
                min="0"
                step="1000"
                value=""
                placeholder="Pilih leasing"
                disabled
                aria-label="Dana leasing"
            >
        </div>

        <button
            class="leasing-delete-button"
            type="button"
            title="Hapus leasing"
            aria-label="Hapus leasing"
        >
            ×
        </button>
    `;

    leasingContainer.appendChild(row);

    const leasingSelect =
        row.querySelector(".leasing-name");

    const leasingFund =
        row.querySelector(".leasing-fund");

    leasingSelect.addEventListener("change", function () {
        const leasingSelected =
            leasingSelect.value !== "";

        leasingFund.disabled = !leasingSelected;

        if (leasingSelected) {
            leasingFund.placeholder = "0";
            leasingFund.focus();
        } else {
            leasingFund.value = "";
            leasingFund.placeholder = "Pilih leasing";
        }

        calculateTotalFund();
    });

    leasingFund.addEventListener(
        "input",
        function () {
            calculateTotalFund();
            updateBudgetDetailSummary();
        }
    );

    row
        .querySelector(".leasing-delete-button")
        .addEventListener("click", function () {
            row.remove();
            calculateTotalFund();
            validateFormState();
        });
}

function collectLeasing() {
    return [
        ...document.querySelectorAll(".leasing-compact-row")
    ]
        .map(function (row) {
            const leasingName =
                row.querySelector(".leasing-name").value;

            const leasingFund =
                row.querySelector(".leasing-fund");

            return {
                name: leasingName,

                fund: leasingName
                    ? Number(leasingFund.value) || 0
                    : 0
            };
        })
        .filter(function (leasing) {
            return leasing.name !== "";
        });
}

/*
|--------------------------------------------------------------------------
| DANA
|--------------------------------------------------------------------------
*/

[
    "danaCsm",
    "danaMd",
    "danaLain"
].forEach(function (elementId) {
    document
        .getElementById(elementId)
        .addEventListener("input", calculateTotalFund);
});

function calculateTotalFund() {
    const danaCsm =
        Number(
            document.getElementById("danaCsm").value
        ) || 0;

    const danaMd =
        Number(
            document.getElementById("danaMd").value
        ) || 0;

    const danaLain =
        Number(
            document.getElementById("danaLain").value
        ) || 0;

    const danaLeasing = [
        ...document.querySelectorAll(".leasing-compact-row")
    ].reduce(function (total, row) {
        const leasingName =
            row.querySelector(".leasing-name").value;

        const leasingFund =
            row.querySelector(".leasing-fund");

        if (!leasingName || leasingFund.disabled) {
            return total;
        }

        return total + (
            Number(leasingFund.value) || 0
        );
    }, 0);

    const total =
        danaCsm +
        danaMd +
        danaLeasing +
        danaLain;
    document.getElementById(
        "summaryDanaCsm"
    ).textContent = rupiah(danaCsm);

    document.getElementById(
        "summaryDanaMd"
    ).textContent = rupiah(danaMd);

    document.getElementById(
        "summaryDanaLeasing"
    ).textContent = rupiah(danaLeasing);

    document.getElementById(
        "summaryDanaLain"
    ).textContent = rupiah(danaLain);

    document.getElementById(
        "summaryTotalDana"
    ).textContent = rupiah(total);

    return {
        danaCsm,
        danaMd,
        danaLeasing,
        danaLain,
        total
    };
}

/*
|--------------------------------------------------------------------------
| PENCARIAN LOKASI
|--------------------------------------------------------------------------
*/

document
    .getElementById("searchLocationButton")
    .addEventListener("click", searchLocation);

document
    .getElementById("locationSearch")
    .addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchLocation();
        }
    });

async function searchLocation() {
    const query = document
        .getElementById("locationSearch")
        .value
        .trim();

    const resultContainer =
        document.getElementById("locationResults");

    if (query.length < 3) {
        showToast(
            "Masukkan minimal 3 karakter nama lokasi."
        );

        return;
    }

    resultContainer.classList.remove("hidden");

    resultContainer.innerHTML = `
        <div class="p-4 text-sm text-slate-500">
            Mencari lokasi...
        </div>
    `;

    try {
        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=jsonv2" +
            "&addressdetails=1" +
            "&limit=5" +
            "&countrycodes=id" +
            `&q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                "Accept-Language": "id"
            }
        });

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil data lokasi."
            );
        }

        const results = await response.json();

        if (!results.length) {
            resultContainer.innerHTML = `
                <div class="p-4 text-sm text-slate-500">
                    Lokasi tidak ditemukan.
                </div>
            `;

            return;
        }

        resultContainer.innerHTML = results
            .map(function (location, index) {
                return `
                    <button
                        type="button"
                        class="location-result"
                        data-location-index="${index}"
                    >
                        ${escapeHtml(location.display_name)}
                    </button>
                `;
            })
            .join("");

        resultContainer
            .querySelectorAll("[data-location-index]")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    const index = Number(
                        button.dataset.locationIndex
                    );

                    chooseLocation(results[index]);
                });
            });
    } catch (error) {
        resultContainer.innerHTML = `
            <div class="p-4 text-sm font-bold text-red-600">
                Pencarian lokasi gagal.
                Lokasi tetap dapat diisi manual.
            </div>
        `;
    }
}

addBudgetDetailButton.addEventListener(
    "click",
    saveBudgetDetail
);


cancelBudgetEditButton.addEventListener(
    "click",
    function () {
        resetBudgetDetailForm();
    }
);


budgetDetailTableBody.addEventListener(
    "click",
    function (event) {
        const button =
            event.target.closest(
                "[data-budget-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.budgetAction;

        const budgetId =
            button.dataset.budgetId;

        if (action === "edit") {
            editBudgetDetail(
                budgetId
            );
        }

        if (action === "delete") {
            deleteBudgetDetail(
                budgetId
            );
        }
    }
);


document
    .querySelectorAll(".fund-input")
    .forEach(function (input) {
        input.addEventListener(
            "input",
            updateBudgetDetailSummary
        );
    });



function chooseLocation(location) {
    const latitude = Number(location.lat);
    const longitude = Number(location.lon);

    fillLocationFields(location);

    placeLocationMarker(
        latitude,
        longitude,
        location.display_name || "Lokasi kegiatan"
    );

    document
        .getElementById("locationResults")
        .classList.add("hidden");

    setMapStatus(
        "Lokasi berhasil dipilih dari hasil pencarian.",
        "success"
    );
}

document
    .getElementById("useMyLocationButton")
    .addEventListener("click", function () {
        if (!navigator.geolocation) {
            showToast(
                "Browser tidak mendukung fitur lokasi."
            );

            return;
        }

        setMapStatus(
            "Mengambil lokasi perangkat...",
            "loading"
        );

        navigator.geolocation.getCurrentPosition(
            async function (position) {
                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                await selectLocationFromCoordinates(
                    latitude,
                    longitude
                );
            },

            function (error) {
                let message =
                    "Lokasi perangkat tidak dapat diambil.";

                if (error.code === 1) {
                    message =
                        "Izin lokasi ditolak oleh pengguna.";
                }

                if (error.code === 2) {
                    message =
                        "Lokasi perangkat tidak tersedia.";
                }

                if (error.code === 3) {
                    message =
                        "Permintaan lokasi terlalu lama.";
                }

                setMapStatus(message, "error");
                showToast(message);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });

/*
|--------------------------------------------------------------------------
| FUNCTION DETAIL BUDGET
|--------------------------------------------------------------------------
*/

function generateTemporaryBudgetId() {
    if (
        window.crypto &&
        typeof window.crypto.getRandomValues ===
            "function"
    ) {
        const bytes =
            new Uint8Array(4);

        window.crypto.getRandomValues(
            bytes
        );

        return Array.from(bytes)
            .map(function (byte) {
                return byte
                    .toString(16)
                    .padStart(2, "0");
            })
            .join("");
    }

    return Math.random()
        .toString(16)
        .slice(2, 10)
        .padEnd(8, "0");
}


function getBudgetDetailTotal() {
    return budgetDetails.reduce(
        function (total, item) {
            return (
                total +
                Number(item.totalPrice || 0)
            );
        },
        0
    );
}


function resetBudgetDetailForm() {
    editingBudgetId = null;

    budgetItemNameInput.value = "";
    budgetTotalPriceInput.value = "";
    budgetQuantityInput.value = "1";
    budgetItemTypeInput.value = "";

    addBudgetDetailButton.textContent =
        "+ Tambah item";

    cancelBudgetEditButton.classList.add(
        "hidden"
    );
}


function updateBudgetDetailSummary() {
    const detailTotal =
        getBudgetDetailTotal();

    const fundTotal =
        calculateTotalFund().total;

    const difference =
        fundTotal - detailTotal;

    document.getElementById(
        "budgetDetailTotalDisplay"
    ).textContent =
        rupiah(detailTotal);

    document.getElementById(
        "budgetFundTotalDisplay"
    ).textContent =
        rupiah(fundTotal);

    document.getElementById(
        "budgetDifferenceDisplay"
    ).textContent =
        rupiah(Math.abs(difference));

    const differenceBox =
        document.getElementById(
            "budgetDifferenceBox"
        );

    const message =
        document.getElementById(
            "budgetDetailMessage"
        );

    const balanced =
        difference === 0;

    differenceBox.classList.toggle(
        "bg-emerald-50",
        balanced
    );

    differenceBox.classList.toggle(
        "bg-amber-50",
        !balanced
    );

    differenceBox.classList.toggle(
        "text-emerald-700",
        balanced
    );

    differenceBox.classList.toggle(
        "text-amber-700",
        !balanced
    );

    message.classList.toggle(
        "hidden",
        balanced
    );

    message.textContent =
        difference > 0
            ? `Masih ada dana ${rupiah(
                difference
            )} yang belum dirinci.`
            : difference < 0
                ? `Detail budget melebihi dana sebesar ${rupiah(
                    Math.abs(difference)
                )}.`
                : "Detail budget sudah sesuai dengan total dana.";
}


function renderBudgetDetails() {
    emptyBudgetDetail.classList.toggle(
        "hidden",
        budgetDetails.length > 0
    );

    budgetDetailTableBody.innerHTML =
        budgetDetails
            .map(function (item, index) {
                return `
                    <tr>
                        <td class="text-center font-bold">
                            ${index + 1}
                        </td>

                        <td>
                            <p class="font-black text-slate-900">
                                ${escapeHtml(
                                    item.itemName
                                )}
                            </p>

                            <p class="mt-1 text-xs text-slate-400">
                                Realisasi dilengkapi melalui LPJ
                            </p>
                        </td>

                        <td>
                            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                ${escapeHtml(
                                    item.itemType
                                )}
                            </span>
                        </td>

                        <td class="text-center font-bold">
                            ${item.quantity}
                        </td>

                        <td class="text-right font-black">
                            ${rupiah(
                                item.totalPrice
                            )}
                        </td>

                        <td>
                            <div class="flex justify-center gap-2">
                                <button
                                    type="button"
                                    data-budget-action="edit"
                                    data-budget-id="${item.id}"
                                    class="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-100"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    data-budget-action="delete"
                                    data-budget-id="${item.id}"
                                    class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 font-black text-red-600 hover:bg-red-100"
                                    title="Hapus item"
                                >
                                    ✕
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");

    updateBudgetDetailSummary();

    if (
        typeof validateFormState ===
        "function"
    ) {
        validateFormState();
    }
}


function saveBudgetDetail() {
    const itemName =
        budgetItemNameInput
            .value
            .trim();

    const totalPrice =
        Number(
            budgetTotalPriceInput.value
        );

    const quantity =
        Number(
            budgetQuantityInput.value
        );

    const itemType =
        budgetItemTypeInput
            .value
            .trim()
            .toUpperCase();

    if (!itemName) {
        showToast(
            "Nama item wajib diisi."
        );

        budgetItemNameInput.focus();
        return;
    }

    if (
        !Number.isFinite(totalPrice) ||
        totalPrice <= 0
    ) {
        showToast(
            "Harga total harus lebih dari 0."
        );

        budgetTotalPriceInput.focus();
        return;
    }

    if (
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {
        showToast(
            "Jumlah item minimal 1."
        );

        budgetQuantityInput.focus();
        return;
    }

    if (!itemType) {
        showToast(
            "Jenis item wajib diisi."
        );

        budgetItemTypeInput.focus();
        return;
    }

    if (editingBudgetId) {
        const itemIndex =
            budgetDetails.findIndex(
                function (item) {
                    return (
                        item.id ===
                        editingBudgetId
                    );
                }
            );

        if (itemIndex !== -1) {
            budgetDetails[itemIndex] = {
                ...budgetDetails[itemIndex],
                itemName: itemName,
                totalPrice: totalPrice,
                quantity: quantity,
                itemType: itemType
            };
        }

        showToast(
            "Detail budget berhasil diperbarui."
        );
    } else {
        budgetDetails.push({
            id:
                generateTemporaryBudgetId(),

            itemName: itemName,
            totalPrice: totalPrice,
            quantity: quantity,
            itemType: itemType,

            /*
            | Diisi melalui menu LPJ.
            */

            realizationPrice: 0,
            designImage: "",
            photo: "",
            note: ""
        });

        showToast(
            "Detail budget berhasil ditambahkan."
        );
    }

    resetBudgetDetailForm();
    renderBudgetDetails();
}


function editBudgetDetail(budgetId) {
    const item =
        budgetDetails.find(
            function (budgetItem) {
                return (
                    budgetItem.id ===
                    budgetId
                );
            }
        );

    if (!item) {
        showToast(
            "Detail budget tidak ditemukan."
        );

        return;
    }

    editingBudgetId = item.id;

    budgetItemNameInput.value =
        item.itemName;

    budgetTotalPriceInput.value =
        item.totalPrice;

    budgetQuantityInput.value =
        item.quantity;

    budgetItemTypeInput.value =
        item.itemType;

    addBudgetDetailButton.textContent =
        "Simpan perubahan";

    cancelBudgetEditButton.classList.remove(
        "hidden"
    );

    budgetItemNameInput.focus();
}


function deleteBudgetDetail(budgetId) {
    const item =
        budgetDetails.find(
            function (budgetItem) {
                return (
                    budgetItem.id ===
                    budgetId
                );
            }
        );

    if (!item) {
        return;
    }

    const confirmed =
        window.confirm(
            `Hapus item budget "${item.itemName}"?`
        );

    if (!confirmed) {
        return;
    }

    budgetDetails =
        budgetDetails.filter(
            function (budgetItem) {
                return (
                    budgetItem.id !==
                    budgetId
                );
            }
        );

    if (
        editingBudgetId === budgetId
    ) {
        resetBudgetDetailForm();
    }

    renderBudgetDetails();

    showToast(
        "Detail budget berhasil dihapus."
    );
}


/*
|--------------------------------------------------------------------------
| SUBMIT PENGAJUAN
|--------------------------------------------------------------------------
*/

pkmForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const missingFields = getMissingFields();

    if (missingFields.length) {
        validateFormState();
        showToast(
            `Lengkapi: ${missingFields.join(", ")}`
        );
        return;
    }

    const typePkm = selectedValues(".type-pkm");

    if (!typePkm.length) {
        showToast(
            "Pilih minimal satu Type PKM."
        );

        return;
    }

    const startDate = combineDateTime(
        document.getElementById("tanggalMulai").value,
        document.getElementById("jamMulai").value
    );

    const endDate = combineDateTime(
        document.getElementById("tanggalSelesai").value,
        document.getElementById("jamSelesai").value
    );

    if (
        !startDate ||
        !endDate
    ) {
        showToast(
            "Tanggal dan jam pelaksanaan wajib diisi."
        );

        return;
    }

    if (
        new Date(endDate).getTime() <
        new Date(startDate).getTime()
    ) {
        showToast(
            "Waktu selesai tidak boleh sebelum waktu mulai."
        );

        return;
    }

    const focusType =
        selectedValues(".focus-type");

    const publication =
        selectedValues(".publication");
    const people = collectPeople();
    const leasing = collectLeasing();
    const fund = calculateTotalFund();

    const budgetDetailTotal =
        getBudgetDetailTotal();

    if (
        fund.total > 0 &&
        budgetDetails.length === 0
    ) {
        showToast(
            "Tambahkan minimal satu detail budget."
        );

        return;
    }

    if (
        budgetDetailTotal !== fund.total
    ) {
        showToast(
            "Total detail budget harus sama dengan total sumber dana."
        );

        return;
    }

    const invalidLeasing = leasing.find(function (item) {
        return item.fund <= 0;
    });

    if (invalidLeasing) {
        showToast(
            `Dana leasing ${invalidLeasing.name} belum diisi.`
        );

        return;
    }

    const jenisPkm =
        document.getElementById("jenisPkm").value;

    const submission = {
        id: generatePkmId(
            currentUser.branch,
            jenisPkm
        ),

        name:
            document.getElementById("namaPkm")
                .value
                .trim(),

        branch: currentUser.branch,
        branchName: currentUser.branchName,

        type: typePkm,
        jenisPkm,

        kegiatan:
            document.getElementById("jenisKegiatan").value,

        startDate,
        endDate,

        location:
            document.getElementById("lokasi")
                .value
                .trim(),

        kabupaten:
            document.getElementById("kabupaten")
                .value
                .trim(),

        kecamatan:
            document.getElementById("kecamatan")
                .value
                .trim(),

        kelurahan:
            document.getElementById("kelurahan")
                .value
                .trim(),

        latitude:
            document.getElementById("latitude").value,

        longitude:
            document.getElementById("longitude").value,

        alasan:
            document.getElementById("alasan")
                .value
                .trim(),

        konsep:
            document.getElementById("konsep")
                .value
                .trim(),

        people,
        focusType,

        programH1: focusType.includes("H1")
            ? document
                .getElementById("programH1")
                .value
                .trim()
            : "",

        programH23: focusType.includes("H23")
            ? document
                .getElementById("programH23")
                .value
                .trim()
            : "",

        publication,
        leasing,

        danaCsm: fund.danaCsm,
        danaMd: fund.danaMd,
        danaLeasing: fund.danaLeasing,
        danaLain: fund.danaLain,
        totalFund: fund.total,
        budgetDetails:
            budgetDetails.map(
                function (item) {
                    return {
                        id: item.id,
                        itemName:
                            item.itemName,
                        totalPrice:
                            item.totalPrice,
                        quantity:
                            item.quantity,
                        itemType:
                            item.itemType,

                        realizationPrice: 0,
                        designImage: "",
                        photo: "",
                        note: ""
                    };
                }
            ),

        targetDb:
            Number(
                document.getElementById("targetDb").value
            ) || 0,

        targetDeal:
            Number(
                document.getElementById("targetDeal").value
            ) || 0,

        targetUe:
            (
                typePkm.includes("H23") ||
                typePkm.includes("H123")
            )
                ? Number(targetUeInput.value || 0)
                : 0,

        pengajuan: "DIAJUKAN",

        status: "MENUNGGU_CRM",
        approvalStep: "CRM",

        approvalHistory: [
            {
                role: "CRM",
                action: "MENGAJUKAN",
                name: currentUser.name,
                username: currentUser.username,
                date: new Date().toISOString(),
                signature: null
            }
        ],

        source: "WEB",

        createdBy: currentUser.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    /*
    |--------------------------------------------------------------------------
    | JANGAN LANGSUNG SIMPAN
    |--------------------------------------------------------------------------
    | Data ditahan sementara sampai CRM memberi TTD.
    */

    pendingCrmSubmission = submission;
    pendingCrmSubmissionSaved = false;
    approvalModalMode = "SUBMIT_CRM";

    await openApprovalModal(
        submission.id
    );

});

/*
|--------------------------------------------------------------------------
| RESET FORM
|--------------------------------------------------------------------------
*/

function resetPkmForm() {
    pkmForm.reset();
    budgetDetails = [];
    editingBudgetId = null;

    resetBudgetDetailForm();
    renderBudgetDetails();

    document.getElementById("cabang").value =
        `${currentUser.branch} — ${currentUser.branchName}`;

    document
        .getElementById("programH1Container")
        .classList.add("hidden");

    document
        .getElementById("programH23Container")
        .classList.add("hidden");

    document
        .getElementById("targetUeContainer")
        .classList.add("hidden");

    document
        .getElementById("locationResults")
        .classList.add("hidden");

    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";

    setMapStatus(
        "Belum ada titik lokasi yang dipilih."
    );

    if (locationMarker && locationMap) {
        locationMap.removeLayer(locationMarker);
        locationMarker = null;

        locationMap.setView(
            [
                defaultMapLocation.latitude,
                defaultMapLocation.longitude
            ],
            defaultMapLocation.zoom
        );
    }

    selectedPeople = [];
    renderSelectedPeople();

    leasingContainer.innerHTML = "";

    addLeasingRow();

    calculateTotalFund();
    updateBtlSections();
    validateFormState();
}

/*
|--------------------------------------------------------------------------
| AMBIL DATA BERDASARKAN CABANG
|--------------------------------------------------------------------------
*/

function getBranchPkm() {
    const localData = getStoredPkm().filter(
        matchesActivePkmFilters
    );

    const allData = [
        ...localData,
        ...sheetPkmData
    ].filter(function (item, index, data) {
        return data.findIndex(function (candidate) {
            return candidate.id === item.id;
        }) === index;
    });

    let filteredData = allData;

    /*
    | Admin dengan cabang ALL dapat melihat seluruh cabang.
    */

    if (currentUser.branch !== "ALL") {
        filteredData = allData.filter(function (item) {
            return item.branch === currentUser.branch;
        });
    }

    return filteredData.sort(function (a, b) {
        return (
            new Date(
                b.startDate || b.createdAt || 0
            ).getTime() -
            new Date(
                a.startDate || a.createdAt || 0
            ).getTime()
        );
    });
}

/*
|--------------------------------------------------------------------------
| RENDER SEMUA DATA
|--------------------------------------------------------------------------
*/

function renderAllData() {
    renderDashboard();
    renderPkmTable();
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

function renderDashboard() {
    const data = getBranchPkm();

    const pending = data.filter(function (item) {
        return String(item.status)
            .startsWith("MENUNGGU");
    }).length;

    const approved = data.filter(function (item) {
        return (
            item.status === "DISETUJUI" ||
            item.status === "ACC"
        );
    }).length;

    const totalFund = data.reduce(function (total, item) {
        return total + (Number(item.totalFund) || 0);
    }, 0);

    document.getElementById("totalSubmission").textContent =
        data.length;

    document.getElementById("pendingSubmission").textContent =
        pending;

    document.getElementById("approvedSubmission").textContent =
        approved;

    document.getElementById("totalFund").textContent =
        rupiah(totalFund);

    renderRecentPkm(data.slice(0, 5));
}

function renderRecentPkm(data) {
    const container =
        document.getElementById("recentPkmContainer");

    if (!data.length) {
        container.innerHTML = `
            <div class="empty-state">
                Belum ada pengajuan dari cabang ini.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">

            <table class="data-table">

                <thead>
                    <tr>
                        <th>Nama PKM</th>
                        <th>Jenis</th>
                        <th>Pelaksanaan</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    ${data.map(function (item) {
                        return `
                            <tr>
                                <td>
                                    <p class="font-bold text-slate-900">
                                        ${escapeHtml(item.name)}
                                    </p>

                                    <p class="text-xs text-slate-500">
                                        ${escapeHtml(item.id)}
                                    </p>
                                </td>

                                <td>
                                    ${escapeHtml(item.jenisPkm)}
                                </td>

                                <td>
                                    ${formatDateTime(item.startDate)}
                                </td>

                                <td>
                                    ${statusBadge(item.status)}
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>

            </table>

        </div>
    `;
}

/*
|--------------------------------------------------------------------------
| BADGE
|--------------------------------------------------------------------------
*/

function statusBadge(status) {
    const normalizedStatus = String(status || "")
        .trim()
        .toUpperCase()
        .replaceAll(" ", "_");

    const statusInformation = {
        MENUNGGU_KACAB: {
            label: "Menunggu KACAB",
            className:
                "bg-amber-100 text-amber-700"
        },

        MENUNGGU_MSCM: {
            label: "Menunggu MSCM",
            className:
                "bg-blue-100 text-blue-700"
        },

        MENUNGGU_MGR: {
            label: "Menunggu MGR",
            className:
                "bg-purple-100 text-purple-700"
        },

        DISETUJUI: {
            label: "Disetujui",
            className:
                "bg-green-100 text-green-700"
        },

        ACC: {
            label: "ACC",
            className:
                "bg-green-100 text-green-700"
        },

        DITOLAK: {
            label: "Ditolak",
            className:
                "bg-red-100 text-red-700"
        },

        MENUNGGU: {
            label: "Menunggu",
            className:
                "bg-amber-100 text-amber-700"
        }
    };

    const information =
        statusInformation[normalizedStatus] || {
            label: status || "-",
            className:
                "bg-slate-100 text-slate-600"
        };

    return `
        <span
            class="inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${information.className}"
        >
            ${escapeHtml(information.label)}
        </span>
    `;
}

function sourceBadge(source) {
    const isWeb = source === "WEB";

    return `
        <span class="source-badge ${
            isWeb
                ? "source-web"
                : "source-legacy"
        }">
            ${isWeb
                ? "WEB BARU"
                : source === "SHEET"
                    ? "SPREADSHEET"
                    : "DATA LAMA"
            }
        </span>
    `;
}

/*
|--------------------------------------------------------------------------
| SISTEM APPROVAL PKM
|--------------------------------------------------------------------------
*/

const approvalStages = [
    "CRM",
    "KACAB",
    "MSCM",
    "MGR"
];

let activeApprovalPkmId = null;
let signatureHasDrawing = false;

/*
|--------------------------------------------------------------------------
| MODE POPUP APPROVAL
|--------------------------------------------------------------------------
| APPROVAL   = memproses data yang sudah tersimpan
| SUBMIT_CRM = TTD CRM ketika membuat pengajuan baru
*/

let approvalModalMode = "APPROVAL";
let pendingCrmSubmission = null;
let pendingCrmSubmissionSaved = false;


function getCurrentUserRole() {
    return String(
        currentUser.role ||
        currentUser.jabatan ||
        ""
    )
        .trim()
        .toUpperCase();
}


function getApprovalStep(item) {
    if (item.approvalStep) {
        return item.approvalStep;
    }

    if (
        item.status === "ACC" ||
        item.status === "DISETUJUI"
    ) {
        return "SELESAI";
    }

    return "KACAB";
}


function canCurrentUserProcess(item) {
    const userRole =
        getCurrentUserRole();

    const approvalStep =
        String(
            getApprovalStep(item) || ""
        )
            .trim()
            .toUpperCase();

    const userBranch =
        String(
            currentUser.originalBranch ||
            currentUser.branch ||
            ""
        )
            .trim()
            .toUpperCase();

    const itemBranch =
        String(item.branch || "")
            .trim()
            .toUpperCase();

    /*
    | KACAB hanya dapat memproses cabangnya.
    | MSCM dan MGR dari HO dapat memproses semua cabang.
    */

    const branchAllowed =
        userRole === "KACAB"
            ? itemBranch === userBranch
            : isHeadOfficeUser();

    return (
        branchAllowed &&
        approvalStep === userRole &&
        ["KACAB", "MSCM", "MGR"].includes(
            userRole
        )
    );
}


function isApprovalStageCompleted(
    item,
    role
) {
    if (role === "CRM") {
        return true;
    }

    if (
        item.status === "DISETUJUI" ||
        item.status === "ACC"
    ) {
        return true;
    }

    const history =
        Array.isArray(item.approvalHistory)
            ? item.approvalHistory
            : [];

    return history.some(function (approval) {
        return (
            approval.role === role &&
            approval.action === "MENYETUJUI"
        );
    });
}


function renderApprovalFlow(item) {
    const currentStep =
        getApprovalStep(item);

    return `
        <div
            class="flex min-w-[410px] items-start"
        >
            ${approvalStages
                .map(function (stage, index) {
                    const completed =
                        isApprovalStageCompleted(
                            item,
                            stage
                        );

                    const active =
                        currentStep === stage;

                    const stateClass = completed
                        ? "completed"
                        : active
                            ? "active"
                            : "pending";

                    const icon = completed
                        ? "✓"
                        : index + 1;

                    const connector =
                        index < approvalStages.length - 1
                            ? `
                                <div
                                    class="approval-flow-line ${
                                        completed
                                            ? "completed"
                                            : ""
                                    }"
                                ></div>
                            `
                            : "";

                    return `
                        <div
                            class="approval-flow-item ${stateClass}"
                        >
                            <div
                                class="approval-flow-circle"
                            >
                                ${icon}
                            </div>

                            <span
                                class="text-xs font-black text-slate-700"
                            >
                                ${stage}
                            </span>
                        </div>

                        ${connector}
                    `;
                })
                .join("")}
        </div>
    `;
}


function renderApprovalAction(item) {
    if (canCurrentUserProcess(item)) {
        return `
            <button
                type="button"
                data-process-pkm="${escapeHtml(item.id)}"
                class="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-md shadow-red-100 transition hover:bg-red-700"
            >
                Proses
            </button>
        `;
    }

    return `
        <button
            type="button"
            data-view-pkm="${escapeHtml(item.id)}"
            class="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
        >
            Lihat
        </button>
    `;
}

/*
|--------------------------------------------------------------------------
| LIST PKM
|--------------------------------------------------------------------------
*/

function getApprovalActionLabel(item) {
    if (
        item.status === "DISETUJUI" ||
        item.status === "ACC"
    ) {
        return "Selesai";
    }

    const approvalStep =
        getApprovalStep(item);

    if (
        approvalStep &&
        approvalStep !== "SELESAI"
    ) {
        return `Menunggu ${approvalStep}`;
    }

    return "-";
}

function renderPkmTable() {
    const searchInput =
        document.getElementById(
            "searchPkm"
        );

    const statusInput =
        document.getElementById(
            "statusFilter"
        );

    if (
        !searchInput ||
        !statusInput ||
        !pkmTableBody
    ) {
        return;
    }

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const statusFilter =
        String(statusInput.value || "ALL")
            .trim()
            .toUpperCase();

    const branchPkmData =
        getBranchPkm();

    let data =
        Array.isArray(branchPkmData)
            ? branchPkmData
            : [];

    /*
    |--------------------------------------------------------------------------
    | FILTER PENCARIAN DAN STATUS
    |--------------------------------------------------------------------------
    */

    data = data.filter(function (item) {
        const combinedText = [
            item.id,
            item.name,
            item.branch,
            item.branchName,
            item.jenisPkm,
            item.kegiatan,
            item.location,
            item.kabupaten,
            item.kecamatan,
            item.kelurahan,
            item.konsep,
            item.alasan,

            Array.isArray(item.people)
                ? item.people.join(" ")
                : item.people,

            Array.isArray(item.leasing)
                ? item.leasing.join(" ")
                : item.leasing,

            item.status,
            item.approvalStep
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            combinedText.includes(search);

        const normalizedStatus =
            String(item.status || "")
                .trim()
                .toUpperCase();

        let matchesStatus = false;

        if (statusFilter === "ALL") {
            matchesStatus = true;
        } else if (
            statusFilter === "MENUNGGU"
        ) {
            matchesStatus =
                normalizedStatus.startsWith(
                    "MENUNGGU"
                );
        } else if (
            statusFilter === "ACC"
        ) {
            matchesStatus = [
                "ACC",
                "DISETUJUI"
            ].includes(normalizedStatus);
        } else {
            matchesStatus =
                normalizedStatus ===
                statusFilter;
        }

        return (
            matchesSearch &&
            matchesStatus
        );
    });

    /*
    |--------------------------------------------------------------------------
    | DEFAULT: SEMBUNYIKAN DATA YANG SUDAH ACC
    |--------------------------------------------------------------------------
    */

    const isDefaultList =
        search === "" &&
        statusFilter === "ALL";

    if (isDefaultList) {
        data = data.filter(function (item) {
            const normalizedStatus =
                String(item.status || "")
                    .trim()
                    .toUpperCase();

            return ![
                "ACC",
                "DISETUJUI"
            ].includes(normalizedStatus);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const totalData = data.length;

    const totalPages = Math.max(
        1,
        Math.ceil(
            totalData /
            PKM_PAGE_SIZE
        )
    );

    if (currentPkmPage > totalPages) {
        currentPkmPage = totalPages;
    }

    if (currentPkmPage < 1) {
        currentPkmPage = 1;
    }

    const startIndex =
        (
            currentPkmPage - 1
        ) * PKM_PAGE_SIZE;

    const endIndex =
        startIndex +
        PKM_PAGE_SIZE;

    const pageData =
        data.slice(
            startIndex,
            endIndex
        );

    const resultCount =
        document.getElementById(
            "listResultCount"
        );

    if (resultCount) {
        resultCount.textContent =
            `${totalData} data ditemukan`;
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER TABEL
    |--------------------------------------------------------------------------
    */

    pkmTableBody.innerHTML =
        pageData
            .map(function (item) {
                const typeText =
                    Array.isArray(item.type)
                        ? item.type.join(", ")
                        : item.type || "-";

                const normalizedStatus =
                    String(item.status || "")
                        .trim()
                        .toUpperCase();

                const managerApproved =
                    Boolean(
                        item.approvals &&
                        (
                            item.approvals.managerH1 ||
                            item.approvals.managerH23
                        )
                    );

                const pdfAvailable =
                    [
                        "ACC",
                        "DISETUJUI"
                    ].includes(
                        normalizedStatus
                    ) &&
                    managerApproved;

                let actionButton;

                if (
                    canCurrentUserProcess(item)
                ) {
                    actionButton = `
                        <button
                            type="button"
                            data-process-pkm="${escapeHtml(item.id)}"
                            class="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-md shadow-red-100 transition hover:bg-red-700"
                        >
                            Proses
                        </button>
                    `;
                } else if (pdfAvailable) {
                    actionButton = `
                        <button
                            type="button"
                            data-download-stored-pdf="${escapeHtml(item.id)}"
                            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
                        >
                            ↓ Download PDF
                        </button>
                    `;
                } else {
                    actionButton = `
                        <span
                            class="whitespace-nowrap text-xs font-bold text-slate-400"
                        >
                            ${getApprovalActionLabel(item)}
                        </span>
                    `;
                }

                return `
                    <tr>
                        <td>
                            <span class="font-bold text-slate-900">
                                ${escapeHtml(item.id || "-")}
                            </span>
                        </td>

                        <td>
                            <p class="font-black text-slate-900">
                                ${escapeHtml(item.name || "-")}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                ${escapeHtml(item.kegiatan || "-")}
                            </p>
                        </td>

                        <td>
                            <p class="font-bold text-slate-800">
                                ${escapeHtml(item.branch || "-")}
                            </p>

                            <p class="text-xs text-slate-500">
                                ${escapeHtml(item.branchName || "")}
                            </p>
                        </td>

                        <td>
                            ${escapeHtml(typeText)}
                        </td>

                        <td>
                            ${formatDateTime(item.startDate)}
                        </td>

                        <td class="font-black text-slate-900">
                            ${rupiah(item.totalFund)}
                        </td>

                        <td>
                            ${statusBadge(item.status)}
                        </td>

                        <td>
                            ${sourceBadge(item.source)}
                        </td>

                        <td class="text-center">
                            ${actionButton}
                        </td>
                    </tr>
                `;
            })
            .join("");

    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE
    |--------------------------------------------------------------------------
    */

    if (emptyPkm) {
        emptyPkm.classList.toggle(
            "hidden",
            totalData > 0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | INFORMASI PAGINATION
    |--------------------------------------------------------------------------
    */

    const paginationContainer =
        document.getElementById(
            "pkmPagination"
        );

    const paginationInfo =
        document.getElementById(
            "pkmPaginationInfo"
        );

    const currentPageElement =
        document.getElementById(
            "currentPkmPage"
        );

    const previousButton =
        document.getElementById(
            "previousPkmPage"
        );

    const nextButton =
        document.getElementById(
            "nextPkmPage"
        );

    if (paginationContainer) {
        paginationContainer.classList.toggle(
            "hidden",
            totalData === 0
        );
    }

    if (paginationInfo) {
        paginationInfo.textContent =
            totalData === 0
                ? "Tidak ada data"
                : `Menampilkan ${startIndex + 1}–${Math.min(
                    endIndex,
                    totalData
                )} dari ${totalData} data`;
    }

    if (currentPageElement) {
        currentPageElement.textContent =
            currentPkmPage;
    }

    if (previousButton) {
        previousButton.disabled =
            currentPkmPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled =
            currentPkmPage >= totalPages;
    }

    /*
    |--------------------------------------------------------------------------
    | EVENT TOMBOL PROSES
    |--------------------------------------------------------------------------
    */

    pkmTableBody
        .querySelectorAll(
            "[data-process-pkm]"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    openApprovalModal(
                        button.dataset
                            .processPkm
                    );
                }
            );
        });
}

/*
|--------------------------------------------------------------------------
| ELEMENT MODAL APPROVAL
|--------------------------------------------------------------------------
*/

const approvalModal =
    document.getElementById("approvalModal");

const signatureSection =
    document.getElementById(
        "signatureSection"
    );

const signatureCanvas =
    document.getElementById(
        "signatureCanvas"
    );

const signatureContext =
    signatureCanvas.getContext("2d");

const approveWithSignatureButton =
    document.getElementById(
        "approveWithSignatureButton"
    );

const signatureError =
    document.getElementById(
        "signatureError"
    );

let signatureIsDrawing = false;
let approvalSignatureMode = "";
let savedApprovalSignatureAvailable = false;


/*
|--------------------------------------------------------------------------
| ISI INPUT READONLY
|--------------------------------------------------------------------------
*/

function setApprovalField(
    elementId,
    value
) {
    const element =
        document.getElementById(elementId);

    if (element) {
        element.value = value ?? "";
    }
}

function selectApprovalSignatureMode(mode) {
    const savedButton =
        document.getElementById(
            "useSavedApprovalSignature"
        );

    const drawnButton =
        document.getElementById(
            "useDrawnApprovalSignature"
        );

    const savedPanel =
        document.getElementById(
            "savedApprovalSignaturePanel"
        );

    const drawnPanel =
        document.getElementById(
            "drawnApprovalSignaturePanel"
        );

    if (
        mode === "SAVED" &&
        !savedApprovalSignatureAvailable
    ) {
        showToast(
            "Anda belum memiliki TTD tersimpan."
        );

        return;
    }

    approvalSignatureMode = mode;

    savedPanel.classList.toggle(
        "hidden",
        mode !== "SAVED"
    );

    drawnPanel.classList.toggle(
        "hidden",
        mode !== "DRAWN"
    );

    savedButton.classList.toggle(
        "border-red-500",
        mode === "SAVED"
    );

    savedButton.classList.toggle(
        "bg-red-50",
        mode === "SAVED"
    );

    drawnButton.classList.toggle(
        "border-red-500",
        mode === "DRAWN"
    );

    drawnButton.classList.toggle(
        "bg-red-50",
        mode === "DRAWN"
    );

    if (mode === "SAVED") {
        approveWithSignatureButton.disabled =
            !savedApprovalSignatureAvailable;
    } else if (mode === "DRAWN") {
        approveWithSignatureButton.disabled =
            !signatureHasDrawing;
    } else {
        approveWithSignatureButton.disabled =
            true;
    }

    signatureError.classList.add(
        "hidden"
    );
}


function resetApprovalSignatureSelection() {
    approvalSignatureMode = "";

    document
        .getElementById(
            "savedApprovalSignaturePanel"
        )
        .classList.add("hidden");

    document
        .getElementById(
            "drawnApprovalSignaturePanel"
        )
        .classList.add("hidden");

    const savedButton =
        document.getElementById(
            "useSavedApprovalSignature"
        );

    const drawnButton =
        document.getElementById(
            "useDrawnApprovalSignature"
        );

    savedButton.classList.remove(
        "border-red-500",
        "bg-red-50"
    );

    drawnButton.classList.remove(
        "border-red-500",
        "bg-red-50"
    );

    approveWithSignatureButton.disabled =
        true;

    signatureError.classList.add(
        "hidden"
    );
}

async function prepareApprovalSignature() {
    const status =
        document.getElementById(
            "savedApprovalSignatureStatus"
        );

    const image =
        document.getElementById(
            "savedApprovalSignatureImage"
        );

    approvalSignatureMode = "";
    savedApprovalSignatureAvailable =
        false;

    approveWithSignatureButton.disabled =
        true;

    approveWithSignatureButton.innerHTML = `
        <span class="flex items-center justify-center gap-2">
            <span class="ui-spinner ui-spinner-small"></span>
            Memuat TTD...
        </span>
    `;

    status.innerHTML = `
        <span class="inline-flex items-center gap-2 text-red-600">
            <span class="ui-spinner ui-spinner-small"></span>
            Memeriksa TTD profil...
        </span>
    `;

    image.removeAttribute("src");

    clearSignature();

    try {
        const profile =
            await requestBackend(
                "getMyProfile"
            );

        savedApprovalSignatureAvailable =
            Boolean(
                profile.hasSignature &&
                profile.signatureData
            );

        if (
            savedApprovalSignatureAvailable
        ) {
            image.src =
                profile.signatureData;

            status.textContent =
                `Terakhir diperbarui: ${
                    profile.signatureUpdatedAt ||
                    "-"
                }`;

            selectApprovalSignatureMode(
                "SAVED"
            );
        } else {
            status.textContent =
                "Belum ada TTD tersimpan. Klik Gambar TTD untuk membuatnya.";

            resetApprovalSignatureSelection();
        }
    } catch (error) {
        status.textContent =
            "TTD profil gagal dimuat. Anda tetap dapat menggambar TTD.";

        resetApprovalSignatureSelection();
    } finally {
        approveWithSignatureButton.innerHTML =
            "✓ Setujui Pengajuan";

        approveWithSignatureButton.disabled =
            approvalSignatureMode === "SAVED"
                ? !savedApprovalSignatureAvailable
                : approvalSignatureMode === "DRAWN"
                    ? !signatureHasDrawing
                    : true;
    }
}


/*
|--------------------------------------------------------------------------
| BUKA MODAL
|--------------------------------------------------------------------------
*/

async function openApprovalModal(itemId) {
    const isCrmSubmission =
        approvalModalMode === "SUBMIT_CRM";

    const item =
        isCrmSubmission &&
        pendingCrmSubmission &&
        String(pendingCrmSubmission.id) ===
            String(itemId)
            ? pendingCrmSubmission
            : getBranchPkm().find(
                function (pkm) {
                    return (
                        String(pkm.id) ===
                        String(itemId)
                    );
                }
            );

    if (!item) {
        showToast(
            "Data pengajuan tidak ditemukan."
        );

        return;
    }

    activeApprovalPkmId = item.id;

    const typeText =
        Array.isArray(item.type)
            ? item.type.join(", ")
            : item.type || "-";

    const targetText = [
        `DB ${item.targetDb || 0}`,
        `Deal ${item.targetDeal || 0}`,
        item.targetUe
            ? `UE ${item.targetUe}`
            : null
    ]
        .filter(Boolean)
        .join(" • ");

    setApprovalField(
        "approvalId",
        item.id
    );

    setApprovalField(
        "approvalName",
        item.name
    );

    setApprovalField(
        "approvalBranch",
        `${item.branch} — ${item.branchName}`
    );

    setApprovalField(
        "approvalType",
        item.jenisPkm
    );

    setApprovalField(
        "approvalProductType",
        typeText
    );

    setApprovalField(
        "approvalActivity",
        item.kegiatan
    );

    setApprovalField(
        "approvalStartDate",
        formatDateTime(item.startDate)
    );

    setApprovalField(
        "approvalEndDate",
        formatDateTime(item.endDate)
    );

    setApprovalField(
        "approvalLocation",
        item.location || "-"
    );

    setApprovalField(
        "approvalFund",
        rupiah(item.totalFund)
    );

    setApprovalField(
        "approvalTarget",
        targetText
    );

    setApprovalField(
        "approvalReason",
        item.alasan
    );

    setApprovalField(
        "approvalConcept",
        item.konsep
    );

    document.getElementById(
        "approvalModalFlow"
    ).innerHTML =
        renderApprovalFlow(item);

    renderApprovalHistory(item);

    const canProcess =
        isCrmSubmission
            ? getCurrentUserRole() === "CRM"
            : canCurrentUserProcess(item);

    signatureSection.classList.toggle(
        "hidden",
        !canProcess
    );

    approveWithSignatureButton.classList.toggle(
        "hidden",
        !canProcess
    );

    document.getElementById(
        "approvalModalLabel"
    ).textContent = isCrmSubmission
        ? "TTD PENGAJUAN CRM"
        : canProcess
            ? `PROSES ${getCurrentUserRole()}`
            : "DETAIL PENGAJUAN";

    document.getElementById(
        "approvalModalSubtitle"
    ).textContent = isCrmSubmission
        ? "Periksa kembali pengajuan, lalu gunakan TTD tersimpan atau gambar TTD CRM."
        : canProcess
            ? "Periksa data, buat tanda tangan, kemudian setujui."
            : "Data hanya dapat dilihat dan tidak dapat diubah.";

    approveWithSignatureButton.textContent =
    isCrmSubmission
        ? "✓ TTD & Ajukan PKM"
        : "✓ Setujui Pengajuan";

    approvalModal.classList.remove("hidden");

    approvalModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    if (canProcess) {
        await prepareApprovalSignature();
    } else {
        clearSignature();
    }
}


/*
|--------------------------------------------------------------------------
| RIWAYAT APPROVAL
|--------------------------------------------------------------------------
*/

function renderApprovalHistory(item) {
    const container =
        document.getElementById(
            "approvalHistoryContainer"
        );

    const history =
        Array.isArray(item.approvalHistory)
            ? item.approvalHistory
            : [];

    if (!history.length) {
        container.innerHTML = `
            <div
                class="rounded-xl bg-slate-100 p-4 text-sm text-slate-500"
            >
                Belum ada riwayat approval.
            </div>
        `;

        return;
    }

    container.innerHTML = history
        .map(function (approval) {
            const approved =
                approval.action ===
                "MENYETUJUI";

            return `
                <div
                    class="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
                >
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            approved
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                        } font-black"
                    >
                        ${approved ? "✓" : "➜"}
                    </div>

                    <div class="min-w-0 flex-1">
                        <div
                            class="flex flex-wrap items-center gap-2"
                        >
                            <p
                                class="font-black text-slate-900"
                            >
                                ${escapeHtml(
                                    approval.role
                                )}
                            </p>

                            <span
                                class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600"
                            >
                                ${escapeHtml(
                                    approval.action
                                )}
                            </span>
                        </div>

                        <p
                            class="mt-1 text-sm text-slate-700"
                        >
                            ${escapeHtml(
                                approval.name
                            )}
                        </p>

                        <p
                            class="mt-1 text-xs text-slate-500"
                        >
                            ${formatDateTime(
                                approval.date
                            )}
                        </p>
                    </div>

                    ${
                        approval.signature
                            ? `
                                <img
                                    src="${approval.signature}"
                                    alt="Tanda tangan ${escapeHtml(
                                        approval.name
                                    )}"
                                    class="h-14 w-28 rounded-lg border border-slate-200 bg-white object-contain"
                                >
                            `
                            : ""
                    }
                </div>
            `;
        })
        .join("");
}


/*
|--------------------------------------------------------------------------
| TUTUP MODAL
|--------------------------------------------------------------------------
*/

function closeApprovalModal() {
    approvalModal.classList.add("hidden");

    approvalModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    activeApprovalPkmId = null;

    clearSignature();

    /*
    |--------------------------------------------------------------------------
    | BATALKAN DRAFT YANG BELUM DISIMPAN
    |--------------------------------------------------------------------------
    */

    if (
        approvalModalMode === "SUBMIT_CRM" &&
        !pendingCrmSubmissionSaved
    ) {
        pendingCrmSubmission = null;
    }

    approvalModalMode = "APPROVAL";
    pendingCrmSubmissionSaved = false;
}


/*
|--------------------------------------------------------------------------
| SIGNATURE PAD
|--------------------------------------------------------------------------
*/

function getSignaturePosition(event) {
    const rectangle =
        signatureCanvas.getBoundingClientRect();

    const scaleX =
        signatureCanvas.width /
        rectangle.width;

    const scaleY =
        signatureCanvas.height /
        rectangle.height;

    return {
        x:
            (event.clientX - rectangle.left) *
            scaleX,

        y:
            (event.clientY - rectangle.top) *
            scaleY
    };
}


function startSignature(event) {
    event.preventDefault();

    /*
    | Pastikan mode gambar aktif.
    */

    if (
        approvalSignatureMode !== "DRAWN"
    ) {
        selectApprovalSignatureMode(
            "DRAWN"
        );
    }

    signatureIsDrawing = true;
    signatureHasDrawing = true;

    try {
        signatureCanvas.setPointerCapture(
            event.pointerId
        );
    } catch (error) {
        /*
        | Beberapa browser tidak mendukung
        | pointer capture secara penuh.
        */
    }

    const position =
        getSignaturePosition(
            event
        );

    signatureContext.beginPath();

    signatureContext.moveTo(
        position.x,
        position.y
    );

    /*
    | Buat titik kecil agar satu sentuhan
    | tetap dianggap sebagai gambar.
    */

    signatureContext.lineTo(
        position.x + 0.1,
        position.y + 0.1
    );

    signatureContext.stroke();

    approveWithSignatureButton.disabled =
        false;

    signatureError.classList.add(
        "hidden"
    );
}


function drawSignature(event) {
    if (!signatureIsDrawing) {
        return;
    }

    event.preventDefault();

    const position =
        getSignaturePosition(
            event
        );

    signatureContext.lineTo(
        position.x,
        position.y
    );

    signatureContext.stroke();

    signatureHasDrawing = true;

    if (
        approvalSignatureMode ===
        "DRAWN"
    ) {
        approveWithSignatureButton.disabled =
            false;
    }

    signatureError.classList.add(
        "hidden"
    );
}


function stopSignature(event) {
    if (!signatureIsDrawing) {
        return;
    }

    signatureIsDrawing = false;

    signatureContext.closePath();

    try {
        if (
            signatureCanvas.hasPointerCapture(
                event.pointerId
            )
        ) {
            signatureCanvas.releasePointerCapture(
                event.pointerId
            );
        }
    } catch (error) {
        /*
        | Abaikan jika pointer capture
        | tidak didukung browser.
        */
    }

    approveWithSignatureButton.disabled =
        approvalSignatureMode === "DRAWN"
            ? !signatureHasDrawing
            : !savedApprovalSignatureAvailable;
}


function clearSignature() {
    signatureContext.clearRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );

    signatureContext.fillStyle = "#ffffff";

    signatureContext.fillRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );

    signatureContext.strokeStyle =
        "#0f172a";

    signatureContext.lineWidth = 4;

    signatureContext.lineCap = "round";
    signatureContext.lineJoin = "round";

    signatureHasDrawing = false;

    approveWithSignatureButton.disabled =
        true;

    signatureError.classList.add(
        "hidden"
    );
}


signatureCanvas.addEventListener(
    "pointerdown",
    startSignature
);

signatureCanvas.addEventListener(
    "pointermove",
    drawSignature
);

signatureCanvas.addEventListener(
    "pointerup",
    stopSignature
);

signatureCanvas.addEventListener(
    "pointercancel",
    stopSignature
);

signatureCanvas.addEventListener(
    "pointerleave",
    stopSignature
);


/*
|--------------------------------------------------------------------------
| SETUJUI PENGAJUAN
|--------------------------------------------------------------------------
*/

async function approvePkmWithSignature() {
    if (!approvalSignatureMode) {
        signatureError.classList.remove(
            "hidden"
        );

        showToast(
            "Pilih metode tanda tangan."
        );

        return;
    }

    if (
        approvalSignatureMode === "DRAWN" &&
        !signatureHasDrawing
    ) {
        signatureError.classList.remove(
            "hidden"
        );

        showToast(
            "Silakan gambar tanda tangan terlebih dahulu."
        );

        return;
    }

    const isCrmSubmission =
        approvalModalMode === "SUBMIT_CRM";

    const item = isCrmSubmission
        ? pendingCrmSubmission
        : sheetPkmData.find(
            function (pkm) {
                return (
                    String(pkm.id) ===
                    String(activeApprovalPkmId)
                );
            }
        );

    if (!item) {
        showToast(
            "Data pengajuan tidak ditemukan."
        );

        return;
    }

    if (
        isCrmSubmission &&
        getCurrentUserRole() !== "CRM"
    ) {
        showToast(
            "Hanya CRM yang dapat membuat pengajuan PKM."
        );

        return;
    }

    if (
        !isCrmSubmission &&
        !canCurrentUserProcess(item)
    ) {
        showToast(
            "Pengajuan ini bukan giliran Anda."
        );

        return;
    }

    const confirmationMessage =
        isCrmSubmission
            ? `Tandatangani dan ajukan PKM ${item.id}?`
            : `Setujui pengajuan ${item.id}?`;

    if (!window.confirm(confirmationMessage)) {
        return;
    }

    let signatureData = "";

    if (
        approvalSignatureMode === "DRAWN"
    ) {
        signatureData =
            signatureCanvas.toDataURL(
                "image/png"
            );
    }

    try {
        approveWithSignatureButton.disabled =
            true;

        approveWithSignatureButton.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                <span class="ui-spinner"></span>
                <span>
                    ${
                        isCrmSubmission
                            ? "Mengajukan PKM..."
                            : "Memproses approval..."
                    }
                </span>
            </span>
        `;

        /*
        |--------------------------------------------------------------------------
        | KHUSUS PENGAJUAN BARU
        |--------------------------------------------------------------------------
        | Simpan PKM terlebih dahulu sebagai MENUNGGU CRM.
        | Jika approval gagal, penyimpanan tidak diulang.
        */

        if (
            isCrmSubmission &&
            !pendingCrmSubmissionSaved
        ) {
            await requestBackend(
                "createPkm",
                item
            );

            pendingCrmSubmissionSaved =
                true;
        }

        /*
        |--------------------------------------------------------------------------
        | PROSES TTD CRM / APPROVAL BERIKUTNYA
        |--------------------------------------------------------------------------
        */

        const result =
            await requestBackend(
                "approvePkm",
                {
                    pkmId: item.id,

                    signatureMode:
                        approvalSignatureMode,

                    signatureData:
                        signatureData
                }
            );

        /*
        |--------------------------------------------------------------------------
        | CEK APAKAH INI APPROVAL TERAKHIR
        |--------------------------------------------------------------------------
        */

        const approvalRole = String(
            result.approvalRole ||
            getCurrentUserRole() ||
            ""
        )
            .replace(/[_-]+/g, " ")
            .trim()
            .toUpperCase();

        const isFinalManagerApproval = [
            "MGR",
            "MANAGER",
            "MANAGER H1",
            "KOORDINATOR H23"
        ].includes(approvalRole);

        let pdfSaved = false;
        let pdfErrorMessage = "";

        if (isFinalManagerApproval) {
            approveWithSignatureButton.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <span class="ui-spinner"></span>
                    <span>Membuat dan menyimpan PDF...</span>
                </span>
            `;

            try {
                await window.createAndStorePkmPdf(
                    item.id
                );

                pdfSaved = true;
            } catch (pdfError) {
                console.error(
                    "Gagal membuat PDF:",
                    pdfError
                );

                pdfErrorMessage =
                    pdfError.message ||
                    "PDF belum berhasil disimpan.";
            }
        }

        if (isCrmSubmission) {
            resetPkmForm();
        }

        /*
        | Ubah mode sebelum modal ditutup.
        */

        approvalModalMode = "APPROVAL";
        pendingCrmSubmission = null;
        pendingCrmSubmissionSaved = false;

        closeApprovalModal();

        /*
        | Tunggu database selesai dimuat agar
        | tampilan langsung berubah.
        */

        await loadPkmData("list");

        showPage("listPkmPage");

        if (
            isFinalManagerApproval &&
            pdfSaved
        ) {
            showToast(
                "Approval selesai dan PDF berhasil disimpan."
            );
        } else if (
            isFinalManagerApproval &&
            pdfErrorMessage
        ) {
            showToast(
                "Approval berhasil, tetapi PDF gagal dibuat: " +
                pdfErrorMessage
            );
        } else {
            showToast(
                result.message ||
                (
                    isCrmSubmission
                        ? "PKM berhasil diajukan dan menunggu ACC KACAB."
                        : "Pengajuan berhasil disetujui."
                )
            );
        }
    } catch (error) {
        showToast(
            error.message ||
            (
                isCrmSubmission
                    ? "Pengajuan PKM gagal disimpan."
                    : "Approval gagal diproses."
            )
        );
    } finally {
        approveWithSignatureButton.innerHTML =
            approvalModalMode ===
            "SUBMIT_CRM"
                ? "✓ TTD & Ajukan PKM"
                : "✓ Setujui Pengajuan";

        approveWithSignatureButton.disabled =
            approvalSignatureMode ===
                "DRAWN"
                ? !signatureHasDrawing
                : !savedApprovalSignatureAvailable;
    }
}


/*
|--------------------------------------------------------------------------
| EVENT MODAL
|--------------------------------------------------------------------------
*/

document
    .getElementById(
        "closeApprovalModalButton"
    )
    .addEventListener(
        "click",
        closeApprovalModal
    );

document
    .getElementById(
        "cancelApprovalButton"
    )
    .addEventListener(
        "click",
        closeApprovalModal
    );

document
    .getElementById(
        "approvalModalBackdrop"
    )
    .addEventListener(
        "click",
        closeApprovalModal
    );

document
    .getElementById(
        "clearSignatureButton"
    )
    .addEventListener(
        "click",
        clearSignature
    );

approveWithSignatureButton.addEventListener(
    "click",
    approvePkmWithSignature
);

document
    .getElementById(
        "useSavedApprovalSignature"
    )
    .addEventListener(
        "click",
        function () {
            selectApprovalSignatureMode(
                "SAVED"
            );
        }
    );


document
    .getElementById(
        "useDrawnApprovalSignature"
    )
    .addEventListener(
        "click",
        function () {
            /*
            | Jika sebelumnya belum memilih
            | mode gambar, bersihkan canvas.
            */

            const previouslyDrawing =
                approvalSignatureMode ===
                "DRAWN";

            selectApprovalSignatureMode(
                "DRAWN"
            );

            if (!previouslyDrawing) {
                clearSignature();
            }

            /*
            | Tunggu canvas tampil, kemudian
            | geser modal seperlunya.
            */

            window.requestAnimationFrame(
                function () {
                    document
                        .getElementById(
                            "drawnApprovalSignaturePanel"
                        )
                        .scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "nearest"
                        });
                }
            );
        }
    );

document.addEventListener(
    "click",
    async function (event) {
        const button = event.target.closest(
            "[data-download-stored-pdf]"
        );

        if (!button) {
            return;
        }

        const pkmId =
            button.dataset.downloadStoredPdf;

        await window.downloadStoredPkmPdf(
            pkmId,
            button
        );
    }
);    

/*
|--------------------------------------------------------------------------
| VALIDASI FORM DAN TOMBOL SUBMIT
|--------------------------------------------------------------------------
*/

const submitPkmButton =
    document.getElementById("submitPkmButton");

const submitPanel =
    document.getElementById("submitPanel");

const submitStatusIcon =
    document.getElementById("submitStatusIcon");

const submitStatusTitle =
    document.getElementById("submitStatusTitle");

const submitStatusMessage =
    document.getElementById("submitStatusMessage");

const submitButtonIcon =
    document.getElementById("submitButtonIcon");

const submitButtonText =
    document.getElementById("submitButtonText");

function getMissingFields() {
    const missingFields = [];

    const requiredTextFields = [
        {
            id: "namaPkm",
            name: "Nama PKM"
        },
        {
            id: "jenisPkm",
            name: "Jenis PKM"
        },
        {
            id: "jenisKegiatan",
            name: "Jenis kegiatan"
        },
        {
            id: "tanggalMulai",
            name: "Tanggal mulai"
        },
        {
            id: "jamMulai",
            name: "Jam mulai"
        },
        {
            id: "tanggalSelesai",
            name: "Tanggal selesai"
        },
        {
            id: "jamSelesai",
            name: "Jam selesai"
        },
        {
            id: "alasan",
            name: "Alasan PKM"
        },
        {
            id: "konsep",
            name: "Konsep PKM"
        }
    ];

    requiredTextFields.forEach(function (field) {
        const element =
            document.getElementById(field.id);

        if (
            !element ||
            element.value.trim() === ""
        ) {
            missingFields.push(field.name);
        }
    });

    if (!selectedValues(".type-pkm").length) {
        missingFields.push("Type PKM");
    }

    const focusTypes =
        selectedValues(".focus-type");

    if (!focusTypes.length) {
        missingFields.push("Fokus type");
    }

    if (
        focusTypes.includes("H1") &&
        !document.getElementById("programH1").value.trim()
    ) {
        missingFields.push("Nama program H1");
    }

    if (
        focusTypes.includes("H23") &&
        !document.getElementById("programH23").value.trim()
    ) {
        missingFields.push("Nama program H23");
    }

    const targetDb =
        Number(document.getElementById("targetDb").value) || 0;

    const targetDeal =
        Number(document.getElementById("targetDeal").value) || 0;

    if (targetDb <= 0) {
        missingFields.push("Target DB");
    }

    if (targetDeal <= 0) {
        missingFields.push("Target deal");
    }

    if (
        selectedValues(".type-pkm").some(function (type) {
            return type === "H23" || type === "H123";
        }) &&
        (Number(document.getElementById("targetUe").value) || 0) <= 0
    ) {
        missingFields.push("Target UE");
    }

    document
        .querySelectorAll(".leasing-compact-row")
        .forEach(function (row) {
            const leasingName =
                row.querySelector(".leasing-name").value;

            const leasingFund =
                Number(row.querySelector(".leasing-fund").value) || 0;

            if (leasingName && leasingFund <= 0) {
                missingFields.push(`Dana leasing ${leasingName}`);
            }
        });

    const startDate = combineDateTime(
        document.getElementById("tanggalMulai").value,
        document.getElementById("jamMulai").value
    );

    const endDate = combineDateTime(
        document.getElementById("tanggalSelesai").value,
        document.getElementById("jamSelesai").value
    );

    if (
        startDate &&
        endDate &&
        new Date(endDate).getTime() < new Date(startDate).getTime()
    ) {
        missingFields.push("Waktu selesai yang valid");
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI TAMBAHAN UNTUK BTL
    |--------------------------------------------------------------------------
    */

    if (isBtlSelected()) {
        if (
            !document
                .getElementById("lokasi")
                .value
                .trim()
        ) {
            missingFields.push("Lokasi kegiatan");
        }

        if (
            !document
                .getElementById("kabupaten")
                .value
                .trim()
        ) {
            missingFields.push("Kabupaten/kota");
        }

        if (!selectedPeople.length) {
            missingFields.push("People");
        }

        if (!selectedValues(".publication").length) {
            missingFields.push("Publikasi");
        }
    }

    return missingFields;
}

function validateFormState() {
    const missingFields = getMissingFields();
    const formComplete = missingFields.length === 0;

    submitPkmButton.disabled = !formComplete;

    submitPanel.classList.toggle(
        "submit-panel-locked",
        !formComplete
    );

    submitPanel.classList.toggle(
        "submit-panel-ready",
        formComplete
    );

    if (formComplete) {
        submitStatusIcon.textContent = "✓";
        submitStatusTitle.textContent =
            "Pengajuan siap dikirim";

        submitStatusMessage.textContent =
            "Seluruh data wajib sudah lengkap.";

        submitButtonIcon.textContent = "➜";
        submitButtonText.textContent = "Ajukan PKM";
    } else {
        submitStatusIcon.textContent = "🔒";
        submitStatusTitle.textContent =
            `${missingFields.length} data belum lengkap`;

        submitStatusMessage.textContent =
            missingFields
                .slice(0, 3)
                .join(", ") +
            (
                missingFields.length > 3
                    ? ` dan ${missingFields.length - 3} lainnya`
                    : ""
            );

        submitButtonIcon.textContent = "🔒";
        submitButtonText.textContent = "Lengkapi data";
    }
}

pkmForm.addEventListener(
    "input",
    validateFormState
);

pkmForm.addEventListener(
    "change",
    validateFormState
);

document
    .getElementById("searchPkm")
    .addEventListener("input", function () {
        currentPkmPage = 1;
        renderPkmTable();
    });

document
    .getElementById("statusFilter")
    .addEventListener("change", function () {
        currentPkmPage = 1;
        renderPkmTable();
    });

document
    .getElementById("applyDashboardFilter")
    .addEventListener("click", function () {
        loadPkmData("dashboard");
    });

document
    .getElementById("applyPkmFilter")
    .addEventListener("click", function () {
        currentPkmPage = 1;
        loadPkmData("list");
    });

document
    .getElementById("resetPkmFilter")
    .addEventListener("click", function () {
        currentPkmPage = 1;
        const range = getCurrentMonthRange();

        document.getElementById("searchPkm").value = "";
        document.getElementById("statusFilter").value = "ALL";
        document.getElementById("listJenisPkm").value = "ALL";
        document.getElementById("listStartDate").value = range.startDate;
        document.getElementById("listEndDate").value = range.endDate;

        if (isHeadOfficeUser()) {
            const allCheckbox = document.querySelector(
                '[data-branch-all="list"]'
            );

            if (allCheckbox) {
                allCheckbox.checked = true;
            }

            document
                .querySelectorAll('[data-branch-option="list"]')
                .forEach(function (checkbox) {
                    checkbox.checked = false;
                });

            const summary = document.getElementById(
                "listBranchSummary"
            );

            if (summary) {
                summary.textContent = "Semua cabang";
            }
        }

        loadPkmData("list");
    });

document
    .getElementById("searchPkm")
    .addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            loadPkmData("list");
        }
    });

/*
|--------------------------------------------------------------------------
| JALANKAN APLIKASI SETELAH SELURUH KONSTANTA DAN LISTENER SIAP
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| PAGINATION LIST PKM
|--------------------------------------------------------------------------
*/

document
    .getElementById("previousPkmPage")
    .addEventListener("click", function () {
        if (currentPkmPage <= 1) {
            return;
        }

        currentPkmPage -= 1;

        renderPkmTable();

        document
            .getElementById("listPkmPage")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    });

document
    .getElementById("nextPkmPage")
    .addEventListener("click", function () {
        currentPkmPage += 1;

        renderPkmTable();

        document
            .getElementById("listPkmPage")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    });


/*
|--------------------------------------------------------------------------
| MANAGE AKUN
|--------------------------------------------------------------------------
*/

const accountManagementModal =
    document.getElementById(
        "accountManagementModal"
    );

let managedAccounts = [];


function closeAccountManagementModal() {
    accountManagementModal.classList.add(
        "hidden"
    );
}


async function openAccountManagementModal() {
    if (!isMasterAccount()) {
        showToast(
            "Anda tidak memiliki akses Manage Akun."
        );

        return;
    }

    accountMenu.classList.add("hidden");

    accountManagementModal.classList.remove(
        "hidden"
    );

    await loadManagedAccounts();
}


async function loadManagedAccounts() {
    const tableBody =
        document.getElementById(
            "managedAccountTableBody"
        );

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="py-10 text-center text-slate-400">
                Memuat data akun...
            </td>
        </tr>
    `;

    try {
        const result = await requestBackend(
            "getManagedAccounts"
        );

        managedAccounts =
            Array.isArray(result.accounts)
                ? result.accounts
                : [];

        renderManagedAccounts();
    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="py-10 text-center font-bold text-red-600">
                    ${escapeHtml(
                        error.message ||
                        "Data akun gagal dimuat."
                    )}
                </td>
            </tr>
        `;
    }
}


function renderManagedAccounts() {
    const search =
        document.getElementById(
            "accountSearch"
        )
            .value
            .trim()
            .toLowerCase();

    const filteredAccounts =
        managedAccounts.filter(
            function (account) {
                const searchableText = [
                    account.nik,
                    account.name,
                    account.branch,
                    account.jabatan,
                    account.role,
                    account.status
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(
                    search
                );
            }
        );

    const tableBody =
        document.getElementById(
            "managedAccountTableBody"
        );

    tableBody.innerHTML =
        filteredAccounts
            .map(function (account) {
                const statusClass =
                    account.status ===
                    "AKTIF"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700";

                return `
                    <tr>
                        <td class="font-black">
                            ${escapeHtml(account.nik)}
                        </td>

                        <td>
                            ${escapeHtml(account.name)}
                        </td>

                        <td>
                            ${escapeHtml(account.branch)}
                        </td>

                        <td>
                            ${escapeHtml(
                                account.role ||
                                "-"
                            )}
                        </td>

                        <td>
                            <span class="rounded-full px-3 py-1 text-xs font-black ${statusClass}">
                                ${escapeHtml(account.status)}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                data-edit-account="${escapeHtml(account.nik)}"
                                class="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                            >
                                Edit
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

    document.getElementById(
        "managedAccountCount"
    ).textContent =
        `${filteredAccounts.length} akun`;

    tableBody
        .querySelectorAll(
            "[data-edit-account]"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    selectManagedAccount(
                        button.dataset
                            .editAccount
                    );
                }
            );
        });
}


function selectManagedAccount(nik) {
    const account =
        managedAccounts.find(
            function (item) {
                return item.nik === nik;
            }
        );

    if (!account) {
        return;
    }

    document.getElementById(
        "managedOriginalNik"
    ).value = account.nik;

    document.getElementById(
        "managedNik"
    ).value = account.nik;

    document.getElementById(
        "managedName"
    ).value = account.name;

    document.getElementById(
        "managedBranch"
    ).value = account.branch;

    document.getElementById(
        "managedRole"
    ).value =
        account.role || "";

    document.getElementById(
        "managedStatus"
    ).value =
        account.status || "AKTIF";

    [
        "managedNik",
        "managedName",
        "managedBranch",
        "managedRole",
        "managedStatus",
        "saveManagedAccount"
    ].forEach(function (id) {
        document.getElementById(
            id
        ).disabled = false;
    });

    /*
    | NIK master tidak boleh diubah.
    */

    if (
        MASTER_ACCOUNT_NIKS.includes(
            account.nik
        )
    ) {
        document.getElementById(
            "managedNik"
        ).disabled = true;
    }
}


document
    .getElementById(
        "accountSearch"
    )
    .addEventListener(
        "input",
        renderManagedAccounts
    );


manageAccountsButton.addEventListener(
    "click",
    openAccountManagementModal
);


document
    .getElementById(
        "closeAccountManagement"
    )
    .addEventListener(
        "click",
        closeAccountManagementModal
    );


document
    .getElementById(
        "accountManagementBackdrop"
    )
    .addEventListener(
        "click",
        closeAccountManagementModal
    );


document
    .getElementById(
        "saveManagedAccount"
    )
    .addEventListener(
        "click",
        async function () {
            const payload = {
                originalNik:
                    document.getElementById(
                        "managedOriginalNik"
                    ).value,

                nik:
                    document.getElementById(
                        "managedNik"
                    ).value.trim(),

                name:
                    document.getElementById(
                        "managedName"
                    ).value.trim(),

                branch:
                    document.getElementById(
                        "managedBranch"
                    ).value,

                role:
                    document.getElementById(
                        "managedRole"
                    ).value,

                status:
                    document.getElementById(
                        "managedStatus"
                    ).value
            };

            if (
                !payload.nik ||
                !payload.name ||
                !payload.branch
            ) {
                showToast(
                    "NIK, nama, dan cabang wajib diisi."
                );

                return;
            }

            try {
                this.disabled = true;
                this.textContent =
                    "Menyimpan...";

                await requestBackend(
                    "updateManagedAccount",
                    payload
                );

                showToast(
                    "Data akun berhasil diperbarui."
                );

                await loadManagedAccounts();
            } catch (error) {
                showToast(
                    error.message ||
                    "Data akun gagal disimpan."
                );
            } finally {
                this.disabled = false;
                this.textContent =
                    "Simpan Perubahan";
            }
        }
    );    

/*
|--------------------------------------------------------------------------
| KELOLA PROFIL
|--------------------------------------------------------------------------
*/

const profileModal =
    document.getElementById(
        "profileModal"
    );

const profileSignatureCanvas =
    document.getElementById(
        "profileSignatureCanvas"
    );

const profileSignatureContext =
    profileSignatureCanvas.getContext(
        "2d"
    );

let profileSignatureDrawing = false;
let profileSignatureHasDrawing = false;
let uploadedSignatureData = "";
let hasCurrentProfileSignature = false;


/*
|--------------------------------------------------------------------------
| TAMPILKAN EDITOR TTD
|--------------------------------------------------------------------------
*/

function showProfileSignatureEditor() {
    document
        .getElementById(
            "currentProfileSignature"
        )
        .classList.add("hidden");

    document
        .getElementById(
            "profileSignatureEditor"
        )
        .classList.remove("hidden");

    clearProfileSignature();
}


/*
|--------------------------------------------------------------------------
| AMBIL TTD SAAT INI
|--------------------------------------------------------------------------
*/

async function loadCurrentProfileSignature() {
    const currentSection =
        document.getElementById(
            "currentProfileSignature"
        );

    const editor =
        document.getElementById(
            "profileSignatureEditor"
        );

    const image =
        document.getElementById(
            "currentSignatureImage"
        );

    const updatedAt =
        document.getElementById(
            "currentSignatureUpdatedAt"
        );

    const loading =
        document.getElementById(
            "profileSignatureLoading"
        );

    /*
    | Tampilkan loading dan sembunyikan
    | preview/editor sementara.
    */

    loading.classList.remove(
        "hidden"
    );

    loading.classList.add(
        "flex"
    );

    currentSection.classList.add(
        "hidden"
    );

    editor.classList.add(
        "hidden"
    );

    try {
        const result =
            await requestBackend(
                "getMyProfile"
            );

        hasCurrentProfileSignature =
            Boolean(
                result.hasSignature &&
                result.signatureData
            );

        if (
            hasCurrentProfileSignature
        ) {
            image.src =
                result.signatureData;

            updatedAt.textContent =
                "Terakhir diperbarui: " +
                (
                    result.signatureUpdatedAt ||
                    "-"
                );

            currentSection
                .classList
                .remove("hidden");

            editor
                .classList
                .add("hidden");

            return;
        }

        image.removeAttribute(
            "src"
        );

        currentSection
            .classList
            .add("hidden");

        editor
            .classList
            .remove("hidden");
    } catch (error) {
        hasCurrentProfileSignature =
            false;

        currentSection
            .classList
            .add("hidden");

        editor
            .classList
            .remove("hidden");

        showToast(
            error.message ||
            "TTD saat ini gagal dimuat."
        );
    } finally {
        /*
        | Selalu hilangkan loading,
        | baik berhasil maupun gagal.
        */

        loading.classList.add(
            "hidden"
        );

        loading.classList.remove(
            "flex"
        );
    }
}



async function openProfileModal() {
    document.getElementById(
        "profileNik"
    ).value =
        currentUser.nik ||
        currentUser.username ||
        "";

    document.getElementById(
        "profileName"
    ).value =
        currentUser.name || "";

    document.getElementById(
        "profileNewPassword"
    ).value = "";

    document.getElementById(
        "profileConfirmPassword"
    ).value = "";

    clearProfileSignature();

    profileModal.classList.remove(
        "hidden"
    );

    profileModal.setAttribute(
        "aria-hidden",
        "false"
    );

    await loadCurrentProfileSignature();

    accountMenu.classList.add("hidden");
}


function closeProfileModal() {
    profileModal.classList.add(
        "hidden"
    );

    profileModal.setAttribute(
        "aria-hidden",
        "true"
    );
}


function getProfileCanvasPosition(event) {
    const rectangle =
        profileSignatureCanvas
            .getBoundingClientRect();

    return {
        x:
            (
                event.clientX -
                rectangle.left
            ) *
            (
                profileSignatureCanvas.width /
                rectangle.width
            ),

        y:
            (
                event.clientY -
                rectangle.top
            ) *
            (
                profileSignatureCanvas.height /
                rectangle.height
            )
    };
}




profileSignatureCanvas.addEventListener(
    "pointerdown",
    function (event) {
        event.preventDefault();

        profileSignatureDrawing = true;

        try {
            profileSignatureCanvas
                .setPointerCapture(
                    event.pointerId
                );
        } catch (error) {
            // Abaikan jika tidak didukung.
        }

        const position =
            getProfileCanvasPosition(
                event
            );

        profileSignatureContext.beginPath();

        profileSignatureContext.moveTo(
            position.x,
            position.y
        );
    }
);


profileSignatureCanvas.addEventListener(
    "pointermove",
    function (event) {
        if (!profileSignatureDrawing) {
            return;
        }

        event.preventDefault();

        const position =
            getProfileCanvasPosition(
                event
            );

        profileSignatureContext.lineWidth = 4;

        profileSignatureContext.lineCap =
            "round";

        profileSignatureContext.lineJoin =
            "round";

        profileSignatureContext.strokeStyle =
            "#0f172a";

        profileSignatureContext.lineTo(
            position.x,
            position.y
        );

        profileSignatureContext.stroke();

        profileSignatureHasDrawing = true;
    }
);


document.addEventListener(
    "pointerup",
    function () {
        profileSignatureDrawing = false;
    }
);


function clearProfileSignature(
    showCanvas = false
) {
    profileSignatureContext.clearRect(
        0,
        0,
        profileSignatureCanvas.width,
        profileSignatureCanvas.height
    );

    /*
    | Beri latar putih pada canvas.
    */

    profileSignatureContext.fillStyle =
        "#ffffff";

    profileSignatureContext.fillRect(
        0,
        0,
        profileSignatureCanvas.width,
        profileSignatureCanvas.height
    );

    profileSignatureHasDrawing = false;
    profileSignatureDrawing = false;
    uploadedSignatureData = "";

    const uploadInput =
        document.getElementById(
            "profileSignatureUpload"
        );

    const preview =
        document.getElementById(
            "uploadedSignaturePreview"
        );

    const previewContainer =
        document.getElementById(
            "uploadedSignaturePreviewContainer"
        );

    const canvasContainer =
        document.getElementById(
            "profileSignatureCanvasContainer"
        );

    uploadInput.value = "";

    preview.removeAttribute("src");

    previewContainer.classList.add(
        "hidden"
    );

    canvasContainer.classList.toggle(
        "hidden",
        !showCanvas
    );
}

document
    .getElementById(
        "chooseDrawSignature"
    )
    .addEventListener(
        "click",
        function () {
            clearProfileSignature(true);

            window.requestAnimationFrame(
                function () {
                    document
                        .getElementById(
                            "profileSignatureCanvasContainer"
                        )
                        .scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "nearest"
                        });
                }
            );
        }
    );


/*
|--------------------------------------------------------------------------
| KOMPRES GAMBAR TTD
|--------------------------------------------------------------------------
| Gambar diperkecil agar request ke Vercel dan Apps Script lebih ringan.
*/

function compressSignatureImage(file) {
    return new Promise(function (
        resolve,
        reject
    ) {
        const reader =
            new FileReader();

        reader.onerror = function () {
            reject(
                new Error(
                    "Gambar tidak dapat dibaca."
                )
            );
        };

        reader.onload = function () {
            const image =
                new Image();

            image.onerror = function () {
                reject(
                    new Error(
                        "Format gambar tidak didukung."
                    )
                );
            };

            image.onload = function () {
                const maximumWidth = 600;
                const maximumHeight = 240;

                const scale = Math.min(
                    1,
                    maximumWidth / image.width,
                    maximumHeight / image.height
                );

                const width = Math.max(
                    1,
                    Math.round(
                        image.width * scale
                    )
                );

                const height = Math.max(
                    1,
                    Math.round(
                        image.height * scale
                    )
                );

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                canvas.width = width;
                canvas.height = height;

                const context =
                    canvas.getContext("2d");

                /*
                | Beri latar putih agar TTD transparan
                | tidak berubah menjadi hitam.
                */

                context.fillStyle = "#ffffff";

                context.fillRect(
                    0,
                    0,
                    width,
                    height
                );

                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );

                /*
                | JPEG kualitas 75% biasanya menghasilkan
                | file kurang dari 300 KB.
                */

                const compressedData =
                    canvas.toDataURL(
                        "image/png",
                    );

                resolve(
                    compressedData
                );
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

function compressDrawnSignature() {
    const maximumWidth = 600;
    const maximumHeight = 240;

    const scale = Math.min(
        1,
        maximumWidth /
            profileSignatureCanvas.width,
        maximumHeight /
            profileSignatureCanvas.height
    );

    const width = Math.max(
        1,
        Math.round(
            profileSignatureCanvas.width *
            scale
        )
    );

    const height = Math.max(
        1,
        Math.round(
            profileSignatureCanvas.height *
            scale
        )
    );

    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
        canvas.getContext("2d");

    context.fillStyle = "#ffffff";

    context.fillRect(
        0,
        0,
        width,
        height
    );

    context.drawImage(
        profileSignatureCanvas,
        0,
        0,
        width,
        height
    );

    return canvas.toDataURL(
        "image/png",
    );
}

document
    .getElementById(
        "profileSignatureUpload"
    )
    .addEventListener(
        "change",
        async function (event) {
            const file =
                event.target.files[0];

            if (!file) {
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                showToast(
                    "File tanda tangan harus berupa gambar."
                );

                event.target.value = "";
                return;
            }

            /*
            | File asli maksimal 5 MB karena nantinya
            | akan dikompres sebelum dikirim.
            */

            if (
                file.size >
                5 * 1024 * 1024
            ) {
                showToast(
                    "Ukuran gambar asli maksimal 5 MB."
                );

                event.target.value = "";
                return;
            }

            try {
                showToast(
                    "Memproses gambar tanda tangan..."
                );

                /*
                | Hapus hasil gambar manual.
                */

                profileSignatureContext
                    .clearRect(
                        0,
                        0,
                        profileSignatureCanvas.width,
                        profileSignatureCanvas.height
                    );

                profileSignatureHasDrawing =
                    false;

                /*
                | Kompres sebelum dimasukkan ke payload API.
                */

                uploadedSignatureData =
                    await compressSignatureImage(
                        file
                    );

                document.getElementById(
                    "uploadedSignaturePreview"
                ).src =
                    uploadedSignatureData;

                document.getElementById(
                    "uploadedSignaturePreviewContainer"
                ).classList.remove(
                    "hidden"
                );

                document.getElementById(
                    "profileSignatureCanvasContainer"
                ).classList.add(
                    "hidden"
                );

                showToast(
                    "Gambar TTD siap disimpan."
                );
            } catch (error) {
                uploadedSignatureData = "";

                event.target.value = "";

                showToast(
                    error.message ||
                    "Gambar TTD gagal diproses."
                );
            }
        }
    );


document
    .getElementById(
        "manageProfileButton"
    )
    .addEventListener(
        "click",
        openProfileModal
    );


document
    .getElementById(
        "closeProfileModal"
    )
    .addEventListener(
        "click",
        closeProfileModal
    );


document
    .getElementById(
        "cancelProfileButton"
    )
    .addEventListener(
        "click",
        closeProfileModal
    );


document
    .getElementById(
        "profileModalBackdrop"
    )
    .addEventListener(
        "click",
        closeProfileModal
    );


document
    .getElementById(
        "clearProfileSignature"
    )
    .addEventListener(
        "click",
        function () {
            /*
            | Bersihkan tanpa menutup canvas.
            */

            clearProfileSignature(true);
        }
    );


document
    .getElementById(
        "saveProfileButton"
    )
    .addEventListener(
        "click",
        async function () {
            const newPassword =
                document.getElementById(
                    "profileNewPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "profileConfirmPassword"
                ).value;

            if (
                newPassword &&
                newPassword.length < 5
            ) {
                showToast(
                    "Password minimal 5 karakter."
                );

                return;
            }

            if (
                newPassword !==
                confirmPassword
            ) {
                showToast(
                    "Konfirmasi password tidak sesuai."
                );

                return;
            }

            let signatureData =
                uploadedSignatureData;

            if (
                !signatureData &&
                profileSignatureHasDrawing
            ) {
                signatureData =
                    compressDrawnSignature();
            }

            /*
            |--------------------------------------------------------------------------
            | CEK UKURAN HASIL BASE64
            |--------------------------------------------------------------------------
            */

            if (
                signatureData &&
                signatureData.length >
                350000
            ) {
                showToast(
                    "Gambar TTD terlalu besar. Coba unggah ulang dengan gambar yang lebih sederhana."
                );

                return;
            }

            try {
                this.disabled = true;
                this.textContent =
                    "Menyimpan...";

                await requestBackend(
                    "updateMyProfile",
                    {
                        newPassword:
                            newPassword,

                        signatureData:
                            signatureData
                    }
                );

                showToast(
                    "Profil berhasil diperbarui."
                );

                document.getElementById(
                    "profileNewPassword"
                ).value = "";

                document.getElementById(
                    "profileConfirmPassword"
                ).value = "";

                clearProfileSignature();

                await loadCurrentProfileSignature();

                closeProfileModal();
            } catch (error) {
                showToast(
                    error.message ||
                    "Profil gagal diperbarui."
                );
            } finally {
                this.disabled = false;
                this.textContent =
                    "Simpan Profil";
            }
        }
    );

initializeApplication();

