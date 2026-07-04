import XLSX from "xlsx";

import {
  BusinessError
}
from "../../errors/index.js";

const VALID_STATUS = [

  "Perlu Dikirim",

  "Sedang Dikirim",

  "Selesai"

];

export async function parseShopeeOrder(
  filePath
) {

  const workbook =

    XLSX.readFile(
      filePath
    );

  console.log(
    "SHEETS:",
    workbook.SheetNames
  );

  const sheet =

    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  if (

    !sheet

  ) {

    throw new BusinessError(

`Sheet pesanan tidak ditemukan.

Pastikan menggunakan export pesanan Shopee.`

    );

  }

  const rows =

    XLSX.utils.sheet_to_json(

      sheet,

      {

        defval: ""

      }

    );

  console.log(

    "SHOPEE ROWS:",

    rows.length

  );

  if (

    rows.length === 0

  ) {

    throw new BusinessError(

      "File pesanan Shopee tidak memiliki data."

    );

  }

  console.log(

    "SHOPEE ROW 0:",

    rows[0]

  );

  if (

    rows.length > 1

  ) {

    console.log(

      "SHOPEE ROW 1:",

      rows[1]

    );

  }

  if (

    rows.length > 2

  ) {

    console.log(

      "SHOPEE ROW 2:",

      rows[2]

    );

  }

  const orders =

    rows

      .map(

        row => ({

          orderId:

            String(

              row["No. Pesanan"] ||

              ""

            ).trim(),

          status:

            String(

              row["Status Pesanan"] ||

              ""

            ).trim(),

          sku:

            String(

              row["Nomor Referensi SKU"] ||

              ""

            ).trim(),

          qty:

            Number(

              row["Jumlah"] || 0

            ),

          productName:

            String(

              row["Nama Produk"] ||

              ""

            ).trim(),

          variant:

            String(

              row["Nama Variasi"] ||

              ""

            ).trim()

        })

      )

      .filter(

        order =>

          order.orderId &&

          order.sku &&

          order.qty > 0 &&

          VALID_STATUS.includes(

            order.status

          )

      );

  console.log(

    "SHOPEE ORDERS:",

    orders.length

  );

  if (

    orders.length === 0

  ) {

    throw new BusinessError(

`Tidak ada pesanan yang dapat diproses.

Pastikan file yang diupload adalah export pesanan Shopee dan memiliki status:

• Perlu Dikirim
• Sedang Dikirim
• Selesai`

    );

  }

  console.log(

    "FIRST ORDER:",

    orders[0]

  );

  return orders;

}