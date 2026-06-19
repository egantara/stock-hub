export default async function handler(
  req,
  res
) {

  console.log(
    "TELEGRAM UPDATE"
  );

  console.log(
    JSON.stringify(
      req.body,
      null,
      2
    )
  );

  return res.status(200).json({
    ok: true
  });

}