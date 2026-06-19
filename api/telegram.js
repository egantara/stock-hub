export default async function handler(
  req,
  res
) {

  console.log(
    JSON.stringify(
      req.body,
      null,
      2
    )
  );

  const chatId =
    req.body?.message?.chat?.id;

  console.log(
    "CHAT ID:",
    chatId
  );

  return res.status(200).json({
    ok: true
  });

}