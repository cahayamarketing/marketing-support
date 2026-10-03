"use strict";

import { supabaseRequest } from "../src/backend/supabase.js";
import { google } from "googleapis";


const GOOGLE_SERVICE_ACCOUNT_EMAIL =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const GOOGLE_PRIVATE_KEY =
    process.env.GOOGLE_PRIVATE_KEY;

const PKM_DRIVE_FOLDER_ID =
    process.env.PKM_DRIVE_FOLDER_ID;


/*
|--------------------------------------------------------------------------
| GOOGLE DRIVE AUTH
|--------------------------------------------------------------------------
*/

function getDriveClient() {

    if (
        !GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !GOOGLE_PRIVATE_KEY ||
        !PKM_DRIVE_FOLDER_ID
    ) {
        throw new Error(
            "Google Drive environment variable belum lengkap."
        );
    }


    const auth =
        new google.auth.GoogleAuth({

            credentials: {

                client_email:
                    GOOGLE_SERVICE_ACCOUNT_EMAIL,

                private_key:
                    GOOGLE_PRIVATE_KEY.replace(
                        /\\n/g,
                        "\n"
                    )
            },

            scopes: [
                "https://www.googleapis.com/auth/drive.readonly"
            ]
        });


    return google.drive({
        version: "v3",
        auth
    });
}


/*
|--------------------------------------------------------------------------
| AMBIL DATA PKM
|--------------------------------------------------------------------------
*/

async function getPkm(
    pkmId
) {

    const rows =
        await supabaseRequest(
            "/rest/v1/pkm" +
            "?select=id_pkm,pdf,print,link" +
            "&id_pkm=eq." +
            encodeURIComponent(
                pkmId
            ) +
            "&limit=1"
        );


    if (
        !rows ||
        !rows.length
    ) {
        return null;
    }


    return rows[0];
}


/*
|--------------------------------------------------------------------------
| AMBIL NAMA FILE DARI PRINT
|--------------------------------------------------------------------------
*/

function getFileNameFromPrint(
    printPath
) {

    return String(
        printPath || ""
    )
        .replace(
            /\\/g,
            "/"
        )
        .split("/")
        .pop()
        .trim();
}


/*
|--------------------------------------------------------------------------
| CARI FILE DI GOOGLE DRIVE
|--------------------------------------------------------------------------
*/

async function findDriveFile(
    drive,
    fileName
) {

    const escapedName =
        String(
            fileName
        )
            .replace(
                /\\/g,
                "\\\\"
            )
            .replace(
                /'/g,
                "\\'"
            );


    const escapedFolder =
        String(
            PKM_DRIVE_FOLDER_ID
        )
            .replace(
                /\\/g,
                "\\\\"
            )
            .replace(
                /'/g,
                "\\'"
            );


    const result =
        await drive.files.list({

            q:
                `'${escapedFolder}' in parents` +
                ` and name = '${escapedName}'` +
                ` and trashed = false`,

            fields:
                "files(id,name,mimeType,modifiedTime)",

            pageSize:
                20,

            orderBy:
                "modifiedTime desc"
        });


    return (
        result.data.files &&
        result.data.files.length
            ? result.data.files[0]
            : null
    );
}


/*
|--------------------------------------------------------------------------
| HANDLER
|--------------------------------------------------------------------------
*/

export default async function handler(
    req,
    res
) {

    try {

        if (
            req.method !== "GET"
        ) {

            res.setHeader(
                "Allow",
                "GET"
            );

            return res
                .status(405)
                .json({

                    success:
                        false,

                    message:
                        "Method tidak diizinkan."
                });
        }


        const pkmId =
            String(
                req.query?.pkmId ||
                ""
            ).trim();


        if (!pkmId) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "pkmId wajib diisi."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | SUPABASE
        |--------------------------------------------------------------------------
        */

        const pkm =
            await getPkm(
                pkmId
            );


        if (!pkm) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    found:
                        false,

                    message:
                        "Data PKM tidak ditemukan."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | LINK SUDAH ADA
        |--------------------------------------------------------------------------
        */

        const existingLink =
            String(
                pkm.link ||
                ""
            ).trim();


        if (existingLink) {

            return res
                .status(200)
                .json({

                    success:
                        true,

                    found:
                        true,

                    source:
                        "supabase",

                    pkmId:
                        pkmId,

                    pdfUrl:
                        existingLink
                });
        }


        /*
        |--------------------------------------------------------------------------
        | PDF LAMA
        |--------------------------------------------------------------------------
        */

        const fileName =
            getFileNameFromPrint(
                pkm.print
            );


        if (!fileName) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    found:
                        false,

                    message:
                        "Nama file PDF tidak tersedia."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | GOOGLE DRIVE
        |--------------------------------------------------------------------------
        */

        const drive =
            getDriveClient();


        const driveFile =
            await findDriveFile(
                drive,
                fileName
            );


        if (!driveFile) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    found:
                        false,

                    pkmId:
                        pkmId,

                    fileName:
                        fileName,

                    message:
                        "PDF tidak ditemukan di Google Drive."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | DRIVE URL
        |--------------------------------------------------------------------------
        */

        const driveUrl =
            "https://drive.google.com/file/d/" +
            encodeURIComponent(
                driveFile.id
            ) +
            "/view";


        /*
        |--------------------------------------------------------------------------
        | SIMPAN LINK
        |--------------------------------------------------------------------------
        */

        await supabaseRequest(

            "/rest/v1/pkm" +
            "?id_pkm=eq." +
            encodeURIComponent(
                pkmId
            ),

            {

                method:
                    "PATCH",

                headers: {

                    "Prefer":
                        "return=minimal"
                },

                body:
                    JSON.stringify({

                        link:
                            driveUrl
                    })
            }
        );


        /*
        |--------------------------------------------------------------------------
        | RETURN
        |--------------------------------------------------------------------------
        */

        return res
            .status(200)
            .json({

                success:
                    true,

                found:
                    true,

                source:
                    "google_drive",

                pkmId:
                    pkmId,

                fileId:
                    driveFile.id,

                fileName:
                    driveFile.name,

                pdfUrl:
                    driveUrl
            });


    } catch (error) {

        console.error(
            "PKM DOWNLOAD ERROR:",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                message:
                    error?.message ||
                    "Gagal mengambil PDF PKM."
            });
    }
}