import {
  dailyBackup
}
from "../backup/daily-backup.js";

import {
  loadAllLicenses
}
from "../services/license/load.js";

import {
  createGoogleSheets
}
from "../services/google/auth.js";

export default async function handler(

  req,

  res

) {

  console.log(

    "AUTO DAILY BACKUP START"

  );

  const summary = [];

  try {

    const clients =

      await loadAllLicenses();

    for (

      const client

      of clients

    ) {

      console.log(

        "CLIENT:",

        client.clientId

      );

      try {

        const google =

          createGoogleSheets({

            sheetId:

              client.google.sheetId,

            projectId:

              client.google.projectId,

            clientEmail:

              client.google.clientEmail,

            privateKey:

              client.google.privateKey

          });

        //
        // Kirim backup ke seluruh user ACTIVE
        //
        for (

          const user

          of client.backup

        ) {

          console.log(

            "SEND BACKUP:",

            client.clientId,

            user.userName,

            user.chatId

          );

          await dailyBackup({

            chatId:

              user.chatId,

            google

          });

        }

        summary.push({

          client:

            client.clientId,

          success:

            true,

          receivers:

            client.backup.length

        });

      } catch (

        error

      ) {

        console.error(

          "BACKUP FAILED:",

          client.clientId,

          error

        );

        summary.push({

          client:

            client.clientId,

          success:

            false,

          error:

            error.message

        });

      }

    }

    console.log(

      "AUTO DAILY BACKUP FINISH"

    );

    return res.status(200).json({

      success: true,

      totalClients:

        summary.length,

      summary

    });

  } catch (

    error

  ) {

    console.error(

      "AUTO DAILY BACKUP ERROR:",

      error

    );

    return res.status(500).json({

      success: false,

      error:

        error.message

    });

  }

}