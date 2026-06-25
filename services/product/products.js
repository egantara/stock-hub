export function findProduct({

  store,

  sku

}) {

  return (

    store.productMap.get(

      String(
        sku
      ).trim()

    )

    ||

    null

  );
}