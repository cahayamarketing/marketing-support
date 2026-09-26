"use strict";

const APP_ICONS = {
    dashboard: `
        <path d="M3 3h7v7H3V3Z"/>
        <path d="M14 3h7v7h-7V3Z"/>
        <path d="M3 14h7v7H3v-7Z"/>
        <path d="M14 14h7v7h-7v-7Z"/>
    `,

    clipboard: `
        <path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <path d="M9 12h6M9 16h6"/>
    `,

    chart: `
        <path d="M4 19V9"/>
        <path d="M10 19V5"/>
        <path d="M16 19v-7"/>
        <path d="M22 19H2"/>
    `,

    user: `
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21a8 8 0 0 1 16 0"/>
    `,

    accounts: `
        <circle cx="9" cy="8" r="4"/>
        <path d="M2 21a7 7 0 0 1 14 0"/>
        <path d="M19 8v6M16 11h6"/>
    `,

    database: `
        <ellipse cx="12" cy="5" rx="8" ry="3"/>
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/>
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>
    `,

    profile: `
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21a8 8 0 0 1 16 0"/>
        <path d="m17 3 1 1"/>
    `,

    logout: `
        <path d="M10 17l5-5-5-5"/>
        <path d="M15 12H3"/>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    `,

    search: `
        <circle cx="11" cy="11" r="7"/>
        <path d="m20 20-4-4"/>
    `,

    filter: `
        <path d="M4 5h16"/>
        <path d="M7 12h10"/>
        <path d="M10 19h4"/>
    `,

    chevron: `
        <path d="m6 9 6 6 6-6"/>
    `,

    close: `
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
    `,

    submission: `
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
        <path d="m15 5 3 3"/>
    `,

    list: `
        <path d="M8 6h13"/>
        <path d="M8 12h13"/>
        <path d="M8 18h13"/>
        <path d="M3 6h.01"/>
        <path d="M3 12h.01"/>
        <path d="M3 18h.01"/>
    `,

    pdf: `
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
        <path d="M14 2v6h6"/>
        <path d="M8 15h2"/>
        <path d="M8 18h5"/>
    `,

    lpj: `
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    `,

    crm: `
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    `,

    sipede: `
        <path d="M3 3v18h18"/>
        <path d="m7 16 4-5 4 3 5-7"/>
        <path d="M17 7h3v3"/>
    `
};


function renderApplicationIcons() {
    document
        .querySelectorAll("[data-app-icon]")
        .forEach(function (element) {
            const iconName =
                element.dataset.appIcon;

            const paths =
                APP_ICONS[iconName];

            if (!paths) {
                return;
            }

            element.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    ${paths}
                </svg>
            `;
        });
}


function initializeApplicationIcons() {
    renderApplicationIcons();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApplicationIcons
    );
} else {
    initializeApplicationIcons();
}

/*
|--------------------------------------------------------------------------
| PEMERIKSAAN SESSION LOGIN
|--------------------------------------------------------------------------
| Login dan index menggunakan halaman terpisah.
*/

const urlParameters =
    new URLSearchParams(
        window.location.search
    );

const discordApprovalPkmId =
    String(
        urlParameters.get(
            "approvalPkm"
        ) || ""
    ).trim();

const discordApprovalToken =
    String(
        urlParameters.get(
            "approvalToken"
        ) || ""
    ).trim();

const isDiscordApprovalMode =
    Boolean(
        discordApprovalPkmId &&
        discordApprovalToken
    );

function ensureDiscordLoadingStyle() {
    if (
        document.getElementById(
            "discordApprovalLoadingStyle"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "discordApprovalLoadingStyle";

    style.textContent = `
        @keyframes discordApprovalSpin {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }

        #discordApprovalLoadingOverlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
                rgba(15, 23, 42, 0.42);

            backdrop-filter:
                blur(10px);

            -webkit-backdrop-filter:
                blur(10px);
        }

        #discordApprovalLoadingOverlay.hidden {
            display: none;
        }

        .discord-approval-loading-card {
            width: min(
                calc(100% - 40px),
                360px
            );

            padding: 30px 24px;
            border-radius: 24px;

            background:
                rgba(255,255,255,0.96);

            box-shadow:
                0 25px 70px
                rgba(15,23,42,0.28);

            text-align: center;
        }

        .discord-approval-loading-spinner {
            width: 48px;
            height: 48px;

            margin:
                0 auto 18px;

            border: 5px solid
                #e5e7eb;

            border-top-color:
                #dc2626;

            border-radius:
                9999px;

            animation:
                discordApprovalSpin
                0.75s
                linear
                infinite;
        }

        .discord-approval-loading-title {
            margin: 0;

            font-size: 17px;
            font-weight: 800;

            color: #111827;
        }

        .discord-approval-loading-message {
            margin-top: 8px;

            font-size: 13px;
            line-height: 1.6;

            color: #64748b;
        }
    `;

    document.head.appendChild(
        style
    );
}


function showDiscordApprovalLoading(
    message =
        "Memuat data pengajuan..."
) {
    ensureDiscordLoadingStyle();

    let overlay =
        document.getElementById(
            "discordApprovalLoadingOverlay"
        );

    if (!overlay) {
        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "discordApprovalLoadingOverlay";

        overlay.innerHTML = `
            <div
                class="discord-approval-loading-card"
            >
                <div
                    class="discord-approval-loading-spinner"
                ></div>

                <p
                    class="discord-approval-loading-title"
                >
                    Menyiapkan Approval PKM
                </p>

                <p
                    id="discordApprovalLoadingMessage"
                    class="discord-approval-loading-message"
                >
                    ${escapeHtml(message)}
                </p>
            </div>
        `;

        document.body.appendChild(
            overlay
        );

    } else {
        overlay.classList.remove(
            "hidden"
        );

        const messageElement =
            document.getElementById(
                "discordApprovalLoadingMessage"
            );

        if (messageElement) {
            messageElement.textContent =
                message;
        }
    }

    document.body.style.overflow =
        "hidden";
}


function updateDiscordApprovalLoading(
    message
) {
    const element =
        document.getElementById(
            "discordApprovalLoadingMessage"
        );

    if (element) {
        element.textContent =
            String(
                message || ""
            );
    }
}


function hideDiscordApprovalLoading() {
    const overlay =
        document.getElementById(
            "discordApprovalLoadingOverlay"
        );

    if (overlay) {
        overlay.classList.add(
            "hidden"
        );
    }

    document.body.style.overflow =
        "";
}


const savedSession =
    sessionStorage.getItem(
        "currentUser"
    );

let sessionToken =
    sessionStorage.getItem(
        "sessionToken"
    ) || "";


/*
|--------------------------------------------------------------------------
| LOGIN NORMAL
|--------------------------------------------------------------------------
*/

if (
    !isDiscordApprovalMode &&
    (
        !savedSession ||
        !sessionToken
    )
) {
    window.location.replace(
        "login.html"
    );

    throw new Error(
        "User belum login."
    );
}


let activePageId = "";
const MASTER_ACCOUNT_NIKS =
    Object.freeze([
        "911117",
        "911120",
        "911147"
    ]);

let sheetPkmData = [];
let referenceMastersLoaded = false;
let referenceMastersPromise = null;

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
let currentPkmLoadPromise = null;
const PKM_PAGE_SIZE = 7;

let currentPkmPage = 1;

let currentUser;


/*
|--------------------------------------------------------------------------
| USER SEMENTARA UNTUK DISCORD
|--------------------------------------------------------------------------
*/

if (
    isDiscordApprovalMode
) {
    currentUser = {
        id:
            "DISCORD",

        nik:
            "DISCORD",

        username:
            "DISCORD",

        name:
            "Discord Approval",

        jabatan:
            "Discord Approval",

        role:
            "",

        branch:
            "ALL",

        originalBranch:
            "HO",

        branchName:
            "HEAD OFFICE",

        status:
            "AKTIF",

        isMaster:
            false
    };

} else {

    try {
        currentUser =
            JSON.parse(
                savedSession
            );
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
}

if (
    !isDiscordApprovalMode &&
    (
        !currentUser ||
        !currentUser.username ||
        !currentUser.role ||
        currentUser.status !==
            "AKTIF"
    )
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

const targetUeInput =
    document.getElementById(
        "targetUe"
    );

let budgetDetails = [];
let editingBudgetId = null;

let salesmanData = [];

let leasingOptions = [];
let pkmTypeOptions = [];
let eventOptions = [];
let focusTypeOptions = [];
let selectedFocusTypes = [];

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

let mapSearchCenter = {
    latitude:
        defaultMapLocation.latitude,

    longitude:
        defaultMapLocation.longitude
};

const MASTER_NIKS = [
    "911117",
    "911120",
    "911147"
];

const MASTER_DATA_MENUS = [
    {
        value: "LEASING",
        label: "Master Leasing"
    },
    {
        value: "PKM",
        label: "Master Jenis PKM"
    },
    {
        value: "EVENT",
        label: "Master Event"
    },
    {
        value: "KPI_CRM",
        label: "Master CRM"
    },
    {
        value: "KPI_SIPEDE",
        label: "Master Sipede"
    }
];


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

    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN PETA DENGAN DEFAULT SOLO
    |--------------------------------------------------------------------------
    */

    locationMap =
        L.map(
            "locationMap"
        ).setView(
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
    ).addTo(
        locationMap
    );

    /*
    |--------------------------------------------------------------------------
    | PILIH LOKASI DENGAN KLIK PETA
    |--------------------------------------------------------------------------
    */

    locationMap.on(
        "click",
        async function (event) {
            const latitude =
                event.latlng.lat;

            const longitude =
                event.latlng.lng;

            await selectLocationFromCoordinates(
                latitude,
                longitude
            );
        }
    );

    /*
    |--------------------------------------------------------------------------
    | ARAHKAN PETA KE POSISI PERANGKAT
    |--------------------------------------------------------------------------
    | Tidak langsung menaruh marker.
    | Hanya menjadikan lokasi perangkat sebagai pusat pencarian.
    |--------------------------------------------------------------------------
    */

    if (!navigator.geolocation) {
        setMapStatus(
            "Menggunakan area Solo sebagai titik awal."
        );

        return;
    }

    setMapStatus(
        "Mencari posisi perangkat...",
        "loading"
    );

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            mapSearchCenter = {
                latitude:
                    latitude,

                longitude:
                    longitude
            };

            locationMap.setView(
                [
                    latitude,
                    longitude
                ],
                13
            );

            setMapStatus(
                "Peta diarahkan ke area sekitar perangkat.",
                "success"
            );
        },

        function (error) {
            console.warn(
                "Lokasi perangkat tidak tersedia:",
                error
            );

            mapSearchCenter = {
                latitude:
                    defaultMapLocation.latitude,

                longitude:
                    defaultMapLocation.longitude
            };

            locationMap.setView(
                [
                    defaultMapLocation.latitude,
                    defaultMapLocation.longitude
                ],
                defaultMapLocation.zoom
            );

            setMapStatus(
                "Lokasi perangkat tidak tersedia. Menggunakan area Solo."
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
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

const activeBackendControllers =
    new Set();

function abortAllBackendRequests() {
    activeBackendControllers.forEach(
        function (controller) {
            controller.abort();
        }
    );

    activeBackendControllers.clear();
}

async function requestBackend(
    action,
    payload = {}
) {
    const controller =
        new AbortController();

    activeBackendControllers.add(
        controller
    );

    const longActions = [
        "createPkm",
        "approvePkm",
        "approvePkmFromDiscord",
        "getDiscordApproval",
        "savePkmPdf",
        "getPkmPdfFile",
        "updateMyProfile",
        "getCrmKpiData",
        "saveCrmKpi",
        "verifyCrmKpi",
        "getSalesmen",
        "saveLpj",
        "createLpj"
    ];

    const kpiActions = [
        "getCrmKpiData",
        "saveCrmKpi",
        "verifyCrmKpi"
    ];

    const dataActions = [
        "getSalesmen",
        "getReferenceMasters",
        "getCrmKpiInputAvailability"    
    ];

    const timeoutDuration =
        kpiActions.includes(action)
            ? 90000
            : dataActions.includes(action)
                ? 60000
                : longActions.includes(action)
                    ? 55000
                    : action === "getPkmData"
                        ? 70000
                        : 30000;

    const timeoutId =
        window.setTimeout(
            function () {
                controller.abort();
            },
            timeoutDuration
        );

    try {
        const response = await fetch(
            "/api/gas",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    action: action,
                    token: sessionToken,
                    payload: payload
                }),

                signal: controller.signal,
                cache: "no-store"
            }
        );

        const responseText =
            await response.text();

        if (!responseText.trim()) {
            throw new Error(
                `Server tidak memberikan respons untuk "${action}".`
            );
        }

        let data;

        try {
            data = JSON.parse(
                responseText
            );
        } catch (error) {
            console.error(
                "Respons backend bukan JSON:",
                {
                    action: action,
                    status: response.status,
                    response:
                        responseText.slice(
                            0,
                            500
                        )
                }
            );

            throw new Error(
                "Respons backend tidak valid."
            );
        }

        if (
            !response.ok ||
            data.success === false
        ) {
            console.error(
                "Backend gagal:",
                {
                    action: action,
                    status: response.status,
                    message:
                        data.message ||
                        data.error?.message ||
                        "",
                    response: data
                }
            );
        
            const message =
                data.message ||
                data.error?.message ||
                (
                    typeof data.error ===
                    "string"
                        ? data.error
                        : ""
                );

            throw new Error(
                message ||
                `Permintaan "${action}" gagal. HTTP ${response.status}.`
            );
        }

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
    } catch (error) {
        if (
            error.name ===
            "AbortError"
        ) {
            throw new Error(
                action === "getPkmData"
                    ? "Pemuatan PKM terlalu lama. Silakan tekan Cari Data untuk mencoba lagi."
                    : `Server terlalu lama merespons permintaan "${action}".`
            );
        }

        throw error;
    } finally {
        window.clearTimeout(
            timeoutId
        );

        activeBackendControllers.delete(
            controller
        );
    }
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

function loadPkmData(
    prefix = "dashboard"
) {
    /*
    | List PKM menggunakan request dashboard
    | apabila request awal masih berjalan.
    */

    if (currentPkmLoadPromise) {
        return currentPkmLoadPromise;
    }

    const loadPromise =
        performPkmDataLoad(
            prefix
        );

    currentPkmLoadPromise =
        loadPromise;

    loadPromise.finally(
        function () {
            if (
                currentPkmLoadPromise ===
                loadPromise
            ) {
                currentPkmLoadPromise =
                    null;
            }
        }
    );

    return loadPromise;
}

async function performPkmDataLoad(
    prefix = "dashboard"
) {

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

function populateJenisKegiatanOptions(
    selectedCategory = ""
) {
    const select =
        document.getElementById(
            "jenisKegiatan"
        );

    if (!select) {
        return;
    }

    const filteredEvents =
        selectedCategory
            ? eventOptions.filter(
                function (item) {
                    return (
                        item.category ===
                        selectedCategory
                    );
                }
            )
            : eventOptions;

    select.innerHTML = `
        <option value="" selected disabled>
            Pilih jenis kegiatan
        </option>

        ${filteredEvents.map(
            function (item) {
                return `
                    <option
                        value="${escapeHtml(item.name)}"
                        data-code="${escapeHtml(item.code)}"
                    >
                        ${escapeHtml(item.name)}
                    </option>
                `;
            }
        ).join("")}
    `;
}

function populateJenisPkmOptions() {
    const select =
        document.getElementById(
            "jenisPkm"
        );

    if (!select) {
        return;
    }

    const categories = [
        ...new Set(
            pkmTypeOptions.map(
                function (item) {
                    return item.category;
                }
            )
        )
    ];

    select.innerHTML = `
        <option value="" selected disabled>
            Pilih jenis PKM
        </option>

        ${categories.map(
            function (category) {
                const options =
                    pkmTypeOptions.filter(
                        function (item) {
                            return (
                                item.category ===
                                category
                            );
                        }
                    );

                return `
                    <optgroup
                        label="${escapeHtml(category)}"
                    >
                        ${options.map(
                            function (item) {
                                return `
                                    <option
                                        value="${escapeHtml(item.name)}"
                                        data-category="${escapeHtml(item.category)}"
                                    >
                                        ${escapeHtml(item.name)}
                                    </option>
                                `;
                            }
                        ).join("")}
                    </optgroup>
                `;
            }
        ).join("")}
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
        loadSalesmanWithRetry()
            .finally(function () {
                /*
                | Setelah selesai atau gagal, izinkan
                | proses pemuatan dijalankan kembali.
                */

                salesmanLoadPromise = null;
            });

    return salesmanLoadPromise;
}


async function loadSalesmanWithRetry() {
    const maximumAttempts = 3;

    if (peopleSearch) {
        peopleSearch.disabled = true;

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
                peopleSearch.disabled = false;

                peopleSearch.placeholder =
                    salesmanData.length
                        ? "Ketik nama atau NIK..."
                        : "Salesman tidak ditemukan";
            }

            return salesmanData;

        } catch (error) {
            console.warn(
                `Percobaan memuat salesman ${attempt}/${maximumAttempts} gagal:`,
                error
            );

            const message =
                String(
                    error.message || ""
                ).toLowerCase();

            /*
            |--------------------------------------------------------------------------
            | ERROR YANG BOLEH DIULANG
            |--------------------------------------------------------------------------
            */

            const retryableError =
                message.includes(
                    "tidak memberikan respons"
                ) ||
                message.includes(
                    "terlalu lama merespons"
                ) ||
                message.includes(
                    "gagal menghubungi"
                ) ||
                message.includes(
                    "respons apps script bukan json"
                ) ||
                message.includes(
                    "respons backend tidak valid"
                ) ||
                message.includes(
                    "http 500"
                ) ||
                message.includes(
                    "http 502"
                ) ||
                message.includes(
                    "http 503"
                ) ||
                message.includes(
                    "http 504"
                );

            if (
                !retryableError ||
                attempt === maximumAttempts
            ) {
                salesmanData = [];

                if (peopleSearch) {
                    peopleSearch.disabled = false;

                    peopleSearch.placeholder =
                        "Data salesman gagal dimuat";
                }

                showToast(
                    error.message ||
                    "Data salesman gagal dimuat."
                );

                throw error;
            }

            if (peopleSearch) {
                peopleSearch.placeholder =
                    `Mencoba kembali (${attempt + 1}/${maximumAttempts})...`;
            }

            /*
            | Percobaan kedua: 1 detik.
            | Percobaan ketiga: 2 detik.
            */

            await waitForSalesmanRetry(
                1000 * attempt
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

async function loadReferenceMasters() {
    if (referenceMastersLoaded) {
        return true;
    }

    if (referenceMastersPromise) {
        return referenceMastersPromise;
    }

    referenceMastersPromise =
        (async function () {
            const maximumAttempts = 3;

            for (
                let attempt = 1;
                attempt <= maximumAttempts;
                attempt++
            ) {
                try {
                    const result =
                        await requestBackend(
                            "getReferenceMasters",
                            {}
                        );

                    leasingOptions =
                        Array.isArray(
                            result.leasing
                        )
                            ? result.leasing
                            : [];

                    pkmTypeOptions =
                        Array.isArray(
                            result.pkmTypes
                        )
                            ? result.pkmTypes
                            : [];

                    eventOptions =
                        Array.isArray(
                            result.events
                        )
                            ? result.events
                            : [];

                    focusTypeOptions =
                        Array.isArray(
                            result.focusTypes
                        )
                            ? result.focusTypes
                            : [];

                    populateJenisPkmOptions();
                    populateJenisKegiatanOptions();
                    renderFocusTypeOptions();
                    refreshLeasingMasterOptions();

                    referenceMastersLoaded =
                        true;

                    return true;

                } catch (error) {

                    console.error(
                        `Master attempt ${attempt} gagal:`,
                        error
                    );

                    if (
                        attempt ===
                        maximumAttempts
                    ) {
                        showToast(
                            "Master PKM gagal dimuat. Silakan coba kembali.",
                            "error"
                        );

                        return false;
                    }

                    await new Promise(
                        function (resolve) {
                            setTimeout(
                                resolve,
                                attempt * 1500
                            );
                        }
                    );
                }
            }

            return false;
        })();

    try {
        return await referenceMastersPromise;
    } finally {
        referenceMastersPromise =
            null;
    }
}

async function initializeApplication() {

    /*
    |--------------------------------------------------------------------------
    | HAPUS CACHE PKM FRONTEND LAMA
    |--------------------------------------------------------------------------
    */

    localStorage.removeItem(
        "pkmData"
    );

    document.getElementById(
        "sidebarUserName"
    ).textContent = currentUser.name;

    const userIsMaster =
        isMasterAccount();

    if (manageAccountsButton) {
        manageAccountsButton.classList.toggle(
            "hidden",
            !userIsMaster
        );
    }

    if (masterDataButton) {
        masterDataButton.classList.toggle(
            "hidden",
            !userIsMaster
        );
    }

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

    setDefaultApprovalStepFilter();

    document.getElementById(
        "cabang"
    ).value =
        `${currentUser.branch} — ${currentUser.branchName}`;

    /*
    |--------------------------------------------------------------------------
    | BUAT OPSI JENIS PKM
    |--------------------------------------------------------------------------
    */

    const masterLoaded =
        await loadReferenceMasters();

    if (!masterLoaded) {
        console.warn(
            "Aplikasi tetap dilanjutkan tanpa master PKM."
        );
    }

    populateJenisPkmOptions();
    initializePkmFilters();

    renderBranchFilter("dashboard");
    renderBranchFilter("list");

    /*
    |--------------------------------------------------------------------------
    | PEOPLE
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | PRELOAD DATA APLIKASI
    |--------------------------------------------------------------------------
    */

    await runDashboardPreload();

    /*
    |--------------------------------------------------------------------------
    | HIDE / SHOW SECTION BTL
    |--------------------------------------------------------------------------
    */

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

function isMasterAccount() {
    const currentNik =
        String(
            currentUser.nik ||
            currentUser.username ||
            ""
        ).trim();

    return (
        currentUser.isMaster === true ||
        MASTER_ACCOUNT_NIKS.includes(
            currentNik
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

const masterDataButton =
    document.getElementById(
        "masterDataButton"
    );

const masterDataModal =
    document.getElementById(
        "masterDataModal"
    );

const closeMasterDataModalButton =
    document.getElementById(
        "closeMasterDataModal"
    );

const masterDataType =
    document.getElementById(
        "masterDataType"
    );

const masterDataLoading =
    document.getElementById(
        "masterDataLoading"
    );

const masterDataTableHead =
    document.getElementById(
        "masterDataTableHead"
    );

const masterDataTableBody =
    document.getElementById(
        "masterDataTableBody"
    );

const addMasterDataButton =
    document.getElementById(
        "addMasterDataButton"
    );

const masterDataFormModal =
    document.getElementById(
        "masterDataFormModal"
    );

const masterDataForm =
    document.getElementById(
        "masterDataForm"
    );

const masterDataFormTitle =
    document.getElementById(
        "masterDataFormTitle"
    );

const masterDataFormFields =
    document.getElementById(
        "masterDataFormFields"
    );

const closeMasterDataFormButton =
    document.getElementById(
        "closeMasterDataForm"
    );

const cancelMasterDataFormButton =
    document.getElementById(
        "cancelMasterDataForm"
    );

const saveMasterDataButton =
    document.getElementById(
        "saveMasterDataButton"
    );


let currentMasterType =
    "LEASING";

let currentMasterHeaders = [];

let currentMasterRows = [];

let editingMasterRowIndex =
    null;

let masterDataSaving =
    false;


const MASTER_KEY_HEADERS = {
    LEASING: "KODE",
    PKM: "ID PKM",
    EVENT: "ID EVENT",
    KPI_CRM: "ID"
};


/*
|--------------------------------------------------------------------------
| BUKA MASTER DATA
|--------------------------------------------------------------------------
*/

async function openMasterDataModal() {
    if (!isMasterAccount()) {
        showToast(
            "Anda tidak memiliki akses Master Data.",
            "error"
        );

        return;
    }

    accountMenu.classList.add(
        "hidden"
    );

    masterDataModal.classList.remove(
        "hidden"
    );

    await loadMasterDataTable(
        masterDataType.value
    );
}


function closeMasterDataModal() {
    masterDataModal.classList.add(
        "hidden"
    );
}


/*
|--------------------------------------------------------------------------
| MUAT TABEL MASTER
|--------------------------------------------------------------------------
*/

async function loadMasterDataTable(
    type
) {
    currentMasterType = type;

    masterDataLoading.classList.remove(
        "hidden"
    );

    masterDataTableHead.innerHTML = "";
    masterDataTableBody.innerHTML = "";

    try {
        const result =
            await requestBackend(
                "getMasterData",
                {
                    type: type
                }
            );

        currentMasterHeaders =
            Array.isArray(result.headers)
                ? result.headers
                : [];

        currentMasterRows =
            Array.isArray(result.data)
                ? result.data
                : [];

        masterDataTableHead.innerHTML = `
            <tr>
                ${currentMasterHeaders.map(
                    function (header) {
                        return `
                            <th class="whitespace-nowrap px-4 py-3">
                                ${escapeHtml(header)}
                            </th>
                        `;
                    }
                ).join("")}

                <th class="sticky right-0 bg-slate-100 px-4 py-3 text-right">
                    Aksi
                </th>
            </tr>
        `;

        if (!currentMasterRows.length) {
            masterDataTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="${Math.max(
                            currentMasterHeaders.length + 1,
                            1
                        )}"
                        class="px-4 py-10 text-center text-slate-500"
                    >
                        Data belum tersedia.
                    </td>
                </tr>
            `;

            return;
        }

        masterDataTableBody.innerHTML =
            currentMasterRows.map(
                function (row, rowIndex) {
                    return `
                        <tr class="hover:bg-slate-50">
                            ${currentMasterHeaders.map(
                                function (header) {
                                    const value =
                                        row[header];

                                    return `
                                        <td class="whitespace-nowrap px-4 py-3 text-slate-700">
                                            ${escapeHtml(
                                                value === "" ||
                                                value === null ||
                                                value === undefined
                                                    ? "-"
                                                    : String(value)
                                            )}
                                        </td>
                                    `;
                                }
                            ).join("")}

                            <td class="sticky right-0 bg-white px-4 py-3 text-right">
                                <button
                                    type="button"
                                    data-edit-master-row="${rowIndex}"
                                    class="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-100"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    `;
                }
            ).join("");
    } catch (error) {
        console.error(
            "Gagal memuat Master Data:",
            error
        );

        masterDataTableBody.innerHTML = `
            <tr>
                <td class="px-4 py-10 text-center font-bold text-red-600">
                    ${escapeHtml(
                        getApiErrorMessage(error)
                    )}
                </td>
            </tr>
        `;
    } finally {
        masterDataLoading.classList.add(
            "hidden"
        );
    }
}


/*
|--------------------------------------------------------------------------
| FORM TAMBAH DAN EDIT
|--------------------------------------------------------------------------
*/

function openMasterDataForm(
    rowIndex = null
) {
    const isEditing =
        rowIndex !== null;

    editingMasterRowIndex =
        isEditing
            ? Number(rowIndex)
            : null;

    const row =
        isEditing
            ? currentMasterRows[
                editingMasterRowIndex
            ] || {}
            : {};

    masterDataFormTitle.textContent =
        isEditing
            ? "Edit Master Data"
            : "Tambah Master Data";

    masterDataFormFields.innerHTML =
        currentMasterHeaders.map(
            function (header) {
                const keyHeader =
                    MASTER_KEY_HEADERS[
                        currentMasterType
                    ];

                const keyLocked =
                    isEditing &&
                    header === keyHeader;

                let value =
                    isEditing
                        ? row[header] || ""
                        : getDefaultMasterValue(
                            header
                        );

                const numericHeaders = [
                    "ID",
                    "ID PKM",
                    "ID EVENT",
                    "%",
                    "BOBOT"
                ];

                const inputType =
                    numericHeaders.includes(
                        header
                    )
                        ? "number"
                        : "text";

                const step =
                    (
                        header === "%" ||
                        header === "BOBOT"
                    )
                        ? 'step="any"'
                        : "";

                return `
                    <div class="${
                        header === "INDIKATOR KPI"
                            ? "md:col-span-2"
                            : ""
                    }">
                        <label class="form-label">
                            ${escapeHtml(header)}
                        </label>

                        <input
                            type="${inputType}"
                            ${step}
                            data-master-field="${escapeHtml(header)}"
                            value="${escapeHtml(String(value))}"
                            class="form-input ${
                                keyLocked
                                    ? "bg-slate-100"
                                    : ""
                            }"
                            ${
                                keyLocked
                                    ? "readonly"
                                    : ""
                            }
                        >
                    </div>
                `;
            }
        ).join("");

    masterDataFormModal.classList.remove(
        "hidden"
    );
}


function getDefaultMasterValue(
    header
) {
    if (header === "STATUS") {
        return "AKTIF";
    }

    const keyHeader =
        MASTER_KEY_HEADERS[
            currentMasterType
        ];

    if (
        header !== keyHeader ||
        currentMasterType === "LEASING"
    ) {
        return "";
    }

    const existingIds =
        currentMasterRows
            .map(function (row) {
                return Number(
                    row[keyHeader]
                );
            })
            .filter(function (value) {
                return Number.isFinite(
                    value
                );
            });

    return existingIds.length
        ? Math.max(...existingIds) + 1
        : 1;
}


function closeMasterDataForm() {
    if (
        masterDataSaving
    ) {
        return;
    }

    masterDataFormModal.classList.add(
        "hidden"
    );

    masterDataForm.reset();
    masterDataFormFields.innerHTML = "";

    editingMasterRowIndex = null;
}


function collectMasterFormValues() {
    const values = {};

    masterDataFormFields
        .querySelectorAll(
            "[data-master-field]"
        )
        .forEach(function (field) {
            values[
                field.dataset.masterField
            ] = field.value.trim();
        });

    return values;
}


function setMasterDataSaving(
    saving
) {
    masterDataSaving = saving;

    saveMasterDataButton.disabled =
        saving;

    saveMasterDataButton.innerHTML =
        saving
            ? `
                <span class="flex items-center justify-center gap-2">
                    <span class="ui-spinner"></span>
                    <span>Menyimpan...</span>
                </span>
            `
            : "Simpan Data";
}


/*
|--------------------------------------------------------------------------
| SIMPAN MASTER DATA
|--------------------------------------------------------------------------
*/

async function submitMasterDataForm(
    event
) {
    event.preventDefault();

    if (masterDataSaving) {
        return;
    }

    const values =
        collectMasterFormValues();

    const keyHeader =
        MASTER_KEY_HEADERS[
            currentMasterType
        ];

    if (
        !keyHeader ||
        !String(
            values[keyHeader] || ""
        ).trim()
    ) {
        showToast(
            `${keyHeader || "ID"} wajib diisi.`,
            "error"
        );

        return;
    }

    setMasterDataSaving(true);

    try {
        const result =
            await requestBackend(
                "saveMasterData",
                {
                    type:
                        currentMasterType,

                    values:
                        values
                }
            );

        /*
        | Izinkan modal ditutup setelah
        | penyimpanan selesai.
        */

        masterDataSaving = false;

        closeMasterDataForm();

        showToast(
            result.mode === "UPDATE"
                ? "Master data berhasil diperbarui."
                : "Master data berhasil ditambahkan.",
            "success"
        );

        await loadMasterDataTable(
            currentMasterType
        );

        /*
        | Refresh pilihan PKM, Event,
        | Leasing dan Focus Type.
        */

        await loadReferenceMasters();
    } catch (error) {
        console.error(
            "Gagal menyimpan Master Data:",
            error
        );

        showToast(
            getApiErrorMessage(error),
            "error"
        );
    } finally {
        setMasterDataSaving(false);
    }
}


/*
|--------------------------------------------------------------------------
| EVENT MASTER DATA
|--------------------------------------------------------------------------
*/

if (masterDataButton) {
    masterDataButton.addEventListener(
        "click",
        openMasterDataModal
    );
}

if (closeMasterDataModalButton) {
    closeMasterDataModalButton.addEventListener(
        "click",
        closeMasterDataModal
    );
}

if (masterDataType) {
    masterDataType.addEventListener(
        "change",
        function () {
            loadMasterDataTable(
                this.value
            );
        }
    );
}

if (addMasterDataButton) {
    addMasterDataButton.addEventListener(
        "click",
        function () {
            openMasterDataForm();
        }
    );
}

if (masterDataTableBody) {
    masterDataTableBody.addEventListener(
        "click",
        function (event) {
            const editButton =
                event.target.closest(
                    "[data-edit-master-row]"
                );

            if (!editButton) {
                return;
            }

            openMasterDataForm(
                editButton.dataset
                    .editMasterRow
            );
        }
    );
}

if (masterDataForm) {
    masterDataForm.addEventListener(
        "submit",
        submitMasterDataForm
    );
}

if (closeMasterDataFormButton) {
    closeMasterDataFormButton.addEventListener(
        "click",
        closeMasterDataForm
    );
}

if (cancelMasterDataFormButton) {
    cancelMasterDataFormButton.addEventListener(
        "click",
        closeMasterDataForm
    );
}

if (masterDataModal) {
    masterDataModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                masterDataModal
            ) {
                closeMasterDataModal();
            }
        }
    );
}

if (masterDataFormModal) {
    masterDataFormModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                masterDataFormModal
            ) {
                closeMasterDataForm();
            }
        }
    );
}


accountMenuButton.addEventListener(
    "click",
    function (event) {
        event.stopPropagation();

        const willOpen =
            accountMenu.classList.contains(
                "hidden"
            );

        accountMenu.classList.toggle(
            "hidden",
            !willOpen
        );

        accountMenuButton.classList.toggle(
            "submenu-open",
            willOpen
        );

        accountMenuButton.setAttribute(
            "aria-expanded",
            String(willOpen)
        );
    }
);

document.addEventListener(
    "click",
    function (event) {
        const wrapper =
            document.getElementById(
                "accountMenuWrapper"
            );

        if (
            wrapper &&
            !wrapper.contains(event.target)
        ) {
            accountMenu.classList.add(
                "hidden"
            );

            accountMenuButton.classList.remove(
                "submenu-open"
            );

            accountMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );
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
        function () {
            const confirmed =
                window.confirm(
                    "Apakah Anda yakin ingin keluar?"
                );

            if (!confirmed) {
                return;
            }

            const tokenBeforeLogout =
                sessionStorage.getItem(
                    "sessionToken"
                );

            /*
            | Hentikan loading PKM, salesman, profil,
            | atau request lainnya.
            */

            abortAllBackendRequests();

            /*
            | Session lokal langsung dihapus.
            | Logout tidak perlu menunggu Google Apps Script.
            */

            sessionStorage.removeItem(
                "currentUser"
            );

            sessionStorage.removeItem(
                "sessionToken"
            );

            /*
            | Beri tahu backend di belakang layar.
            | keepalive memungkinkan request tetap berjalan
            | walaupun halaman berpindah.
            */

            if (tokenBeforeLogout) {
                fetch(
                    "/api/gas",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            action: "logout",
                            token:
                                tokenBeforeLogout,
                            payload: {}
                        }),

                        keepalive: true
                    }
                ).catch(
                    function () {
                        /*
                        | Tidak masalah jika logout backend gagal.
                        | Session lokal sudah dihapus.
                        */
                    }
                );
            }

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

function setSidebarSubmenu(
    buttonId,
    submenuId,
    open
) {
    const button =
        document.getElementById(buttonId);

    const submenu =
        document.getElementById(submenuId);

    if (!button || !submenu) {
        return;
    }

    submenu.classList.toggle(
        "hidden",
        !open
    );

    button.classList.toggle(
        "submenu-open",
        open
    );

    button.setAttribute(
        "aria-expanded",
        String(open)
    );
}


function toggleSidebarSubmenu(
    buttonId,
    submenuId
) {
    const submenu =
        document.getElementById(submenuId);

    if (!submenu) {
        return;
    }

    setSidebarSubmenu(
        buttonId,
        submenuId,
        submenu.classList.contains("hidden")
    );
}


function bindSidebarSubmenuButton(
    buttonId,
    submenuId
) {
    const button =
        document.getElementById(buttonId);

    if (!button) {
        console.warn(
            `Tombol sidebar "${buttonId}" tidak ditemukan.`
        );

        return;
    }

    button.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            event.stopPropagation();

            toggleSidebarSubmenu(
                buttonId,
                submenuId
            );
        }
    );
}


bindSidebarSubmenuButton(
    "pkmMenuButton",
    "pkmSubmenu"
);

bindSidebarSubmenuButton(
    "kpiMenuButton",
    "kpiSubmenu"
);

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

        pdfPkmPage: {
            title: "PDF PKM",
            subtitle:
                "Dokumen pengajuan yang sudah disetujui"
        },

        lpjPage: {
            title: "LPJ",
            subtitle:
                "Finalisasi hasil kegiatan marketing"
        },
        
        crmKpiPage: {
            title: "KPI CRM",
            subtitle:
                "Pengisian dan verifikasi performance CRM"
        },

        sipedeKpiPage: {
            title: "KPI SiPede",
            subtitle:
                "Monitoring performance SiPede"
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
        pageId === "pdfPkmPage" ||
        pageId === "lpjPage"
    ) {
        setSidebarSubmenu(
            "pkmMenuButton",
            "pkmSubmenu",
            true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH LIST PKM
    |--------------------------------------------------------------------------
    */

    if (pageId === "listPkmPage") {
        renderPkmTable();
    }

    if (pageId === "pdfPkmPage") {
        currentPdfPkmPage = 1;
        renderPkmPdfTable();
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH MAP
    |--------------------------------------------------------------------------
    */

    if (pageId === "pengajuanPage") {
        /*
        | Muat berurutan supaya Apps Script
        | tidak menerima banyak request bersamaan.
        */

        loadReferenceMasters()
            .then(function () {
                populateJenisPkmOptions();
                refreshLeasingMasterOptions();

                return loadSalesmanData();
            })
            .catch(function (error) {
                console.warn(
                    "Data pengajuan belum lengkap:",
                    error
                );

                showToast(
                    "Sebagian data pengajuan belum berhasil dimuat.",
                    "error"
                );
            });

        window.setTimeout(function () {
            if (isBtlSelected()) {
                initializeLocationMap();

                if (locationMap) {
                    locationMap.invalidateSize();
                }
            }
        }, 150);
    }

    /*
    |--------------------------------------------------------------------------
    | BUKA SUBMENU KPI
    |--------------------------------------------------------------------------
    */

    if (
        pageId === "crmKpiPage" ||
        pageId === "sipedeKpiPage"
    ) {
        setSidebarSubmenu(
            "kpiMenuButton",
            "kpiSubmenu",
            true
        );
    }


    /*
    |--------------------------------------------------------------------------
    | MUAT KPI CRM
    |--------------------------------------------------------------------------
    */

    if (
        pageId === "crmKpiPage" &&
        typeof window.loadCrmKpiPage ===
            "function"
    ) {
        window
            .loadCrmKpiPage()
            .catch(function (error) {
                console.error(
                    "KPI CRM gagal dibuka:",
                    error
                );

                showToast(
                    error.message ||
                    "KPI CRM gagal dimuat."
                );
            });
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
                updateProgramFieldsByPkmType();

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

function updateProgramFieldsByPkmType() {
    const selectedTypes =
        selectedValues(
            ".type-pkm"
        );

    const useH1 =
        selectedTypes.includes("H1") ||
        selectedTypes.includes("H123");

    const useH23 =
        selectedTypes.includes("H23") ||
        selectedTypes.includes("H123");

    const programH1Container =
        document.getElementById(
            "programH1Container"
        );

    const programH23Container =
        document.getElementById(
            "programH23Container"
        );

    if (programH1Container) {
        programH1Container.classList.toggle(
            "hidden",
            !useH1
        );
    }

    if (programH23Container) {
        programH23Container.classList.toggle(
            "hidden",
            !useH23
        );
    }

    if (!useH1) {
        document.getElementById(
            "programH1"
        ).value = "";
    }

    if (!useH23) {
        document.getElementById(
            "programH23"
        ).value = "";
    }
}

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

peopleSearch.addEventListener(
    "focus",
    function () {
        if (
            !salesmanData.length &&
            !salesmanLoadPromise
        ) {
            loadSalesmanData().catch(
                function (error) {
                    console.warn(
                        "Salesman belum berhasil dimuat:",
                        error
                    );
                }
            );
        }
    }
);

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
    document.getElementById(
        "jenisPkm"
    );

if (jenisPkmSelect) {
    jenisPkmSelect.addEventListener(
        "change",
        function () {
            const selectedOption =
                this.options[
                    this.selectedIndex
                ];

            const category =
                selectedOption
                    ? (
                        selectedOption
                            .dataset
                            .category ||
                        ""
                    )
                    : "";

            /*
            | Filter jenis kegiatan berdasarkan
            | kategori ATL, BTL, atau OTHER.
            */

            populateJenisKegiatanOptions(
                category
            );

            /*
            | Fungsi yang sudah ada di kode Anda
            | untuk hide/show bagian BTL.
            */

            updateBtlSections();
        }
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
                        <option
                            value="${escapeHtml(leasing.name)}"
                            data-code="${escapeHtml(leasing.code)}"
                            data-init="${escapeHtml(leasing.init)}"
                        >
                            ${escapeHtml(leasing.name)}
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

function refreshLeasingMasterOptions() {
    document
        .querySelectorAll(
            ".leasing-name"
        )
        .forEach(function (select) {
            const selectedValue =
                select.value;

            select.innerHTML = `
                <option value="">
                    Pilih leasing
                </option>

                ${leasingOptions
                    .map(function (leasing) {
                        return `
                            <option
                                value="${escapeHtml(
                                    leasing.name
                                )}"
                                data-code="${escapeHtml(
                                    leasing.code
                                )}"
                                data-init="${escapeHtml(
                                    leasing.init
                                )}"
                            >
                                ${escapeHtml(
                                    leasing.name
                                )}
                            </option>
                        `;
                    })
                    .join("")}
            `;

            const valueExists =
                Array.from(
                    select.options
                ).some(function (option) {
                    return (
                        option.value ===
                        selectedValue
                    );
                });

            if (valueExists) {
                select.value =
                    selectedValue;
            }
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
        const center =
            locationMap
                ? locationMap.getCenter()
                : {
                    lat:
                        mapSearchCenter.latitude,

                    lng:
                        mapSearchCenter.longitude
                };

        /*
        |--------------------------------------------------------------------------
        | BATAS PENCARIAN
        |--------------------------------------------------------------------------
        | Sekitar 1,25 derajat dari pusat map.
        | Kurang lebih mencakup Solo Raya dan sekitarnya.
        |--------------------------------------------------------------------------
        */

        const latitudeRange = 1.25;
        const longitudeRange = 1.25;

        const left =
            center.lng -
            longitudeRange;

        const right =
            center.lng +
            longitudeRange;

        const top =
            center.lat +
            latitudeRange;

        const bottom =
            center.lat -
            latitudeRange;

        const viewBox =
            [
                left,
                top,
                right,
                bottom
            ].join(",");

        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=jsonv2" +
            "&addressdetails=1" +
            "&limit=8" +
            "&countrycodes=id" +
            `&viewbox=${encodeURIComponent(
                viewBox
            )}` +
            "&bounded=1" +
            `&q=${encodeURIComponent(
                query
            )}`;

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

        programH1:
            (
                typePkm.includes("H1") ||
                typePkm.includes("H123")
            )
                ? document
                    .getElementById("programH1")
                    .value
                    .trim()
                : "",

        programH23:
            (
                typePkm.includes("H23") ||
                typePkm.includes("H123")
            )
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
    selectedFocusTypes = [];

    renderSelectedFocusTypes();

    const focusTypeSearch =
        document.getElementById(
            "focusTypeSearch"
        );

    if (focusTypeSearch) {
        focusTypeSearch.value = "";
    }
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
    /*
    |--------------------------------------------------------------------------
    | SUMBER UTAMA HANYA GOOGLE SPREADSHEET
    |--------------------------------------------------------------------------
    | localStorage tidak lagi digunakan karena dapat menyimpan status lama.
    */

    let filteredData =
        Array.isArray(sheetPkmData)
            ? [...sheetPkmData]
            : [];

    /*
    |--------------------------------------------------------------------------
    | FILTER CABANG
    |--------------------------------------------------------------------------
    */

    if (
        currentUser.branch !== "ALL"
    ) {
        const userBranch =
            String(
                currentUser.originalBranch ||
                currentUser.branch ||
                ""
            )
                .trim()
                .toUpperCase();

        filteredData =
            filteredData.filter(
                function (item) {
                    return (
                        String(
                            item.branch || ""
                        )
                            .trim()
                            .toUpperCase() ===
                        userBranch
                    );
                }
            );
    }

    /*
    |--------------------------------------------------------------------------
    | URUTKAN DATA TERBARU
    |--------------------------------------------------------------------------
    */

    return filteredData.sort(
        function (first, second) {
            return (
                new Date(
                    second.startDate ||
                    second.createdAt ||
                    0
                ).getTime() -
                new Date(
                    first.startDate ||
                    first.createdAt ||
                    0
                ).getTime()
            );
        }
    );
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
    const originalStatus =
        String(status || "-").trim();

    const normalizedStatus =
        originalStatus
            .toUpperCase()
            .replaceAll(" ", "_");

    let label = originalStatus;
    let tone = "neutral";

    if (
        normalizedStatus === "ACC" ||
        normalizedStatus === "DISETUJUI"
    ) {
        label = "Disetujui";
        tone = "approved";
    } else if (
        normalizedStatus.includes("DITOLAK") ||
        normalizedStatus.includes("REJECT")
    ) {
        label = "Ditolak";
        tone = "rejected";
    } else if (
        normalizedStatus.includes("CRM")
    ) {
        label = "Menunggu CRM";
        tone = "crm";
    } else if (
        normalizedStatus.includes("KACAB")
    ) {
        label = "Menunggu KACAB";
        tone = "kacab";
    } else if (
        normalizedStatus.includes("MSMC")
    ) {
        label = "Menunggu MSMC";
        tone = "msmc";
    } else if (
        normalizedStatus.includes("PIC_H23") ||
        normalizedStatus.includes("PIC H23")
    ) {
        label = "Menunggu PIC H23";
        tone = "pic-h23";
    } else if (
        normalizedStatus.includes("MGR") ||
        normalizedStatus.includes("MANAGER")
    ) {
        label = "Menunggu Manager";
        tone = "manager";
    } else if (
        normalizedStatus.includes("MENUNGGU")
    ) {
        label = "Menunggu";
        tone = "waiting";
    }

    return `
        <span class="status-pill status-${tone}">
            <span class="status-dot"></span>
            ${escapeHtml(label)}
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

function getApprovalStages(item) {
    const typePkm =
        String(
            item.type ||
            item.typePkm ||
            ""
        )
            .replace(/\s+/g, "")
            .toUpperCase();


    if (typePkm === "H23") {
        return [
            "CRM",
            "KACAB",
            "MSMC",
            "PIC_H23",
            "MGR_H23"
        ];
    }


    if (typePkm === "H123") {
        return [
            "CRM",
            "KACAB",
            "MSMC",
            "PIC_H23",
            "MGR_H1"
        ];
    }


    return [
        "CRM",
        "KACAB",
        "MSMC",
        "MGR_H1"
    ];
}


function getApprovalStageLabel(stage) {
    const labels = {
        CRM: "CRM",
        KACAB: "KACAB",
        MSMC: "MSMC",
        PIC_H23: "PIC H23",
        MGR_H1: "MANAGER H1",
        MGR_H23: "MANAGER H23"
    };

    return labels[stage] || stage;
}

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
    | MSMC dan MGR dari HO dapat memproses semua cabang.
    */

    const branchAllowed =
        userRole === "KACAB"
            ? itemBranch === userBranch
            : isHeadOfficeUser();

    return (
        branchAllowed &&
        approvalStep === userRole &&
        ["KACAB", "MSMC","PIC_H23","MGR_H1","MGR_H23"].includes(
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

    const approvalStages =
        getApprovalStages(item);

    return `
        <div
            class="flex min-w-max items-start"
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
                        index <
                        approvalStages.length - 1
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
                                class="whitespace-nowrap text-xs font-black text-slate-700"
                            >
                                ${getApprovalStageLabel(stage)}
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
    | FILTER STEP APPROVAL
    |--------------------------------------------------------------------------
    */

    const currentRole =
        getCurrentUserRole();

    const approvalQueueRoles = [
        "KACAB",
        "MSMC",
        "PIC_H23",
        "MGR_H1",
        "MGR_H23"
    ];

    const approvalStepFilter =
        String(
            document.getElementById(
                "approvalStepFilter"
            )?.value || "ALL"
        )
            .trim()
            .toUpperCase();


    if (
        approvalStepFilter ===
        "MY_QUEUE"
    ) {
        /*
        | Hanya pengajuan yang bisa diproses
        | oleh akun login saat ini.
        */

        data = data.filter(function (item) {
            return canCurrentUserProcess(
                item
            );
        });
    } else if (
        approvalStepFilter !== "ALL"
    ) {
        /*
        | Filter berdasarkan step yang dipilih.
        */

        data = data.filter(function (item) {
            const itemStep =
                String(
                    getApprovalStep(item) ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            return (
                itemStep ===
                approvalStepFilter
            );
        });
    }


    /*
    |--------------------------------------------------------------------------
    | URUTKAN YANG PERLU DIPROSES DI ATAS
    |--------------------------------------------------------------------------
    */

    data.sort(function (first, second) {
        const firstCanProcess =
            canCurrentUserProcess(first)
                ? 1
                : 0;

        const secondCanProcess =
            canCurrentUserProcess(second)
                ? 1
                : 0;

        /*
        | Pengajuan yang menjadi giliran user
        | ditempatkan paling atas.
        */

        if (
            firstCanProcess !==
            secondCanProcess
        ) {
            return (
                secondCanProcess -
                firstCanProcess
            );
        }

        /*
        | Dalam antrean yang sama, tampilkan
        | pengajuan paling lama terlebih dahulu.
        */

        return (
            new Date(
                first.createdAt ||
                first.startDate ||
                0
            ).getTime() -
            new Date(
                second.createdAt ||
                second.startDate ||
                0
            ).getTime()
        );
    });

    /*
    | Pengajuan paling lama ditempatkan paling atas
    | supaya antrean approval dikerjakan berurutan.
    */

    data.sort(function (first, second) {
        return (
            new Date(
                first.createdAt ||
                first.startDate ||
                0
            ).getTime() -
            new Date(
                second.createdAt ||
                second.startDate ||
                0
            ).getTime()
        );
    });

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
            approvalQueueRoles.includes(currentRole)
                ? `${totalData} pengajuan perlu diproses`
                : `${totalData} data ditemukan`;
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
                        item.approvals.managerH1
                    );

                const pdfAvailable =
                    [
                        "ACC",
                        "DISETUJUI"
                    ].includes(
                        normalizedStatus
                    ) &&
                    managerApproved;

                let primaryAction;

                if (
                    canCurrentUserProcess(item)
                ) {
                    primaryAction = `
                        <button
                            type="button"
                            data-process-pkm="${escapeHtml(item.id)}"
                            class="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-md shadow-red-100 transition hover:bg-red-700"
                        >
                            Proses
                        </button>
                    `;
                } else {
                    primaryAction = `
                        <span
                            class="whitespace-nowrap text-xs font-bold text-slate-400"
                        >
                            ${getApprovalActionLabel(item)}
                        </span>
                    `;
                }

                const discordHelperButton =
                    canShowDiscordHelper(item)
                        ? `
                            <button
                                type="button"
                                data-push-discord="${escapeHtml(item.id)}"
                                class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-60"
                                title="Kirim ulang reminder ke Discord"
                            >
                                <span>🔔</span>
                                <span>Push Discord</span>
                            </button>
                        `
                        : "";

                const actionButton = `
                    <div
                        class="flex items-center justify-end gap-2"
                    >
                        ${primaryAction}
                        ${discordHelperButton}
                    </div>
                `;

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

    pkmTableBody
        .querySelectorAll(
            "[data-push-discord]"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                async function () {
                    const pkmId =
                        button.dataset
                            .pushDiscord;

                    const originalContent =
                        button.innerHTML;

                    const confirmed =
                        window.confirm(
                            "Kirim reminder PKM " +
                            pkmId +
                            " ke Discord?"
                        );

                    if (!confirmed) {
                        return;
                    }

                    try {
                        button.disabled = true;

                        button.innerHTML = `
                            <span class="ui-spinner ui-spinner-small"></span>
                            <span>Mengirim...</span>
                        `;

                        const result =
                            await requestBackend(
                                "pushPkmDiscordReminder",
                                {
                                    pkmId: pkmId
                                }
                            );

                        showToast(
                            result.message ||
                            "Reminder Discord berhasil dikirim.",
                            "success"
                        );
                    } catch (error) {
                        showToast(
                            getApiErrorMessage(error),
                            "error"
                        );
                    } finally {
                        button.disabled = false;
                        button.innerHTML =
                            originalContent;
                    }
                }
            );
        });
    }

function setDefaultApprovalStepFilter() {
    const filter =
        document.getElementById(
            "approvalStepFilter"
        );

    if (!filter) {
        return;
    }

    const role =
        getCurrentUserRole();

    const approvalRoles = [
        "KACAB",
        "MSMC",
        "PIC_H23",
        "MGR_H1",
        "MGR_H23"
    ];

    filter.value =
        approvalRoles.includes(role)
            ? "MY_QUEUE"
            : "ALL";
}

const DISCORD_HELPER_NIKS = [
    "911117",
    "911120",
    "911147"
];


function canShowDiscordHelper(item) {
    const currentNik =
        String(
            currentUser.nik ||
            currentUser.id ||
            currentUser.username ||
            ""
        ).trim();

    if (
        !DISCORD_HELPER_NIKS.includes(
            currentNik
        )
    ) {
        return false;
    }

    const approvalStep =
        String(
            getApprovalStep(item) || ""
        )
            .trim()
            .toUpperCase();

    return [
        "MSMC",
        "MGR_H1"
    ].includes(approvalStep);
}



/*
|--------------------------------------------------------------------------
| HALAMAN PDF PKM
|--------------------------------------------------------------------------
*/

let currentPdfPkmPage = 1;
const PDF_PKM_PAGE_SIZE = 7;


function renderPkmPdfTable() {
    const tableBody =
        document.getElementById(
            "pdfPkmTableBody"
        );

    if (!tableBody) {
        return;
    }

    const search =
        String(
            document.getElementById(
                "searchPdfPkm"
            )?.value || ""
        )
            .trim()
            .toLowerCase();

    let data =
        getBranchPkm()
            .filter(function (item) {
                const status =
                    String(item.status || "")
                        .trim()
                        .toUpperCase();

                return [
                    "ACC",
                    "DISETUJUI"
                ].includes(status);
            })
            .filter(function (item) {
                if (!search) {
                    return true;
                }

                return [
                    item.id,
                    item.name,
                    item.branch,
                    item.branchName,
                    item.kegiatan,
                    item.jenisPkm,
                    item.location
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(search);
            })
            .sort(function (first, second) {
                return (
                    new Date(
                        second.startDate || 0
                    ).getTime() -
                    new Date(
                        first.startDate || 0
                    ).getTime()
                );
            });

    const totalData = data.length;

    const totalPages = Math.max(
        1,
        Math.ceil(
            totalData /
            PDF_PKM_PAGE_SIZE
        )
    );

    currentPdfPkmPage =
        Math.min(
            currentPdfPkmPage,
            totalPages
        );

    const startIndex =
        (
            currentPdfPkmPage - 1
        ) * PDF_PKM_PAGE_SIZE;

    const pageData =
        data.slice(
            startIndex,
            startIndex +
                PDF_PKM_PAGE_SIZE
        );

    tableBody.innerHTML =
        pageData
            .map(function (item) {
                const typeText =
                    Array.isArray(item.type)
                        ? item.type.join(", ")
                        : item.type || "-";

                return `
                    <tr>
                        <td class="font-bold">
                            ${escapeHtml(item.id || "-")}
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
                            ${escapeHtml(item.branch || "-")}
                        </td>

                        <td>
                            ${escapeHtml(typeText)}
                        </td>

                        <td>
                            ${formatDateTime(item.startDate)}
                        </td>

                        <td>
                            ${statusBadge(item.status)}
                        </td>

                        <td class="text-right">
                            <button
                                type="button"
                                data-download-stored-pdf="${escapeHtml(item.id)}"
                                class="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                            >
                                ↓ Download PDF
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

    document
        .getElementById("emptyPdfPkm")
        ?.classList.toggle(
            "hidden",
            totalData > 0
        );

    document.getElementById(
        "pdfPkmPaginationInfo"
    ).textContent =
        totalData
            ? `Menampilkan ${startIndex + 1}–${Math.min(
                startIndex +
                    PDF_PKM_PAGE_SIZE,
                totalData
            )} dari ${totalData} dokumen`
            : "Tidak ada dokumen";

    document.getElementById(
        "currentPdfPkmPage"
    ).textContent =
        currentPdfPkmPage;

    document.getElementById(
        "previousPdfPkmPage"
    ).disabled =
        currentPdfPkmPage <= 1;

    document.getElementById(
        "nextPdfPkmPage"
    ).disabled =
        currentPdfPkmPage >= totalPages;
}

document
    .getElementById("searchPdfPkm")
    ?.addEventListener(
        "input",
        function () {
            currentPdfPkmPage = 1;
            renderPkmPdfTable();
        }
    );


document
    .getElementById(
        "previousPdfPkmPage"
    )
    ?.addEventListener(
        "click",
        function () {
            if (currentPdfPkmPage <= 1) {
                return;
            }

            currentPdfPkmPage -= 1;
            renderPkmPdfTable();
        }
    );


document
    .getElementById(
        "nextPdfPkmPage"
    )
    ?.addEventListener(
        "click",
        function () {
            currentPdfPkmPage += 1;
            renderPkmPdfTable();
        }
    );

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
| STATUS LOADING DAN SUBMIT APPROVAL
|--------------------------------------------------------------------------
*/

let approvalSignatureUserSelected =
    false;

let approvalSignatureLoadVersion =
    0;

let approvalSubmitting =
    false;


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
    const loadVersion =
        ++approvalSignatureLoadVersion;

    const status =
        document.getElementById(
            "savedApprovalSignatureStatus"
        );

    const image =
        document.getElementById(
            "savedApprovalSignatureImage"
        );

    approvalSignatureUserSelected =
        false;

    approvalSignatureMode = "";

    savedApprovalSignatureAvailable =
        false;

    resetApprovalSignatureSelection();
    clearSignature();

    status.innerHTML = `
        <span class="inline-flex items-center gap-2 text-red-600">
            <span class="ui-spinner ui-spinner-small"></span>
            Memeriksa TTD profil...
        </span>
    `;

    image.removeAttribute("src");

    try {
        const profile =
            await requestBackend(
                "getMyProfile"
            );

        if (
            loadVersion !==
            approvalSignatureLoadVersion
        ) {
            return;
        }

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

            /*
            | Jangan mengganti pilihan apabila
            | pengguna sudah mulai menggambar.
            */

            if (
                !approvalSignatureUserSelected
            ) {
                selectApprovalSignatureMode(
                    "SAVED"
                );
            }
        } else {
            status.textContent =
                "Belum ada TTD tersimpan. Silakan gambar TTD.";

            if (
                !approvalSignatureUserSelected
            ) {
                selectApprovalSignatureMode(
                    "DRAWN"
                );
            }
        }
    } catch (error) {
        if (
            loadVersion !==
            approvalSignatureLoadVersion
        ) {
            return;
        }

        status.textContent =
            "TTD tersimpan gagal dimuat. Anda tetap dapat menggambar TTD.";

        if (
            !approvalSignatureUserSelected
        ) {
            selectApprovalSignatureMode(
                "DRAWN"
            );
        }
    } finally {
        if (
            loadVersion !==
            approvalSignatureLoadVersion
        ) {
            return;
        }

        approveWithSignatureButton.innerHTML =
            approvalModalMode ===
            "SUBMIT_CRM"
                ? "✓ TTD & Ajukan PKM"
                : "✓ Setujui Pengajuan";

        approveWithSignatureButton.disabled =
            approvalSignatureMode ===
            "SAVED"
                ? !savedApprovalSignatureAvailable
                : approvalSignatureMode ===
                    "DRAWN"
                    ? !signatureHasDrawing
                    : true;
    }
}

function prepareDiscordApprovalSignature() {
    approvalSignatureLoadVersion +=
        1;

    approvalSignatureUserSelected =
        true;

    savedApprovalSignatureAvailable =
        false;

    /*
    | Discord tidak memakai TTD profil.
    */
    const savedButton =
        document.getElementById(
            "useSavedApprovalSignature"
        );

    const savedPanel =
        document.getElementById(
            "savedApprovalSignaturePanel"
        );

    const savedStatus =
        document.getElementById(
            "savedApprovalSignatureStatus"
        );

    if (savedButton) {
        savedButton.classList.add(
            "hidden"
        );
    }

    if (savedPanel) {
        savedPanel.classList.add(
            "hidden"
        );
    }

    if (savedStatus) {
        savedStatus.textContent =
            "Approval melalui Discord. Silakan gambar tanda tangan.";
    }

    clearSignature();

    selectApprovalSignatureMode(
        "DRAWN"
    );

    approveWithSignatureButton
        .innerHTML =
        "✓ Setujui Pengajuan";
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
        isDiscordApprovalMode
            ? true
            : isCrmSubmission
                ? getCurrentUserRole() ===
                    "CRM"
                : canCurrentUserProcess(
                    item
                );

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

        if (
            isDiscordApprovalMode
        ) {
            prepareDiscordApprovalSignature();
        } else {
            await prepareApprovalSignature();
        }

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

function closeApprovalModal(
    force = false
) {
    if (
        approvalSubmitting &&
        force !== true
    ) {
        showToast(
            "Proses sedang berjalan. Mohon tunggu."
        );

        return;
    }

    approvalSignatureLoadVersion += 1;

    approvalModal.classList.add(
        "hidden"
    );

    approvalModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    activeApprovalPkmId = null;

    clearSignature();

    if (
        approvalModalMode ===
            "SUBMIT_CRM" &&
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
    approvalSignatureUserSelected =
        true;

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
    if (approvalSubmitting) {
        return;
    }

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
        !isDiscordApprovalMode &&
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

    approvalSubmitting = true;

    document.getElementById(
        "closeApprovalModalButton"
    ).disabled = true;

    document.getElementById(
        "cancelApprovalButton"
    ).disabled = true;    

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

        const approvalAction =
            isDiscordApprovalMode
                ? "approvePkmFromDiscord"
                : "approvePkm";


        const approvalPayload = {
            pkmId:
                item.id,

            signatureMode:
                isDiscordApprovalMode
                    ? "DRAWN"
                    : approvalSignatureMode,

            signatureData:
                signatureData
        };


        if (
            isDiscordApprovalMode
        ) {
            approvalPayload.approvalToken =
                discordApprovalToken;
        }


        const result =
            await requestBackend(
                approvalAction,
                approvalPayload
            );

        if (
            isDiscordApprovalMode
        ) {
            const approvalRole =
                String(
                    result.approvalRole || ""
                )
                    .trim()
                    .toUpperCase();

            const nextRole =
                String(
                    result.nextRole || ""
                )
                    .trim()
                    .toUpperCase();

            const isFinalDiscordManager =
                [
                    "MGR_H1",
                    "MGR_H23"
                ].includes(
                    approvalRole
                ) &&
                nextRole ===
                    "SELESAI";


            /*
            |--------------------------------------------------------------------------
            | BUKAN MANAGER FINAL
            |--------------------------------------------------------------------------
            | Contoh MSMC → cukup selesai seperti sebelumnya.
            */

            if (
                !isFinalDiscordManager
            ) {
                approvalModalMode =
                    "APPROVAL";

                pendingCrmSubmission =
                    null;

                pendingCrmSubmissionSaved =
                    false;

                closeApprovalModal(
                    true
                );

                showToast(
                    result.message ||
                    "Pengajuan berhasil disetujui.",
                    "success"
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | MANAGER FINAL EXTERNAL
            |--------------------------------------------------------------------------
            | Setelah approval tersimpan:
            | - browser TIDAK membuat PDF
            | - browser TIDAK butuh pdfSessionToken
            | - PDF akan diproses otomatis oleh worker GAS
            */

            if (
                isFinalDiscordManager
            ) {
                approvalModalMode =
                    "APPROVAL";

                pendingCrmSubmission =
                    null;

                pendingCrmSubmissionSaved =
                    false;

                closeApprovalModal(
                    true
                );

                hideDiscordApprovalLoading();

                showToast(
                    "Approval Manager berhasil. PDF final akan diproses otomatis.",
                    "success"
                );

                return;
            }


            showDiscordApprovalLoading(
                "Membuat PDF final..."
            );


            const previousSessionToken =
                sessionToken;

            const previousStoredToken =
                sessionStorage.getItem(
                    "sessionToken"
                );


            /*
            |--------------------------------------------------------------------------
            | PAKAI SESSION PDF SEMENTARA
            |--------------------------------------------------------------------------
            */

            sessionStorage.setItem(
                "sessionToken",
                sessionToken
            );


            let pdfSaved =
                false;

            let pdfError =
                null;


            try {

                updateDiscordApprovalLoading(
                    "Mengambil data PDF final..."
                );


                pdfSaved =
                    true;


                updateDiscordApprovalLoading(
                    "PDF final berhasil disimpan."
                );


                /*
                | Hapus session sementara
                | dari backend.
                */
                try {
                    await requestBackend(
                        "logout",
                        {}
                    );
                } catch (
                    logoutError
                ) {
                    console.warn(
                        "Session PDF Discord gagal dibersihkan:",
                        logoutError
                    );
                }

            } catch (
                error
            ) {

                pdfError =
                    error;

                console.error(
                    "PDF final Discord gagal:",
                    error
                );

            } finally {

                /*
                |--------------------------------------------------------------------------
                | KEMBALIKAN SESSION ASLI
                |--------------------------------------------------------------------------
                */

                sessionToken =
                    previousSessionToken;


                if (
                    previousStoredToken
                ) {
                    sessionStorage.setItem(
                        "sessionToken",
                        previousStoredToken
                    );

                } else {

                    sessionStorage.removeItem(
                        "sessionToken"
                    );
                }


                hideDiscordApprovalLoading();
            }


            /*
            |--------------------------------------------------------------------------
            | TUTUP MODAL SETELAH PROSES PDF
            |--------------------------------------------------------------------------
            */

            approvalModalMode =
                "APPROVAL";

            pendingCrmSubmission =
                null;

            pendingCrmSubmissionSaved =
                false;

            closeApprovalModal(
                true
            );


            if (
                pdfSaved
            ) {
                showToast(
                    "Approval Manager selesai dan PDF final berhasil dibuat.",
                    "success"
                );

            } else {

                showToast(
                    "Approval Manager berhasil, tetapi PDF gagal dibuat: " +
                    (
                        pdfError &&
                        pdfError.message
                            ? pdfError.message
                            : "Unknown error"
                    ),
                    "error"
                );
            }


            return;
        }

        /*
        |--------------------------------------------------------------------------
        | PENGAJUAN CRM SELESAI
        |--------------------------------------------------------------------------
        | Tutup modal segera setelah backend berhasil menyimpan TTD.
        | Reset form dan refresh data dilakukan setelah modal ditutup.
        */

        if (isCrmSubmission) {
            const successMessage =
                result.message ||
                "PKM berhasil diajukan dan menunggu ACC KACAB.";

            /*
            | Bersihkan status modal lebih dahulu.
            */

            approvalModalMode = "APPROVAL";
            pendingCrmSubmission = null;
            pendingCrmSubmissionSaved = false;

            /*
            | Tutup modal tanpa menunggu refresh database.
            */

            closeApprovalModal(true);

            /*
            | Pindah langsung ke List PKM.
            */

            showPage("listPkmPage");

            showToast(
                successMessage,
                "success"
            );

            /*
            | Reset form tidak boleh menggagalkan penutupan modal.
            */

            try {
                resetPkmForm();
            } catch (resetError) {
                console.warn(
                    "PKM berhasil disimpan, tetapi form gagal direset:",
                    resetError
                );
            }

            /*
            | Refresh dilakukan di belakang agar UI tidak tertahan.
            */

            loadPkmData("list").catch(
                function (refreshError) {
                    console.warn(
                        "PKM berhasil disimpan, tetapi list belum diperbarui:",
                        refreshError
                    );
                }
            );

            return;
        }

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
            "MGR H1",
            "MGR H23",
            "MANAGER H1",
            "MANAGER H23"
        ].includes(approvalRole);

        let pdfSaved = false;
        let pdfErrorMessage = "";

        if (
            isFinalManagerApproval &&
            !isDiscordApprovalMode
        ) {
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

        /*
        | Ubah mode sebelum modal ditutup.
        */

        approvalModalMode = "APPROVAL";
        pendingCrmSubmission = null;
        pendingCrmSubmissionSaved = false;

        closeApprovalModal(true);

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
        /*
        | createPkm sudah berhasil, tetapi respons approvePkm
        | mungkin terputus setelah TTD ditulis ke database.
        */

        if (
            isCrmSubmission &&
            pendingCrmSubmissionSaved
        ) {
            console.warn(
                "Respons approval CRM terputus. Status akan disinkronkan:",
                error
            );

            approvalModalMode = "APPROVAL";
            pendingCrmSubmission = null;
            pendingCrmSubmissionSaved = false;

            closeApprovalModal(true);

            try {
                resetPkmForm();
            } catch (resetError) {
                console.warn(
                    "Form gagal direset:",
                    resetError
                );
            }

            showPage("listPkmPage");

            showToast(
                "Pengajuan sudah tersimpan. Status sedang diperbarui.",
                "success"
            );

            loadPkmData("list").catch(
                function (refreshError) {
                    console.warn(
                        "List PKM belum berhasil diperbarui:",
                        refreshError
                    );
                }
            );

            return;
        }

        showToast(
            error.message ||
            (
                isCrmSubmission
                    ? "Pengajuan PKM gagal disimpan."
                    : "Approval gagal diproses."
            ),
            "error"
        );
    } finally {

        approvalSubmitting = false;

        document.getElementById(
            "closeApprovalModalButton"
        ).disabled = false;

        document.getElementById(
            "cancelApprovalButton"
        ).disabled = false;

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
        function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (approvalSubmitting) {
                showToast(
                    "Proses sedang berjalan. Mohon tunggu."
                );
            }
        }
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
            /*
            | Tandai bahwa user sudah memilih.
            | Hasil loading tidak boleh mengganti
            | pilihan ini.
            */

            approvalSignatureUserSelected =
                true;

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
            | Hasil loading TTD tersimpan
            | tidak boleh menghilangkan canvas.
            */

            approvalSignatureUserSelected =
                true;

            const previouslyDrawing =
                approvalSignatureMode ===
                "DRAWN";

            selectApprovalSignatureMode(
                "DRAWN"
            );

            if (!previouslyDrawing) {
                clearSignature();
            }

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
        const button =
            event.target.closest(
                "[data-download-stored-pdf]"
            );

        if (!button) {
            return;
        }

        const pkmId =
            button.dataset
                .downloadStoredPdf;

        const originalContent =
            button.innerHTML;

        try {
            button.disabled = true;

            button.innerHTML = `
                <span class="flex items-center gap-2">
                    <span class="ui-spinner"></span>
                    Memeriksa PDF...
                </span>
            `;

            /*
            | Coba mengambil PDF yang sudah ada.
            */

            try {
                await window.downloadStoredPkmPdf(
                    pkmId,
                    button
                );

                return;
            } catch (downloadError) {
                /*
                | Jangan membuat PDF baru jika error-nya
                | adalah session, akses, koneksi, atau server.
                */

                if (
                    downloadError.code !==
                    "PDF_NOT_FOUND"
                ) {
                    throw downloadError;
                }

                console.warn(
                    "PDF tidak ditemukan di Drive. Membuat PDF baru.",
                    downloadError
                );
            }

            button.innerHTML = `
                <span class="flex items-center gap-2">
                    <span class="ui-spinner"></span>
                    Membuat PDF...
                </span>
            `;

            await window.createAndStorePkmPdf(
                pkmId
            );

            await window.downloadStoredPkmPdf(
                pkmId,
                button
            );
        } catch (error) {
            showToast(
                error.message ||
                "PDF gagal diproses."
            );
        } finally {
            button.disabled = false;
            button.innerHTML =
                originalContent;
        }
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

    const selectedPkmTypes =
        selectedValues(".type-pkm");

    if (
        isBtlSelected() &&
        !focusTypes.length
    ) {
        missingFields.push(
            "Fokus type"
        );
    }

    if (
        isBtlSelected() &&
        (
            selectedPkmTypes.includes("H1") ||
            selectedPkmTypes.includes("H123")
        ) &&
        !document
            .getElementById("programH1")
            .value
            .trim()
    ) {
        missingFields.push(
            "Nama program H1"
        );
    }

    if (
        isBtlSelected() &&
        (
            selectedPkmTypes.includes("H23") ||
            selectedPkmTypes.includes("H123")
        ) &&
        !document
            .getElementById("programH23")
            .value
            .trim()
    ) {
        missingFields.push(
            "Nama program H23"
        );
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
    .getElementById("statusFilter")
    .addEventListener("change", function () {
        currentPkmPage = 1;
        renderPkmTable();
    });


/*
|--------------------------------------------------------------------------
| FILTER STEP APPROVAL
|--------------------------------------------------------------------------
*/

document
    .getElementById(
        "approvalStepFilter"
    )
    .addEventListener(
        "change",
        function () {
            currentPkmPage = 1;
            renderPkmTable();
        }
    );

document
    .getElementById("applyDashboardFilter")
    .addEventListener("click", function () {
        loadPkmData("dashboard");
    });

document
    .getElementById("applyPkmFilter")
    .addEventListener(
        "click",
        async function () {
            if (pkmDataLoading) {
                showToast(
                    "Data PKM masih dimuat. Mohon tunggu."
                );

                return;
            }

            currentPkmPage = 1;

            try {
                this.disabled = true;
                this.textContent =
                    "Memuat...";

                await loadPkmData(
                    "list"
                );
            } finally {
                this.disabled = false;
                this.textContent =
                    "Cari data";
            }
        }
    );

document
    .getElementById("resetPkmFilter")
    .addEventListener("click", function () {
        setDefaultApprovalStepFilter();
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
            String(
                account.nik || ""
            ).trim()
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
| STATUS EDITOR DAN LOADING TTD PROFIL
|--------------------------------------------------------------------------
*/

let profileSignatureUserEditing =
    false;

let profileSignatureLoadVersion =
    0;


/*
|--------------------------------------------------------------------------
| TAMPILKAN EDITOR TTD
|--------------------------------------------------------------------------
*/

function showProfileSignatureEditor() {

    profileSignatureUserEditing =
        true;

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
    const loadVersion =
        ++profileSignatureLoadVersion;

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

    loading.classList.remove(
        "hidden"
    );

    loading.classList.add(
        "flex"
    );

    currentSection.classList.add(
        "hidden"
    );

    /*
    | Editor tetap aktif ketika data TTD
    | tersimpan sedang dimuat.
    */

    editor.classList.remove(
        "hidden"
    );

    try {
        const result =
            await requestBackend(
                "getMyProfile"
            );

        if (
            loadVersion !==
            profileSignatureLoadVersion
        ) {
            return;
        }

        hasCurrentProfileSignature =
            Boolean(
                result.hasSignature &&
                result.signatureData
            );

        /*
        | Jika pengguna sudah menggambar/upload,
        | jangan sembunyikan editor.
        */

        if (profileSignatureUserEditing) {
            return;
        }

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
        if (
            loadVersion !==
            profileSignatureLoadVersion
        ) {
            return;
        }

        hasCurrentProfileSignature =
            false;

        if (
            !profileSignatureUserEditing
        ) {
            currentSection
                .classList
                .add("hidden");

            editor
                .classList
                .remove("hidden");
        }

        showToast(
            error.message ||
            "TTD saat ini gagal dimuat."
        );
    } finally {
        if (
            loadVersion !==
            profileSignatureLoadVersion
        ) {
            return;
        }

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

    profileSignatureUserEditing =
        false;

    clearProfileSignature();

    profileModal.classList.remove(
        "hidden"
    );

    profileModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    accountMenu.classList.add(
        "hidden"
    );

    /*
    | Tidak memakai await agar modal dapat
    | langsung digunakan untuk menggambar.
    */

    loadCurrentProfileSignature();
}


function closeProfileModal() {
    /*
    | Membatalkan perubahan UI dari request
    | profil yang masih berjalan.
    */

    profileSignatureLoadVersion += 1;

    profileModal.classList.add(
        "hidden"
    );

    profileModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
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

        profileSignatureUserEditing =
            true;

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
                    profileSignatureUserEditing =
                        true;

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
                const maximumWidth = 400;
                const maximumHeight = 120;

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
    const maximumWidth = 400;
    const maximumHeight = 120;

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

function renderFocusTypeOptions() {
    const searchInput =
        document.getElementById(
            "focusTypeSearch"
        );

    const searchResults =
        document.getElementById(
            "focusTypeSearchResults"
        );

    const selectedContainer =
        document.getElementById(
            "selectedFocusTypeContainer"
        );

    if (
        !searchInput ||
        !searchResults ||
        !selectedContainer
    ) {
        return;
    }

    searchInput.disabled =
        !focusTypeOptions.length;

    searchInput.placeholder =
        focusTypeOptions.length
            ? "Cari kode atau nama unit..."
            : "Data focus type tidak tersedia";

    renderSelectedFocusTypes();

    /*
    | Mencegah event dipasang berulang kali
    | ketika data master dimuat ulang.
    */

    if (
        searchInput.dataset.listenerBound ===
        "true"
    ) {
        return;
    }

    searchInput.dataset.listenerBound =
        "true";

    searchInput.addEventListener(
        "input",
        function () {
            showFocusTypeSearchResults(
                this.value
            );
        }
    );

    searchInput.addEventListener(
        "focus",
        function () {
            if (this.value.trim()) {
                showFocusTypeSearchResults(
                    this.value
                );
            }
        }
    );

    searchResults.addEventListener(
        "click",
        function (event) {
            const button =
                event.target.closest(
                    "[data-focus-type]"
                );

            if (!button) {
                return;
            }

            addSelectedFocusType(
                button.dataset.focusType
            );
        }
    );

    selectedContainer.addEventListener(
        "click",
        function (event) {
            const button =
                event.target.closest(
                    "[data-remove-focus-type]"
                );

            if (!button) {
                return;
            }

            removeSelectedFocusType(
                button.dataset
                    .removeFocusType
            );
        }
    );

    document.addEventListener(
        "click",
        function (event) {
            if (
                event.target !==
                    searchInput &&
                !searchResults.contains(
                    event.target
                )
            ) {
                searchResults.classList.add(
                    "hidden"
                );
            }
        }
    );
}

function showFocusTypeSearchResults(
    keyword
) {
    const resultsContainer =
        document.getElementById(
            "focusTypeSearchResults"
        );

    if (!resultsContainer) {
        return;
    }

    const normalizedKeyword =
        String(keyword || "")
            .trim()
            .toLowerCase();

    if (!normalizedKeyword) {
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add(
            "hidden"
        );

        return;
    }

    const matches =
        focusTypeOptions
            .filter(function (gab) {
                const value =
                    String(gab || "");

                return (
                    value
                        .toLowerCase()
                        .includes(
                            normalizedKeyword
                        ) &&
                    !selectedFocusTypes.includes(
                        value
                    )
                );
            })
            .slice(0, 15);

    if (!matches.length) {
        resultsContainer.innerHTML = `
            <div class="px-4 py-3 text-sm text-slate-500">
                Focus type tidak ditemukan.
            </div>
        `;

        resultsContainer.classList.remove(
            "hidden"
        );

        return;
    }

    resultsContainer.innerHTML =
        matches.map(function (gab) {
            return `
                <button
                    type="button"
                    data-focus-type="${escapeHtml(gab)}"
                    class="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-red-50"
                >
                    <span class="font-bold text-slate-800">
                        ${escapeHtml(gab)}
                    </span>

                    <span class="text-xs font-bold text-red-600">
                        Pilih
                    </span>
                </button>
            `;
        }).join("");

    resultsContainer.classList.remove(
        "hidden"
    );
}


function addSelectedFocusType(gab) {
    const value =
        String(gab || "").trim();

    if (
        !value ||
        selectedFocusTypes.includes(value)
    ) {
        return;
    }

    selectedFocusTypes.push(value);

    const searchInput =
        document.getElementById(
            "focusTypeSearch"
        );

    const searchResults =
        document.getElementById(
            "focusTypeSearchResults"
        );

    if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
    }

    if (searchResults) {
        searchResults.innerHTML = "";
        searchResults.classList.add(
            "hidden"
        );
    }

    renderSelectedFocusTypes();
    validateFormState();
}


function removeSelectedFocusType(gab) {
    selectedFocusTypes =
        selectedFocusTypes.filter(
            function (item) {
                return item !== gab;
            }
        );

    renderSelectedFocusTypes();
    validateFormState();
}


function renderSelectedFocusTypes() {
    const container =
        document.getElementById(
            "selectedFocusTypeContainer"
        );

    const count =
        document.getElementById(
            "selectedFocusTypeCount"
        );

    if (!container) {
        return;
    }

    if (count) {
        count.textContent =
            `${selectedFocusTypes.length} type`;
    }

    if (!selectedFocusTypes.length) {
        container.innerHTML = `
            <div
                id="focusTypeEmptyState"
                class="people-empty-state"
            >
                Belum ada focus type yang dipilih.
            </div>
        `;

        return;
    }

    container.innerHTML =
        selectedFocusTypes.map(
            function (gab) {
                return `
                    <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <input
                            class="focus-type"
                            type="checkbox"
                            value="${escapeHtml(gab)}"
                            checked
                            hidden
                        >

                        <span class="font-bold text-slate-800">
                            ${escapeHtml(gab)}
                        </span>

                        <button
                            type="button"
                            data-remove-focus-type="${escapeHtml(gab)}"
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 font-black text-red-600 transition hover:bg-red-100"
                            aria-label="Hapus ${escapeHtml(gab)}"
                            title="Hapus"
                        >
                            ×
                        </button>
                    </div>
                `;
            }
        ).join("");
}

function updateDashboardPreload(
    percentage,
    message
) {
    document.getElementById(
        "dashboardPreloadPercent"
    ).textContent =
        `${percentage}%`;

    document.getElementById(
        "dashboardPreloadBar"
    ).style.width =
        `${percentage}%`;

    document.getElementById(
        "dashboardPreloadText"
    ).textContent =
        message;
}


function setDashboardPreloadItem(
    id,
    status,
    label
) {
    const element =
        document.getElementById(id);

    const icon =
        status === "loading"
            ? "◌"
            : status === "success"
                ? "✓"
                : "!";

    element.textContent =
        `${icon} ${label}`;

    element.className =
        status === "success"
            ? "font-bold text-emerald-600"
            : status === "error"
                ? "font-bold text-red-600"
                : "font-bold text-slate-600";
}


async function waitForKpiFrontend() {
    const startedAt =
        Date.now();

    while (
        typeof window.loadCrmKpiPage !==
        "function"
    ) {
        if (
            Date.now() - startedAt >
            10000
        ) {
            throw new Error(
                "Frontend KPI belum tersedia."
            );
        }

        await new Promise(function (
            resolve
        ) {
            window.setTimeout(
                resolve,
                100
            );
        });
    }
}


async function runDashboardPreload() {
    const panel =
        document.getElementById(
            "dashboardPreloadPanel"
        );

    panel.classList.remove(
        "hidden"
    );

    /*
    |--------------------------------------------------------------------------
    | SALESMAN
    |--------------------------------------------------------------------------
    */

    updateDashboardPreload(
        5,
        "Memuat salesman..."
    );

    setDashboardPreloadItem(
        "preloadSalesman",
        "loading",
        "Memuat data salesman"
    );

    try {
        setDashboardPreloadItem(
            "preloadSalesman",
            "success",
            "Salesman dimuat saat Pengajuan"
        );
    } catch (error) {
        setDashboardPreloadItem(
            "preloadSalesman",
            "error",
            "Data salesman gagal"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UTILITY PKM
    |--------------------------------------------------------------------------
    */

    updateDashboardPreload(
        35,
        "Memuat utility PKM..."
    );

    setDashboardPreloadItem(
        "preloadPkmUtility",
        "loading",
        "Memuat utility PKM"
    );

    try {
        const masterResult =
            await loadReferenceMasters();

        if (!masterResult) {
            throw new Error(
                "Master PKM gagal dimuat."
            );
        }

        await loadPkmData(
            "dashboard"
        );

        setDashboardPreloadItem(
            "preloadPkmUtility",
            "success",
            "Utility PKM siap"
        );
    } catch (error) {
        setDashboardPreloadItem(
            "preloadPkmUtility",
            "error",
            "Utility PKM gagal"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MODUL KPI
    |--------------------------------------------------------------------------
    | Data KPI tidak ditarik saat login.
    | Data baru dimuat ketika menu KPI CRM dibuka.
    */

    updateDashboardPreload(
        75,
        "Menyiapkan modul KPI..."
    );

    setDashboardPreloadItem(
        "preloadKpi",
        "loading",
        "Menyiapkan modul KPI"
    );

    try {
        await waitForKpiFrontend();

        setDashboardPreloadItem(
            "preloadKpi",
            "success",
            "Modul KPI siap"
        );
    } catch (error) {
        console.warn(
            "Modul KPI belum siap:",
            error
        );

        setDashboardPreloadItem(
            "preloadKpi",
            "error",
            "Modul KPI belum siap"
        );
    }

    updateDashboardPreload(
        100,
        "Aplikasi siap digunakan."
    );

    window.setTimeout(
        function () {
            panel.classList.add(
                "hidden"
            );
        },
        1500
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

            profileSignatureUserEditing =
                true;

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
            | JANGAN KIRIM REQUEST KOSONG
            |--------------------------------------------------------------------------
            */

            if (
                !newPassword &&
                !signatureData
            ) {
                showToast(
                    "Tidak ada perubahan yang perlu disimpan."
                );

                return;
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

                document.getElementById(
                    "profileNewPassword"
                ).value = "";

                document.getElementById(
                    "profileConfirmPassword"
                ).value = "";

                profileSignatureUserEditing =
                    false;

                clearProfileSignature();

                closeProfileModal();

                showToast(
                    "Profil berhasil diperbarui."
                );

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


async function initializeDiscordApproval() {

    showDiscordApprovalLoading(
        "Memeriksa link approval..."
    );

    try {

        const result =
            await requestBackend(
                "getDiscordApproval",
                {
                    pkmId:
                        discordApprovalPkmId,

                    approvalToken:
                        discordApprovalToken
                }
            );

        if (
            !result ||
            !result.pkm
        ) {
            throw new Error(
                "Data approval Discord tidak ditemukan."
            );
        }

        updateDiscordApprovalLoading(
            "Menyiapkan data PKM..."
        );

        const role =
            String(
                result.role || ""
            )
                .trim()
                .toUpperCase();

        currentUser = {
            id:
                "DISCORD_" +
                role,

            nik:
                "DISCORD_" +
                role,

            username:
                "DISCORD_" +
                role,

            name:
                role === "MSMC"
                    ? "MSMC via Discord"
                    : "Manager via Discord",

            jabatan:
                role,

            role:
                role,

            branch:
                "ALL",

            originalBranch:
                "HO",

            branchName:
                "HEAD OFFICE",

            status:
                "AKTIF",

            isMaster:
                false
        };

        sheetPkmData = [
            result.pkm
        ];

        approvalModalMode =
            "APPROVAL";

        updateDiscordApprovalLoading(
            "Menyiapkan form tanda tangan..."
        );

        await openApprovalModal(
            result.pkm.id
        );

        /*
        | Beri sedikit jeda agar modal
        | benar-benar selesai dirender.
        */
        await new Promise(
            function (resolve) {
                window.setTimeout(
                    resolve,
                    300
                );
            }
        );

    } finally {

        hideDiscordApprovalLoading();
    }
}



if (
    isDiscordApprovalMode
) {

    initializeDiscordApproval()
        .catch(
            function (error) {
                console.error(
                    "Inisialisasi Discord approval gagal:",
                    error
                );

                showToast(
                    error.message ||
                    "Link approval tidak dapat dibuka."
                );
            }
        );

} else {

    initializeApplication()
        .catch(
            function (error) {
                console.error(
                    "Inisialisasi aplikasi gagal:",
                    error
                );

                showToast(
                    error.message ||
                    "Aplikasi gagal disiapkan."
                );
            }
        );
}