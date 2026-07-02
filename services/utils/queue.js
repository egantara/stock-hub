let queue =
  Promise.resolve();

export function enqueue(
  task
) {

  const next =

    queue.then(
      task
    );

  queue =

    next.catch(() => {});

  return next;

}