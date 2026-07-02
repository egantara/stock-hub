let queue =
  Promise.resolve();

let pending =
  0;

export async function runTask(
  task
) {

  pending++;

  console.log(
    `[QUEUE] Pending: ${pending}`
  );

  const next =

    queue.then(
      task
    );

  queue =

    next

      .catch(() => {})

      .finally(() => {

        pending--;

        console.log(
          `[QUEUE] Pending: ${pending}`
        );

      });

  return next;

}

export function getPendingTask() {

  return pending;

}