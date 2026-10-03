import { google } from "googleapis";

const GOOGLE_SERVICE_ACCOUNT_EMAIL =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const GOOGLE_PRIVATE_KEY =
    process.env.GOOGLE_PRIVATE_KEY;

const PKM_DRIVE_FOLDER_ID =
    process.env.PKM_DRIVE_FOLDER_ID;

function getDriveClient() {
    if (
        !GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !GOOGLE_PRIVATE_KEY ||
        !PKM_DRIVE_FOLDER_ID
    ) {
        throw new Error(
            "Environment variable Google Drive belum lengkap."
        );
    }

    const auth = new google.auth.GoogleAuth({
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

export default async function handler(req, res) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({
                success: false,
                message: "Gunakan GET."
            });
        }

        const drive = getDriveClient();

        const result =
            await drive.files.list({
                q:
                    `'${PKM_DRIVE_FOLDER_ID}' in parents` +
                    ` and trashed = false`,

                fields:
                    "files(id,name,mimeType,size,modifiedTime,parents,webViewLink)",

                pageSize: 1000,

                orderBy:
                    "modifiedTime desc"
            });

        const files =
            result.data.files || [];

        return res.status(200).json({
            success: true,

            folderId:
                PKM_DRIVE_FOLDER_ID,

            total:
                files.length,

            files:
                files.map(file => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    size: file.size || null,
                    modifiedTime:
                        file.modifiedTime || null,
                    parents:
                        file.parents || [],
                    webViewLink:
                        file.webViewLink || null
                }))
        });

    } catch (error) {

        console.error(
            "[TEST DRIVE FOLDER ERROR]",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error?.message ||
                "Gagal membaca folder Google Drive."
        });
    }
}